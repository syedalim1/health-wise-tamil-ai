// Firebase SW for push notifications when tab is closed
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD72JjYaqmgwYw7eSTlyM_9dy-EevE9bUQ",
  authDomain: "asmi-project-notification.firebaseapp.com", // Added authDomain from firebase.ts
  projectId: "asmi-project-notification",
  storageBucket: "asmi-project-notification.firebasestorage.app", // Added storageBucket from firebase.ts
  messagingSenderId: "936650736998",
  appId: "1:936650736998:web:34fbf60a68aa59712574a7",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  // Check if payload.notification exists before destructuring
  if (payload.notification) {
    const { title, ...options } = payload.notification;
    if (title) { // Only show notification if title exists
      self.registration.showNotification(title, options);
    } else {
      console.warn("Background notification payload missing title:", payload);
    }
  } else {
    console.warn("Background message payload missing notification property:", payload);
  }
});
