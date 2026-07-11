"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe um e-mail válido.")
    .email("Informe um e-mail válido.")
    .max(160),
  password: z.string().min(1, "Senha obrigatória.").max(128),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

type Phase = "idle" | "loading" | "success" | "error";

/** Imagem da loja (coluna esquerda) */
const HERO_IMAGE =
  "https://juzlblaxwybssbyddnwj.supabase.co/storage/v1/object/sign/SoftShake%20Images/Sorveteria/SoftShake_local.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lNmM0NGQwYS0xYmQ0LTRlZmUtYmEzMy02MWIxYmMxYmU2NTYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJTb2Z0U2hha2UgSW1hZ2VzL1NvcnZldGVyaWEvU29mdFNoYWtlX2xvY2FsLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODM3OTEyMjEsImV4cCI6MjA5OTE1MTIyMX0.fvSwYnrCDKc06hbeuzHa7qOB87ncNJ3bXsDYMdvDLZk";

/** Logo tipográfica SoftShake */
const LOGO_TEXT_URL =
  "https://juzlblaxwybssbyddnwj.supabase.co/storage/v1/object/sign/SoftShake%20Images/Sorveteria/softshake_text.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lNmM0NGQwYS0xYmQ0LTRlZmUtYmEzMy02MWIxYmMxYmU2NTYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJTb2Z0U2hha2UgSW1hZ2VzL1NvcnZldGVyaWEvc29mdHNoYWtlX3RleHQucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4Mzc5MTI4NywiZXhwIjoyMDk5MTUxMjg3fQ.YgN8TKxPsJG9N65nD8LGTGjrveREnMS-RgXmF_WNkw4";

const REMEMBER_KEY = "softshake-admin-email";

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  const remember = watch("remember");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setValue("email", saved);
        setValue("remember", true);
      }
    } catch {
      // ignore
    }
  }, [setValue]);

  const busy = phase === "loading" || phase === "success";

  const onSubmit = async (data: LoginForm) => {
    if (busy) return;
    setPhase("loading");
    setFormError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      if (error) {
        setPhase("error");
        // Anti-enumeração: mensagem única
        setFormError("E-mail ou senha inválidos.");
        return;
      }

      try {
        if (data.remember) {
          localStorage.setItem(REMEMBER_KEY, data.email.trim().toLowerCase());
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }
      } catch {
        // ignore
      }

      setPhase("success");
      await new Promise((r) => setTimeout(r, 1100));
      router.push("/admin");
      router.refresh();
    } catch {
      setPhase("error");
      setFormError("E-mail ou senha inválidos.");
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white">
      {/* Overlay de carregamento / sucesso */}
      <AnimatePresence>
        {(phase === "loading" || phase === "success") && (
          <motion.div
            key="login-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex w-full max-w-xs flex-col items-center px-6 text-center">
              {/* Anel animado + logo */}
              <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
                {/* Anel externo */}
                <motion.div
                  className="absolute inset-0 rounded-full border-[3px] border-[#EEE8FA]"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#4C258C] border-r-[#7C3AED]/40"
                  animate={
                    phase === "loading"
                      ? { rotate: 360 }
                      : { rotate: 0, scale: 1.05 }
                  }
                  transition={
                    phase === "loading"
                      ? { duration: 0.9, repeat: Infinity, ease: "linear" }
                      : { duration: 0.35 }
                  }
                />
                {/* Centro */}
                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#F8F5FC]">
                  <AnimatePresence mode="wait">
                    {phase === "loading" ? (
                      <motion.div
                        key="logo-load"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative h-10 w-[72px]"
                      >
                        <Image
                          src={LOGO_TEXT_URL}
                          alt=""
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="ok"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 320,
                          damping: 18,
                        }}
                      >
                        <CheckCircle2 className="h-10 w-10 text-[#4C258C]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {phase === "loading" ? (
                  <motion.div
                    key="txt-loading"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="space-y-2"
                  >
                    <p className="text-base font-semibold text-[#111827]">
                      Autenticando…
                    </p>
                    <p className="text-sm text-[#6B7280]">
                      Validando suas credenciais
                    </p>
                    {/* Barra de progresso indeterminada */}
                    <div className="mx-auto mt-4 h-1 w-40 overflow-hidden rounded-full bg-[#EEE8FA]">
                      <motion.div
                        className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#4C258C] to-[#7C3AED]"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{
                          duration: 1.1,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="txt-ok"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <p className="text-base font-semibold text-[#111827]">
                      Acesso liberado
                    </p>
                    <p className="text-sm text-[#6B7280]">
                      Entrando no painel administrativo…
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="grid min-h-screen w-full lg:grid-cols-[55%_45%]"
      >
        {/* ── Coluna esquerda: imagem ── */}
        <div className="relative hidden min-h-screen overflow-hidden lg:block">
          <Image
            src={HERO_IMAGE}
            alt="SoftShake — açaí e sobremesas artesanais"
            fill
            priority
            className="object-cover object-center"
            sizes="55vw"
            quality={90}
          />
          {/* Overlay sutil */}
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4C258C]/50 via-transparent to-black/20" />

          <div className="absolute bottom-0 left-0 right-0 p-10 xl:p-12">
            <p className="text-sm font-medium tracking-wide text-white/80">
              SoftShake
            </p>
            <p className="mt-1 max-w-sm text-lg font-semibold leading-snug text-white">
              Gestão da loja com a mesma qualidade dos nossos produtos.
            </p>
          </div>
        </div>

        {/* ── Coluna direita: formulário ── */}
        <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
            className="w-full max-w-[450px]"
          >
            {/* Logo oficial (imagem) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="mb-8 flex justify-center"
            >
              <div className="relative h-[68px] w-[200px] sm:h-[76px] sm:w-[300px]">
                <Image
                  src={LOGO_TEXT_URL}
                  alt="SoftShake"
                  fill
                  priority
                  className="object-contain object-center"
                  sizes="300px"
                  unoptimized
                />
              </div>
            </motion.div>

            <div className="mb-7 text-center sm:text-left">
              <h1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-[28px]">
                Painel Administrativo
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                Entre com seu e-mail e senha para acessar o painel
                administrativo da SoftShake.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              {/* E-mail */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-medium text-[#374151]"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    disabled={busy}
                    placeholder="Digite seu e-mail"
                    className={cn(
                      "h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-[#111827]",
                      "placeholder:text-[#9CA3AF] outline-none transition-all duration-150",
                      "focus:border-[#4C258C] focus:ring-2 focus:ring-[#4C258C]/15",
                      "disabled:opacity-60",
                      errors.email
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-[#E5E7EB]"
                    )}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-medium text-[#374151]"
                >
                  Senha
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={busy}
                    placeholder="Digite sua senha"
                    className={cn(
                      "h-12 w-full rounded-xl border bg-white pl-11 pr-12 text-sm text-[#111827]",
                      "placeholder:text-[#9CA3AF] outline-none transition-all duration-150",
                      "focus:border-[#4C258C] focus:ring-2 focus:ring-[#4C258C]/15",
                      "disabled:opacity-60",
                      errors.password
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-[#E5E7EB]"
                    )}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={busy}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#9CA3AF] transition-colors duration-150 hover:bg-[#F3F4F6] hover:text-[#4C258C]"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Opções */}
              <div className="flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 select-none">
                  <Checkbox
                    checked={Boolean(remember)}
                    onCheckedChange={(v) =>
                      setValue("remember", v === true, {
                        shouldDirty: true,
                      })
                    }
                    disabled={busy}
                    className="border-[#D1D5DB] data-[state=checked]:border-[#4C258C] data-[state=checked]:bg-[#4C258C]"
                  />
                  <span className="text-sm text-[#4B5563]">
                    Lembrar de mim
                  </span>
                </label>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    // Placeholder — recuperação via Supabase resetPasswordForEmail no futuro
                    setFormError(
                      "Fale com o administrador do sistema para redefinir a senha."
                    );
                  }}
                  className="text-sm font-medium text-[#4C258C] transition-colors duration-150 hover:text-[#5E35B1] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>

              {/* Erro global */}
              <AnimatePresence mode="wait">
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botão principal */}
              <button
                type="submit"
                disabled={busy}
                className={cn(
                  "relative flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all duration-150",
                  "bg-[#4C258C] hover:bg-[#3d1d70] active:bg-[#351966]",
                  "disabled:cursor-not-allowed disabled:opacity-70",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C258C]/40 focus-visible:ring-offset-2"
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {phase === "loading" && (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-2"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Entrando…
                    </motion.span>
                  )}
                  {phase === "success" && (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Acesso liberado
                    </motion.span>
                  )}
                  {(phase === "idle" || phase === "error") && (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Entrar
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Botão secundário */}
              <Link
                href="/"
                className={cn(
                  "flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#374151]",
                  "transition-colors duration-150 hover:border-[#D4C4F0] hover:bg-[#F9FAFB] hover:text-[#4C258C]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C258C]/20"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o site
              </Link>
            </form>

            <footer className="mt-10 text-center text-[11px] text-[#9CA3AF]">
              <p>© 2026 SoftShake</p>
              <p className="mt-0.5">Versão 1.0</p>
            </footer>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
