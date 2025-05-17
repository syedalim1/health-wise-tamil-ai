// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
const firebaseConfig = {
  apiKey: "AIzaSyD72JjYaqmgwYw7eSTlyM_9dy-EevE9bUQ",
  authDomain: "asmi-project-notification.firebaseapp.com",
  projectId: "asmi-project-notification",
  storageBucket: "asmi-project-notification.firebasestorage.app",
  messagingSenderId: "936650736998",
  appId: "1:936650736998:web:34fbf60a68aa59712574a7",
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  console.log(
    "[firebase-messaging-sw.js] Received background message:",
    payload
  );

  const notificationTitle =
    payload.notification?.title || "Medication Reminder";
  const notificationOptions = {
    body: payload.notification?.body || "Time to take your medication",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.data?.medicationId || "medication-reminder",
    data: payload.data || {},
    requireInteraction: true, // Keep notification visible until user interacts
    actions: [
      {
        action: "confirm",
        title: "Take Now",
      },
      {
        action: "postpone",
        title: "Remind Later",
      },
    ],
    // Add FCM-specific options
    click_action: payload.notification?.click_action || "/",
    fcm_options: {
      link: payload.fcmOptions?.link || "/",
    },
  };

  // Show notification
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", function (event) {
  console.log("[firebase-messaging-sw.js] Notification clicked:", event);
  event.notification.close();

  const medicationId = event.notification.data?.medicationId;
  const action = event.action;
  let urlToOpen = "/";

  if (action === "confirm" && medicationId) {
    urlToOpen = `/?action=taken&medicationId=${medicationId}`;
  } else if (action === "postpone" && medicationId) {
    // Schedule a reminder for 15 minutes later
    const postponeTime = Date.now() + 15 * 60 * 1000;
    self.registration.showNotification(event.notification.title, {
      ...event.notification.options,
      body: "Reminder postponed for 15 minutes",
      showTrigger: new TimestampTrigger(postponeTime),
    });
    return;
  }

  // Focus or open window
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        // If a window client is available, focus it
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // If no window client, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle push events
self.addEventListener("push", function (event) {
  console.log("[firebase-messaging-sw.js] Push received:", event);

  if (event.data) {
    const payload = event.data.json();
    const notificationTitle =
      payload.notification?.title || "Medication Reminder";
    const notificationOptions = {
      body: payload.notification?.body || "Time to take your medication",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: payload.data?.medicationId || "medication-reminder",
      data: payload.data || {},
      requireInteraction: true,
      actions: [
        {
          action: "confirm",
          title: "Take Now",
        },
        {
          action: "postpone",
          title: "Remind Later",
        },
      ],
      // Add FCM-specific options
      click_action: payload.notification?.click_action || "/",
      fcm_options: {
        link: payload.fcmOptions?.link || "/",
      },
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  }
});

// Handle service worker activation
self.addEventListener("activate", function (event) {
  console.log("[firebase-messaging-sw.js] Activated");
  // Claim control immediately
  event.waitUntil(clients.claim());
});

// Handle service worker installation
self.addEventListener("install", function (event) {
  console.log("[firebase-messaging-sw.js] Installing");
  // Activate worker immediately
  event.waitUntil(self.skipWaiting());
});
