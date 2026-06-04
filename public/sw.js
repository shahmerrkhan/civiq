self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "Civiq";
  const options = {
    body: data.body || "Something new is happening in Ontario.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "civiq-default",
    renotify: true,
    data: { url: data.url || "/dashboard" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const url = event.notification.data?.url || "/dashboard";
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});