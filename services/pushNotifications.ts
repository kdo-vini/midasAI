import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Converts a URL-safe base64 string to a Uint8Array (required for applicationServerKey)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Checks if push notifications are supported by the browser
 */
export function isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Gets the current notification permission state
 */
export function getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
}

/**
 * Registers the service worker and subscribes to push notifications.
 * Saves the subscription to Supabase.
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
    if (!isPushSupported()) {
        console.warn('Push notifications are not supported in this browser.');
        return false;
    }

    try {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied.');
            return false;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Subscribe to push
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
            });
        }

        // Extract keys from subscription
        const subscriptionJSON = subscription.toJSON();
        const endpoint = subscriptionJSON.endpoint!;
        const authKey = subscriptionJSON.keys!.auth;
        const p256dhKey = subscriptionJSON.keys!.p256dh;

        // Save to Supabase (upsert to avoid duplicates)
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert(
                {
                    user_id: userId,
                    endpoint,
                    auth_key: authKey,
                    p256dh_key: p256dhKey,
                },
                { onConflict: 'user_id,endpoint' }
            );

        if (error) {
            console.error('Error saving push subscription:', error);
            return false;
        }

        console.log('Successfully subscribed to push notifications.');
        return true;
    } catch (error) {
        console.error('Error subscribing to push:', error);
        return false;
    }
}

/**
 * Unsubscribes from push notifications and removes from Supabase.
 */
export async function unsubscribeFromPush(userId: string): Promise<boolean> {
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return true;

        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            const endpoint = subscription.endpoint;
            await subscription.unsubscribe();

            // Remove from Supabase
            await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', userId)
                .eq('endpoint', endpoint);
        }

        return true;
    } catch (error) {
        console.error('Error unsubscribing from push:', error);
        return false;
    }
}

/**
 * Checks if the user is currently subscribed to push notifications.
 */
export async function isSubscribedToPush(): Promise<boolean> {
    if (!isPushSupported()) return false;

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return false;

        const subscription = await registration.pushManager.getSubscription();
        return !!subscription;
    } catch {
        return false;
    }
}
