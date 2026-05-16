import axios from "axios";
import { Log } from "../../logging_middleware/src/logger.js";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhcnJvaGlzcml2YXN0YXZhMEBnbWFpbC5jb20iLCJleHAiOjE3Nzg5MzUzMTYsImlhdCI6MTc3ODkzNDQxNiwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6ImQ3NzBiODA1LTE1NDEtNGYyZi04Yzg3LTE1MzU0ZDI5MjZlOSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImFycm9oaSBzcml2YXN0YXZhIiwic3ViIjoiNWE2NDJhNDQtOGZmOC00YTVjLTllY2YtOTJjNzE0ZGQ2M2QwIn0sImVtYWlsIjoiYXJyb2hpc3JpdmFzdGF2YTBAZ21haWwuY29tIiwibmFtZSI6ImFycm9oaSBzcml2YXN0YXZhIiwicm9sbE5vIjoiMjJtaW0xMDAzMSIsImFjY2Vzc0NvZGUiOiJTZkZ1V2ciLCJjbGllbnRJRCI6IjVhNjQyYTQ0LThmZjgtNGE1Yy05ZWNmLTkyYzcxNGRkNjNkMCIsImNsaWVudFNlY3JldCI6IlFkRktXdVFVSnljQ2preHEifQ.hnsgrhVwUK5BXQJJsQnJa2NWq2hQvrrf2Jr4XraMNxI";
const BASE_URL = "http://4.224.186.213/evaluation-service";
const headers = { Authorization: `Bearer ${TOKEN}` };

interface Depot {
  ID: number;
  MechanicHours: number;
}

interface Vehicle {
  TaskID: string;
  Duration: number;
  Impact: number;
}

interface KnapsackResult {
  selected: Vehicle[];
  totalImpact: number;
}

// 0/1 Knapsack dynamic programming solution
function knapsack(vehicles: Vehicle[], capacity: number): KnapsackResult {
  const n = vehicles.length;

  // Build DP table
  const dp: number[][] = Array.from(
    { length: n + 1 },
    () => new Array(capacity + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    const { Duration, Impact } = vehicles[i - 1];
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];
      if (Duration <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - Duration] + Impact);
      }
    }
  }

  // Backtrack to find which vehicles were selected
  const selected: Vehicle[] = [];
  let w = capacity;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(vehicles[i - 1]);
      w -= vehicles[i - 1].Duration;
    }
  }

  return { selected, totalImpact: dp[n][capacity] };
}

async function main() {
  await Log("backend", "info", "service", "Vehicle Maintenance Scheduler starting");

  try {
    // Fetch depots
    await Log("backend", "debug", "service", "Fetching depots from evaluation API");
    const depotsRes = await axios.get<{ depots: Depot[] }>(
      `${BASE_URL}/depots`,
      { headers }
    );
    const depots = depotsRes.data.depots;
    await Log("backend", "info", "service", `Successfully fetched ${depots.length} depots`);

    // Fetch vehicles
    await Log("backend", "debug", "service", "Fetching vehicles from evaluation API");
    const vehiclesRes = await axios.get<{ vehicles: Vehicle[] }>(
      `${BASE_URL}/vehicles`,
      { headers }
    );
    const vehicles = vehiclesRes.data.vehicles;
    await Log("backend", "info", "service", `Successfully fetched ${vehicles.length} vehicles`);

    // Solve for each depot
    for (const depot of depots) {
      await Log(
        "backend", "debug", "service",
        `Running knapsack for depot ${depot.ID} with budget ${depot.MechanicHours} mechanic-hours`
      );

      const result = knapsack(vehicles, depot.MechanicHours);

      console.log(`\n========================================`);
      console.log(`Depot ID     : ${depot.ID}`);
      console.log(`Budget       : ${depot.MechanicHours} mechanic-hours`);
      console.log(`Total Impact : ${result.totalImpact}`);
      console.log(`Tasks Selected (${result.selected.length}):`);
      result.selected.forEach((v) => {
        console.log(`  TaskID: ${v.TaskID} | Duration: ${v.Duration}h | Impact: ${v.Impact}`);
      });

      await Log(
        "backend", "info", "service",
        `Depot ${depot.ID} result: ${result.selected.length} tasks selected, total impact = ${result.totalImpact}`
      );
    }

    await Log("backend", "info", "service", "Vehicle Maintenance Scheduler completed successfully");

  } catch (err: any) {
    await Log("backend", "fatal", "service", `Scheduler crashed: ${err.message}`);
    console.error("Fatal error:", err);
  }
}

main();