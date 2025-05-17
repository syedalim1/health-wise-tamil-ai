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
    const {
      token,
      scheduleTime,
      medicationName,
      dosage,
      timeDisplay,
      medicationId,
    } = req.body;

    if (!token || !scheduleTime || !medicationName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const scheduleDate = new Date(scheduleTime);
    const now = new Date();

    // If the scheduled time has already passed, return error
    if (scheduleDate < now) {
      return res
        .status(400)
        .json({ error: "Scheduled time has already passed" });
    }

    // Calculate delay in seconds from now
    const delaySeconds = Math.floor(
      (scheduleDate.getTime() - now.getTime()) / 1000
    );

    // Create the payload for the notification
    const payload = {
      notification: {
        title: `Time for your medication: ${timeDisplay}`,
        body: `${medicationName} - ${dosage}`,
        icon: "/icons/medication-96x96.png",
        clickAction: "/tablet-reminder",
      },
      data: {
        medicationId: medicationId || "",
        medicationName,
        dosage,
        timeDisplay,
        clickAction: "/tablet-reminder",
        scheduleTime: scheduleTime,
      },
      token,
      android: {
        priority: "high",
        notification: {
          color: "#4f46e5",
          channelId: "medication-reminders",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    let response;

    // If delay is less than 10 minutes, send immediately
    if (delaySeconds < 600) {
      response = await admin.messaging().send(payload);
    } else {
      // Otherwise schedule for later
      response = await admin.messaging().send({
        ...payload,
        android: {
          ...payload.android,
          ttl: delaySeconds * 1000, // Time to live in milliseconds
        },
        apns: {
          ...payload.apns,
          headers: {
            "apns-expiration": Math.floor(
              scheduleDate.getTime() / 1000
            ).toString(),
          },
        },
      });
    }

    return res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return res.status(500).json({ error: "Failed to schedule notification" });
  }
}
