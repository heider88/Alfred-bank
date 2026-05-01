import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowRightLeft, History, Settings, X, Wallet } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
  { name: "Resumen", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transferencias", href: "/transferencias", icon: ArrowRightLeft },
  { name: "Historial", href: "/historial", icon: History },
  { name: "Configuración", href: "/configuracion", icon: Settings },
];

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay oscuro para móviles cuando el Drawer está abierto */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Contenedor del Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-[#0A0A0A] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:shadow-none lg:border-r lg:border-white/10 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between px-8 border-b border-white/5">
          <Link href="/" className="font-display font-extrabold text-2xl tracking-tighter flex items-center gap-1 hover:opacity-80 transition-opacity">
            alfred<span className="text-[#CCFF00]">.</span>
          </Link>
          <button 
            onClick={() => setIsOpen(false)} 
            className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-2 p-4 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? "bg-[#CCFF00] text-black" 
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-black" : "text-white/40"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* Bottom Decorative Element */}
        <div className="absolute bottom-10 left-8 right-8">
           <div className="bg-white/5 rounded-2xl p-5 border border-white/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00] rounded-full blur-[50px] opacity-10"></div>
             <p className="text-xs text-white/50 font-medium relative z-10">
               ¿Necesitas ayuda?
             </p>
             <p className="text-sm text-white font-bold mt-1 relative z-10">
               Habla con soporte
             </p>
           </div>
        </div>
      </aside>
    </>
  );
}
