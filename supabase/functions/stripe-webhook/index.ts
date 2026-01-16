import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return new Response('No signature', { status: 400 });
    }

    try {
        const body = await req.text();
        const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.supabase_user_id;
                const customerId = session.customer as string;
                const subscriptionId = session.subscription as string;

                if (userId) {
                    // Get subscription details
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                    await supabase.from('subscriptions').upsert({
                        user_id: userId,
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        status: subscription.status,
                        trial_ends_at: subscription.trial_end
                            ? new Date(subscription.trial_end * 1000).toISOString()
                            : null,
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' });
                }
                break;
            }

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await supabase
                    .from('subscriptions')
                    .update({
                        status: subscription.status,
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        trial_ends_at: subscription.trial_end
                            ? new Date(subscription.trial_end * 1000).toISOString()
                            : null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('stripe_customer_id', customerId);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                await supabase
                    .from('subscriptions')
                    .update({
                        status: 'past_due',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('stripe_customer_id', customerId);
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
