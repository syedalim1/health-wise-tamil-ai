import admin from "../../firebase/admin";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get token and userId from request body
    const { token, userId } = req.body;

    // Validate token
    if (!token) {
      return res.status(400).json({ error: "FCM token is required" });
    }

    // Store token in Firestore (ideal solution)
    // This creates a devices collection with documents for each token
    const db = admin.firestore();
    await db
      .collection("devices")
      .doc(token)
      .set(
        {
          token,
          userId: userId || "anonymous",
          platform: "web",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    // Send a test notification to verify the token works
    try {
      await admin.messaging().send({
        token,
        notification: {
          title: "Device Registered",
          body: "Your device is now set up to receive notifications",
        },
      });
      console.log("Test notification sent successfully");
    } catch (notificationError) {
      console.error("Error sending test notification:", notificationError);
      // Don't fail the registration if test notification fails
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error registering device:", error);
    return res.status(500).json({ error: "Failed to register device" });
  }
}
