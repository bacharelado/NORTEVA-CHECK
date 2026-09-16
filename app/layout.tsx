import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NORTEVA CHECK | Diagnóstico de Segurança Digital",
  description: "Diagnóstico prático de segurança digital para pequenas e médias empresas."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}