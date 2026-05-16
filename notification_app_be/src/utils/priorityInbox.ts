import { Notification, PrioritizedNotification } from "../domain/notification.js";
import { Log } from "../../../logging_middleware/src/logger.js";

const TYPE_WEIGHT: Record<string, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

export function computeScore(n: Notification): number {
  const ts = new Date(n.Timestamp).getTime() / 1000;
  return TYPE_WEIGHT[n.Type] * 1_000_000 + ts;
}

export async function getTopN(
  notifications: Notification[],
  n: number = 10
): Promise<PrioritizedNotification[]> {
  await Log("backend", "debug", "utils", `Computing top ${n} priority notifications from ${notifications.length} total`);

  const scored: PrioritizedNotification[] = notifications.map((notif) => ({
    ...notif,
    score: computeScore(notif),
  }));

  const top = scored.sort((a, b) => b.score - a.score).slice(0, n);

  await Log("backend", "info", "utils", `Top ${n} notifications computed successfully`);
  return top;
}