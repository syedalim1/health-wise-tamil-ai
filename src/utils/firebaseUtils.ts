import { onMessageListener as originalOnMessageListener } from "../../firebase";

// Re-export the message listener function
export const onMessageListener = originalOnMessageListener;
