// Middleware desabilitado - usando JWT auth direto
// A autenticação é gerenciada via cookies e verificada nas rotas API
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession() {
  // Apenas passa a requisição adiante sem verificação
  // O controle de autenticação é feito via JWT nas API routes
  return NextResponse.next();
}
