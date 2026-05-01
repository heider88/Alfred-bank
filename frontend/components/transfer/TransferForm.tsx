"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Send, ArrowLeft, AlertCircle, ShieldCheck } from "lucide-react";
import { formatCurrencyFromCents, convertToCents } from "@/utils/formatters";

// API Dinámica
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface TransferFormProps {
  accountId: string;
  currentBalanceCents: number;
  onSuccess?: () => void;
}

export default function TransferForm({ accountId, currentBalanceCents, onSuccess }: TransferFormProps) {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [pendingData, setPendingData] = useState<z.infer<ReturnType<typeof getSchema>> | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Esquema dinámico de Zod validando contra el saldo real provisto por las props
  const getSchema = () =>
    z.object({
      to_account_id: z
        .string()
        .min(1, "Requerido.")
        .uuid("Debe ser un formato UUID válido (Ej. 123e4567-e89b-12d3-a456-426614174000).")
        .refine((val) => val !== accountId, "No puedes transferir a tu propia cuenta."),
      amount: z.coerce
        .number({ invalid_type_error: "Ingresa un número válido." })
        .positive("El monto debe ser mayor a 0.")
        .refine(
          // Validación crítica: Convertimos de manera segura para comparar
          (val) => convertToCents(val) <= currentBalanceCents,
          `Supera tu saldo disponible de ${formatCurrencyFromCents(currentBalanceCents)}.`
        ),
    });

  type TransferFormData = z.infer<ReturnType<typeof getSchema>>;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TransferFormData>({
    resolver: zodResolver(getSchema()),
    mode: "onChange",
  });

  const onSubmitRequest = (data: TransferFormData) => {
    setPendingData(data);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!pendingData) return;
    
    setIsTransferring(true);
    
    // Uso de la utilidad segura de conversión de moneda para evitar errores de coma flotante
    const amountCents = convertToCents(pendingData.amount);

    try {
      const response = await fetch(`${API_URL}/transactions/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_account_id: accountId,
          to_account_id: pendingData.to_account_id,
          amount_cents: amountCents,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Lanzamos el error capturando el 'detail' o 'message' devuelto por FastAPI (Ej. "Fondos insuficientes")
        throw new Error(result.message || result.detail || "Transacción rechazada por el servidor.");
      }

      toast.success("Transferencia completada", {
        description: `Se enviaron ${formatCurrencyFromCents(amountCents)} exitosamente.`,
      });
      
      reset();
      setStep("form");
      if (onSuccess) onSuccess();

    } catch (error: any) {
      // Capturamos tanto errores de negocio (400) como errores de red
      const errorMsg = error.message === "Failed to fetch" 
        ? "Error de conexión con el servidor. Intenta más tarde." 
        : error.message;

      toast.error("Error en la transacción", {
        description: errorMsg,
      });
      
      // Devolvemos al usuario al formulario para que pueda ajustar el monto o corregir datos
      setStep("form"); 
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900">Nueva Transferencia</h2>
        <p className="text-sm text-slate-500">Envía dinero de forma rápida y segura.</p>
      </div>

      {step === "form" && (
        <form onSubmit={handleSubmit(onSubmitRequest)} className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
          
          <div className="flex flex-col gap-2">
            <label htmlFor="to_account_id" className="text-sm font-semibold text-slate-700">
              Cuenta de Destino (UUID)
            </label>
            <input
              id="to_account_id"
              type="text"
              placeholder="Ej. e89b-12d3-..."
              className={`rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-indigo-600/20 ${
                errors.to_account_id ? "border-red-300 ring-4 ring-red-500/10" : "border-slate-200"
              }`}
              {...register("to_account_id")}
            />
            {errors.to_account_id && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <AlertCircle className="h-3.5 w-3.5" /> {errors.to_account_id.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="amount" className="flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>Monto a Enviar</span>
              <span className="text-xs font-medium text-indigo-600">
                Disponible: {formatCurrencyFromCents(currentBalanceCents)}
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">$</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className={`w-full rounded-xl border bg-slate-50 py-3 pl-8 pr-4 text-sm text-slate-900 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-indigo-600/20 ${
                  errors.amount ? "border-red-300 ring-4 ring-red-500/10" : "border-slate-200"
                }`}
                {...register("amount")}
              />
            </div>
            {errors.amount && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <AlertCircle className="h-3.5 w-3.5" /> {errors.amount.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-[0.98]"
          >
            Continuar <Send className="h-4 w-4" />
          </button>
        </form>
      )}

      {step === "confirm" && pendingData && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
              <h3 className="font-semibold text-indigo-900">Confirma tu transferencia</h3>
            </div>
            
            <div className="flex flex-col gap-4 divide-y divide-indigo-100/60 text-sm">
              <div className="flex flex-col gap-1 pb-2">
                <span className="text-slate-500">Monto exacto a enviar:</span>
                <span className="text-3xl font-bold text-slate-900">
                  {formatCurrencyFromCents(convertToCents(pendingData.amount))}
                </span>
              </div>
              <div className="flex flex-col gap-1 pt-4">
                <span className="text-slate-500">Hacia la cuenta de destino:</span>
                <span className="break-all font-mono text-xs font-medium text-slate-900 rounded-md bg-white p-2 border border-slate-100 mt-1">
                  {pendingData.to_account_id}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("form")}
              disabled={isTransferring}
              className="flex items-center justify-center rounded-xl bg-slate-100 p-3.5 text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleConfirm}
              disabled={isTransferring}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98]"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar y Enviar"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
