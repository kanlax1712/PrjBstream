"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const HELP_RESPONSES: Record<string, string> = {
  upload: `To upload a video:
1. Go to Creator Studio (click "Upload" in the top menu or visit /studio)
2. Fill in the video details:
   - Title (required)
   - Description (required)
   - Duration (auto-detected from video file)
   - Tags (comma-separated)
   - Thumbnail (select from video or upload)
   - Video Quality preference
3. Select your video file (up to 2GB)
4. Click "Upload Video"
5. Wait for processing to complete

The video will be transcoded to multiple qualities (480p to 4K) automatically.`,
  
  search: `To search for videos or channels:
1. Use the search bar in the top navigation
2. Type your query or use voice search (microphone icon)
3. Press Enter or click search
4. Results will show matching videos and channels

You can search by:
- Video titles
- Video descriptions
- Tags
- Channel names
- Channel handles`,
  
  live: `To go live:
1. Click "Go Live" in the sidebar or navigation
2. Click "Start Camera" to begin
3. Allow camera and microphone permissions
4. Select your camera and microphone from settings
5. Click "Go Live" when ready
6. Click "End Stream" when finished

Note: This is a demo feature. In production, this would connect to a streaming server.`,
  
  playlist: `To create and manage playlists:
1. Go to "Playlists" in the sidebar
2. Click "Create Playlist"
3. Enter a title and description
4. Choose if it's public or private
5. Click "Create"

To add videos to a playlist:
1. Open any video
2. Click "Add to Playlist" button
3. Select the playlist from the dropdown
4. Video will be added

You can view your playlists in the Playlists page.`,
  
  subscribe: `To subscribe to a channel:
1. Open any video from that channel
2. Click the "Subscribe" button below the video
3. You'll receive updates in your Subscriptions feed

To view your subscriptions:
1. Go to "Subscriptions" in the sidebar
2. See all videos from channels you follow`,
  
  default: `I can help you with:
- Uploading videos
- Searching for content
- Going live
- Creating playlists
- Subscribing to channels
- Navigation and features

Just ask me about any of these topics!`,
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your Bstream assistant. How can I help you today? You can ask me about uploading videos, searching, going live, playlists, or anything else!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const getResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase().trim();

    // Check for specific keywords
    if (lowerMessage.includes("upload") || lowerMessage.includes("video upload")) {
      return HELP_RESPONSES.upload;
    }
    if (lowerMessage.includes("search") || lowerMessage.includes("find")) {
      return HELP_RESPONSES.search;
    }
    if (lowerMessage.includes("live") || lowerMessage.includes("stream")) {
      return HELP_RESPONSES.live;
    }
    if (lowerMessage.includes("playlist")) {
      return HELP_RESPONSES.playlist;
    }
    if (lowerMessage.includes("subscribe") || lowerMessage.includes("subscription")) {
      return HELP_RESPONSES.subscribe;
    }
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("help")) {
      return HELP_RESPONSES.default;
    }

    // Default response
    return `I understand you're asking about "${userMessage}". ${HELP_RESPONSES.default}`;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate thinking delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getResponse(userMessage.content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 500);
  };

  const quickActions = [
    { label: "How to upload?", query: "How do I upload a video?" },
    { label: "Search help", query: "How do I search for videos?" },
    { label: "Go live", query: "How do I go live?" },
    { label: "Playlists", query: "How do I create a playlist?" },
  ];

  return (
    <>
      {/* Chatbot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg transition hover:bg-cyan-600 active:scale-95 touch-manipulation sm:bottom-6 sm:right-6"
        aria-label="Open chatbot"
      >
        {isOpen ? (
          <X className="size-6" />
        ) : (
          <MessageCircle className="size-6" />
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[500px] w-[90vw] max-w-md flex-col rounded-2xl border border-white/10 bg-slate-900 shadow-2xl sm:bottom-24 sm:right-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-cyan-500">
                <Bot className="size-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Bstream Assistant</h3>
                <p className="text-xs text-white/60">How can I help you?</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Close chatbot"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                    <Bot className="size-4 text-cyan-400" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-cyan-500 text-white"
                      : "bg-white/10 text-white/90"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <User className="size-4 text-white/70" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="border-t border-white/10 p-3">
              <p className="mb-2 text-xs text-white/60">Quick help:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setInput(action.query);
                      handleSend({ preventDefault: () => {} } as React.FormEvent);
                    }}
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white touch-manipulation"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-white/10 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2 text-white transition hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

