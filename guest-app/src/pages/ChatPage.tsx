import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeCard } from "@/components/chat/WelcomeCard";
import { QuickReplies } from "@/components/chat/QuickReplies";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { BottomNav } from "@/components/layout/BottomNav";

interface Message {
  id: string;
  message: string;
  type: "guest" | "ai" | "system";
  timestamp?: string;
}

const quickReplies = [
  { id: "wifi", label: "🔐 Wi-Fi password" },
  { id: "checkout", label: "🕐 Check-out time" },
  { id: "nearby", label: "🍽️ Nearby restaurants" },
  { id: "help", label: "💬 Contact host" },
];

const aiResponses: Record<string, string> = {
  wifi: "Your Wi-Fi details:\n\n📶 Network: CoastalHaven_Guest\n🔑 Password: welcome2024\n\nYou should be connected within seconds. Let me know if you have any trouble!",
  checkout:
    "Check-out is at 11:00 AM.\n\nBefore you leave, please:\n• Place used towels in the bathroom\n• Run the dishwasher if needed\n• Lock the door behind you\n\nNo need to return the keys — just leave them on the kitchen counter. Safe travels! ✨",
  nearby:
    "Here are my top picks within walking distance:\n\n🌊 **Malibu Seafood** — Fresh catch, ocean views (5 min)\n🥗 **Sage & Honey** — Farm-to-table brunch spot (8 min)\n🍕 **Lillian's Pizza** — Local favorite, great for families (3 min)\n\nWant me to share directions to any of these?",
  help: "I'm connecting you with Sarah, your property manager. She typically responds within a few minutes.\n\nIn the meantime, is there anything I can help you with?",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (message: string, quickReplyId?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      message,
      type: "guest",
      timestamp: "Just now",
    };
    setMessages((prev) => [...prev, newMessage]);
    setShowQuickReplies(false);

    // Simulate AI response
    setIsTyping(true);

    const responseTime = 1200 + Math.random() * 800;

    setTimeout(() => {
      let response =
        aiResponses[quickReplyId || ""] ||
        "I'd be happy to help with that. Let me look into it for you and get back to you shortly.";

      // Add some variation for generic messages
      if (!quickReplyId) {
        const genericResponses = [
          "Great question! Let me find that information for you.",
          "I understand. Here's what I can tell you...",
          "Thanks for reaching out! I'm looking into this now.",
        ];
        response = genericResponses[Math.floor(Math.random() * genericResponses.length)];
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        message: response,
        type: "ai",
        timestamp: "Just now",
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, aiMessage]);

      // Show quick replies again after AI response
      setTimeout(() => setShowQuickReplies(true), 500);
    }, responseTime);
  };

  const handleQuickReply = (reply: { id: string; label: string }) => {
    handleSend(reply.label, reply.id);
  };

  return (
    <div className="flex flex-col h-screen bg-background max-w-lg mx-auto">
      <ChatHeader propertyName="Coastal Haven" stayDates="Jan 24 – 28, 2026" showBack />

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-20">
        <WelcomeCard propertyName="Coastal Haven" />

        {messages.map((msg, index) => (
          <ChatBubble
            key={msg.id}
            message={msg.message}
            type={msg.type}
            timestamp={msg.timestamp}
            showAvatar={index === 0 || messages[index - 1]?.type !== msg.type}
            isLatest={index === messages.length - 1 && msg.type === "guest"}
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
        <ChatInput onSend={(msg) => handleSend(msg)} placeholder="Ask me anything..." disabled={isTyping} />
      </div>

      <BottomNav />
    </div>
  );
}
