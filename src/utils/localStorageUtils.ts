import { Message } from "@/components/ChatAssistant";

const CHAT_HISTORY_KEY = "health_wise_chat_history";

export const saveMessageToLocalStorage = (message: Message): void => {
  try {
    const history = getChatHistory();
    history.push(message);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save message to local storage:", error);
  }
};

export const getChatHistory = (): Message[] => {
  try {
    const historyString = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!historyString) return [];
    
    const parsed = JSON.parse(historyString);
    // Ensure we have an array and validate basic structure
    if (Array.isArray(parsed)) {
      return parsed
        .filter(item => 
          typeof item.content === "string" && 
          typeof item.isUser === "boolean"
        )
        .map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
    }
    return [];
  } catch (error) {
    console.error("Failed to parse chat history:", error);
    return [];
  }
};

export const clearChatHistory = (): void => {
  localStorage.removeItem(CHAT_HISTORY_KEY);
};
