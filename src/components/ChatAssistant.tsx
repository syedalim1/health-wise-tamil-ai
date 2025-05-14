import React, { useState, useRef, useEffect } from "react";
import { Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Language, getLanguageStrings } from "@/utils/languageUtils";
import { isEmergencyMessage } from "@/utils/emergencyUtils";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ChatAssistantProps {
  language: Language;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  model?: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ language }) => {
  const strings = getLanguageStrings(language);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        language === "english"
          ? "Hello! I'm your health assistant. How can I help you today?"
          : language === "tamil"
          ? "வணக்கம்! நான் உங்கள் ஆரோக்கிய உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?"
          : language === "hindi"
          ? "नमस्ते! मैं आपका स्वास्थ्य सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?"
          : "Vanakkam! Naan unga arokkiya uthaviyalar. Inru naan ungalukku eppadi udhava mudiyum?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  if (!apiKey) {
    console.error(
      "Gemini API key is not set. Please set VITE_GEMINI_API_KEY in your .env file."
    );
  }

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    setNewMessage("");

    try {
      const result = await model.generateContent(newMessage);
      const response = await result.response;
      const text = response.text();

      const aiMessage: Message = {
        id: Date.now().toString(),
        content: text,
        isUser: false,
        timestamp: new Date(),
        model: "gemini",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Gemini AI error:", error);
      const aiMessage: Message = {
        id: Date.now().toString(),
        content:
          "Sorry, I am having trouble connecting to Gemini AI. Please try again later.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-180px)]">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        {strings.chatAssistant}
      </h2>

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

      {/* Chat Messages */}
      <div className="flex-grow overflow-auto bg-gray-50 rounded-lg p-4 space-y-4 mb-4">
        {messages.map((message) => (
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
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder={strings.chatPlaceholder}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          className="input-health flex-grow"
        />
        <Button
          onClick={handleSendMessage}
          className="bg-health-primary hover:bg-health-primary/90"
          disabled={!newMessage.trim()}
        >
          <Send className="h-4 w-4 mr-1" />
          {strings.send}
        </Button>
      </div>
    </div>
  );
};

export default ChatAssistant;
