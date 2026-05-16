import axios from "axios";
import { Notification } from "../domain/notification.js";
import { config } from "../config/config.js";
import { Log } from "../../../logging_middleware/src/logger.js";

export async function fetchAllNotifications(): Promise<Notification[]> {
  await Log("backend", "debug", "repository", "Fetching notifications from evaluation API");

  try {
    const res = await axios.get<{ notifications: Notification[] }>(
      `${config.BASE_URL}/notifications`,
      { headers: { Authorization: `Bearer ${config.TOKEN}` } }
    );

    await Log("backend", "info", "repository", `Fetched ${res.data.notifications.length} notifications`);
    return res.data.notifications;

  } catch (err: any) {
    await Log("backend", "error", "repository", `Failed to fetch notifications: ${err.message}`);
    throw err;
  }
}