import { NextResponse } from "next/server";
import { createServerClient } from "@/integrations/supabase/client.server";
import { verifyAdmin } from "@/lib/admin/auth";

export async function PATCH(request: Request) {
  try {
    // Verificar se é admin
    const adminVerification = await verifyAdmin();
    if (!adminVerification.isAdmin) {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      );
    }

    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "ID do pedido e status são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar status
    const validStatuses = [
      "pendente",
      "confirmado",
      "preparando",
      "saiu_entrega",
      "entregue",
      "cancelado",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status inválido" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Atualizar o status do pedido
    const { data, error } = await supabase
      .from("pedidos")
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar status:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar status do pedido" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
