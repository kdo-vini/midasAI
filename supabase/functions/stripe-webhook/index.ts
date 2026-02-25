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

                    await supabase.from('user_profiles').update({
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        subscription_status: subscription.status,
                        trial_end_date: subscription.trial_end
                            ? new Date(subscription.trial_end * 1000).toISOString()
                            : null
                    }).eq('user_id', userId);
                }
                break;
            }

            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await supabase
                    .from('user_profiles')
                    .update({
                        subscription_status: subscription.status,
                        trial_end_date: subscription.trial_end
                            ? new Date(subscription.trial_end * 1000).toISOString()
                            : null
                    })
                    .eq('stripe_customer_id', customerId);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                await supabase
                    .from('user_profiles')
                    .update({
                        subscription_status: 'past_due'
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
