import { Menu, Bell } from "lucide-react";

interface TopNavbarProps {
  onMenuClick: () => void;
}

export default function TopNavbar({ onMenuClick }: TopNavbarProps) {
  return (
    <header className="flex h-20 items-center justify-between bg-white px-4 md:px-8 border-b border-black/5 z-30 relative">
      <div className="flex items-center gap-4">
        {/* Botón Hamburguesa para Mobile */}
        <button 
          onClick={onMenuClick}
          className="rounded-xl p-2 text-black/40 hover:bg-black/5 hover:text-black focus:outline-none lg:hidden transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Notificaciones */}
        <button className="relative text-black/40 hover:text-black transition-colors">
          <Bell className="h-6 w-6" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#CCFF00] ring-2 ring-white shadow-sm"></span>
        </button>
        
        {/* User Avatar Falso */}
        <div className="flex items-center gap-3 border-l border-black/5 pl-6 cursor-pointer group">
          <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-[#CCFF00]/50 group-hover:ring-[#CCFF00] transition-all bg-[#0A0A0A] flex justify-center items-center">
            <span className="font-display font-bold text-white text-sm">JP</span>
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-sm font-bold text-[#0A0A0A]">Juan Pérez</span>
            <span className="text-xs font-medium text-black/50">Cuenta Pro</span>
          </div>
        </div>
      </div>
    </header>
  );
}
