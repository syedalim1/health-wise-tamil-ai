// Service Worker for handling notifications
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  // Force immediate installation to make it available to all pages right away
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  // Claim control over all clients immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Register for periodic sync if supported
      "periodicSync" in self.registration
        ? self.registration.periodicSync.register(
            "notification-periodic-sync",
            {
              minInterval: 60 * 1000, // 1 minute in ms
            }
          )
        : Promise.resolve(),
    ])
  );
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

      // Schedule background sync for reliability
      Promise.all([
        // Register for one-time sync
        "sync" in self.registration
          ? self.registration.sync.register("notification-sync")
          : Promise.resolve(),

        // Fall back to setTimeout as a last resort
        new Promise((resolve) => {
          setTimeout(() => {
            self.registration
              .showNotification(options.title, options)
              .then(() => {
                if (options.sound) {
                  // Store sound URL in notification data for later access
                  self._notificationSound = options.sound;
                }
                resolve();
              });
          }, timeInMs);
        }),
      ]);
    }
  }

  // Add handling for checkScheduledNotifications message
  if (event.data.type === "checkScheduledNotifications") {
    checkScheduledNotifications();
  }

  // Handle SKIP_WAITING message
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
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

// Periodic Sync API support (for consistent wake-ups)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "notification-periodic-sync") {
    event.waitUntil(checkScheduledNotifications());
  }
});

// Periodically check for scheduled notifications (every minute)
const NOTIFICATION_CHECK_INTERVAL = 60000; // 1 minute
self._checkInterval = setInterval(() => {
  checkScheduledNotifications();
}, NOTIFICATION_CHECK_INTERVAL);

// Check IndexedDB for scheduled notifications
const checkScheduledNotifications = async () => {
  console.log("[Service Worker] Checking scheduled notifications");

  return new Promise((resolveMain, rejectMain) => {
    const dbPromise = indexedDB.open("notifications-db", 1);

    dbPromise.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction("notifications", "readwrite");
      const store = tx.objectStore("notifications");
      const now = Date.now();
      let pendingNotifications = 0;
      let shownNotifications = 0;

      const pendingPromises = [];

      store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const notification = cursor.value;
          pendingNotifications++;

          if (notification.scheduledTime <= now) {
            // Show the notification if it's time
            const notificationPromise = self.registration
              .showNotification(
                notification.options.title,
                notification.options
              )
              .then(() => {
                // Remove this notification from the database
                cursor.delete();
                shownNotifications++;
                console.log(
                  "[Service Worker] Showing and removing scheduled notification"
                );
              })
              .catch((error) => {
                console.error(
                  "[Service Worker] Error showing notification:",
                  error
                );
              });

            pendingPromises.push(notificationPromise);
          }
          cursor.continue();
        } else {
          // Cursor is complete
          console.log(
            `[Service Worker] Notification check complete. Found ${pendingNotifications} pending, showed ${shownNotifications}`
          );

          // Resolve when all notifications are processed
          Promise.all(pendingPromises)
            .then(() => resolveMain())
            .catch((err) => {
              console.error(
                "[Service Worker] Error processing notifications:",
                err
              );
              resolveMain(); // Still resolve the main promise even if some notifications failed
            });
        }
      };

      tx.oncomplete = () => {
        // Close the database connection when transaction is complete
        db.close();
      };
    };

    dbPromise.onerror = (error) => {
      console.error("[Service Worker] Error checking notifications:", error);
      rejectMain(error);
    };
  });
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
        requireInteraction: true, // Keep notification visible until user interacts
        tag: `medication-reminder-${Date.now()}`,
        actions: [
          {
            action: "confirm",
            title: "✓ Taken",
          },
          {
            action: "postpone",
            title: "⏰ Remind Later",
          },
        ],
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

// Keep the service worker alive with an active fetch handler
self.addEventListener("fetch", (event) => {
  // We need to define a custom strategy to keep the service worker active
  // This will also ensure the service worker stays registered
  if (event.request.url.includes("keep-alive")) {
    event.respondWith(
      new Response("Service worker is alive", {
        headers: { "Content-Type": "text/plain" },
      })
    );
  }
  // For other requests, use default browser handling
});

// Make sure indexedDB connections are properly closed when service worker is terminated
self.addEventListener("beforeunload", () => {
  // Clear the interval
  if (self._checkInterval) {
    clearInterval(self._checkInterval);
  }
});
