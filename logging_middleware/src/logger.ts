import axios from "axios";

const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhcnJvaGlzcml2YXN0YXZhMEBnbWFpbC5jb20iLCJleHAiOjE3Nzg5MzUzMTYsImlhdCI6MTc3ODkzNDQxNiwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6ImQ3NzBiODA1LTE1NDEtNGYyZi04Yzg3LTE1MzU0ZDI5MjZlOSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImFycm9oaSBzcml2YXN0YXZhIiwic3ViIjoiNWE2NDJhNDQtOGZmOC00YTVjLTllY2YtOTJjNzE0ZGQ2M2QwIn0sImVtYWlsIjoiYXJyb2hpc3JpdmFzdGF2YTBAZ21haWwuY29tIiwibmFtZSI6ImFycm9oaSBzcml2YXN0YXZhIiwicm9sbE5vIjoiMjJtaW0xMDAzMSIsImFjY2Vzc0NvZGUiOiJTZkZ1V2ciLCJjbGllbnRJRCI6IjVhNjQyYTQ0LThmZjgtNGE1Yy05ZWNmLTkyYzcxNGRkNjNkMCIsImNsaWVudFNlY3JldCI6IlFkRktXdVFVSnljQ2preHEifQ.hnsgrhVwUK5BXQJJsQnJa2NWq2hQvrrf2Jr4XraMNxI";
const LOG_URL = "http://4.224.186.213/evaluation-service/logs";

type Stack = "backend" | "frontend";
type Level = "debug" | "info" | "warn" | "error" | "fatal";
type Package =
  | "cache"
  | "controller"
  | "cron_job"
  | "db"
  | "domain"
  | "handler"
  | "repository"
  | "route"
  | "service"
  | "auth"
  | "config"
  | "middleware"
  | "utils";

export async function Log(
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string
): Promise<void> {
  try {
    await axios.post(
      LOG_URL,
      { stack, level, package: pkg, message },
      {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("[Logger Error]", err?.response?.data?.message ?? err.message);
  }
}