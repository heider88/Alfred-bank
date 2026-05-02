"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

type Message = {
  id: string;
  role: "user" | "alfred";
  content: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function AlfredChat({ accountId }: { accountId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "alfred",
      content: "Saludos. Soy Alfred. ¿En qué le puedo asistir con sus finanzas hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenChat = () => {
    setIsOpen((prev) => !prev);
    setShowWelcome(false);
  };
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    
    // Añadir mensaje del usuario
    const newUserMsg: Message = { id: Date.now().toString(), role: "user", content: userText };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    account_id: accountId,
                    message: userText
                })
            });
            if (!response.ok) {
                throw new Error("Error en la respuesta de Alfred");
            }

      const data = await response.json();
      
      const alfredMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "alfred",
        content: data.reply,
      };
      
      setMessages((prev) => [...prev, alfredMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "alfred",
        content: "Disculpe, he tenido un inconveniente técnico. Por favor intente más tarde.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Mensaje de bienvenida (Tooltip) */}
      {!isOpen && showWelcome && (
        <div className="fixed bottom-24 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 origin-bottom-right duration-500">
          <div className="relative w-64 rounded-2xl bg-white p-4 shadow-2xl border border-slate-100">
            <button 
              onClick={() => setShowWelcome(false)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden border border-slate-100 shadow-sm shrink-0">
                <Image src="/alfreed.png" alt="Alfred" width={32} height={32} className="object-cover" />
              </div>
              <span className="font-bold text-slate-900 text-sm">alfred.</span>
            </div>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              ¡Hola! Soy Alfred, tu CFO personal. ¿En qué te ayudo hoy? 🧐
            </p>
            {/* Triángulo apuntando al botón */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white rotate-45 border-b border-r border-slate-100"></div>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={handleOpenChat}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl hover:scale-105 active:scale-95 transition-all border border-slate-100 p-0.5 overflow-hidden ${
          isOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      >
        <Image src="/alfreed.png" alt="Alfred" width={56} height={56} className="object-cover rounded-full" />
      </button>

      {/* Ventana del Chat */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl transition-all duration-300 origin-bottom-right ${
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-black shrink-0">
              <Image src="/alfreed.png" alt="Alfred" width={40} height={40} className="object-cover" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-white tracking-wide">alfred.</h3>
              <p className="text-[10px] text-[#CCFF00] uppercase tracking-wider font-semibold">Online</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-medium ${
                  msg.role === "user"
                    ? "bg-[#CCFF00] text-black rounded-tr-sm"
                    : "bg-white/10 text-white rounded-tl-sm border border-white/5"
                }`}
              >
                {msg.role === "alfred" ? (
                  <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-white/5 prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/10 border border-white/5 px-4 py-3 text-white">
                <Loader2 className="h-4 w-4 animate-spin text-[#CCFF00]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-3 bg-[#0A0A0A]">
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1 focus-within:border-[#CCFF00] focus-within:bg-white/10 transition-colors"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe a Alfred..."
              className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CCFF00] text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
