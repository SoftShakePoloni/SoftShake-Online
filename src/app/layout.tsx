import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles.css";
import { Providers } from "./providers";
import { AuthProvider } from "@/context/AuthContext";
import { RouteConditionalLayout } from "@/components/layout/RouteConditionalLayout";

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
            <RouteConditionalLayout>{children}</RouteConditionalLayout>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
