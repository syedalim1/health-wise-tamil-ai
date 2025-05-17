import { NextApiRequest, NextApiResponse } from "next";
import admin from "firebase-admin";

const privateKey =
  "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDVpjYhWdLQM7EZ\npyO/mIJRjGxiIcWMCtIOKftR5dROu+kfdQflqIjcfzTmWwH58VEzJbJcgK851O1s\n...rest_of_private_key...\n-----END PRIVATE KEY-----\n";
// Initialize Firebase Admin SDK if it hasn't been initialized already
if (!admin.apps.length) {
  try {
    // You will still need to add a service account private key to your environment variables
    // for server-side authentication
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: "asmi-project-notification",
        clientEmail:
          "firebase-adminsdk-fbsvc@asmi-project-notification.iam.gserviceaccount.com",
        privateKey: privateKey?.replace(/\\n/g, "\n"),
      }),
      // Optional, if you're using Firestore
      databaseURL: `https://asmi-project-notification.firebaseio.com`,
    });
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Store the token in Firestore
    const db = admin.firestore();
    await db
      .collection("fcmTokens")
      .doc(token)
      .set({
        token,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        platform: req.headers["user-agent"] || "unknown",
      });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error registering FCM token:", error);
    return res.status(500).json({ error: "Failed to register token" });
  }
}
