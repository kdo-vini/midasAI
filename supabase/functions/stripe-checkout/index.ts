import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PRICE_ID = 'price_1SqI7LLUJWyE4PkYu6pYG9Tw';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { userId, email, returnUrl } = await req.json();

        if (!userId || !email) {
            throw new Error('userId and email are required');
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Check if user already has a subscription
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single();

        let customerId = profile?.stripe_customer_id;

        // Create Stripe customer if doesn't exist
        if (!customerId) {
            const customer = await stripe.customers.create({
                email,
                metadata: { supabase_user_id: userId }
            });
            customerId = customer.id;
        }

        // Create checkout session with 7-day trial
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{
                price: PRICE_ID,
                quantity: 1,
            }],
            mode: 'subscription',
            subscription_data: {
                trial_period_days: 7,
            },
            success_url: `${returnUrl}?success=true`,
            cancel_url: `${returnUrl}?canceled=true`,
            metadata: {
                supabase_user_id: userId,
            },
        });

        return new Response(
            JSON.stringify({ url: session.url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Stripe checkout error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
