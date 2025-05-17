import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  AlertTriangle,
  Bot,
  MessageCircle,
  RefreshCw,
  Trash2,
  Settings,
  Save,
  User,
  ListFilter,
  Download,
  Upload,
  Edit,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Language, getLanguageStrings } from "@/utils/languageUtils";
import { isEmergencyMessage } from "@/utils/emergencyUtils";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  getChatHistory,
  saveMessageToLocalStorage,
  clearChatHistory,
  getConversations,
  Conversation,
  loadConversation,
  deleteConversation,
  saveCurrentConversation,
  exportChatHistory,
  importChatHistory,
} from "@/utils/localStorageUtils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ChatAssistantProps {
  language: Language;
}

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  model?: string;
}

// Added model types for selection

const ChatAssistant: React.FC<ChatAssistantProps> = ({
  language,
}): React.ReactNode => {
  const strings = getLanguageStrings(language);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [streaming, setStreaming] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showConversations, setShowConversations] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [importData, setImportData] = useState("");
  const { toast } = useToast();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get API key from environment
  const getApiKey = () => {
    return import.meta.env.VITE_GEMINI_API_KEY;
  };

  // Initialize Gemini AI with API key
  const initializeGeminiAI = () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error("API key is not set in environment variables");
      return null;
    }
    return new GoogleGenerativeAI(apiKey);
  };

  // Get model with current settings
  const getModel = () => {
    const genAI = initializeGeminiAI();
    if (!genAI) return null;

    return genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-04-17",
      generationConfig: {
        temperature: temperature,
      },
    });
  };

  const prompt = `
You are a multilingual health assistant. Based on the user's symptoms or questions, explain the possible causes (e.g., why a tablet causes a specific side effect like headache, stomach pain, dizziness, etc.). Always reply in the language the user uses (Tamil, Hindi, English). Use simple, short sentences that are easy to understand. If the user mentions a tablet or symptom, tell them briefly what it does, why that effect may happen, and what they can do next. Be clear, helpful, and not too technical.
 this is user message {userMessage}

`;

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history from local storage on component mount
  useEffect(() => {
    const history = getChatHistory();
    setMessages(history);
    loadConversationsList();

    // Generate a title for the current conversation
    if (history.length > 0) {
      const firstUserMsg = history.find((msg) => msg.isUser);
      if (firstUserMsg) {
        setConversationTitle(
          firstUserMsg.content.length > 30
            ? firstUserMsg.content.substring(0, 27) + "..."
            : firstUserMsg.content
        );
      }
    }
  }, []);

  // Focus input after emergency alert is closed
  useEffect(() => {
    if (!showEmergencyAlert) {
      inputRef.current?.focus();
    }
  }, [showEmergencyAlert]);

  // Load conversations list
  const loadConversationsList = () => {
    const loadedConversations = getConversations();
    setConversations(loadedConversations);
  };

  // Handler for loading a specific conversation
  const handleLoadConversation = (conversationId: string) => {
    const loaded = loadConversation(conversationId);
    setMessages(loaded);

    // Find the conversation to set its title
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setConversationTitle(conversation.title);
    }

    setShowConversations(false);
    toast({
      title: "Conversation Loaded",
      description: "Successfully loaded the selected conversation.",
    });
  };

  // Handler for deleting a conversation
  const handleDeleteConversation = (conversationId: string) => {
    deleteConversation(conversationId);
    loadConversationsList();
    toast({
      title: "Conversation Deleted",
      description: "The conversation has been removed.",
    });
  };

  // Handler for saving current conversation with a title
  const handleSaveConversation = () => {
    if (messages.length === 0) {
      toast({
        title: "No Messages",
        description: "There are no messages to save.",
        variant: "destructive",
      });
      return;
    }

    // Save with the current title or a default one
    const title = isEditingTitle ? editingTitle : conversationTitle;
    saveCurrentConversation(title);

    setConversationTitle(title);
    setIsEditingTitle(false);
    loadConversationsList();

    toast({
      title: "Conversation Saved",
      description: "Your conversation has been saved successfully.",
    });
  };

  // Start title editing
  const startTitleEdit = () => {
    setEditingTitle(conversationTitle);
    setIsEditingTitle(true);
  };

  // Cancel title editing
  const cancelTitleEdit = () => {
    setIsEditingTitle(false);
  };

  // Export chat history to file
  const handleExportHistory = () => {
    const jsonData = exportChatHistory();
    if (!jsonData) {
      toast({
        title: "Nothing to Export",
        description: "There is no conversation history to export.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health-wise-chat-history-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Export Successful",
      description: "Your chat history has been exported to a file.",
    });
  };

  // Import chat history from file
  const handleImportHistory = () => {
    fileInputRef.current?.click();
  };

  // Process the file upload for import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  // Confirm import of data
  const confirmImport = () => {
    if (!importData) return;

    const success = importChatHistory(importData);
    if (success) {
      loadConversationsList();
      toast({
        title: "Import Successful",
        description: "Your chat history has been imported.",
      });
      setImportData("");
    } else {
      toast({
        title: "Import Failed",
        description: "The file format is invalid or corrupted.",
        variant: "destructive",
      });
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    clearChatHistory();
    setConversationTitle("");
    toast({
      title: "Chat Cleared",
      description: "Your conversation history has been cleared.",
    });
  };

  const handleRegenerateResponse = async () => {
    // Find the last user message to regenerate a response for it
    const lastUserMessageIndex = [...messages]
      .reverse()
      .findIndex((m) => m.isUser);
    if (lastUserMessageIndex === -1) return;

    const lastUserMessage = [...messages].reverse()[lastUserMessageIndex];

    // Remove all AI messages after this user message
    const messagesToKeep = messages.slice(
      0,
      messages.length - lastUserMessageIndex
    );
    setMessages(messagesToKeep);

    // Generate a new response
    await generateAIResponse(lastUserMessage.content);
  };

  const generateAIResponse = async (userMessageContent: string) => {
    const model = getModel();
    if (!model) {
      toast({
        title: "API Key Missing",
        description: "Please set the VITE_GEMINI_API_KEY environment variable.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add typing indicator
      const tempId = `typing-${Date.now()}`;
      const typingMessage: Message = {
        id: tempId,
        content: "...",
        isUser: false,
        timestamp: new Date(),
        model: "typing",
      };
      setMessages((prev) => [...prev, typingMessage]);

      const dynamicPrompt = prompt.replace("{userMessage}", userMessageContent);

      if (streaming) {
        // Use streaming response

        console.log("dynamicPrompt", dynamicPrompt);

        const result = await model.generateContentStream(dynamicPrompt);
        let accumulatedText = "";

        // Remove typing indicator and add actual response
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));

        const streamId = Date.now().toString();

        // Add initial empty message
        const initialMessage: Message = {
          id: streamId,
          content: "",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, initialMessage]);

        // Process the stream
        for await (const chunk of result.stream) {
          const text = chunk.text();
          accumulatedText += text;

          // Update the message with accumulated text
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamId ? { ...msg, content: accumulatedText } : msg
            )
          );
        }

        // Save the final message to localStorage
        const finalMessage: Message = {
          id: streamId,
          content: accumulatedText,
          isUser: false,
          timestamp: new Date(),
        };
        saveMessageToLocalStorage(finalMessage);
      } else {
        // Use non-streaming response
        const result = await model.generateContent(dynamicPrompt);
        const response = await result.response;
        const text = response.text();

        // Remove typing indicator and add actual response
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));

        const aiMessage: Message = {
          id: Date.now().toString(),
          content: text,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        saveMessageToLocalStorage(aiMessage);
      }
    } catch (error) {
      console.error("AI error:", error);
      // Remove typing indicator
      setMessages((prev) =>
        prev.filter((msg) => !msg.id.startsWith("typing-"))
      );

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      const aiMessage: Message = {
        id: Date.now().toString(),
        content:
          language === "tamil"
            ? `மன்னிக்கவும், AI உடன் இணைப்பதில் சிக்கல் உள்ளது. பிறகு முயற்சிக்கவும். (${errorMessage})`
            : language === "hindi"
            ? `क्षमा करें, मैं AI से कनेक्ट करने में समस्या हो रही है। कृपया बाद में पुनः प्रयास करें। (${errorMessage})`
            : `Sorry, I am having trouble connecting to AI. Please try again later. (${errorMessage})`,
        isUser: false,
        timestamp: new Date(),
        model: "error",
      };
      setMessages((prev) => [...prev, aiMessage]);
      saveMessageToLocalStorage(aiMessage);

      toast({
        title: "Connection Error",
        description:
          "Failed to connect to AI. Please check your API key in the environment variables.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Check for emergency symptoms
    const isEmergency = isEmergencyMessage(newMessage, language);
    if (isEmergency) {
      setShowEmergencyAlert(true);
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      isUser: true,
      timestamp: new Date(),
      model: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    saveMessageToLocalStorage(userMessage);

    // Update title if this is the first message
    if (messages.length === 0) {
      const title =
        newMessage.length > 30
          ? newMessage.substring(0, 27) + "..."
          : newMessage;
      setConversationTitle(title);
    }

    const messageToSend = newMessage;
    setNewMessage("");
    setIsLoading(true);

    try {
      await generateAIResponse(messageToSend);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex p-5 flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-180px)]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-health-primary" />
          Smart Health Assistant
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            disabled={messages.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Emergency Alert */}
      {showEmergencyAlert && (
        <Alert className="mb-4 bg-health-danger/10 border-health-danger">
          <AlertTriangle className="h-4 w-4 text-health-danger" />
          <AlertTitle className="text-health-danger font-bold">
            {strings.emergencyAlert}
          </AlertTitle>
          <AlertDescription className="text-health-danger">
            {strings.emergencyMessage}
          </AlertDescription>
          <Button
            className="mt-2 bg-health-danger text-white hover:bg-health-danger/90"
            size="sm"
            onClick={() => setShowEmergencyAlert(false)}
          >
            OK
          </Button>
        </Alert>
      )}

      {/* Conversations Dialog */}
      <Dialog open={showConversations} onOpenChange={setShowConversations}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conversation History</DialogTitle>
            <DialogDescription>
              View, manage, and restore your past conversations
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-between gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={handleImportHistory}>
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportHistory}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>

          {importData && (
            <Alert className="mb-4">
              <h4 className="font-medium">Import Data</h4>
              <p className="text-sm mb-2">
                Are you sure you want to import this data? It will replace your
                current history.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="default" onClick={confirmImport}>
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImportData("")}
                >
                  Cancel
                </Button>
              </div>
            </Alert>
          )}

          <ScrollArea className="h-[300px] pr-4">
            {conversations.length === 0 ? (
              <div className="text-center p-4 text-gray-400">
                <p>No saved conversations yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations
                  .sort(
                    (a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()
                  )
                  .map((conv) => (
                    <Card key={conv.id} className="p-0">
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm font-medium line-clamp-1">
                          {conv.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-0 pt-1">
                        <p className="text-xs text-gray-500">
                          {formatDate(conv.lastUpdated)} ·{" "}
                          {conv.messages.length} messages
                        </p>
                      </CardContent>
                      <CardFooter className="p-3 pt-2 gap-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleDeleteConversation(conv.id)}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleLoadConversation(conv.id)}
                        >
                          Load
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowConversations(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              disabled={messages.length === 0}
              onClick={handleSaveConversation}
            >
              Save Current Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chatbot Capabilities Card */}
      <Card className="mb-4 bg-health-light/30 border-health-light">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm font-medium text-health-primary">
            {strings.chatCapabilities}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <ul className="text-xs text-gray-600 space-y-1">
            <li className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="h-1.5 w-1.5 p-0 rounded-full bg-blue-500"
              ></Badge>
              {strings.askSymptom}
            </li>
            <li className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="h-1.5 w-1.5 p-0 rounded-full bg-green-500"
              ></Badge>
              {strings.askMedication}
            </li>
            <li className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="h-1.5 w-1.5 p-0 rounded-full bg-red-500"
              ></Badge>
              {strings.emergencyDetection}
            </li>
            <li className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="h-1.5 w-1.5 p-0 rounded-full bg-purple-500"
              ></Badge>
              {strings.multilingualSupport}
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <div className="flex-grow overflow-auto bg-gray-50 rounded-lg p-4 space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Bot className="h-12 w-12 mb-3 text-health-primary/30" />
            <p className="text-sm">Chat with your healthcare assistant</p>
            <p className="text-xs">
              Ask about medications, symptoms, or health advice
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-4 py-2 ${
                  message.isUser
                    ? "bg-health-primary text-white rounded-br-none"
                    : message.model === "typing"
                    ? "bg-white border border-gray-200 rounded-bl-none animate-pulse"
                    : "bg-white border border-gray-200 rounded-bl-none"
                }`}
              >
                <div className="flex items-center mb-1">
                  {!message.isUser && (
                    <Avatar className="h-6 w-6 mr-2 bg-health-light text-health-primary">
                      <span className="font-bold text-xs">AI</span>
                    </Avatar>
                  )}
                  <span className="text-xs opacity-70">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {message.model === "typing" ? (
                    <span className="inline-flex">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce animation-delay-200">
                        .
                      </span>
                      <span className="animate-bounce animation-delay-400">
                        .
                      </span>
                    </span>
                  ) : (
                    message.content
                  )}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex items-center space-x-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder={strings.chatPlaceholder}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="input-health flex-grow"
          disabled={isLoading}
        />
        <Button
          onClick={handleSendMessage}
          className="bg-health-primary hover:bg-health-primary/90"
          disabled={!newMessage.trim() || isLoading}
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" />
              {strings.send}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatAssistant;
