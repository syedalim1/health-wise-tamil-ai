import React, { useState, useRef, useEffect } from "react";
import { Send, AlertTriangle } from "lucide-react";
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

const ChatAssistant: React.FC<ChatAssistantProps> = ({ language }) => {
  const strings = getLanguageStrings(language);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const { toast } = useToast();
  const messageEndRef = useRef<HTMLDivElement>(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-preview-04-17",
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


    }

    try {
      const result = await model.generateContent(prompt.replace("{userMessage}", newMessage) );
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

      // Save to local storage
      saveMessageToLocalStorage(aiMessage);

      // Save to Supabase
      const { error: aiMsgError } = await supabase
        .from("chat_messages")
        .insert({
          content: aiMessage.content,
          is_user: false,
          timestamp: aiMessage.timestamp.toISOString(),
          model: aiMessage.model,
        });

      if (aiMsgError) {
        toast({
          title: "Error saving response",
          description: "Failed to save AI response to history",
          variant: "destructive",
        });
      }
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

      {/* Chatbot Capabilities Prompt */}
      <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-100 rounded-md">
        <p>
          <strong>Chatbot Capabilities:</strong>
        </p>
        <ul className="list-disc list-inside">
          <li>Users can ask health questions by symptom or tablet name</li>
          <li>AI suggests correct tablet, timing, dosage, and side effects</li>
          <li>
            AI detects emergency symptoms like chest pain and shows alerts
          </li>
          <li>
            Chatbot replies in Tamil, English, Hindi, or Tanglish based on
            selection
          </li>
        </ul>
      </div>

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
