"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRouter } from "next/navigation";
import ReceiptScanner from "@/components/split/ReceiptScanner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function DividirCuentaPage() {
  const router = useRouter();
  const [myAccountId, setMyAccountId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");
        
        const meResponse = await fetch(`${API_URL}/accounts/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!meResponse.ok) throw new Error("Session expired");
        
        const myAccount = await meResponse.json();
        setMyAccountId(myAccount.id);
      } catch (err) {
        router.push("/login");
      }
    };
    fetchMe();
  }, [router]);

  return (
    <DashboardLayout accountId={myAccountId || undefined}>
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-12">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold mb-3">
            ✨ Nuevo: OCR Inteligente
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dividir Cuenta</h1>
          <p className="text-slate-500 mt-1">Sube la foto de una factura. Alfred extraerá los items y calculará automáticamente cuánto paga cada uno.</p>
        </header>

        <ReceiptScanner />
      </div>
    </DashboardLayout>
  );
}
