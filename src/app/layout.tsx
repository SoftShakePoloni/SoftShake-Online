import { getCustomerSession } from "@/lib/customer-session.server";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles.css";
import { Providers } from "./providers";
import { RouteConditionalLayout } from "@/components/layout/RouteConditionalLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SoftShake — Delivery online",
  description: "Peça seu milkshake online no SoftShake.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialCliente = await getCustomerSession().catch(() => undefined);
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers initialCliente={initialCliente}>
          <RouteConditionalLayout>{children}</RouteConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
