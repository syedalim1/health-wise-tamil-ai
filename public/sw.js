// Service Worker for handling notifications
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the main thread
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Message received:", event.data);

  if (event.data.type === "scheduleNotification") {
    const { timeInMs, options } = event.data;

    // Store the notification data in IndexedDB
    storeNotificationData(timeInMs, options);

    // Use the Notification Trigger API (if available)
    if ("showTrigger" in Notification.prototype) {
      const trigger = new TimestampTrigger(Date.now() + timeInMs);
      self.registration.showNotification(options.title, {
        ...options,
        showTrigger: trigger,
      });
      console.log(
        `[Service Worker] Scheduled notification with trigger for ${new Date(
          Date.now() + timeInMs
        )}`
      );
    } else {
      // Fallback to push notification system if available
      console.log(
        `[Service Worker] Using traditional method for ${new Date(
          Date.now() + timeInMs
        )}`
      );

      // Schedule a one-time sync event
      if ("sync" in self.registration) {
        self.registration.sync.register("notification-sync");
      }

      // Set an alarm for waking up the service worker
      setTimeout(() => {
        self.registration.showNotification(options.title, options).then(() => {
          if (options.sound) {
            // Store sound URL in notification data for later access
            self._notificationSound = options.sound;
          }
        });
      }, timeInMs);
    }
  }
});

// Store notification data in IndexedDB for persistence
const storeNotificationData = (timeInMs, options) => {
  const dbPromise = indexedDB.open("notifications-db", 1);

  dbPromise.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("notifications")) {
      db.createObjectStore("notifications", {
        keyPath: "id",
        autoIncrement: true,
      });
    }
  };

  dbPromise.onsuccess = (event) => {
    const db = event.target.result;
    const tx = db.transaction("notifications", "readwrite");
    const store = tx.objectStore("notifications");

    store.add({
      scheduledTime: Date.now() + timeInMs,
      options: options,
    });

    console.log("[Service Worker] Notification data stored in IndexedDB");
  };

  dbPromise.onerror = (error) => {
    console.error("[Service Worker] IndexedDB error:", error);
  };
};

// Sync event to wake up the service worker and check for notifications
self.addEventListener("sync", (event) => {
  if (event.tag === "notification-sync") {
    event.waitUntil(checkScheduledNotifications());
  }
});

// Check IndexedDB for scheduled notifications
const checkScheduledNotifications = async () => {
  console.log("[Service Worker] Checking scheduled notifications");

  const dbPromise = indexedDB.open("notifications-db", 1);

  dbPromise.onsuccess = (event) => {
    const db = event.target.result;
    const tx = db.transaction("notifications", "readwrite");
    const store = tx.objectStore("notifications");
    const now = Date.now();

    store.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const notification = cursor.value;

        if (notification.scheduledTime <= now) {
          // Show the notification if it's time
          self.registration.showNotification(
            notification.options.title,
            notification.options
          );

          // Remove this notification from the database
          cursor.delete();
          console.log(
            "[Service Worker] Showing and removing scheduled notification"
          );
        }
        cursor.continue();
      }
    };
  };
};

// Listen for push events
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received:", event);

  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || "Health Reminder";
      const options = data.options || {
        body: "It's time for your medication",
        icon: "/favicon.ico",
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error("[Service Worker] Error handling push event:", e);
    }
  }
});

// Handle notification click to play sound and open the app
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event);
  event.notification.close();

  const notificationData = event.notification.data || {};

  // Play sound if available
  if (self._notificationSound || notificationData.sound) {
    const soundUrl = self._notificationSound || notificationData.sound;

    // Try to communicate with client to play sound
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].postMessage({
          type: "playSound",
          sound: soundUrl,
        });
      }
    });

    // Clear sound reference
    self._notificationSound = null;
  }

  // Handle specific actions if any
  if (event.action === "confirm" && notificationData.medicationId) {
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          action: "MEDICATION_TAKEN",
          medicationId: notificationData.medicationId,
        });
      }
    });
  } else if (event.action === "postpone" && notificationData.medicationId) {
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          action: "POSTPONE_REMINDER",
          medicationId: notificationData.medicationId,
        });
      }
    });
  }

  // Open a window if no clients are open
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      } else {
        return self.clients.openWindow("/");
      }
    })
  );
});
