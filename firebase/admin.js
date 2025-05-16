import admin from "firebase-admin";

// Check if Firebase admin is already initialized
if (!admin.apps.length) {
  try {
    // Initialize Firebase Admin with service account
    // For production, use environment variables for credentials
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:
          process.env.FIREBASE_PROJECT_ID || "asmi-project-notification",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key needs special handling as it contains newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          : undefined,
      }),
      // If you're using Firebase Database, Storage, etc., add their configs here
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }
}

export default admin;
