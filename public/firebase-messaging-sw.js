// Log service worker initialization
console.log("Firebase messaging service worker initialized");

// Import the latest Firebase scripts
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD72JjYaqmgwYw7eSTlyM_9dy-EevE9bUQ",
  authDomain: "asmi-project-notification.firebaseapp.com",
  projectId: "asmi-project-notification",
  storageBucket: "asmi-project-notification.firebasestorage.app",
  messagingSenderId: "936650736998",
  appId: "1:936650736998:web:34fbf60a68aa59712574a7",
};

// VAPID key (only needed for debugging)
self.VAPID_KEY =
  "BL6WDWYOmUXReKuOauKDP4VMbPTM5WL1GcdNMUPZdgiwOwg1KVXRIJTITReuBQMsw63OUS2Bn8jyy0ygKSfeZE8";

// Initialize Firebase in the service worker
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();
console.log("Firebase messaging initialized in service worker");

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  // Customize notification here
  const notificationTitle =
    payload.notification?.title || "Medication Reminder";
  const notificationOptions = {
    body: payload.notification?.body || "It's time to take your medication",
    icon: "/favicon.ico",
    data: payload.data || {},
    actions: [
      { action: "confirm", title: "✓ Taken" },
      { action: "postpone", title: "⏰ Remind Later" },
    ],
    requireInteraction: true,
    tag: `medication-reminder-${Date.now()}`,
    vibrate: [200, 100, 200],
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Listen for push messages
self.addEventListener("push", (event) => {
  console.log("[FCM Service Worker] Push Received:", event);

  let notificationData = {};

  try {
    notificationData = event.data.json();
    console.log("Push data:", notificationData);
  } catch (e) {
    console.error("Error parsing push data:", e);
  }

  const title = notificationData.notification?.title || "Medication Care";
  const options = {
    body:
      notificationData.notification?.body ||
      "It's time to take your medication",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: notificationData.data || {},
    // Add actions for more interactive notifications
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
    // Prevent notifications from being grouped together
    tag: `medication-reminder-${Date.now()}`,
    // Show notification with high importance
    requireInteraction: true,
    // Set vibration pattern to ensure notification is noticeable
    vibrate: [200, 100, 200],
  };

  // Ensure notification is shown even when browser is closed
  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Store notification data for reliability
      storeNotificationInIndexedDB(options);
    })
  );
});

// Store notification in IndexedDB for redundancy
const storeNotificationInIndexedDB = (options) => {
  const dbPromise = indexedDB.open("fcm-notifications-db", 1);

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
      timestamp: Date.now(),
      options: options,
    });

    console.log("[FCM Service Worker] Notification data stored in IndexedDB");

    // Close the database connection when done
    tx.oncomplete = () => {
      db.close();
    };
  };

  dbPromise.onerror = (error) => {
    console.error("[FCM Service Worker] Error storing notification:", error);
  };
};

// Periodically check for pending notifications in IndexedDB
const checkStoredNotifications = () => {
  console.log("[FCM Service Worker] Checking for stored notifications");

  const dbPromise = indexedDB.open("fcm-notifications-db", 1);

  dbPromise.onsuccess = (event) => {
    const db = event.target.result;
    const tx = db.transaction("notifications", "readwrite");
    const store = tx.objectStore("notifications");

    // Get all notifications stored in the last 24 hours
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
    const request = store.index
      ? store.index("timestamp").openCursor(IDBKeyRange.lowerBound(cutoffTime))
      : store.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const data = cursor.value;

        // Check if this notification needs to be reshown
        if (!data.shown) {
          self.registration
            .showNotification(
              data.options.title || "Medication Reminder",
              data.options
            )
            .then(() => {
              // Mark notification as shown
              const updateData = { ...data, shown: true };
              cursor.update(updateData);
            });
        }

        cursor.continue();
      }
    };

    tx.oncomplete = () => {
      db.close();
    };
  };

  dbPromise.onerror = (error) => {
    console.error(
      "[FCM Service Worker] Error checking stored notifications:",
      error
    );
  };
};

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[FCM Service Worker] Notification click received:", event);

  // Close the notification
  event.notification.close();

  // Get notification data
  const data = event.notification.data || {};

  // Handle click action
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If we have a client, focus it and send a message
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if (event.action === "confirm") {
              client.postMessage({
                action: "MEDICATION_TAKEN",
                medicationId: data.medicationId,
              });
              return;
            }
            if (event.action === "postpone") {
              client.postMessage({
                action: "POSTPONE_REMINDER",
                medicationId: data.medicationId,
              });
              return;
            }
            return;
          }
        }

        // If no client is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow("/");
        }
      })
  );
});

// Ensure the service worker is properly activated
self.addEventListener("activate", (event) => {
  console.log("[FCM Service Worker] Activate event");

  // Immediately claim clients to ensure control
  event.waitUntil(
    Promise.all([
      self.clients.claim(),

      // Register for periodic sync if supported
      "periodicSync" in self.registration
        ? self.registration.periodicSync.register("fcm-periodic-sync", {
            minInterval: 60 * 1000, // 1 minute in ms
          })
        : Promise.resolve(),
    ])
  );

  // Check stored notifications upon activation
  checkStoredNotifications();
});

// Periodic Sync API support (when available)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "fcm-periodic-sync") {
    event.waitUntil(checkStoredNotifications());
  }
});

// Log installation
self.addEventListener("install", (event) => {
  console.log("[FCM Service Worker] Install event");
  // Skip waiting to become active immediately
  event.waitUntil(self.skipWaiting());
});

// Add fetch event handler to keep the service worker alive
self.addEventListener("fetch", (event) => {
  // Handle keep-alive ping requests
  if (event.request.url.includes("keep-alive")) {
    event.respondWith(
      new Response("Firebase service worker is alive", {
        headers: { "Content-Type": "text/plain" },
      })
    );
  }
});

// Listen for messages from the main app
self.addEventListener("message", (event) => {
  console.log("[FCM Service Worker] Message received:", event.data);

  // Handle browser close notification
  if (event.data.type === "BROWSER_CLOSING") {
    console.log("[FCM Service Worker] Browser closing, sending notification");

    // Create a notification for browser close
    const notificationOptions = {
      title: "Browser Session Ended",
      body: "Your health monitoring session has ended",
      icon: "/favicon.ico",
      data: {
        userId: event.data.userId,
        deviceToken: event.data.deviceToken,
        type: "BROWSER_CLOSED",
      },
      tag: `browser-closed-${Date.now()}`,
      requireInteraction: true,
    };

    // Store the notification data for redundancy
    storeNotificationInIndexedDB(notificationOptions);

    // Show the notification
    self.registration.showNotification(
      notificationOptions.title,
      notificationOptions
    );

    // If we have access to FCM token, send a backend request
    if (event.data.deviceToken) {
      fetch("/api/send-mobile-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: event.data.deviceToken,
          userId: event.data.userId,
          title: "Browser Session Ended",
          body: "Your health monitoring session has ended",
          data: { type: "BROWSER_CLOSED" },
        }),
        keepalive: true,
      }).catch((err) =>
        console.error("Error sending close notification:", err)
      );
    }
  }

  if (event.data.type === "checkNotifications") {
    checkStoredNotifications();
  }

  // Skip waiting if requested
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Periodically check for pending notifications
self._checkInterval = setInterval(() => {
  console.log("[FCM Service Worker] Running periodic check");
  checkStoredNotifications();
}, 30000);

// Clean up when terminated
self.addEventListener("beforeunload", () => {
  if (self._checkInterval) {
    clearInterval(self._checkInterval);
  }
});

// Handle browser closing in the main window context
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", function (e) {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      // Use sendBeacon for reliability during page unload
      const serviceWorker = navigator.serviceWorker.controller;

      // Get the FCM token from localStorage if available
      const fcmToken = localStorage.getItem("fcmToken");
      const userId = localStorage.getItem("userId");

      // Send closing message to service worker
      serviceWorker.postMessage({
        type: "BROWSER_CLOSING",
        userId: userId,
        deviceToken: fcmToken,
        timestamp: Date.now(),
      });

      // Also send to server via beacon if API endpoint exists
      if (fcmToken) {
        navigator.sendBeacon(
          "/api/notify-browser-close",
          JSON.stringify({
            userId: userId,
            fcmToken: fcmToken,
            timestamp: Date.now(),
          })
        );
      }
    }
  });
}
