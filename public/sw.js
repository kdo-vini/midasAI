// Midas AI - Service Worker for Web Push Notifications

self.addEventListener('push', function (event) {
    let data = { title: 'Midas AI', body: 'Você tem uma notificação!' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/',
        },
        actions: data.actions || [],
        tag: data.tag || 'midas-notification',
        renotify: true,
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            return clients.openWindow(urlToOpen);
        })
    );
});

// Activate immediately
self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});
