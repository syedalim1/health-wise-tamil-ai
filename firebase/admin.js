import admin from "firebase-admin";

// Check if Firebase admin is already initialized

const privateKey =
  "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDVpjYhWdLQM7EZ\npyO/mIJRjGxiIcWMCtIOKftR5dROu+kfdQflqIjcfzTmWwH58VEzJbJcgK851O1s\n...rest_of_private_key...\n-----END PRIVATE KEY-----\n";
if (!admin.apps.length) {
  try {
    // Initialize Firebase Admin with service account
    // For production, use environment variables for credentials
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "asmi-project-notification",
        clientEmail:
          "firebase-adminsdk-fbsvc@asmi-project-notification.iam.gserviceaccount.com",
        // The private key needs special handling as it contains newlines
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      // If you're using Firebase Database, Storage, etc., add their configs here
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }
}

export default admin;
