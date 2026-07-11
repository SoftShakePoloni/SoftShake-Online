/**
 * RBAC mínimo SoftShake.
 * Hoje: cliente (JWT session) vs admin (Supabase Auth).
 * Extensível para gerente/atendente via claim ou tabela admins.role.
 */

export type AppRole = "cliente" | "admin" | "gerente" | "atendente";

export const ROLE_PERMISSIONS: Record<AppRole, readonly string[]> = {
  cliente: [
    "pedido:create",
    "pedido:read_own",
    "perfil:update_own",
    "endereco:manage_own",
  ],
  atendente: [
    "pedido:read",
    "pedido:update_status",
    "catalogo:read",
  ],
  gerente: [
    "pedido:read",
    "pedido:update_status",
    "catalogo:read",
    "catalogo:write",
    "relatorio:read",
    "cliente:read",
  ],
  admin: [
    "pedido:read",
    "pedido:update_status",
    "catalogo:read",
    "catalogo:write",
    "relatorio:read",
    "cliente:read",
    "cliente:write",
    "config:write",
    "admin:manage",
  ],
} as const;

export type Permission = (typeof ROLE_PERMISSIONS)[AppRole][number];

export function hasPermission(role: AppRole, permission: Permission): boolean {
  const list = ROLE_PERMISSIONS[role] ?? [];
  return (list as readonly string[]).includes(permission);
}

/** Por enquanto todo usuário Supabase Auth no admin é tratado como admin */
export function resolveAdminRole(
  meta?: { role?: string } | null
): AppRole {
  const r = meta?.role?.toLowerCase();
  if (r === "gerente") return "gerente";
  if (r === "atendente") return "atendente";
  return "admin";
}
