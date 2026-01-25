import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeCard } from "@/components/chat/WelcomeCard";
import { QuickReplies } from "@/components/chat/QuickReplies";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { BottomNav } from "@/components/layout/BottomNav";
import { StayView } from "@/components/stay/StayView";
import { sendMessage, validateToken, getMessages, getProperty, MessageItem } from "@/api";

type ActiveView = "stay" | "chat";

interface Message {
  id: string;
  message: string;
  type: "guest" | "ai" | "system";
  timestamp?: string;
  escalated?: boolean;
}

const quickReplies = [
  { id: "wifi", label: "🔐 Wi-Fi password" },
  { id: "checkout", label: "🕐 Check-out time" },
  { id: "nearby", label: "🍽️ Nearby restaurants" },
  { id: "help", label: "💬 Contact host" },
];

function mapBackendRole(role: MessageItem["role"]): Message["type"] {
  switch (role) {
    case "guest":
      return "guest";
    case "assistant":
      return "ai";
    case "property_manager":
      return "system";
    default:
      return "ai";
  }
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
}

function mapBackendMessage(msg: MessageItem): Message {
  return {
    id: msg.message_id,
    message: msg.content,
    type: mapBackendRole(msg.role),
    timestamp: formatTimestamp(msg.created_at),
    escalated: msg.escalated,
  };
}

export default function GuestApp() {
  const { token } = useParams<{ token: string }>();

  // Token validation state
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState<string>("Your Stay");
  const [guestName, setGuestName] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [activeView, setActiveView] = useState<ActiveView>("stay");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeView === "chat") {
      scrollToBottom();
    }
  }, [messages, isTyping, activeView]);

  // Token validation on mount
  useEffect(() => {
    async function initApp() {
      if (!token) {
        setError("No access token provided");
        setValidating(false);
        return;
      }

      try {
        const tokenData = await validateToken(token);
        setPropertyId(tokenData.property_id);
        setGuestName(tokenData.guest_name);

        // Fetch property name
        const property = await getProperty(tokenData.property_id);
        if (property?.name) {
          setPropertyName(property.name);
        }

        // Load existing conversation if any
        if (tokenData.conversation_id) {
          setConversationId(tokenData.conversation_id);
          const historyMessages = await getMessages(
            tokenData.property_id,
            tokenData.conversation_id
          );
          setMessages(historyMessages.map(mapBackendMessage));
          lastMessageCountRef.current = historyMessages.length;
          if (historyMessages.length > 0) {
            setShowQuickReplies(false);
          }
        }

        setValidating(false);
      } catch (err) {
        console.error("Token validation failed:", err);
        setError("Invalid or expired access link. Please request a new one from your host.");
        setValidating(false);
      }
    }

    initApp();
  }, [token]);

  // Message polling for PM replies
  useEffect(() => {
    if (!propertyId || !conversationId) return;

    const pollInterval = setInterval(async () => {
      try {
        const currentMessages = await getMessages(propertyId, conversationId);
        if (currentMessages.length > lastMessageCountRef.current) {
          setMessages(currentMessages.map(mapBackendMessage));
          lastMessageCountRef.current = currentMessages.length;
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [propertyId, conversationId]);

  const handleSend = useCallback(
    async (message: string) => {
      if (!propertyId) return;

      const tempId = Date.now().toString();
      const guestMessage: Message = {
        id: tempId,
        message,
        type: "guest",
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, guestMessage]);
      setShowQuickReplies(false);
      setIsTyping(true);

      try {
        const response = await sendMessage(
          propertyId,
          message,
          conversationId || undefined,
          guestName || undefined
        );

        if (!conversationId) {
          setConversationId(response.conversation_id);
        }

        const aiMessage: Message = {
          id: response.message_id,
          message: response.answer,
          type: "ai",
          timestamp: "Just now",
          escalated: response.escalated,
        };

        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === tempId ? { ...m, id: `guest-${response.message_id}` } : m
          );
          return [...updated, aiMessage];
        });

        lastMessageCountRef.current += 2;

        setTimeout(() => {
          setMessages((current) => {
            if (current.length < 6) {
              setShowQuickReplies(true);
            }
            return current;
          });
        }, 500);
      } catch (err) {
        console.error("Send failed:", err);
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          message: "Sorry, I couldn't process your message. Please try again.",
          type: "ai",
          timestamp: "Just now",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [propertyId, conversationId, guestName]
  );

  const handleQuickReply = (reply: { id: string; label: string }) => {
    const cleanLabel = reply.label.replace(/^[^\w]+/, "").trim();
    handleSend(cleanLabel);
  };

  // Loading state during token validation
  if (validating) {
    return (
      <div className="flex flex-col h-screen bg-background max-w-lg mx-auto items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your concierge...</p>
      </div>
    );
  }

  // Error state for invalid token
  if (error) {
    return (
      <div className="flex flex-col h-screen bg-background max-w-lg mx-auto items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Access Required</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Stay View
  if (activeView === "stay") {
    return (
      <StayView propertyName={propertyName}>
        <BottomNav activeView={activeView} onViewChange={setActiveView} />
      </StayView>
    );
  }

  // Chat View
  return (
    <div className="flex flex-col h-screen bg-background max-w-lg mx-auto">
      <ChatHeader propertyName={propertyName} stayDates="" />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-20">
        <WelcomeCard propertyName={propertyName} />

        {messages.map((msg, index) => (
          <ChatBubble
            key={msg.id}
            message={msg.message}
            type={msg.type}
            timestamp={msg.timestamp}
            showAvatar={index === 0 || messages[index - 1]?.type !== msg.type}
            isLatest={index === messages.length - 1 && msg.type === "guest"}
            escalated={msg.escalated}
          />
        ))}

        <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>

        <AnimatePresence>
          {showQuickReplies && messages.length < 4 && (
            <QuickReplies replies={quickReplies} onSelect={handleQuickReply} />
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </main>

      <div className="pb-20">
        <ChatInput
          onSend={(msg) => handleSend(msg)}
          placeholder="Ask me anything..."
          disabled={isTyping}
        />
      </div>

      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}
