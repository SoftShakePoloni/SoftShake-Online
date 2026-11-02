import { fetchMenu } from "@/data/cardapio";
import { publicJson } from "@/lib/public-json.server";
import { apiServerError } from "@/lib/security/api-response";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { withApiGuard } from "@/lib/security/with-api-guard";
export const GET = withApiGuard(
  { methods: ["GET"], rateLimit: RATE_LIMITS.apiStrict, checkOrigin: false },
  async (request) => {
    try {
      return publicJson(request, { categorias: await fetchMenu() });
    } catch (error) {
      return apiServerError(error);
    }
  },
);
