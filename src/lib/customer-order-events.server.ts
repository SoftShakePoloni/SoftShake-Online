import "server-only";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import type { createServiceRoleClient } from "@/integrations/supabase/client.server";

/** The privileged subscription stays on the server. No order rows leave this stream. */
export function customerOrderEvents(
  db: ReturnType<typeof createServiceRoleClient>,
  owner: string,
  previousVersion: string,
  signal: AbortSignal,
) {
  const encoder = new TextEncoder();
  let finish = () => {};
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      let stopped = false,
        sequence = 0;
      let heartbeat: ReturnType<typeof setInterval> | undefined = undefined;
      let lifetime: ReturnType<typeof setTimeout> | undefined = undefined;
      const channel = db.channel("customer-orders-" + crypto.randomUUID());
      const send = (event: string, data: unknown, id?: string) => {
        if (!stopped)
          controller.enqueue(
            encoder.encode(
              "retry: 10000\n" +
                (id ? "id: " + id + "\n" : "") +
                "event: " +
                event +
                "\ndata: " +
                JSON.stringify(data) +
                "\n\n",
            ),
          );
      };
      finish = () => {
        if (stopped) return;
        stopped = true;
        sequence++;
        clearInterval(heartbeat);
        clearTimeout(lifetime);
        signal.removeEventListener("abort", finish);
        void db
          .removeChannel(channel)
          .catch(() => {})
          .finally(() => db.realtime.disconnect());
        if (!cancelled) controller.close();
      };
      const snapshot = async () => {
        const version = ++sequence;
        try {
          // One compact revision per connection, not a repeated full history.
          const { data, count, error } = await db
            .from("pedidos")
            .select("id, status, updated_at", { count: "exact" })
            .eq("cliente_id", owner)
            .order("updated_at", { ascending: false, nullsFirst: false })
            .order("id", { ascending: false })
            .limit(1);
          if (stopped || version !== sequence) return;
          if (error) throw error;
          const revision = createHash("sha256")
            .update(JSON.stringify([count, data]))
            .digest("hex");
          if (previousVersion !== revision) send("changed", {}, revision);
          send("ready", { owner }, revision);
        } catch {
          if (!stopped) {
            send("unavailable", {});
            finish();
          }
        }
      };
      channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "pedidos",
            filter: "cliente_id=eq." + owner,
          },
          (payload) => {
            // Unscoped DELETE payloads are recovered by the revision on reconnect.
            // Do not leak even a notification about another customer's activity.
            const row =
              payload.eventType === "DELETE" ? payload.old : payload.new;
            if ((row as { cliente_id?: string }).cliente_id !== owner) return;
            send("changed", {}, "changed-" + crypto.randomUUID());
          },
        )
        .subscribe((status) => {
          if (stopped) return;
          if (status === "SUBSCRIBED") void snapshot();
          else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
            send("unavailable", {});
            finish();
          }
        });
      // Bound the stream to a serverless request; EventSource resumes using Last-Event-ID.
      heartbeat = setInterval(() => {
        if (!stopped) controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 15_000);
      lifetime = setTimeout(() => finish(), 50_000);
      signal.addEventListener("abort", finish, { once: true });
      if (signal.aborted) finish();
    },
    cancel() {
      cancelled = true;
      finish();
    },
  });
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "private, no-store, no-transform",
      "X-Accel-Buffering": "no",
      "X-Customer-Id": owner,
    },
  });
}
