"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import AlfredChat from "@/components/chat/AlfredChat";

export default function DashboardLayout({ children, accountId }: { children: React.ReactNode, accountId?: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Colapsable / Drawer */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Contenedor Principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavbar onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Card base para el contenido del dashboard con estética High-End */}
          <div className="mx-auto max-w-7xl rounded-2xl bg-white p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] ring-1 ring-slate-100 min-h-[calc(100vh-8rem)]">
            {children}
          </div>
        </main>
      </div>

      {/* Chatbot flotante (solo renderiza si hay cuenta cargada) */}
      {accountId && <AlfredChat accountId={accountId} />}
    </div>
  );
}
