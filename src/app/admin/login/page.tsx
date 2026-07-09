"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  LayoutDashboard,
  Package,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LoginPhase = "idle" | "authenticating" | "success" | "error";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Painel completo",
    description: "Pedidos, clientes e indicadores em um só lugar",
  },
  {
    icon: Package,
    title: "Cardápio ao vivo",
    description: "Produtos e adicionais com status em tempo real",
  },
  {
    icon: TrendingUp,
    title: "Visão do negócio",
    description: "Receitas e performance para decidir com clareza",
  },
];

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [phase, setPhase] = useState<LoginPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoading = phase === "authenticating" || phase === "success";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setPhase("authenticating");
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setPhase("error");
        setError(
          authError.message === "Invalid login credentials"
            ? "E-mail ou senha incorretos. Verifique e tente novamente."
            : authError.message
        );
        return;
      }

      setPhase("success");
      // Pequeno delay para a animação de sucesso
      await new Promise((r) => setTimeout(r, 900));
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setPhase("error");
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro inesperado"
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0618]">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#4C258C]/40 blur-[100px] animate-pulse" />
        <div
          className="absolute -bottom-40 -right-20 h-[480px] w-[480px] rounded-full bg-[#7C3AED]/30 blur-[120px]"
          style={{ animation: "pulse 4s ease-in-out infinite" }}
        />
        <div className="absolute left-1/2 top-1/3 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-[#EC4899]/15 blur-[90px]" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div
        className={cn(
          "relative z-10 grid min-h-screen transition-all duration-700 lg:grid-cols-2",
          mounted ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Left brand panel */}
        <section className="relative hidden flex-col justify-between p-10 lg:flex xl:p-14">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#4C258C] shadow-lg shadow-purple-900/40">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">
                SoftShake
              </p>
              <p className="text-xs text-white/50">Admin Console</p>
            </div>
          </div>

          <div className="max-w-lg space-y-8">
            <div
              className={cn(
                "space-y-4 transition-all duration-700 delay-150",
                mounted
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              )}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Área restrita · Acesso seguro
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Gerencie sua loja com{" "}
                <span className="bg-gradient-to-r from-[#C4B5FD] to-[#F0ABFC] bg-clip-text text-transparent">
                  clareza e estilo
                </span>
              </h1>
              <p className="text-base leading-relaxed text-white/60">
                Pedidos, cardápio, clientes e configurações em um painel moderno
                pensado para o dia a dia da SoftShake.
              </p>
            </div>

            <div className="space-y-3">
              {FEATURES.map((feature, index) => (
                <div
                  key={feature.title}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition-all duration-700",
                    mounted
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-4 opacity-0"
                  )}
                  style={{ transitionDelay: `${250 + index * 100}ms` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C258C] to-[#7C3AED]">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{feature.title}</p>
                    <p className="text-sm text-white/55">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/35">
            © {new Date().getFullYear()} SoftShake · Painel administrativo
          </p>
        </section>

        {/* Right form panel */}
        <section className="flex items-center justify-center p-6 sm:p-10">
          <div
            className={cn(
              "relative w-full max-w-[440px] transition-all duration-700 delay-100",
              mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            )}
          >
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#4C258C]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">SoftShake</p>
                <p className="text-xs text-white/50">Admin Console</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/95 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
              {/* Success / loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm animate-in fade-in duration-300">
                  {phase === "authenticating" ? (
                    <div className="flex flex-col items-center gap-5">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-[#EEE8FA]" />
                        <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-[#4C258C]" />
                        <div className="absolute inset-2 flex items-center justify-center">
                          <ShieldCheck className="h-6 w-6 text-[#4C258C] animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-[#111827]">
                          Autenticando...
                        </p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          Validando suas credenciais
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-[#4C258C]"
                            style={{
                              animation: "bounce 1s ease-in-out infinite",
                              animationDelay: `${i * 150}ms`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                        <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-[#111827]">
                          Acesso liberado!
                        </p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          Entrando no painel...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-7">
                <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
                  Bem-vindo de volta
                </h2>
                <p className="mt-1.5 text-sm text-[#6B7280]">
                  Entre com suas credenciais de administrador
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-[#374151]"
                  >
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@softshake.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                      if (phase === "error") setPhase("idle");
                    }}
                    required
                    disabled={isLoading}
                    className="h-12 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] px-4 text-[#111827] transition-all focus-visible:border-[#4C258C] focus-visible:ring-[#4C258C]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-[#374151]"
                  >
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                        if (phase === "error") setPhase("idle");
                      }}
                      required
                      disabled={isLoading}
                      className="h-12 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] px-4 pr-11 text-[#111827] transition-all focus-visible:border-[#4C258C] focus-visible:ring-[#4C258C]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#4C258C]"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                    disabled={isLoading}
                    className="border-[#D1D5DB] data-[state=checked]:border-[#4C258C] data-[state=checked]:bg-[#4C258C]"
                  />
                  <Label
                    htmlFor="remember"
                    className="cursor-pointer text-sm font-medium text-[#4B5563]"
                  >
                    Manter-me conectado
                  </Label>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#4C258C] to-[#7C3AED] text-base font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-60"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar no painel"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-xs text-[#9CA3AF]">
                Acesso exclusivo para administradores autorizados
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
