import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles.css";
import { Providers } from "./providers";
import { AuthProvider } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { BarraSacola } from "@/components/cardapio/BarraSacola";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SoftShake — Delivery online",
  description: "Peça seu milkshake online no SoftShake.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            <div className="min-h-screen bg-background pb-20 md:pb-0">
              <Header />
              {children}
              <BarraSacola />
              <BottomNav />
            </div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
