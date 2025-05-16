# Firebase Cloud Messaging Setup for HealthWise Tamil AI

This document provides instructions for setting up Firebase Cloud Messaging (FCM) for the HealthWise Tamil AI application to enable Medication Cares.

## Prerequisites

1. A Google account
2. Firebase project (already set up - asmi-project-notification)

## Step 1: Firebase Configuration Status

The Firebase client configuration has already been set up with the following details:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD72JjYaqmgwYw7eSTlyM_9dy-EevE9bUQ",
  authDomain: "asmi-project-notification.firebaseapp.com",
  projectId: "asmi-project-notification",
  storageBucket: "asmi-project-notification.firebasestorage.app",
  messagingSenderId: "936650736998",
  appId: "1:936650736998:web:34fbf60a68aa59712574a7",
};
```

The VAPID key for web push notifications has also been configured:

```javascript
const vapidKey =
  "BL6WDWYOmUXReKuOauKDP4VMbPTM5WL1GcdNMUPZdgiwOwg1KVXRIJTITReuBQMsw63OUS2Bn8jyy0ygKSfeZE8";
```

These configurations are already set in:

- `src/utils/firebase.ts` (Firebase config and VAPID key)
- `public/firebase-messaging-sw.js` (Firebase config and VAPID key as a global variable)

## Step 2: Install Required Dependencies

The project already includes the necessary dependencies in `package.json`:

```bash
npm install # or yarn
```

## Step 3: Server-Side Setup (For Admin SDK)

For the server-side functionality, you still need to add a service account:

1. In the Firebase Console, navigate to Project Settings (asmi-project-notification)
2. Click on the "Service accounts" tab
3. Click on "Generate new private key"
4. Download the JSON file
5. Create a `.env.local` file in the root directory with the following variables:

```
# Firebase Admin Configuration
FIREBASE_CLIENT_EMAIL=your-service-account-email-from-json-file
FIREBASE_PRIVATE_KEY=your-private-key-from-json-file
```

## Step 4: Set Up Firebase Cloud Messaging on Android and iOS (Optional)

For mobile apps, additional setup is required:

### Android

1. Add the google-services.json to your Android app
2. Set up the necessary configurations in your Android app

### iOS

1. Add the GoogleService-Info.plist to your iOS app
2. Set up the necessary configurations in your iOS app

## Testing Firebase Cloud Messaging

To test your FCM setup:

1. Run the application
2. Enable notifications when prompted
3. Add a Medication Care
4. When the reminder time comes, you should receive a notification both in the browser and as a Firebase Cloud Message

## Troubleshooting

- Make sure your Firebase project has Cloud Messaging API enabled
- Check browser console for errors
- Make sure the service worker is registered correctly
- Verify that the Firebase Admin service account credentials are correctly set

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Web Push Notifications Guide](https://firebase.google.com/docs/cloud-messaging/js/client)
