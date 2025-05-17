// import admin from "../../firebase/admin";

// export default async function handler(req, res) {
//   // Only allow POST requests
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   try {
//     // Get parameters from request body
//     const { token, userId, title, body, data } = req.body;

//     // Validate token
//     if (!token) {
//       return res.status(400).json({ error: "FCM token is required" });
//     }

//     // Construct the message
//     const message = {
//       token,
//       notification: {
//         title: title || "Health Reminder",
//         body: body || "New health notification",
//       },
//       data: {
//         ...data,
//         userId: userId || "unknown",
//         timestamp: Date.now().toString(),
//       },
//       // Set high priority for the notification
//       android: {
//         priority: "high",
//         notification: {
//           clickAction: "FLUTTER_NOTIFICATION_CLICK",
//           priority: "max",
//           channelId: "health_notifications",
//         },
//       },
//       // For iOS devices
//       apns: {
//         payload: {
//           aps: {
//             contentAvailable: true,
//             sound: "default",
//             badge: 1,
//           },
//         },
//       },
//       // For web clients
//       webpush: {
//         headers: {
//           Urgency: "high",
//         },
//         notification: {
//           requireInteraction: true,
//         },
//       },
//     };

//     // Send message using Firebase Admin SDK
//     const response = await admin.messaging().send(message);
//     console.log("Mobile notification sent successfully:", response);

//     return res.status(200).json({ success: true, messageId: response });
//   } catch (error) {
//     console.error("Error sending mobile notification:", error);
//     return res.status(500).json({ error: "Failed to send notification" });
//   }
// }
