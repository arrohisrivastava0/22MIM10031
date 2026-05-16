import express from "express";
import cors from "cors";
import { Log } from "../../logging_middleware/src/logger.js";
import { loggerMiddleware } from "./middleware/loggerMiddleware.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { config } from "./config/config.js";

await Log("backend", "info", "service", "Starting notification_app_be server");

const app = express();

app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

app.use("/api/notifications", notificationRoutes);

app.listen(config.PORT, async () => {
  await Log("backend", "info", "service", `Server running on port ${config.PORT}`);
  console.log(`Server running on http://localhost:${config.PORT}`);
});