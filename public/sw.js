// --- Constants ---
const DB_NAME = "notifications-db";
const DB_VERSION = 1;
const STORE_NAME = "notifications";
const NOTIFICATION_CHECK_INTERVAL = 60000; // 1 minute

// --- DB Helper ---
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        console.log("[SW] Created object store");
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// --- Install & Activate ---
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(self.skipWaiting());
});

// --- Message from Client ---
self.addEventListener("message", (event) => {
  const data = event.data;
  console.log("[SW] Message received:", data);

  if (data.type === "scheduleNotification") {
    const { timeInMs, options } = data;
    storeNotificationData(timeInMs, options);

    if ("showTrigger" in Notification.prototype) {
      const trigger = new TimestampTrigger(Date.now() + timeInMs);
      self.registration.showNotification(options.title, {
        ...options,
        showTrigger: trigger,
      });
    } else {
      if ("sync" in self.registration) {
        self.registration.sync.register("notification-sync");
      }
      setTimeout(() => {
        self.registration.showNotification(options.title, options);
      }, timeInMs);
    }
  }

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// --- Store Notification ---
async function storeNotificationData(timeInMs, options) {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    await store.add({
      scheduledTime: Date.now() + timeInMs,
      options,
    });

    console.log("[SW] Stored notification data in IndexedDB");
  } catch (error) {
    console.error("[SW] Error storing notification:", error);
  }
}

// --- Check Scheduled Notifications ---
async function checkScheduledNotifications() {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const now = Date.now();

    // Get all notifications
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const notifications = request.result;
        const notificationsToShow = [];
        const notificationsToDelete = [];

        // Check each notification
        for (const notification of notifications) {
          if (notification.scheduledTime <= now) {
            // Time to show this notification
            notificationsToShow.push(notification);
            notificationsToDelete.push(notification.id);
          }
        }

        // Show notifications
        for (const notification of notificationsToShow) {
          await self.registration.showNotification(
            notification.options.title,
            notification.options
          );
          console.log("[SW] Showing notification:", notification.options.title);
        }

        // Delete shown notifications
        for (const id of notificationsToDelete) {
          await store.delete(id);
        }

        console.log(
          `[SW] Checked notifications: ${notificationsToShow.length} shown`
        );
        resolve();
      };

      request.onerror = (event) => {
        console.error("[SW] Error checking notifications:", event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error("[SW] Error in checkScheduledNotifications:", error);
    return Promise.reject(error);
  }
}

// --- Background Sync ---
self.addEventListener("sync", (event) => {
  if (event.tag === "notification-sync") {
    event.waitUntil(checkScheduledNotifications());
  }
});

// --- Periodic Sync ---
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "notification-periodic-sync") {
    event.waitUntil(checkScheduledNotifications());
  }
});

// --- In-memory check (optional) ---
self._checkInterval = setInterval(() => {
  checkScheduledNotifications();
}, NOTIFICATION_CHECK_INTERVAL);

// --- Click Events ---
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);
  event.notification.close();

  const data = event.notification.data || {};

  if (self._notificationSound || data.sound) {
    const sound = self._notificationSound || data.sound;
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length > 0) {
        clients[0].postMessage({ type: "playSound", sound });
      }
    });
  }

  if (event.action === "confirm" && data.medicationId) {
    self.clients.matchAll({ type: "window" }).then((clients) => {
      clients.forEach((client) =>
        client.postMessage({
          action: "MEDICATION_TAKEN",
          medicationId: data.medicationId,
        })
      );
    });
  }

  if (event.action === "postpone" && data.medicationId) {
    self.clients.matchAll({ type: "window" }).then((clients) => {
      clients.forEach((client) =>
        client.postMessage({
          action: "POSTPONE_REMINDER",
          medicationId: data.medicationId,
        })
      );
    });
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      return clients.length ? clients[0].focus() : self.clients.openWindow("/");
    })
  );
});

// --- Fetch: Keep-alive check ---
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("keep-alive")) {
    event.respondWith(
      new Response("Service worker is alive", {
        headers: { "Content-Type": "text/plain" },
      })
    );
  }
});

// --- Cleanup ---
self.addEventListener("beforeunload", () => {
  if (self._checkInterval) {
    clearInterval(self._checkInterval);
  }
});
