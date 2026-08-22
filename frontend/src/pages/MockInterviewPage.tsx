import { useState, useRef, useEffect } from "react";
import { api } from "../api/client";

export default function MockInterviewPage() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hello! I'm your AI Interviewer. I can help you prepare for your upcoming placements. Which role are you interviewing for today? (e.g., Software Engineer, Data Analyst, etc.)" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response: any = await api.post("/api/ai/interview", {
        messages: [...messages, userMessage],
      });
      setMessages((prev) => [...prev, { role: "assistant", content: response.data.content }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 h-[calc(100vh-12rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Mock Interview</h1>
        <p className="text-gray-600">Practice your interview skills with our real-time AI interviewer.</p>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 space-y-4"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div 
              className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === "user" 
                  ? "bg-indigo-600 text-white rounded-br-none" 
                  : "bg-gray-100 text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-4 rounded-2xl rounded-bl-none animate-pulse">
              Interviewer is thinking...
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your response..."
          className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
