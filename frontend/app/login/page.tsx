"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, AlertCircle, Lock, Mail, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Ingresa un correo electrónico válido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      const formData = new URLSearchParams();
      formData.append("username", data.email);
      formData.append("password", data.password);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Correo o contraseña incorrectos");
      }

      const { access_token } = await res.json();
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
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-[#CCFF00] rounded-full blur-[120px] opacity-20 -z-10"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] bg-black rounded-full blur-[100px] opacity-10 -z-10"></div>

      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-10">
          <div className="font-display font-extrabold text-3xl tracking-tighter">
            alfred<span className="text-[#CCFF00]">.</span>
          </div>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-black/5 relative z-10">
          <h1 className="font-display font-bold text-3xl text-slate-900 mb-2">Bienvenido</h1>
          <p className="text-slate-500 text-sm mb-8">Ingresa tus credenciales para acceder a tu cuenta.</p>

          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  placeholder="juan@alfred.bank"
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent ${
                    errors.email ? "border-rose-300 focus:ring-rose-200" : "border-slate-200"
                  }`}
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-500 font-medium pl-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">Contraseña</label>
                <Link href="#" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
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
              className="w-full mt-4 bg-[#0A0A0A] hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Ingresar <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          
          {/* Hint for demo */}
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 text-center">
            <p className="font-semibold text-slate-700 mb-1">Credenciales de prueba:</p>
            <p>Email: <span className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">juan@alfred.bank</span></p>
            <p className="mt-1">Pass: <span className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">123456</span></p>
          </div>

          <div className="mt-6 text-center text-sm font-medium text-slate-500">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-[#0A0A0A] font-bold hover:underline">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}