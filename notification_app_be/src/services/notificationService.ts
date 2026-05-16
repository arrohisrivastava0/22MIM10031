import { fetchAllNotifications } from "../repository/notificationRepository.js";
import { getTopN } from "../utils/priorityInbox.js";
import { Log } from "../../../logging_middleware/src/logger.js";
import { PrioritizedNotification } from "../domain/notification";

export async function getPriorityInbox(n: number = 10): Promise<PrioritizedNotification[]> {
  await Log("backend", "info", "service", `getPriorityInbox called with n=${n}`);

  const all = await fetchAllNotifications();
  const top = await getTopN(all, n);

  await Log("backend", "info", "service", `Returning ${top.length} priority notifications`);
  return top;
}