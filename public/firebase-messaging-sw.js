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
  const notificationTitle = payload.notification.title || "Notification";
  const notificationOptions = {
    body: payload.notification.body || "Background message received.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
