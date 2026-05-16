import { Router } from "express";
import { getPriorityNotifications } from "../controllers/notificationController.js";
import { Log } from "../../../logging_middleware/src/logger.js";

const router = Router();

await Log("backend", "info", "route", "Registering notification routes");

// GET /api/notifications?n=10
router.get("/", getPriorityNotifications);

await Log("backend", "info", "route", "Notification routes registered");

export default router;