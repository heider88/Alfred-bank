"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, AlertCircle, Lock, Mail, User, ArrowLeft } from "lucide-react";

const registerSchema = z.object({
  owner_name: z.string().min(3, { message: "Ingresa tu nombre completo" }),
  email: z.string().email({ message: "Ingresa un correo electrónico válido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

      // 1. Crear la cuenta
      const resCreate = await fetch(`${API_URL}/accounts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!resCreate.ok) {
        const errorData = await resCreate.json().catch(() => null);
        throw new Error(errorData?.detail || "Error al crear la cuenta. Intenta con otro correo.");
      }

      // 2. Hacer login automático para obtener el token
      const formData = new URLSearchParams();
      formData.append("username", data.email);
      formData.append("password", data.password);

      const resLogin = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!resLogin.ok) throw new Error("Cuenta creada, pero hubo un error al iniciar sesión.");

      const { access_token } = await resLogin.json();
      localStorage.setItem("token", access_token);

      // Redirigir al dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.message === "Failed to fetch"
          ? "No se pudo conectar con el servidor. Verifica que el backend esté corriendo."
          : err.message
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F5] p-6 selection:bg-[#CCFF00] selection:text-black relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-[#CCFF00] rounded-full blur-[120px] opacity-20 -z-10"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] bg-black rounded-full blur-[100px] opacity-10 -z-10"></div>

      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
      </div>

      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-8">
          <div className="font-display font-extrabold text-3xl tracking-tighter">
            alfred<span className="text-[#CCFF00]">.</span>
          </div>
        </Link>

        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-black/5 relative z-10">
          <h1 className="font-display font-bold text-3xl text-slate-900 mb-2">Crear Cuenta</h1>
          <p className="text-slate-500 text-sm mb-8">Únete a Alfred Bank y recibe un bono de bienvenida de $500.000 COP para probar la app.</p>

          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Nombre Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Ej. María Gómez"
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent ${
                    errors.owner_name ? "border-rose-300 focus:ring-rose-200" : "border-slate-200"
                  }`}
                  {...register("owner_name")}
                />
              </div>
              {errors.owner_name && <p className="text-xs text-rose-500 font-medium pl-1">{errors.owner_name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  placeholder="maria@ejemplo.com"
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent ${
                    errors.email ? "border-rose-300 focus:ring-rose-200" : "border-slate-200"
                  }`}
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-500 font-medium pl-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent ${
                    errors.password ? "border-rose-300 focus:ring-rose-200" : "border-slate-200"
                  }`}
                  {...register("password")}
                />
              </div>
              {errors.password && <p className="text-xs text-rose-500 font-medium pl-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-[#0A0A0A] hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Crear Cuenta <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm font-medium text-slate-500">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-black font-bold hover:underline">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}