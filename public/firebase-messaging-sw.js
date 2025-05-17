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
firebase.initializeApp({
  apiKey: "AIzaSyD72JjYaqmgwYw7eSTlyM_9dy-EevE9bUQ",
  authDomain: "asmi-project-notification.firebaseapp.com",
  projectId: "asmi-project-notification",
  storageBucket: "asmi-project-notification.firebasestorage.app",
  messagingSenderId: "936650736998",
  appId: "1:936650736998:web:34fbf60a68aa59712574a7",
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message:",
    payload
  );

  // Customize notification here
  const notificationTitle =
    payload.notification?.title || "Medication Reminder";
  const notificationOptions = {
    body: payload.notification?.body || "Time to take your medication",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.data?.medicationId || "medication-reminder", // Group notifications by medication
    data: payload.data,
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
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification clicked:", event);
  event.notification.close();

  const medicationId = event.notification.data?.medicationId;
  const action = event.action;

  // Handle different actions
  if (action === "confirm" && medicationId) {
    // Medication taken action
    const clientUrl = `${self.location.origin}/?action=taken&medicationId=${medicationId}`;
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          // If a window client is available, navigate to it
          for (const client of clientList) {
            if (client.url === clientUrl && "focus" in client) {
              return client.focus();
            }
          }
          // If no window client, open a new window
          if (clients.openWindow) {
            return clients.openWindow(clientUrl);
          }
        })
    );
  } else if (action === "postpone" && medicationId) {
    // Schedule a reminder for 15 minutes later
    const postponeTime = Date.now() + 15 * 60 * 1000; // 15 minutes
    event.waitUntil(
      self.registration.showNotification(event.notification.title, {
        ...event.notification.options,
        body: "Reminder postponed for 15 minutes",
        showTrigger: new TimestampTrigger(postponeTime),
      })
    );
  } else {
    // Default action - open/focus window
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if ("focus" in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow("/");
          }
        })
    );
  }
});

// Handle push events (for browsers that support push API)
self.addEventListener("push", (event) => {
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
      data: payload.data,
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
    };

    event.waitUntil(
      self.registration.showNotification(notificationTitle, notificationOptions)
    );
  }
});
