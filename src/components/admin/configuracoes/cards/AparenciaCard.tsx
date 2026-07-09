"use client";

import { useState } from "react";
import { ConfiguracaoLoja } from "@/types/configuracoes";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface AparenciaCardProps {
  config: ConfiguracaoLoja;
  onChange: (
    field: keyof ConfiguracaoLoja,
    value: ConfiguracaoLoja[keyof ConfiguracaoLoja]
  ) => void;
}

export function AparenciaCard({ config, onChange }: AparenciaCardProps) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [dragActiveLogo, setDragActiveLogo] = useState(false);
  const [dragActiveBanner, setDragActiveBanner] = useState(false);
  const supabase = createClient();

  const handleUpload = async (file: File, type: "logo" | "banner") => {
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máximo 5MB)");
      return;
    }

    const setUploading = type === "logo" ? setUploadingLogo : setUploadingBanner;
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `configuracoes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      // Remover imagem antiga se existir
      const oldUrl = type === "logo" ? config.logo_url : config.banner_url;
      if (oldUrl) {
        const oldPath = oldUrl.split("/").slice(-2).join("/");
        await supabase.storage.from("images").remove([oldPath]);
      }

      // Atualizar
      onChange(type === "logo" ? "logo_url" : "banner_url", publicUrl);
      toast.success(`${type === "logo" ? "Logo" : "Banner"} atualizado`);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (type: "logo" | "banner") => {
    const url = type === "logo" ? config.logo_url : config.banner_url;
    if (!url) return;

    try {
      const oldPath = url.split("/").slice(-2).join("/");
      await supabase.storage.from("images").remove([oldPath]);
      onChange(type === "logo" ? "logo_url" : "banner_url", null);
      toast.success(`${type === "logo" ? "Logo" : "Banner"} removido`);
    } catch (error) {
      console.error("Erro ao remover:", error);
      toast.error("Erro ao remover imagem");
    }
  };

  const handleDrag = (e: React.DragEvent, type: "logo" | "banner") => {
    e.preventDefault();
    e.stopPropagation();
    const setDragActive = type === "logo" ? setDragActiveLogo : setDragActiveBanner;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: "logo" | "banner") => {
    e.preventDefault();
    e.stopPropagation();
    const setDragActive = type === "logo" ? setDragActiveLogo : setDragActiveBanner;
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0], type);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-[#EEE8FA] flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-[#4C258C]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#111827]">Aparência</h3>
          <p className="text-sm text-[#6B7280]">Logo e banner da loja</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Logo */}
        <div>
          <label className="text-sm font-medium text-[#111827] mb-2 block">
            Logo da Loja
          </label>
          <div
            onDragEnter={(e) => handleDrag(e, "logo")}
            onDragLeave={(e) => handleDrag(e, "logo")}
            onDragOver={(e) => handleDrag(e, "logo")}
            onDrop={(e) => handleDrop(e, "logo")}
            className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all ${
              dragActiveLogo
                ? "border-[#4C258C] bg-[#EEE8FA]"
                : "border-[#E5E7EB] bg-[#F8F9FC]"
            }`}
          >
            {config.logo_url ? (
              <div className="relative aspect-square max-w-[200px] mx-auto">
                <Image
                  src={config.logo_url}
                  alt="Logo"
                  fill
                  className="object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => document.getElementById("logo-input")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Trocar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemove("logo")}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-square max-w-[200px] mx-auto flex flex-col items-center justify-center p-6 text-center">
                {uploadingLogo ? (
                  <>
                    <Loader2 className="w-10 h-10 text-[#4C258C] mb-3 animate-spin" />
                    <p className="text-sm text-[#6B7280]">Fazendo upload...</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-[#9CA3AF] mb-3" />
                    <p className="text-sm font-medium text-[#111827] mb-1">
                      Arraste uma imagem ou clique
                    </p>
                    <p className="text-xs text-[#6B7280] mb-3">
                      PNG, JPG ou WEBP até 5MB
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById("logo-input")?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Arquivo
                    </Button>
                  </>
                )}
              </div>
            )}
            <input
              id="logo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleUpload(e.target.files[0], "logo");
                }
              }}
            />
          </div>
          <p className="text-xs text-[#6B7280] mt-2">
            Recomendado: 512x512px (quadrado)
          </p>
        </div>

        {/* Banner */}
        <div>
          <label className="text-sm font-medium text-[#111827] mb-2 block">
            Banner da Loja
          </label>
          <div
            onDragEnter={(e) => handleDrag(e, "banner")}
            onDragLeave={(e) => handleDrag(e, "banner")}
            onDragOver={(e) => handleDrag(e, "banner")}
            onDrop={(e) => handleDrop(e, "banner")}
            className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all ${
              dragActiveBanner
                ? "border-[#4C258C] bg-[#EEE8FA]"
                : "border-[#E5E7EB] bg-[#F8F9FC]"
            }`}
          >
            {config.banner_url ? (
              <div className="relative aspect-[3/1]">
                <Image
                  src={config.banner_url}
                  alt="Banner"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => document.getElementById("banner-input")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Trocar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemove("banner")}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-[3/1] flex flex-col items-center justify-center p-6 text-center">
                {uploadingBanner ? (
                  <>
                    <Loader2 className="w-10 h-10 text-[#4C258C] mb-3 animate-spin" />
                    <p className="text-sm text-[#6B7280]">Fazendo upload...</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-[#9CA3AF] mb-3" />
                    <p className="text-sm font-medium text-[#111827] mb-1">
                      Arraste uma imagem ou clique
                    </p>
                    <p className="text-xs text-[#6B7280] mb-3">
                      PNG, JPG ou WEBP até 5MB
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById("banner-input")?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Arquivo
                    </Button>
                  </>
                )}
              </div>
            )}
            <input
              id="banner-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleUpload(e.target.files[0], "banner");
                }
              }}
            />
          </div>
          <p className="text-xs text-[#6B7280] mt-2">
            Recomendado: 1200x400px (proporção 3:1)
          </p>
        </div>
      </div>
    </div>
  );
}
