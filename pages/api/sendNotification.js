import admin from "firebase-admin";
import path from "path";
import fs from "fs";

if (!admin.apps.length) {
  try {
    // Read service account key from file
    const serviceAccountPath = path.resolve(process.cwd(), "service_key.json");
    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf8")
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, title, body, data } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  console.log("Sending notification to token:", token);
  console.log("Notification title:", title);
  console.log("Notification body:", body);
  console.log("Notification data:", data);

  const message = {
    token,
    notification: {
      title: title || "🔥 Test Notification",
      body: body || "Button click panna idhu vandhuchu!",
    },
    // Optional data payload
    ...(data && { data }),
    // Add Android-specific configuration
    android: {
      priority: "high",
      notification: {
        sound: "default",
        priority: "high",
        clickAction: "FLUTTER_NOTIFICATION_CLICK",
      },
    },
    // Add Apple-specific configuration
    apns: {
      headers: {
        "apns-priority": "10",
      },
      payload: {
        aps: {
          sound: "default",
          badge: 1,
          content_available: true,
        },
      },
    },
    // Add Web-specific configuration
    webpush: {
      headers: {
        TTL: "86400", // 24 hours in seconds
        Urgency: "high",
      },
      notification: {
        icon: "/favicon.ico",
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
          {
            action: "confirm",
            title: "✓ Taken",
          },
          {
            action: "postpone",
            title: "⏰ Later",
          },
        ],
      },
      fcm_options: {
        link: "/",
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).json({
      message: "Notification sent successfully",
      response,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      message: "Notification failed",
      error: error.message,
    });
  }
}
