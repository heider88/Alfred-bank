"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRouter } from "next/navigation";
import { formatCurrencyFromCents } from "@/utils/formatters";
import { Send, AlertCircle, CheckCircle2, ArrowRightLeft, Users, ShieldCheck, Mail } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface Contact {
  id: string;
  name: string;
  email: string;
  color: string;
}

export default function TransferenciasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [myAccountId, setMyAccountId] = useState<string | null>(null);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [resolvedAccountId, setResolvedAccountId] = useState<string | null>(null);

  // Contacts
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);

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

        // Fetch statement to extract recent contacts
        const stmtResponse = await fetch(`${API_URL}/accounts/${myAccount.id}/statement`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (stmtResponse.ok) {
          const stmtData = await stmtResponse.json();
          const contactsMap = new Map();
          const colors = ["bg-purple-100 text-purple-600", "bg-blue-100 text-blue-600", "bg-orange-100 text-orange-600", "bg-emerald-100 text-emerald-600", "bg-pink-100 text-pink-600"];
          let colorIdx = 0;
          
          stmtData.transactions.forEach((tx: any) => {
            // Only add outgoing transfers to contacts (or incoming if we want to send back)
            if (tx.from_account_id === myAccount.id && tx.to_account_id && tx.counterparty_name !== "Externo") {
              if (!contactsMap.has(tx.to_account_id)) {
                contactsMap.set(tx.to_account_id, {
                  id: tx.to_account_id,
                  name: tx.counterparty_name,
                  email: "", // Not available in stmt, but we can resolve it if clicked
                  color: colors[colorIdx % colors.length]
                });
                colorIdx++;
              }
            }
          });
          
          setRecentContacts(Array.from(contactsMap.values()).slice(0, 4));
        }

      } catch (err) {
        router.push("/login");
      }
    };
    fetchMe();
  }, [router]);

  const handleVerifyTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (!myAccountId) throw new Error("No se pudo identificar tu cuenta.");
      if (!identifier.trim()) throw new Error("Ingresa el correo electrónico o cuenta destino");
      if (!amount || parseFloat(amount) <= 0) throw new Error("Ingresa un monto válido");

      setLoading(true);
      const token = localStorage.getItem("token");

      // Resolve user by email or account ID
      const resName = await fetch(`${API_URL}/accounts/resolve/${identifier.trim()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!resName.ok) {
        const errorData = await resName.json().catch(() => null);
        throw new Error(errorData?.detail || "No se encontró la cuenta destino. Verifica el correo.");
      }

      const dataName = await resName.json();
      setResolvedAccountId(dataName.account_id);
      setRecipientName(dataName.owner_name);
      setRecipientEmail(dataName.email);
      setIsModalOpen(true);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    setIsModalOpen(false);

    try {
      const token = localStorage.getItem("token");
      
      const payload = {
        from_account_id: myAccountId,
        to_account_id: resolvedAccountId,
        amount_cents: Math.floor(parseFloat(amount) * 100),
        description: description.trim() || "Transferencia"
      };

      const res = await fetch(`${API_URL}/transactions/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || data?.message || "Error al realizar la transferencia");
      }

      setSuccess("¡Transferencia enviada con éxito!");
      setIdentifier("");
      setAmount("");
      setDescription("");
      setRecipientName(null);
      setRecipientEmail(null);
      setResolvedAccountId(null);
      
      // Optionally refresh contacts here
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout accountId={myAccountId || undefined}>
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-12">
        
        {/* Header Elegante */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold mb-3 border border-slate-200">
              <Mail className="w-3.5 h-3.5" /> Transferencias Inteligentes
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Enviar Dinero</h1>
            <p className="text-slate-500 mt-1">Transfiere fondos al instante usando el correo o número de cuenta de la persona.</p>
          </div>
        </header>

        {/* Notificaciones Globales */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Bento Box Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Main Transfer Form - Left Side (Col-span 7) */}
          <section className="lg:col-span-8 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm ring-1 ring-slate-100 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#CCFF00] rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
            
            <form onSubmit={handleVerifyTransfer} className="space-y-8 relative z-10">
              
              {/* Bloque de Monto (Estilo Calculadora/Hero) */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">¿Cuánto deseas enviar?</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <span className="text-4xl font-light text-slate-300">$</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    className="w-full pl-14 pr-6 py-6 bg-slate-50 border-none rounded-3xl text-5xl font-display font-bold text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:bg-white placeholder:text-slate-200"
                  />
                </div>
              </div>

              <div className="h-px w-full bg-slate-100"></div>

              {/* Bloque Destinatario */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">¿A quién le envías?</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-[#a3cc00] transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Correo o N° de Cuenta (ej. juan@email.com o 0000000001)"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:bg-white focus:border-transparent"
                  />
                </div>
              </div>

              {/* Bloque Concepto */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Concepto (Opcional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="¿Para qué es este dinero?"
                  maxLength={50}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base transition-all focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:bg-white focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !myAccountId}
                className="w-full bg-[#0A0A0A] hover:bg-black text-white font-bold py-5 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] flex justify-center items-center gap-2 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-black/5 text-lg mt-4 group"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Procesando...
                  </div>
                ) : (
                  <>
                    Continuar <ArrowRightLeft className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Right Side Widgets (Col-span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Widget: Contactos Frecuentes */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-100 flex-1">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-400" /> Historial de Envío
              </h3>
              
              {recentContacts.length === 0 ? (
                 <div className="flex flex-col items-center justify-center text-center py-6">
                   <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                     <Users className="w-6 h-6 text-slate-300" />
                   </div>
                   <p className="text-sm text-slate-500">Tus contactos recientes aparecerán aquí</p>
                 </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {recentContacts.map((contact, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-3 cursor-pointer group p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors" 
                      onClick={() => setIdentifier(contact.id)}
                    >
                      <div className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center font-bold text-lg ${contact.color} group-hover:ring-2 ring-offset-2 ring-current transition-all`}>
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-sm font-bold text-slate-900 block truncate">{contact.name}</span>
                        <span className="text-xs font-medium text-slate-500 block truncate">Transferir de nuevo</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Widget: Seguridad y Límites */}
            <div className="bg-[#0A0A0A] rounded-[2rem] p-6 text-white relative overflow-hidden group mt-auto">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative z-10 flex items-start gap-4">
                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                  <ShieldCheck className="w-6 h-6 text-[#CCFF00]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Cifrado Militar</h3>
                  <p className="text-sm text-white/60 mb-4 leading-relaxed">
                    Protegido por encriptación de extremo a extremo (AES-256).
                  </p>
                  <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/50 font-medium">Límite Diario</span>
                      <span className="text-xs font-bold text-white">$10.000.000</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#CCFF00] w-[15%] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal de Confirmación Estilizado */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop con blur */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !loading && setIsModalOpen(false)}></div>
            
            {/* Modal Content */}
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#0A0A0A] rounded-[2rem] shadow-xl flex items-center justify-center border-4 border-white rotate-12">
                <Send className="w-10 h-10 text-[#CCFF00] -rotate-12" />
              </div>

              <div className="mt-10 text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Confirmar Envío</h3>
                <p className="text-slate-500 text-sm mb-6">Por favor verifica los datos antes de autorizar la transacción.</p>
                
                <div className="bg-slate-50 rounded-[1.5rem] p-5 mb-8 space-y-4 border border-slate-100 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Nombre:</span>
                    <span className="text-base font-bold text-slate-900 truncate max-w-[200px] text-right">{recipientName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Cuenta:</span>
                    <span className="text-sm font-mono text-slate-700 truncate max-w-[200px] text-right">{resolvedAccountId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Correo:</span>
                    <span className="text-sm font-semibold text-slate-700 truncate max-w-[200px] text-right">{recipientEmail}</span>
                  </div>
                  <div className="h-px w-full bg-slate-200 border-dashed border-b border-slate-200"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Valor a enviar:</span>
                    <span className="text-2xl font-display font-bold text-[#0A0A0A] tracking-tight">${parseFloat(amount).toLocaleString('es-CO')}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                    className="flex-1 py-4 px-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleConfirmTransfer}
                    disabled={loading}
                    className="flex-1 py-4 px-4 rounded-2xl font-bold text-black bg-[#CCFF00] hover:bg-[#b8e600] transition-colors shadow-lg shadow-[#CCFF00]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      "Confirmar"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
