import type { Metadata } from "next";
import { Syne, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "@/app/globals.css";

const syne = Syne({ subsets: ["latin"], variable: '--font-syne' });
const manrope = Manrope({ subsets: ["latin"], variable: '--font-manrope' });

export const metadata: Metadata = {
  title: "Alfred Bank | La banca para la nueva generación",
  description: "Gestiona tu dinero con Alfred Bank. Simple, intuitivo y sin fricciones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} ${syne.variable} font-sans bg-white text-zinc-950 antialiased`}>
        {children}
        <Toaster richColors position="top-right" expand={true} />
      </body>
    </html>
  );
}
