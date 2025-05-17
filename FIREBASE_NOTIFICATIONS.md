# Firebase Cloud Messaging Notifications Setup

This document explains how to use Firebase Cloud Messaging (FCM) notifications in this project.

## Setup Complete

The Firebase notification setup is now complete with:

1. Firebase SDK initialized in `firebase.ts`
2. Service worker created at `public/firebase-messaging-sw.js`
3. Sample implementation created at `src/notificationExample.tsx`

## How to Use FCM Notifications

### 1. Import the notification handler

```jsx
import { NotificationsHandler } from "../src/notificationExample";

function YourApp() {
  return (
    <div>
      {/* This will handle permission requests and foreground notifications */}
      <NotificationsHandler />

      {/* Your other components */}
    </div>
  );
}
```

### 2. Request Notification Permission Manually (if needed)

```jsx
import { requestNotificationPermission } from "./firebase";

// In your component
const handleRequestPermission = async () => {
  const token = await requestNotificationPermission();
  if (token) {
    console.log("FCM Token:", token);
    // Send this token to your backend server to enable sending notifications to this device
  }
};

// Use a button or other trigger
<button onClick={handleRequestPermission}>Enable Notifications</button>;
```

### 3. Listen for Foreground Messages

```jsx
import { onMessageListener } from "./firebase";

// In your component's useEffect
useEffect(() => {
  const unsubscribe = onMessageListener().then((payload) => {
    // Handle the notification payload
    console.log("Received foreground message:", payload);

    // Show your custom notification UI
    // ...
  });

  return () => {
    unsubscribe.catch((err) => console.log("Error unsubscribing:", err));
  };
}, []);
```

### 4. Send Test Notifications

You can send test notifications from the Firebase Console:

1. Go to your Firebase project console
2. Navigate to Messaging > Campaigns
3. Create a new campaign or send a test message
4. Use the FCM token printed in your console when permission is granted

## Customizing Notifications

### Foreground Notifications

Customize how foreground notifications appear by modifying the handler in `src/notificationExample.tsx`.

### Background Notifications

Customize how background notifications appear by modifying the service worker at `public/firebase-messaging-sw.js`.

## Troubleshooting

1. **Notifications don't appear in production:**

   - Make sure service worker is being served from the root domain path
   - Verify your VAPID key is correct

2. **No token is generated:**

   - Check browser console for errors
   - Make sure notification permission is granted
   - Verify your Firebase configuration is correct

3. **Service worker not registering:**
   - Ensure the service worker file is in the correct location
   - Check the browser console for registration errors
