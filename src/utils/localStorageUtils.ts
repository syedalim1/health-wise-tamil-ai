import { Message } from "@/components/ChatAssistant";

const CHAT_HISTORY_KEY = "health_wise_chat_history";
const CONVERSATIONS_KEY = "health_wise_conversations";

// Interface for conversation management
export interface Conversation {
  id: string;
  title: string;
  created: Date;
  lastUpdated: Date;
  messages: Message[];
}

// Save a single message to the current chat history
export const saveMessageToLocalStorage = (message: Message): void => {
  try {
    const history = getChatHistory();
    history.push(message);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));

    // Update the current conversation's last update time
    updateCurrentConversation();
  } catch (error) {
    console.error("Failed to save message to local storage:", error);
  }
};

// Get the current chat history
export const getChatHistory = (): Message[] => {
  try {
    const historyString = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!historyString) return [];

    const parsed = JSON.parse(historyString);
    // Ensure we have an array and validate basic structure
    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (item) =>
            typeof item.content === "string" && typeof item.isUser === "boolean"
        )
        .map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
    }
    return [];
  } catch (error) {
    console.error("Failed to parse chat history:", error);
    return [];
  }
};

// Clear current chat history
export const clearChatHistory = (): void => {
  localStorage.removeItem(CHAT_HISTORY_KEY);

  // Also update the conversations list
  const currentConversationId = getCurrentConversationId();
  if (currentConversationId) {
    deleteConversation(currentConversationId);
  }
};

// Get all saved conversations
export const getConversations = (): Conversation[] => {
  try {
    const conversationsString = localStorage.getItem(CONVERSATIONS_KEY);
    if (!conversationsString) return [];

    const parsed = JSON.parse(conversationsString);
    if (Array.isArray(parsed)) {
      return parsed.map((conv) => ({
        ...conv,
        created: new Date(conv.created),
        lastUpdated: new Date(conv.lastUpdated),
        messages: conv.messages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to parse conversations:", error);
    return [];
  }
};

// Save the current conversation with a title
export const saveCurrentConversation = (title?: string): string => {
  const messages = getChatHistory();
  if (messages.length === 0) return "";

  const conversations = getConversations();
  const currentId = getCurrentConversationId() || generateId();

  // Generate a title if not provided
  const conversationTitle = title || generateTitleFromMessages(messages);

  const now = new Date();
  const conversation: Conversation = {
    id: currentId,
    title: conversationTitle,
    created: now,
    lastUpdated: now,
    messages,
  };

  // Update or add the conversation
  const existingIndex = conversations.findIndex((c) => c.id === currentId);
  if (existingIndex >= 0) {
    conversations[existingIndex] = conversation;
  } else {
    conversations.push(conversation);
  }

  // Save to localStorage
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  localStorage.setItem("current_conversation_id", currentId);

  return currentId;
};

// Update the current conversation without changing its title
const updateCurrentConversation = (): void => {
  const currentId = getCurrentConversationId();
  if (!currentId) {
    // If no current conversation, create one
    saveCurrentConversation();
    return;
  }

  const messages = getChatHistory();
  if (messages.length === 0) return;

  const conversations = getConversations();
  const existingIndex = conversations.findIndex((c) => c.id === currentId);

  if (existingIndex >= 0) {
    // Update the existing conversation
    conversations[existingIndex].messages = messages;
    conversations[existingIndex].lastUpdated = new Date();
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } else {
    // Create a new conversation
    saveCurrentConversation();
  }
};

// Load a specific conversation
export const loadConversation = (conversationId: string): Message[] => {
  const conversations = getConversations();
  const conversation = conversations.find((c) => c.id === conversationId);

  if (conversation) {
    // Set as current conversation
    localStorage.setItem(
      CHAT_HISTORY_KEY,
      JSON.stringify(conversation.messages)
    );
    localStorage.setItem("current_conversation_id", conversationId);
    return conversation.messages;
  }

  return [];
};

// Delete a conversation
export const deleteConversation = (conversationId: string): void => {
  const conversations = getConversations();
  const filtered = conversations.filter((c) => c.id !== conversationId);
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));

  // If we deleted the current conversation, clear the current ID
  if (getCurrentConversationId() === conversationId) {
    localStorage.removeItem("current_conversation_id");
  }
};

// Get current conversation ID
export const getCurrentConversationId = (): string | null => {
  return localStorage.getItem("current_conversation_id");
};

// Generate a conversation title from messages
const generateTitleFromMessages = (messages: Message[]): string => {
  // Find first user message to use as title
  const firstUserMessage = messages.find((msg) => msg.isUser);
  if (firstUserMessage) {
    // Truncate to reasonable length for a title
    const content = firstUserMessage.content;
    return content.length > 30 ? content.substring(0, 27) + "..." : content;
  }
  return `Conversation ${new Date().toLocaleString()}`;
};

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Export conversation history as JSON
export const exportChatHistory = (): string => {
  const conversations = getConversations();
  return JSON.stringify(conversations);
};

// Import conversation history from JSON
export const importChatHistory = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) throw new Error("Invalid format");

    localStorage.setItem(CONVERSATIONS_KEY, jsonString);
    return true;
  } catch (error) {
    console.error("Failed to import chat history:", error);
    return false;
  }
};
