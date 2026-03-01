import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3003", { autoConnect: false });

export default function Chat() {
  const [username] = useState("User" + Math.floor(Math.random() * 1000));
  const [room] = useState("mern-group");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState("");
  const msgRef = useRef(null);

  // ✅ connect & join room
  useEffect(() => {
    socket.connect();
    socket.emit("join", { username, room });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    socket.on("typing", (msg) => {
      setTyping(msg);
      setTimeout(() => setTyping(""), 1500);
    });

    return () => {
      socket.off("message");
      socket.off("typing");
      socket.disconnect();
    };
  }, [username, room]);

  // ✅ send message
  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = { room, sender: username, message };
    socket.emit("message", userMsg);
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");

    // 🤖 AI response
    try {
      const res = await fetch("http://localhost:3003/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: message }),
      });

      const data = await res.json();
      const aiMsg = { room, sender: "AI", message: data.answer };
      setMessages((prev) => [...prev, aiMsg]);
      scrollToBottom();
    } catch (err) {
      console.error("AI error:", err);
    }
  };

  const handleTyping = () => {
    socket.emit("typing", { room, username });
  };

  const scrollToBottom = () => {
    if (msgRef.current) {
      msgRef.current.scrollTop = msgRef.current.scrollHeight;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 text-lg font-semibold shadow">
        AI Support
      </div>

      {/* Messages */}
      <div
        ref={msgRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-xs px-3 py-2 rounded-lg shadow ${
              msg.sender === username
                ? "ml-auto bg-blue-500 text-white"
                : msg.sender === "AI"
                ? "bg-green-200"
                : "bg-white"
            }`}
          >
            <div className="text-xs font-bold opacity-70">
              {msg.sender}
            </div>
            <div>{msg.message}</div>
          </div>
        ))}
      </div>

      {/* Typing indicator */}
      {typing && (
        <div className="px-4 text-sm text-gray-500 italic">
          {typing}
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t flex gap-2">
        <input
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            handleTyping();
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}