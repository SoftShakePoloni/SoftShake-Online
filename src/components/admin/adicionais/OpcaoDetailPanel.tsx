"use client";

import { useState, useCallback, useEffect } from "react";
import { Opcao, GrupoOpcoes } from "@/types/adicional";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateOpcao, deleteOpcao } from "@/actions/admin/adicionais";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OpcaoDetailPanelProps {
  opcao: Opcao;
  onUpdate: (opcao: Opcao) => void;
  onDelete: (opcaoId: string | number) => void;
}

export function OpcaoDetailPanel({
  opcao: opcaoInicial,
  onUpdate,
  onDelete,
}: OpcaoDetailPanelProps) {
  const [opcao, setOpcao] = useState(opcaoInicial);
  const [grupos, setGrupos] = useState<GrupoOpcoes[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const supabase = createClient();

  // Atualizar estado local quando opção mudar
  useEffect(() => {
    setOpcao(opcaoInicial);
  }, [opcaoInicial]);

  // Buscar grupos
  useEffect(() => {
    const fetchGrupos = async () => {
      const { data } = await supabase
        .from("grupos_opcoes")
        .select("*")
        .order("nome");
      if (data) setGrupos(data);
    };
    fetchGrupos();
  }, [supabase]);

  const handleSave = useCallback(
    async (dadosAtualizados: Partial<Opcao>) => {
      const snapshot = opcao;
      const optimistic = { ...opcao, ...dadosAtualizados } as Opcao;
      setOpcao(optimistic);
      onUpdate(optimistic);
      setIsSaving(true);

      try {
        const data = await updateOpcao(opcao.id, dadosAtualizados);

        const row = data as Opcao & { grupo?: Opcao["grupo"] };
        const opcaoAtualizada: Opcao = {
          ...row,
          grupo: row.grupo,
        };

        setOpcao(opcaoAtualizada);
        onUpdate(opcaoAtualizada);
        toast.success("Adicional atualizado");
      } catch (error: unknown) {
        console.error("Erro completo:", error);
        setOpcao(snapshot);
        onUpdate(snapshot);
        toast.error(
          error instanceof Error ? error.message : "Erro ao atualizar adicional"
        );
      } finally {
        setIsSaving(false);
      }
    },
    [opcao, onUpdate]
  );

  const handleToggleDisponibilidade = async () => {
    if (isSaving) return;
    const novoStatus = !opcao.esta_disponivel;
    await handleSave({ esta_disponivel: novoStatus });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteOpcao(opcao.id);
      onDelete(opcao.id);
      setShowDeleteDialog(false);
      toast.success("Adicional excluído");
    } catch (error: unknown) {
      console.error("Erro ao excluir opção:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir adicional"
      );
    }
  };

  return (
    <div className="flex-1 h-full bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#EEE8FA] flex items-center justify-center">
              <Package className="w-6 h-6 text-[#4C258C]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111827]">
                {opcao.nome}
              </h1>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span>ID: {String(opcao.id).slice(0, 8)}</span>
                {opcao.grupo && (
                  <>
                    <span>•</span>
                    <span>{opcao.grupo.nome}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2",
                opcao.esta_disponivel
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  opcao.esta_disponivel ? "bg-emerald-500" : "bg-red-500"
                )}
              />
              {opcao.esta_disponivel ? "Disponível" : "Esgotado"}
            </div>

            {/* Toggle Disponibilidade */}
            <Button
              variant={opcao.esta_disponivel ? "outline" : "default"}
              size="sm"
              onClick={handleToggleDisponibilidade}
              disabled={isSaving}
              className={cn(
                !opcao.esta_disponivel && "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {opcao.esta_disponivel ? "Marcar como Esgotado" : "Marcar como Disponível"}
            </Button>

            {isSaving && (
              <Loader2 className="w-4 h-4 text-[#6B7280] animate-spin" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[#111827]">
              Informações Básicas
            </h3>

            {/* Nome */}
            <div>
              <Label htmlFor="nome" className="text-sm text-[#6B7280] mb-2 block">
                Nome do Adicional
              </Label>
              <Input
                id="nome"
                value={opcao.nome}
                onChange={(e) => {
                  setOpcao({ ...opcao, nome: e.target.value });
                }}
                onBlur={() => handleSave({ nome: opcao.nome })}
                className="h-11"
                disabled={isSaving}
              />
            </div>

            {/* Preço e Grupo */}
            <div className="grid grid-cols-2 gap-4">
              {/* Preço */}
              <div>
                <Label htmlFor="preco" className="text-sm text-[#6B7280] mb-2 block">
                  Preço Adicional (R$)
                </Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  min="0"
                  value={opcao.preco_adicional}
                  onChange={(e) => {
                    setOpcao({
                      ...opcao,
                      preco_adicional: parseFloat(e.target.value) || 0,
                    });
                  }}
                  onBlur={() => handleSave({ preco_adicional: opcao.preco_adicional })}
                  className="h-11"
                  disabled={isSaving}
                />
              </div>

              {/* Grupo */}
              <div>
                <Label htmlFor="grupo" className="text-sm text-[#6B7280] mb-2 block">
                  Grupo de Opções
                </Label>
                <Select
                  value={String(opcao.grupo_id)}
                  onValueChange={(value) => {
                    const numValue = parseInt(value);
                    setOpcao({ ...opcao, grupo_id: numValue });
                    handleSave({ grupo_id: numValue });
                  }}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {grupos.map((grupo) => (
                      <SelectItem key={grupo.id} value={String(grupo.id)}>
                        {grupo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ordem */}
            <div>
              <Label htmlFor="ordem" className="text-sm text-[#6B7280] mb-2 block">
                Ordem de Exibição
              </Label>
              <Input
                id="ordem"
                type="number"
                min="0"
                value={opcao.ordem}
                onChange={(e) => {
                  setOpcao({
                    ...opcao,
                    ordem: parseInt(e.target.value) || 0,
                  });
                }}
                onBlur={() => handleSave({ ordem: opcao.ordem })}
                className="h-11"
                disabled={isSaving}
              />
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Adicional</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este adicional? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-[#F8F9FC] rounded-xl p-4 my-4">
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center">
                <Package className="w-8 h-8 text-[#9CA3AF]" />
              </div>
              <div>
                <p className="font-semibold text-[#111827]">{opcao.nome}</p>
                <p className="text-sm text-[#6B7280]">
                  {opcao.grupo?.nome}
                </p>
                <p className="text-sm font-bold text-[#4C258C]">
                  + R$ {opcao.preco_adicional.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
