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
};

export default nextConfig;
