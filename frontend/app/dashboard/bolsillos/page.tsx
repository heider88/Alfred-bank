"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRouter } from "next/navigation";
import { PiggyBank, Plus, ArrowRightLeft, Target, MoreVertical, Loader2, X } from "lucide-react";
import { formatCurrencyFromCents } from "@/utils/formatters";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface Pocket {
  id: string;
  name: string;
  balance_cents: number;
  goal_cents: number | null;
}

export default function BolsillosPage() {
  const router = useRouter();
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [loading, setLoading] = useState(true);
  const [myAccountId, setMyAccountId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [selectedPocket, setSelectedPocket] = useState<Pocket | null>(null);
  
  // Forms state
  const [pocketName, setPocketName] = useState("");
  const [pocketGoal, setPocketGoal] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundAction, setFundAction] = useState<"add" | "withdraw">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");
      
      const meRes = await fetch(`${API_URL}/accounts/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error("Session expired");
      const meData = await meRes.json();
      setMyAccountId(meData.id);

      const pocketsRes = await fetch(`${API_URL}/pockets`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (pocketsRes.ok) {
        setPockets(await pocketsRes.json());
      }
    } catch (err) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePocket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pocketName.trim()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: pocketName,
        goal_cents: pocketGoal ? Math.floor(parseFloat(pocketGoal) * 100) : null
      };
      const res = await fetch(`${API_URL}/pockets`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Error al crear el bolsillo");
      
      toast.success("Bolsillo creado exitosamente");
      setIsCreateModalOpen(false);
      setPocketName("");
      setPocketGoal("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFundPocket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPocket || !fundAmount) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      let amountCents = Math.floor(parseFloat(fundAmount) * 100);
      if (fundAction === "withdraw") amountCents = -amountCents;

      const res = await fetch(`${API_URL}/pockets/${selectedPocket.id}/fund`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount_cents: amountCents })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error en la transacción");
      }
      
      toast.success(fundAction === "add" ? "Dinero agregado al bolsillo" : "Dinero retirado del bolsillo");
      setIsFundModalOpen(false);
      setFundAmount("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openFundModal = (pocket: Pocket, action: "add" | "withdraw") => {
    setSelectedPocket(pocket);
    setFundAction(action);
    setFundAmount("");
    setIsFundModalOpen(true);
  };

  return (
    <DashboardLayout accountId={myAccountId || undefined}>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mis Bolsillos</h1>
            <p className="text-slate-500 mt-1">Organiza tu dinero y alcanza tus metas de ahorro.</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#0A0A0A] hover:bg-black text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-5 h-5" /> Nuevo Bolsillo
          </button>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1,2].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl"></div>)}
          </div>
        ) : pockets.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <PiggyBank className="w-10 h-10 text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">Aún no tienes bolsillos</h3>
             <p className="text-slate-500 max-w-md mx-auto mb-6">Crea tu primer bolsillo para empezar a separar dinero para tus próximas vacaciones, regalos o emergencias.</p>
             <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold px-6 py-3 rounded-xl transition-colors"
             >
               Crear mi primer bolsillo
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pockets.map(pocket => {
              const progress = pocket.goal_cents ? Math.min(100, Math.round((pocket.balance_cents / pocket.goal_cents) * 100)) : 0;
              
              return (
                <div key={pocket.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00] rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                       <PiggyBank className="w-6 h-6 text-slate-700" />
                    </div>
                    <button className="text-slate-400 hover:text-slate-900 transition-colors p-2">
                       <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 text-lg mb-1 truncate">{pocket.name}</h3>
                  <p className="font-display font-bold text-3xl tracking-tight mb-6">
                    ${(pocket.balance_cents / 100).toLocaleString('es-CO')}
                  </p>
                  
                  {pocket.goal_cents && (
                    <div className="mb-6">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Target className="w-3 h-3"/> Meta</span>
                        <span className="text-xs font-bold text-slate-900">${(pocket.goal_cents / 100).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#0A0A0A] rounded-full transition-all duration-1000" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-[10px] font-bold text-slate-400 mt-1">{progress}% alcanzado</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => openFundModal(pocket, "add")}
                      className="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                    >
                      Añadir
                    </button>
                    <button 
                      onClick={() => openFundModal(pocket, "withdraw")}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-2.5 rounded-xl text-sm transition-colors"
                    >
                      Retirar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Crear Bolsillo */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Nuevo Bolsillo</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-2"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreatePocket} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nombre del bolsillo</label>
                <input 
                  type="text" 
                  value={pocketName} 
                  onChange={e => setPocketName(e.target.value)}
                  placeholder="Ej: Viaje a París"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Meta de ahorro (Opcional)</label>
                <input 
                  type="number" 
                  value={pocketGoal} 
                  onChange={e => setPocketGoal(e.target.value)}
                  placeholder="Ej: 1500000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] font-medium"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear Bolsillo"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Añadir/Retirar Dinero */}
      {isFundModalOpen && selectedPocket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {fundAction === "add" ? "Añadir Dinero" : "Retirar Dinero"}
              </h2>
              <button onClick={() => setIsFundModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-2"><X className="w-5 h-5"/></button>
            </div>
            <p className="text-slate-500 text-sm mb-6">
              {fundAction === "add" 
                ? `Moviendo dinero de tu cuenta principal a "${selectedPocket.name}".` 
                : `Retirando dinero de "${selectedPocket.name}" a tu cuenta principal.`}
            </p>
            <form onSubmit={handleFundPocket} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Monto en COP</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                  <input 
                    type="number" 
                    value={fundAmount} 
                    onChange={e => setFundAmount(e.target.value)}
                    placeholder="0"
                    min="1"
                    className="w-full pl-8 pr-4 py-4 text-xl bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] font-bold"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#0A0A0A] hover:bg-black text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRightLeft className="w-4 h-4"/> Confirmar Movimiento</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
