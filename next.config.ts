import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bucket privado — imagens são servidas via signed URL pelo Route Handler /api/imagem
  // O domínio do Supabase Storage ainda precisa estar liberado para o <img> funcionar
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "juzlblaxwybssbyddnwj.supabase.co",
        pathname: "/storage/v1/**",
      },
    ],
  },
  // Reutiliza o payload RSC de rotas já visitadas por alguns segundos.
  // Sem isso (default 0 em páginas dinâmicas), toda troca da sidebar
  // refaz o fetch completo e a navegação parece “travada”.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
