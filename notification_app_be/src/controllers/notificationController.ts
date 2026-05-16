import { Request, Response } from "express";
import { getPriorityInbox } from "../services/notificationService.js";
import { Log } from "../../../logging_middleware/src/logger.js";

export async function getPriorityNotifications(req: Request, res: Response): Promise<void> {
  await Log("backend", "info", "controller", "getPriorityNotifications handler called");

  try {
    const n = req.query.n ? parseInt(req.query.n as string) : 10;
    await Log("backend", "debug", "controller", `Requesting top ${n} notifications`);

    const notifications = await getPriorityInbox(n);

    await Log("backend", "info", "controller", `Responding with ${notifications.length} notifications`);
    res.status(200).json({ notifications });

  } catch (err: any) {
    await Log("backend", "error", "controller", `Handler failed: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
}