"use client";

import { useState, useRef } from "react";
import { UploadCloud, Receipt, CheckCircle2, AlertTriangle, Calculator, SplitSquareHorizontal, X, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface ParsedItem {
  name: string;
  price: number;
}

interface ParsedReceipt {
  items: ParsedItem[];
  subtotal: number;
  tax: number;
  total: number;
}

interface Participant {
  id: string;
  name: string;
  color: string;
  bg: string;
  dotBg: string;
}

const DEFAULT_ME: Participant = { id: "me", name: "Yo", color: "text-[#0A0A0A]", bg: "bg-[#CCFF00]", dotBg: "bg-[#CCFF00]" };

const PALETTE = [
  { color: "text-indigo-700", bg: "bg-indigo-100", dotBg: "bg-indigo-400" },
  { color: "text-rose-700", bg: "bg-rose-100", dotBg: "bg-rose-400" },
  { color: "text-emerald-700", bg: "bg-emerald-100", dotBg: "bg-emerald-400" },
  { color: "text-amber-700", bg: "bg-amber-100", dotBg: "bg-amber-400" },
  { color: "text-cyan-700", bg: "bg-cyan-100", dotBg: "bg-cyan-400" },
];

export default function ReceiptScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [receiptData, setReceiptData] = useState<ParsedReceipt | null>(null);
  
  const [participants, setParticipants] = useState<Participant[]>([
    DEFAULT_ME,
    { id: "p_1", name: "Amigo 1", ...PALETTE[0] },
    { id: "p_2", name: "Amigo 2", ...PALETTE[1] }
  ]);
  
  // Guardamos un array de IDs por cada ítem
  const [assignments, setAssignments] = useState<Record<number, string[]>>({});
  const [showQR, setShowQR] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setStatus("idle");
      setReceiptData(null);
      setAssignments({});
    }
  };

  const processReceipt = async () => {
    if (!file) return;
    setStatus("uploading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/ocr/receipt`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        throw new Error("No pudimos analizar el recibo. Verifica que sea legible.");
      }

      const data: ParsedReceipt = await res.json();
      
      const initialAssig: Record<number, string[]> = {};
      data.items.forEach((_, i) => { initialAssig[i] = ["me"]; });
      
      setAssignments(initialAssig);
      setReceiptData(data);
      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Error procesando el recibo");
      setStatus("error");
    }
  };

  const addParticipant = () => {
    const newId = `p_${Date.now()}`;
    const colorIndex = (participants.length - 1) % PALETTE.length;
    const newParticipant = {
      id: newId,
      name: `Amigo ${participants.length}`,
      ...PALETTE[colorIndex]
    };
    setParticipants(prev => [...prev, newParticipant]);
  };

  const updateParticipantName = (id: string, newName: string) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const toggleParticipantForItem = (itemIndex: number, participantId: string) => {
    setAssignments(prev => {
      const current = prev[itemIndex] || [];
      let next;
      if (current.includes(participantId)) {
        next = current.filter(id => id !== participantId);
        if (next.length === 0) next = ["me"]; // Fallback para no dejar items huérfanos
      } else {
        next = [...current, participantId];
      }
      return { ...prev, [itemIndex]: next };
    });
  };

  const splitEvenly = () => {
    if (!receiptData) return;
    const allIds = participants.map(p => p.id);
    const newAssig: Record<number, string[]> = {};
    receiptData.items.forEach((_, i) => {
      newAssig[i] = allIds;
    });
    setAssignments(newAssig);
  };

  // Calcular totales
  const calculateTotals = () => {
    let sums: Record<string, number> = {};
    participants.forEach(p => sums[p.id] = 0);

    if (!receiptData) return sums;
    
    // Dividir cada producto entre las personas asignadas
    receiptData.items.forEach((item, i) => {
      const assignees = assignments[i] || ["me"];
      const splitPrice = item.price / assignees.length;
      assignees.forEach(pId => {
        if (sums[pId] !== undefined) {
          sums[pId] += splitPrice;
        } else {
          sums["me"] += splitPrice; // Fallback
        }
      });
    });

    const itemsSum = receiptData.items.reduce((acc, it) => acc + it.price, 0);
    const extra = receiptData.total - itemsSum;
    
    // Repartir propina/impuestos equitativamente
    const activeAssignees = Object.keys(sums).filter(k => sums[k] > 0);
    if (activeAssignees.length > 0 && extra > 0) {
        const extraPerPerson = extra / activeAssignees.length;
        activeAssignees.forEach(k => {
            sums[k] += extraPerPerson;
        });
    } else if (extra > 0) {
        sums["me"] += extra; // Fallback
    }

    return sums;
  };

  const totals = calculateTotals();

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Column */}
        <div className="flex flex-col gap-6">
          <div 
            onClick={() => status !== "uploading" && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              preview 
                ? 'border-slate-200 bg-white shadow-sm' 
                : 'border-[#CCFF00]/50 bg-[#CCFF00]/5 hover:bg-[#CCFF00]/10 hover:border-[#CCFF00]'
            } ${status === "uploading" ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            
            {preview ? (
              <div className="w-full max-w-[250px] relative rounded-xl overflow-hidden shadow-md">
                 <img src={preview} alt="Receipt" className="w-full h-auto object-cover" />
                 {status === "success" && (
                   <div className="absolute inset-0 bg-[#CCFF00]/20 flex items-center justify-center backdrop-blur-[2px]">
                     <div className="bg-black text-[#CCFF00] px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4" /> Escaneado
                     </div>
                   </div>
                 )}
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-[#CCFF00]/20 rounded-full flex items-center justify-center mb-4 text-[#85a600]">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Sube la factura</h3>
                <p className="text-sm text-slate-500 max-w-xs">Toma una foto clara del recibo del restaurante o sube una imagen desde tus archivos.</p>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          {preview && status === "idle" && (
            <button 
              onClick={processReceipt}
              className="w-full bg-[#0A0A0A] hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Receipt className="w-5 h-5" /> Extraer Items con IA
            </button>
          )}

          {status === "uploading" && (
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col items-center justify-center text-center animate-pulse">
               <div className="w-12 h-12 border-4 border-white/20 border-t-[#CCFF00] rounded-full animate-spin mb-4"></div>
               <p className="font-bold">Alfred está leyendo su recibo...</p>
               <p className="text-xs text-white/50 mt-2">Analizando items, cantidades, precios e impuestos.</p>
            </div>
          )}
        </div>

        {/* Results Column */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-100 relative min-h-[400px]">
          {status !== "success" || !receiptData ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-60">
                <SplitSquareHorizontal className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-lg font-bold text-slate-400">Sin Datos</h3>
                <p className="text-sm text-slate-400 max-w-xs mt-2">Sube una factura y transpórtala aquí. Alfred organizará todo el caos.</p>
             </div>
          ) : (
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-slate-700" />
                  <h3 className="text-lg font-bold text-slate-900">División de Items</h3>
                </div>
                <button 
                  onClick={splitEvenly}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  ⚖️ Partes Iguales
                </button>
              </div>

              {/* Participants Manager */}
              <div className="mb-4 flex flex-wrap gap-2 items-center">
                {participants.map(p => (
                  <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${p.bg} ${p.color}`}>
                    {p.id === "me" ? (
                      <span>{p.name}</span>
                    ) : (
                      <input 
                        type="text" 
                        value={p.name}
                        onChange={(e) => updateParticipantName(p.id, e.target.value)}
                        className="bg-transparent border-none outline-none w-20 p-0 font-bold focus:ring-0 placeholder:text-current/50"
                        placeholder="Nombre"
                      />
                    )}
                  </div>
                ))}
                <button 
                  onClick={addParticipant}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  + Amigo
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6 max-h-[300px]">
                {receiptData.items.map((item, i) => {
                  const assignees = assignments[i] || ["me"];
                  
                  return (
                    <div key={i} className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-bold text-slate-900 truncate text-sm">{item.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-slate-500 font-mono text-sm">${item.price.toLocaleString('es-CO')}</p>
                            {assignees.length > 1 && (
                               <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-md">
                                 Dividido entre {assignees.length}
                               </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Avatar Row */}
                      <div className="flex gap-1.5 items-center mt-1 flex-wrap">
                        {participants.map(p => {
                           const isAssigned = assignees.includes(p.id);
                           return (
                             <button
                               key={p.id}
                               onClick={() => toggleParticipantForItem(i, p.id)}
                               className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                 isAssigned 
                                  ? `${p.bg} ${p.color} ring-2 ring-black/5` 
                                  : 'bg-slate-200/50 text-slate-400 hover:bg-slate-200'
                               }`}
                               title={p.name}
                             >
                               {p.name.charAt(0).toUpperCase()}
                             </button>
                           )
                        })}
                      </div>
                    </div>
                  )
                })}
                
                {/* Resumen Factura */}
                <div className="pt-4 mt-4 border-t border-dashed border-slate-200 text-right space-y-1">
                   <p className="text-xs text-slate-500">Subtotal Factura: <span className="font-mono text-slate-900">${receiptData.subtotal.toLocaleString('es-CO')}</span></p>
                   <p className="text-xs text-slate-500">Impuestos/Propina: <span className="font-mono text-slate-900">${receiptData.tax.toLocaleString('es-CO')}</span></p>
                   <p className="text-sm font-bold text-slate-900">Total Original: <span className="font-mono">${receiptData.total.toLocaleString('es-CO')}</span></p>
                </div>
              </div>

              {/* Total Calculations */}
              <div className="bg-[#0A0A0A] rounded-[1.5rem] p-5 text-white mt-auto">
                <h4 className="text-sm font-bold text-white/60 mb-4 uppercase tracking-wider">Resumen de Pagos</h4>
                
                <div className="space-y-3">
                  {participants.map(p => {
                    const amount = totals[p.id] || 0;
                    if (amount === 0 && p.id !== "me") return null;
                    return (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${p.dotBg}`}></div>
                          <span className={`font-medium ${p.id === "me" ? "" : "text-white/80"}`}>{p.name} {p.id === "me" ? "pagaré" : "pagará"}</span>
                        </div>
                        <span className={`font-mono font-bold ${p.id === "me" ? "text-[#CCFF00]" : "text-white"}`}>
                          ${Math.round(amount).toLocaleString('es-CO')}
                        </span>
                      </div>
                    )
                  })}
                </div>
                
                <button 
                  onClick={() => setShowQR(true)}
                  className="w-full mt-5 bg-white text-black font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm flex justify-center items-center gap-2"
                >
                   <QrCode className="w-5 h-5" /> Generar QRs de Cobro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowQR(false)} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors bg-slate-100 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
               <QrCode className="w-6 h-6 text-slate-900" />
               <h2 className="text-2xl font-bold text-slate-900">Códigos QR de Cobro</h2>
            </div>
            <p className="text-slate-500 mb-8">Pídele a tus amigos que escaneen el código para pagar su parte de la cuenta.</p>
            
            {participants.filter(p => p.id !== "me" && totals[p.id] > 0).length === 0 ? (
               <div className="text-center bg-slate-50 p-8 rounded-2xl border border-slate-100">
                  <p className="text-slate-500 font-medium">No hay cobros pendientes para tus amigos.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {participants.filter(p => p.id !== "me" && totals[p.id] > 0).map(p => (
                  <div key={p.id} className="flex flex-col items-center bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 hover:shadow-md transition-shadow">
                     <p className="font-bold text-slate-900 text-lg mb-1">{p.name}</p>
                     <p className="text-slate-500 font-mono text-xl mb-4 font-bold text-[#CCFF00] bg-black px-4 py-1 rounded-full">${Math.round(totals[p.id]).toLocaleString('es-CO')}</p>
                     <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                       <QRCodeSVG 
                         value={`alfred://pay?amount=${Math.round(totals[p.id])}&for=CuentaCompartida&name=${encodeURIComponent(p.name)}`}
                         size={140}
                         level={"H"}
                         fgColor="#0A0A0A"
                       />
                     </div>
                     <p className="text-xs text-slate-400 mt-4 font-medium uppercase tracking-wider">Escanear para pagar</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
