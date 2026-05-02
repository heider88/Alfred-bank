"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight, Smartphone, Zap, Shield, Sparkles, CreditCard, ChevronRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 80, damping: 20 },
    },
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F4F4F5] text-[#0A0A0A] overflow-hidden selection:bg-[#CCFF00] selection:text-black">
      
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-5 md:px-12 backdrop-blur-md bg-[#F4F4F5]/80"
      >
        <div className="font-display font-extrabold text-2xl tracking-tighter flex items-center gap-1">
          alfred<span className="text-[#CCFF00] drop-shadow-[0_0_8px_rgba(204,255,0,0.8)]">.</span>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold tracking-wide">
            <Link href="#features" className="hover:opacity-60 transition-opacity">Beneficios</Link>
            <Link href="#how-it-works" className="hover:opacity-60 transition-opacity">¿Cómo funciona?</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-bold px-4 py-2 hover:bg-black/5 rounded-full transition-colors hidden sm:block">
              Ingresar
            </Link>
            <Link href="/register" className="bg-[#0A0A0A] text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-black/80 transition-transform hover:scale-105 flex items-center gap-2">
              Abrir cuenta <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-20 px-6 md:px-12 min-h-[90vh] flex flex-col justify-center">
          {/* Decorative Background Elements */}
          <div className="absolute top-1/4 right-0 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[#CCFF00] rounded-full blur-[120px] opacity-20 -z-10 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-blue-400 rounded-full blur-[150px] opacity-10 -z-10 -translate-x-1/4"></div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto w-full"
          >
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 flex flex-col items-start z-10">
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/10 bg-white/50 backdrop-blur-sm mb-6 shadow-sm">
                  <Sparkles className="w-4 h-4 text-[#CCFF00] fill-current" />
                  <span className="text-xs font-bold uppercase tracking-wider">La nueva era financiera</span>
                </motion.div>
                
                <motion.h1 variants={itemVariants} className="font-display font-bold text-6xl md:text-8xl leading-[0.9] tracking-tighter uppercase">
                  Banca <br />
                  <span className="relative inline-block">
                    Sin
                    <span className="absolute bottom-1 md:bottom-3 left-0 w-full h-[30%] bg-[#CCFF00] -z-10 -rotate-2"></span>
                  </span>{" "}
                  Fricción
                </motion.h1>
                
                <motion.p variants={itemVariants} className="mt-8 text-lg md:text-xl text-black/60 max-w-md font-medium leading-relaxed">
                  Alfred Bank está diseñado para profesionales que exigen rapidez, control absoluto y cero burocracia. Minimalista en diseño, máximo en poder.
                </motion.p>
                
                <motion.div variants={itemVariants} className="mt-10 flex flex-wrap gap-4">
                  <Link href="/register" className="bg-[#CCFF00] text-black font-bold text-lg px-8 py-4 rounded-full shadow-[0_4px_24px_-4px_rgba(204,255,0,0.5)] hover:shadow-[0_8px_32px_-4px_rgba(204,255,0,0.6)] hover:-translate-y-1 transition-all flex items-center gap-2">
                    Comenzar ahora
                  </Link>
                  <Link href="#features" className="bg-white/60 backdrop-blur-md text-black font-bold text-lg px-8 py-4 rounded-full border border-black/5 hover:bg-white transition-all flex items-center gap-2">
                    Ver más <ChevronRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </div>

              {/* Abstract Hero Image/Graphic */}
              <motion.div variants={itemVariants} className="lg:col-span-5 relative">
                <div className="relative w-full aspect-[4/5] rounded-[2rem] bg-[#0A0A0A] p-8 overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#CCFF00] rounded-full blur-[80px] opacity-20"></div>
                  
                  {/* Mockup Card */}
                  <div className="absolute -right-10 top-10 w-72 h-44 bg-gradient-to-tr from-zinc-800 to-zinc-700 rounded-2xl p-5 border border-white/10 shadow-2xl backdrop-blur-xl rotate-[-12deg] z-20">
                    <div className="flex justify-between items-start">
                      <div className="w-8 h-6 bg-white/20 rounded"></div>
                      <div className="font-display font-bold text-white/50 text-xs">alfred.</div>
                    </div>
                    <div className="mt-8 font-mono text-white/80 tracking-widest text-sm">•••• •••• •••• 4092</div>
                    <div className="mt-2 text-white font-semibold flex justify-between items-end">
                      <span>$ 12,450.00</span>
                      <span className="text-[10px] text-white/40 uppercase">Debit</span>
                    </div>
                  </div>

                  {/* Mockup App Interface */}
                  <div className="mt-24 bg-zinc-900/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 h-full flex flex-col gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-[#CCFF00] flex items-center justify-center shadow-[0_0_30px_rgba(204,255,0,0.3)]">
                      <ArrowRight className="w-8 h-8 text-black -rotate-45" />
                    </div>
                    <div>
                      <div className="text-white/50 text-sm font-medium">Balance Total</div>
                      <div className="font-display font-bold text-4xl text-white mt-1">$4,820.50</div>
                    </div>
                    
                    <div className="mt-auto space-y-3">
                      {[1,2,3].map((i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-2xl bg-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10"></div>
                            <div className="space-y-1">
                              <div className="w-20 h-3 bg-white/20 rounded-full"></div>
                              <div className="w-12 h-2 bg-white/10 rounded-full"></div>
                            </div>
                          </div>
                          <div className="w-16 h-3 bg-white/20 rounded-full"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Alfred AI Section */}
        <section className="py-24 px-6 md:px-12 bg-[#0A0A0A] text-white overflow-hidden relative">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[#CCFF00] rounded-full blur-[150px] opacity-[0.07] pointer-events-none"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-[#CCFF00]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Inteligencia Artificial</span>
                </div>
                <h2 className="font-display font-bold text-4xl md:text-6xl mb-6 tracking-tighter">
                  Conoce a Alfred, <br/> tu CFO personal.
                </h2>
                <p className="text-white/60 text-lg md:text-xl font-medium mb-10 leading-relaxed">
                  No más dudas sobre en qué se te fue el dinero. Alfred analiza tus finanzas en tiempo real, te da recomendaciones y responde cualquier pregunta sobre tus movimientos. Todo por un chat rápido y natural.
                </p>
                <ul className="space-y-5 mb-10">
                  {['Análisis de gastos automático', 'Recomendaciones de ahorro', 'Respuestas en lenguaje natural'].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-base font-medium text-white/80">
                      <div className="w-6 h-6 rounded-full bg-[#CCFF00]/20 flex items-center justify-center text-[#CCFF00] shrink-0">
                        <Zap className="w-3.5 h-3.5" fill="currentColor" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="inline-flex items-center gap-2 font-bold text-[#CCFF00] hover:text-[#b8e600] transition-colors">
                  Pruébalo gratis en tu cuenta <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Chat Mockup */}
              <div className="relative">
                <div className="w-full max-w-md mx-auto bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">
                  <div className="border-b border-white/10 bg-white/5 px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center overflow-hidden shrink-0">
                      <Image src="/alfreed.png" alt="Alfred" width={40} height={40} className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-white tracking-wide">alfred.</h3>
                      <p className="text-xs text-[#CCFF00] uppercase tracking-wider font-semibold">Online</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex flex-col items-end">
                      <div className="bg-[#CCFF00] text-black text-sm font-medium px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%]">
                        ¿Cuánto gasté en Starbucks esta semana? ☕
                      </div>
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="bg-white/10 text-white text-sm font-medium px-4 py-3 rounded-2xl rounded-tl-sm border border-white/5 max-w-[90%] leading-relaxed">
                        Has gastado <span className="font-bold text-[#CCFF00]">$37,000 COP</span> en Starbucks en los últimos 7 días (2 transacciones). Te recomiendo crear un 'Bolsillo' para cafés si es un gasto recurrente.
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="bg-[#CCFF00] text-black text-sm font-medium px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%]">
                        ¡Buena idea! 💡
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-white/10 bg-black/50">
                    <div className="h-10 bg-white/5 border border-white/10 rounded-xl px-4 flex items-center">
                      <span className="text-white/30 text-sm">Escribe a Alfred...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 px-6 md:px-12 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16">
              <h2 className="font-display font-bold text-4xl md:text-6xl tracking-tight leading-none mb-4">
                Redefinimos <br className="hidden md:block"/> lo esencial.
              </h2>
              <p className="text-black/50 text-lg md:text-xl font-medium max-w-xl">
                Nuestra plataforma elimina el ruido. Sólo te dejamos las herramientas que necesitas para dominar tu economía personal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Feature 1 - Large */}
              <div className="md:col-span-2 bg-[#F4F4F5] rounded-[2rem] p-8 md:p-12 overflow-hidden relative group">
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#CCFF00] rounded-full blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-700"></div>
                <div className="relative z-10 w-full md:w-2/3">
                  <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-8">
                    <Zap className="w-6 h-6 text-[#CCFF00]" />
                  </div>
                  <h3 className="font-display font-bold text-3xl mb-4">Velocidad que se siente</h3>
                  <p className="text-black/60 font-medium text-lg leading-relaxed mb-8">
                    Las transferencias y pagos suceden en milisegundos. Sin pantallas de carga eternas, sin procesos confusos.
                  </p>
                  <Link href="/register" className="inline-flex items-center gap-2 font-bold hover:gap-4 transition-all">
                    Pruébalo ahora <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              {/* Feature 2 - Small */}
              <div className="bg-[#0A0A0A] text-white rounded-[2rem] p-8 md:p-12 flex flex-col justify-between group overflow-hidden relative">
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
                    <Shield className="w-6 h-6 text-[#CCFF00]" />
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-4">Seguridad Intransigente</h3>
                  <p className="text-white/60 font-medium">
                    Encriptación de grado militar y biometría avanzada protegen tu cuenta 24/7.
                  </p>
                </div>
              </div>

              {/* Feature 3 - Small */}
              <div className="bg-[#CCFF00] text-black rounded-[2rem] p-8 md:p-12 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 bg-black/5 rounded-2xl flex items-center justify-center mb-8">
                    <Smartphone className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-4">100% Responsivo</h3>
                  <p className="text-black/70 font-medium">
                    Tu banco en el bolsillo, tableta o computadora. La misma experiencia impecable en todos tus dispositivos.
                  </p>
                </div>
              </div>

              {/* Feature 4 - Large Image/Card Mockup */}
              <div className="md:col-span-2 bg-[#F4F4F5] rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 overflow-hidden">
                <div className="flex-1">
                  <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center mb-8">
                    <CreditCard className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="font-display font-bold text-3xl mb-4">La única tarjeta que necesitas</h3>
                  <p className="text-black/60 font-medium text-lg mb-8">
                    Física y virtual. Controla límites, bloqueos y visualiza tu PIN directamente desde la app en segundos.
                  </p>
                </div>
                <div className="flex-1 w-full flex justify-center perspective-[1000px]">
                  <div className="w-64 h-40 bg-black rounded-xl p-5 shadow-2xl transform rotate-y-[-15deg] rotate-x-[10deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-500 border border-white/10 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="font-display font-bold text-white text-sm">alfred.</span>
                      <div className="w-8 h-6 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-sm"></div>
                    </div>
                    <div className="font-mono text-white/80 tracking-widest text-lg">•••• 4092</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-32 px-6 md:px-12 bg-[#0A0A0A] text-white relative overflow-hidden">
          {/* Noise/Texture overlay could go here, for now pure dark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-[#CCFF00] rounded-full blur-[200px] opacity-[0.08] pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
            <h2 className="font-display font-bold text-5xl md:text-7xl mb-8 uppercase tracking-tighter">
              Únete a la <br/> revolución
            </h2>
            <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl font-medium">
              Abre tu cuenta en menos de 3 minutos. Sin sucursales, sin papeleos interminables. 
            </p>
            <Link href="/register" className="bg-[#CCFF00] text-black font-extrabold text-xl px-12 py-5 rounded-full hover:scale-105 transition-transform flex items-center gap-3">
              Crear mi cuenta <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-12 px-6 md:px-12 border-t border-black/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-display font-extrabold text-2xl tracking-tighter">
            alfred<span className="text-[#CCFF00]">.</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-black/60">
            <Link href="#" className="hover:text-black transition-colors">Términos</Link>
            <Link href="#" className="hover:text-black transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-black transition-colors">Soporte</Link>
          </div>
          <div className="text-sm text-black/40 font-medium">
            © 2026 Alfred Bank. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
