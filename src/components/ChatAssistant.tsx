import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  AlertTriangle,
  Bot,
  MessageCircle,
  MessageSquare,
  User,
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
} from "@/utils/localStorageUtils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const ChatAssistant: React.FC<ChatAssistantProps> = ({
  language,
}): React.ReactNode => {
  const strings = getLanguageStrings(language);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  const prompt = `
You are a multilingual medical assistant for a tablet reminder app.

The user asked: {userMessage}

The user will ask questions related to their health — either by mentioning symptoms (like headache, chest pain) or by tablet name (like Paracetamol).

Your task is to:
- Suggest the most suitable tablet for the symptom, if the user describes a health issue.
- Provide full information about the tablet if the user asks by name: include uses, dosage, timing, side effects, and precautions.
- If the user mentions emergency symptoms like chest pain, vomiting, dizziness, or fainting — immediately warn them:
  → "This might be an emergency. Please call 108 or visit the nearest hospital."
- Always answer in the user's selected language: {userLanguage}.

Use clear, friendly, and medically accurate language.
If unsure about a symptom, recommend that they consult a real doctor.
`;

  if (!apiKey) {
    console.error(
      "Gemini API key is not set. Please set VITE_GEMINI_API_KEY in your .env file."
    );
  }

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history from local storage on component mount
  useEffect(() => {
    const history = getChatHistory();
    setMessages(history);
  }, []);

  // Focus input after emergency alert is closed
  useEffect(() => {
    if (!showEmergencyAlert) {
      inputRef.current?.focus();
    }
  }, [showEmergencyAlert]);

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
    setIsLoading(true);
    saveMessageToLocalStorage(userMessage);

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

      const dynamicPrompt = prompt
        .replace("{userMessage}", newMessage)
        .replace("{userLanguage}", language);

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
        model: "gemini",
      };

      setMessages((prev) => [...prev, aiMessage]);
      saveMessageToLocalStorage(aiMessage);
    } catch (error) {
      console.error("Gemini AI error:", error);
      // Remove typing indicator
      setMessages((prev) =>
        prev.filter((msg) => !msg.id.startsWith("typing-"))
      );

      const aiMessage: Message = {
        id: Date.now().toString(),
        content:
          language === "tamil"
            ? "மன்னிக்கவும், Gemini AI உடன் இணைப்பதில் சிக்கல் உள்ளது. பிறகு முயற்சிக்கவும்."
            : language === "hindi"
            ? "क्षमा करें, मैं Gemini AI से कनेक्ट करने में समस्या हो रही है। कृपया बाद में पुनः प्रयास करें।"
            : "Sorry, I am having trouble connecting to Gemini AI. Please try again later.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      saveMessageToLocalStorage(aiMessage);
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

  return (
    <div className="flex p-5 flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-180px)]">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-health-primary" />
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
