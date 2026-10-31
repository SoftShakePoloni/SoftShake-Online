import { fetchMenu } from "@/data/cardapio";
import { apiOk, apiServerError } from "@/lib/security/api-response";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { withApiGuard } from "@/lib/security/with-api-guard";

/** Cardápio público: a conexão com o banco fica exclusivamente no servidor. */
export const GET = withApiGuard(
  { methods: ["GET"], rateLimit: RATE_LIMITS.apiStrict, checkOrigin: false },
  async () => {
    try {
      const categorias = await fetchMenu();
      return apiOk(
        { categorias },
        200,
        { "Cache-Control": "no-store" }
      );
    } catch (error) {
      return apiServerError(error);
    }
  }
);
