// import admin from "../../firebase/admin";

// export default async function handler(req, res) {
//   // Only allow POST requests
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   try {
//     // Parse the request body (handle both JSON and raw formats)
//     let body;
//     if (typeof req.body === "string") {
//       body = JSON.parse(req.body);
//     } else {
//       body = req.body;
//     }

//     const { userId, fcmToken, timestamp } = body;

//     // Validate input
//     if (!fcmToken) {
//       return res.status(400).json({ error: "FCM token is required" });
//     }

//     // Send notification to mobile devices
//     const message = {
//       notification: {
//         title: "Browser Session Ended",
//         body: "Your health monitoring session has ended",
//       },
//       data: {
//         type: "BROWSER_CLOSED",
//         userId: userId || "unknown",
//         timestamp: timestamp?.toString() || Date.now().toString(),
//       },
//       token: fcmToken,
//     };

//     // Send message using Firebase Admin SDK
//     const response = await admin.messaging().send(message);
//     console.log("Browser close notification sent successfully:", response);

//     // Since this might be called with sendBeacon, the response may not matter,
//     // but we'll send a success response anyway
//     return res.status(200).json({ success: true, messageId: response });
//   } catch (error) {
//     console.error("Error sending browser close notification:", error);
//     return res.status(500).json({ error: "Failed to send notification" });
//   }
// }
