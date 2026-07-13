"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ConfiguracaoLoja,
  diasSemana,
  estadosBrasil,
  normalizeConfiguracao,
  parseDiasFuncionamento,
} from "@/types/configuracoes";
import { updateConfiguracoesLoja } from "@/actions/admin/configuracoes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Cor principal da loja */
const BRAND = "#4C258C";
const BRAND_SOFT = "#EEE8FA";

const SECTIONS = [
  { id: "geral", label: "Geral" },
  { id: "aparencia", label: "Aparência" },
  { id: "endereco", label: "Endereço" },
  { id: "contato", label: "Contato" },
  { id: "horario", label: "Horários" },
  { id: "delivery", label: "Delivery" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/* ─── UI (mesmo layout de Configurações) ──────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-lg font-semibold text-[#111827]">{children}</h2>
  );
}

function SectionHint({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm text-[#6B7280]">{children}</p>;
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-[#E5E7EB] bg-white",
        className
      )}
    >
      {children}
    </div>
  );
}

function Row({
  title,
  description,
  children,
  last,
  align = "center",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  last?: boolean;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-6 px-5 sm:px-6 py-4 min-h-[64px]",
        align === "center" ? "items-center" : "items-start",
        !last && "border-b border-[#E5E7EB]"
      )}
    >
      <div className="min-w-0 flex-1 pr-4">
        <p className="text-[17px] font-semibold leading-snug text-[#111827]">
          {title}
        </p>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 pl-2 w-full max-w-[min(100%,420px)] flex justify-end">
        {children}
      </div>
    </div>
  );
}

function BrandSwitch({
  checked,
  onCheckedChange,
  disabled,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <Switch
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      className={cn(
        "h-5 w-9 shrink-0",
        "data-[state=checked]:bg-[#4C258C] data-[state=unchecked]:bg-[#D1D5DB]",
        "[&>span]:h-4 [&>span]:w-4 [&>span]:data-[state=checked]:translate-x-4"
      )}
    />
  );
}

const fieldClass =
  "h-9 w-full max-w-[420px] rounded-md border-[#E5E7EB] text-sm focus-visible:ring-[#4C258C]/30 focus-visible:border-[#4C258C]";

/* ─── Manager ─────────────────────────────────────────────────────────── */

interface EstabelecimentoManagerProps {
  configuracaoInicial: ConfiguracaoLoja;
}

export function EstabelecimentoManager({
  configuracaoInicial,
}: EstabelecimentoManagerProps) {
  const [config, setConfig] = useState(configuracaoInicial);
  const [section, setSection] = useState<SectionId>("geral");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const diasFuncionamento = parseDiasFuncionamento(config.dias_funcionamento);

  const persist = useCallback(
    async (patch: Partial<ConfiguracaoLoja>) => {
      if (!config.id || config.id === "default" || config.id === 0) {
        toast.error("Configuração ainda não foi criada no banco");
        return;
      }
      setSaving(true);
      try {
        const data = await updateConfiguracoesLoja(config.id, patch);
        const normalized = normalizeConfiguracao(
          data as Record<string, unknown>
        );
        setConfig((prev) => ({
          ...prev,
          ...normalized,
          dias_funcionamento:
            patch.dias_funcionamento !== undefined
              ? Array.isArray(patch.dias_funcionamento)
                ? patch.dias_funcionamento
                : normalized.dias_funcionamento
              : prev.dias_funcionamento,
        }));
        toast.success("Alterações salvas.");
      } catch {
        toast.error("Não foi possível salvar.");
      } finally {
        setSaving(false);
      }
    },
    [config.id]
  );

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatch = useRef<Partial<ConfiguracaoLoja>>({});

  const queueField = useCallback(
    (
      field: keyof ConfiguracaoLoja,
      value: ConfiguracaoLoja[keyof ConfiguracaoLoja]
    ) => {
      setConfig((prev) => ({ ...prev, [field]: value }));
      pendingPatch.current = { ...pendingPatch.current, [field]: value };
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        const p = { ...pendingPatch.current };
        pendingPatch.current = {};
        void persist(p);
      }, 450);
    },
    [persist]
  );

  const setFieldNow = useCallback(
    (
      field: keyof ConfiguracaoLoja,
      value: ConfiguracaoLoja[keyof ConfiguracaoLoja]
    ) => {
      setConfig((prev) => ({ ...prev, [field]: value }));
      void persist({ [field]: value } as Partial<ConfiguracaoLoja>);
    },
    [persist]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleDiaToggle = (dia: string, checked: boolean) => {
    const novos = checked
      ? [...diasFuncionamento, dia]
      : diasFuncionamento.filter((d) => d !== dia);
    setConfig((prev) => ({ ...prev, dias_funcionamento: novos }));
    void persist({ dias_funcionamento: novos });
  };

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
    const supabase = createClient();

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

      const oldUrl = type === "logo" ? config.logo_url : config.banner_url;
      if (oldUrl) {
        const oldPath = oldUrl.split("/").slice(-2).join("/");
        await supabase.storage.from("images").remove([oldPath]);
      }

      const field = type === "logo" ? "logo_url" : "banner_url";
      setConfig((prev) => ({ ...prev, [field]: publicUrl }));
      await persist({ [field]: publicUrl });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (type: "logo" | "banner") => {
    const url = type === "logo" ? config.logo_url : config.banner_url;
    if (!url) return;
    try {
      const supabase = createClient();
      const oldPath = url.split("/").slice(-2).join("/");
      await supabase.storage.from("images").remove([oldPath]);
      const field = type === "logo" ? "logo_url" : "banner_url";
      setConfig((prev) => ({ ...prev, [field]: null }));
      await persist({ [field]: null });
    } catch {
      toast.error("Erro ao remover imagem");
    }
  };

  return (
    <div className="min-h-full bg-[#F9FAFB]">
      <div className="flex w-full gap-6 lg:gap-10 px-4 sm:px-6 lg:px-8 py-5">
        {/* Nav */}
        <nav
          className="hidden w-52 shrink-0 md:block"
          aria-label="Seções do estabelecimento"
        >
          <ul className="space-y-0.5">
            {SECTIONS.map((s) => {
              const active = section === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={cn(
                      "w-full rounded px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "font-medium text-[#4C258C]"
                        : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
                    )}
                    style={
                      active
                        ? { backgroundColor: BRAND_SOFT }
                        : undefined
                    }
                  >
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 border-t border-[#E5E7EB] pt-4">
            <Link
              href="/admin/configuracoes"
              className="block px-3 py-2 text-sm text-[#6B7280] hover:text-[#4C258C]"
            >
              Configurações do sistema →
            </Link>
          </div>
        </nav>

        {/* Mobile select */}
        <div className="mb-3 w-full md:hidden">
          <Select
            value={section}
            onValueChange={(v) => setSection(v as SectionId)}
          >
            <SelectTrigger className="h-10 rounded-md border-[#E5E7EB] bg-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SECTIONS.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-sm">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 flex-1 pb-10">
          {/* ——— GERAL ——— */}
          {section === "geral" && (
            <div>
              <SectionTitle>Geral</SectionTitle>
              <SectionHint>
                Identidade e status de funcionamento da loja.
              </SectionHint>
              <Panel>
                <Row
                  title="Nome da loja"
                  description="Nome exibido no cardápio e nos pedidos."
                  align="start"
                >
                  <Input
                    value={config.nome}
                    disabled={saving}
                    onChange={(e) => queueField("nome", e.target.value)}
                    placeholder="Ex: SoftShake"
                    className={fieldClass}
                  />
                </Row>
                <Row
                  title="Descrição"
                  description="Texto curto sobre a loja (até ~150 caracteres)."
                  align="start"
                >
                  <Textarea
                    value={config.descricao || ""}
                    disabled={saving}
                    onChange={(e) => queueField("descricao", e.target.value)}
                    placeholder="Descreva sua loja..."
                    rows={3}
                    className={cn(
                      fieldClass,
                      "h-auto min-h-[80px] resize-none py-2"
                    )}
                  />
                </Row>
                <Row
                  title="Loja aberta"
                  description={
                    config.esta_aberto
                      ? "Clientes podem fazer pedidos."
                      : "Loja temporariamente fechada para pedidos."
                  }
                  last
                >
                  <BrandSwitch
                    checked={config.esta_aberto}
                    disabled={saving}
                    onCheckedChange={(v) => setFieldNow("esta_aberto", v)}
                    aria-label="Loja aberta"
                  />
                </Row>
              </Panel>
            </div>
          )}

          {/* ——— APARÊNCIA ——— */}
          {section === "aparencia" && (
            <div>
              <SectionTitle>Aparência</SectionTitle>
              <SectionHint>Logo e banner exibidos no cardápio.</SectionHint>
              <Panel>
                <Row
                  title="Logo"
                  description="Recomendado: 512×512px, PNG ou JPG até 5MB."
                  align="start"
                >
                  <div className="w-full max-w-[420px] space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F9FAFB]">
                        {config.logo_url ? (
                          <Image
                            src={config.logo_url}
                            alt="Logo"
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-[#9CA3AF]">
                            —
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingLogo || saving}
                          onClick={() =>
                            document.getElementById("logo-input")?.click()
                          }
                          className="h-9 border-[#E5E7EB] text-sm hover:border-[#4C258C]/40 hover:bg-[#EEE8FA] hover:text-[#4C258C]"
                        >
                          {uploadingLogo ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-1.5 h-4 w-4" />
                          )}
                          {config.logo_url ? "Trocar" : "Enviar"}
                        </Button>
                        {config.logo_url ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingLogo || saving}
                            onClick={() => void handleRemoveImage("logo")}
                            className="h-9 border-[#E5E7EB] text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <X className="mr-1.5 h-4 w-4" />
                            Remover
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <input
                      id="logo-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          void handleUpload(e.target.files[0], "logo");
                        }
                      }}
                    />
                  </div>
                </Row>
                <Row
                  title="Banner"
                  description="Recomendado: 1200×400px (proporção 3:1)."
                  align="start"
                  last
                >
                  <div className="w-full max-w-[420px] space-y-2">
                    <div className="relative h-20 w-full overflow-hidden rounded-md border border-[#E5E7EB] bg-[#F9FAFB]">
                      {config.banner_url ? (
                        <Image
                          src={config.banner_url}
                          alt="Banner"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-full items-center justify-center text-xs text-white/80"
                          style={{ backgroundColor: BRAND }}
                        >
                          Sem banner
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingBanner || saving}
                        onClick={() =>
                          document.getElementById("banner-input")?.click()
                        }
                        className="h-9 border-[#E5E7EB] text-sm hover:border-[#4C258C]/40 hover:bg-[#EEE8FA] hover:text-[#4C258C]"
                      >
                        {uploadingBanner ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-1.5 h-4 w-4" />
                        )}
                        {config.banner_url ? "Trocar" : "Enviar"}
                      </Button>
                      {config.banner_url ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingBanner || saving}
                          onClick={() => void handleRemoveImage("banner")}
                          className="h-9 border-[#E5E7EB] text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <X className="mr-1.5 h-4 w-4" />
                          Remover
                        </Button>
                      ) : null}
                    </div>
                    <input
                      id="banner-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          void handleUpload(e.target.files[0], "banner");
                        }
                      }}
                    />
                  </div>
                </Row>
              </Panel>
            </div>
          )}

          {/* ——— ENDEREÇO ——— */}
          {section === "endereco" && (
            <div>
              <SectionTitle>Endereço</SectionTitle>
              <SectionHint>Localização exibida no cardápio.</SectionHint>
              <Panel>
                <Row
                  title="Endereço"
                  description="Rua, número e complemento."
                  align="start"
                >
                  <Input
                    value={config.endereco || ""}
                    disabled={saving}
                    onChange={(e) => queueField("endereco", e.target.value)}
                    placeholder="Rua, número, complemento"
                    className={fieldClass}
                  />
                </Row>
                <Row title="Cidade" align="start">
                  <Input
                    value={config.cidade || ""}
                    disabled={saving}
                    onChange={(e) => queueField("cidade", e.target.value)}
                    placeholder="Ex: São Paulo"
                    className={fieldClass}
                  />
                </Row>
                <Row title="Estado" last>
                  <Select
                    value={config.estado || ""}
                    disabled={saving}
                    onValueChange={(v) => setFieldNow("estado", v)}
                  >
                    <SelectTrigger className={cn(fieldClass, "max-w-[200px]")}>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {estadosBrasil.map((uf) => (
                        <SelectItem key={uf} value={uf} className="text-sm">
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
              </Panel>
              {config.endereco && config.cidade ? (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const q = `${config.endereco}, ${config.cidade}, ${config.estado || ""}`;
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
                        "_blank"
                      );
                    }}
                    className="h-9 border-[#E5E7EB] text-sm hover:border-[#4C258C]/40 hover:text-[#4C258C]"
                  >
                    Abrir no Google Maps
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {/* ——— CONTATO ——— */}
          {section === "contato" && (
            <div>
              <SectionTitle>Contato</SectionTitle>
              <SectionHint>Telefone e redes sociais da loja.</SectionHint>
              <Panel>
                <Row title="Telefone" description="Número principal." align="start">
                  <Input
                    value={config.telefone || ""}
                    disabled={saving}
                    onChange={(e) => queueField("telefone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className={fieldClass}
                  />
                </Row>
                <Row
                  title="WhatsApp"
                  description="Contato direto com o cliente."
                  align="start"
                >
                  <Input
                    value={config.whatsapp || ""}
                    disabled={saving}
                    onChange={(e) => queueField("whatsapp", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className={fieldClass}
                  />
                </Row>
                <Row title="Instagram" description="@perfil ou URL." align="start">
                  <Input
                    value={config.instagram || ""}
                    disabled={saving}
                    onChange={(e) => queueField("instagram", e.target.value)}
                    placeholder="@seuperfil"
                    className={fieldClass}
                  />
                </Row>
                <Row title="Facebook" description="URL da página." align="start" last>
                  <Input
                    value={config.facebook || ""}
                    disabled={saving}
                    onChange={(e) => queueField("facebook", e.target.value)}
                    placeholder="https://facebook.com/..."
                    className={fieldClass}
                  />
                </Row>
              </Panel>
            </div>
          )}

          {/* ——— HORÁRIOS ——— */}
          {section === "horario" && (
            <div className="space-y-6">
              <div>
                <SectionTitle>Horários</SectionTitle>
                <SectionHint>
                  Dias e horários em que a loja recebe pedidos.
                </SectionHint>
                <Panel>
                  <Row title="Abertura" description="Horário de abertura.">
                    <Input
                      type="time"
                      value={config.horario_abertura || ""}
                      disabled={saving}
                      onChange={(e) =>
                        queueField("horario_abertura", e.target.value)
                      }
                      className={cn(fieldClass, "max-w-[160px]")}
                    />
                  </Row>
                  <Row title="Fechamento" description="Horário de fechamento." last>
                    <Input
                      type="time"
                      value={config.horario_fechamento || ""}
                      disabled={saving}
                      onChange={(e) =>
                        queueField("horario_fechamento", e.target.value)
                      }
                      className={cn(fieldClass, "max-w-[160px]")}
                    />
                  </Row>
                </Panel>
              </div>

              <div>
                <SectionTitle>Dias de funcionamento</SectionTitle>
                <Panel>
                  {diasSemana.map((dia, i) => (
                    <Row
                      key={dia.value}
                      title={dia.label}
                      last={i === diasSemana.length - 1}
                    >
                      <Checkbox
                        checked={diasFuncionamento.includes(dia.value)}
                        disabled={saving}
                        onCheckedChange={(checked) =>
                          handleDiaToggle(dia.value, Boolean(checked))
                        }
                        className="border-[#D1D5DB] data-[state=checked]:border-[#4C258C] data-[state=checked]:bg-[#4C258C]"
                        aria-label={dia.label}
                      />
                    </Row>
                  ))}
                </Panel>
              </div>
            </div>
          )}

          {/* ——— DELIVERY ——— */}
          {section === "delivery" && (
            <div>
              <SectionTitle>Delivery</SectionTitle>
              <SectionHint>Taxas, pedido mínimo e tempo estimado.</SectionHint>
              <Panel>
                <Row
                  title="Taxa de entrega"
                  description="Valor cobrado na entrega (R$)."
                >
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.taxa_entrega ?? ""}
                    disabled={saving}
                    onChange={(e) =>
                      queueField(
                        "taxa_entrega",
                        e.target.value === ""
                          ? null
                          : parseFloat(e.target.value)
                      )
                    }
                    placeholder="0,00"
                    className={cn(fieldClass, "max-w-[140px]")}
                  />
                </Row>
                <Row
                  title="Pedido mínimo"
                  description="Valor mínimo do carrinho (R$)."
                >
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.pedido_minimo ?? ""}
                    disabled={saving}
                    onChange={(e) =>
                      queueField(
                        "pedido_minimo",
                        e.target.value === ""
                          ? null
                          : parseFloat(e.target.value)
                      )
                    }
                    placeholder="0,00"
                    className={cn(fieldClass, "max-w-[140px]")}
                  />
                </Row>
                <Row
                  title="Tempo mínimo"
                  description="Estimativa mínima em minutos."
                >
                  <Input
                    type="number"
                    min="0"
                    value={config.tempo_entrega_min ?? ""}
                    disabled={saving}
                    onChange={(e) =>
                      queueField(
                        "tempo_entrega_min",
                        e.target.value === ""
                          ? null
                          : parseInt(e.target.value, 10)
                      )
                    }
                    placeholder="30"
                    className={cn(fieldClass, "max-w-[140px]")}
                  />
                </Row>
                <Row
                  title="Tempo máximo"
                  description="Estimativa máxima em minutos."
                  last
                >
                  <Input
                    type="number"
                    min="0"
                    value={config.tempo_entrega_max ?? ""}
                    disabled={saving}
                    onChange={(e) =>
                      queueField(
                        "tempo_entrega_max",
                        e.target.value === ""
                          ? null
                          : parseInt(e.target.value, 10)
                      )
                    }
                    placeholder="45"
                    className={cn(fieldClass, "max-w-[140px]")}
                  />
                </Row>
              </Panel>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
