import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

// Web Push requires these headers for each push endpoint
async function sendWebPush(
    subscription: { endpoint: string; auth_key: string; p256dh_key: string },
    payload: string,
    vapidPublicKey: string,
    vapidPrivateKey: string
): Promise<boolean> {
    try {
        // Import the web-push compatible crypto for Deno
        const vapidKeys = {
            publicKey: vapidPublicKey,
            privateKey: vapidPrivateKey,
        };

        // Create JWT for VAPID authentication
        const audience = new URL(subscription.endpoint).origin;
        const expiry = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours

        // Build VAPID JWT header
        const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" }))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const body = btoa(
            JSON.stringify({
                aud: audience,
                exp: expiry,
                sub: "mailto:contato@techneia.com.br",
            })
        )
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const unsignedToken = `${header}.${body}`;

        // Import VAPID private key for signing
        const privateKeyBytes = Uint8Array.from(
            atob(vapidPrivateKey.replace(/-/g, "+").replace(/_/g, "/")),
            (c) => c.charCodeAt(0)
        );

        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            privateKeyBytes,
            { name: "ECDSA", namedCurve: "P-256" },
            false,
            ["sign"]
        );

        const signature = await crypto.subtle.sign(
            { name: "ECDSA", hash: "SHA-256" },
            cryptoKey,
            new TextEncoder().encode(unsignedToken)
        );

        // Convert signature from DER to raw format and base64url encode
        const signatureBase64 = btoa(
            String.fromCharCode(...new Uint8Array(signature))
        )
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const jwt = `${unsignedToken}.${signatureBase64}`;

        // Encrypt the payload using Web Push encryption (simplified - using fetch with the subscription endpoint)
        // For full encryption we need the auth and p256dh keys
        // Using the push endpoint directly with VAPID authorization
        const response = await fetch(subscription.endpoint, {
            method: "POST",
            headers: {
                Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
                "Content-Type": "application/octet-stream",
                TTL: "86400",
                Urgency: "high",
            },
            body: payload,
        });

        if (response.status === 201 || response.status === 200) {
            return true;
        }

        // 410 Gone means the subscription is no longer valid
        if (response.status === 410) {
            console.log(
                "Subscription expired, should be removed:",
                subscription.endpoint
            );
        }

        console.error(
            `Push failed with status ${response.status}:`,
            await response.text()
        );
        return false;
    } catch (error) {
        console.error("Error sending web push:", error);
        return false;
    }
}

Deno.serve(async (req: Request) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
        const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get the current date (Brazil timezone)
        const now = new Date();
        const brasilOffset = -3 * 60; // UTC-3
        const brasilTime = new Date(now.getTime() + brasilOffset * 60 * 1000);
        const today = brasilTime.toISOString().split("T")[0];
        const tomorrow = new Date(brasilTime.getTime() + 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

        // Find unpaid transactions that are due today or tomorrow
        const { data: dueTransactions, error: txError } = await supabase
            .from("transactions")
            .select("id, description, amount, date, due_date, user_id, is_paid")
            .or(`date.eq.${today},date.eq.${tomorrow}`)
            .or("is_paid.eq.false,is_paid.is.null");

        if (txError) {
            console.error("Error fetching transactions:", txError);
            return new Response(
                JSON.stringify({ error: "Failed to fetch transactions" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        if (!dueTransactions || dueTransactions.length === 0) {
            return new Response(
                JSON.stringify({ message: "No due transactions found", sent: 0 }),
                {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Group transactions by user
        const userTransactions: Record<
            string,
            Array<{ description: string; amount: number; date: string }>
        > = {};
        for (const tx of dueTransactions) {
            if (!userTransactions[tx.user_id]) {
                userTransactions[tx.user_id] = [];
            }
            userTransactions[tx.user_id].push({
                description: tx.description,
                amount: tx.amount,
                date: tx.date,
            });
        }

        let totalSent = 0;

        // For each user, get their push subscriptions and send a notification
        for (const [userId, txs] of Object.entries(userTransactions)) {
            const { data: subscriptions, error: subError } = await supabase
                .from("push_subscriptions")
                .select("endpoint, auth_key, p256dh_key")
                .eq("user_id", userId);

            if (subError || !subscriptions || subscriptions.length === 0) {
                continue;
            }

            // Build notification payload
            const totalAmount = txs.reduce((sum, tx) => sum + tx.amount, 0);
            const dueToday = txs.filter((tx) => tx.date === today);
            const dueTomorrow = txs.filter((tx) => tx.date === tomorrow);

            let bodyText = "";
            if (dueToday.length > 0) {
                bodyText += `📅 Hoje: ${dueToday.length} conta(s) - R$ ${dueToday.reduce((s, t) => s + t.amount, 0).toFixed(2)}`;
            }
            if (dueTomorrow.length > 0) {
                if (bodyText) bodyText += "\n";
                bodyText += `⏰ Amanhã: ${dueTomorrow.length} conta(s) - R$ ${dueTomorrow.reduce((s, t) => s + t.amount, 0).toFixed(2)}`;
            }

            const payload = JSON.stringify({
                title: "💰 Midas AI - Contas a Pagar",
                body: bodyText,
                tag: "bill-reminder",
                url: "/",
                actions: [{ action: "open", title: "Ver contas" }],
            });

            // Send to all user's subscriptions (devices)
            for (const sub of subscriptions) {
                const success = await sendWebPush(
                    sub,
                    payload,
                    vapidPublicKey,
                    vapidPrivateKey
                );
                if (success) totalSent++;
            }
        }

        return new Response(
            JSON.stringify({
                message: `Notifications processed`,
                transactions: dueTransactions.length,
                sent: totalSent,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Unhandled error:", error);
        return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
