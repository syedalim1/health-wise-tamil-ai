// pages/api/sendNotification.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export default async function handler(req, res) {
  const { token } = req.body;

  const message = {
    token,
    notification: {
      title: "Immediate Notification",
      body: "Button click panna idhu vandhuchu!",
    },
  };

  try {
    await admin.messaging().send(message);
    res.status(200).json({ message: "Notification sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Notification failed", error });
  }
}
