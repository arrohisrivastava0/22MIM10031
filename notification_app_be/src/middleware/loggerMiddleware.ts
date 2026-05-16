import { Request, Response, NextFunction } from "express";
import { Log } from "../../../logging_middleware/src/logger.js";

export async function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const start = Date.now();

  await Log(
    "backend", "info", "middleware",
    `Incoming request: ${req.method} ${req.path}`
  );

  res.on("finish", async () => {
    const duration = Date.now() - start;
    await Log(
      "backend", "info", "middleware",
      `Completed: ${req.method} ${req.path} — status ${res.statusCode} in ${duration}ms`
    );
  });

  next();
}