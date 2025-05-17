import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import cron from "node-cron";

interface NotificationEntry {
  time: string;
  token: string;
  // Add other properties if they exist in notifications.json
}

// Check for required environment variables
const projectId = "asmi-project-notification";
const clientEmail =
  "firebase-adminsdk-fbsvc@asmi-project-notification.iam.gserviceaccount.com";
const privateKey =
  "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDVpjYhWdLQM7EZ\npyO/mIJRjGxiIcWMCtIOKftR5dROu+kfdQflqIjcfzTmWwH58VEzJbJcgK851O1s\n...rest_of_private_key...\n-----END PRIVATE KEY-----\n";

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Missing Firebase Admin SDK environment variables. Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
  );
}

// Initialize Firebase Admin SDK
const serviceAccount = require("@/service_key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const dbPath = path.resolve("notifications.json");

cron.schedule("* * * * *", async () => {
  const now = new Date();
  const data: NotificationEntry[] = fs.existsSync(dbPath)
    ? JSON.parse(fs.readFileSync(dbPath, "utf-8"))
    : [];

  const remaining: NotificationEntry[] = [];

  for (const entry of data) {
    const target = new Date(entry.time);
    if (target <= now) {
      await admin.messaging().send({
        token: entry.token,
        notification: {
          title: "Health Reminder",
          body: "Time to take your medicine!",
        },
        webpush: {
          notification: {
            icon: "/favicon.ico",
            requireInteraction: true,
          },
        },
      });
      console.log("Notification sent to:", entry.token);
    } else {
      remaining.push(entry);
    }
  }

  fs.writeFileSync(dbPath, JSON.stringify(remaining, null, 2));
});
