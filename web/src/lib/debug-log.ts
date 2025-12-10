import { promises as fs } from "fs";
import path from "path";

const LOG_PATH = path.join(process.cwd(), ".cursor", "debug.log");

export async function debugLog(data: {
  location: string;
  message: string;
  data?: any;
  timestamp?: number;
  sessionId?: string;
  runId?: string;
  hypothesisId?: string;
}) {
  try {
    const logEntry = {
      ...data,
      timestamp: data.timestamp || Date.now(),
      sessionId: data.sessionId || "debug-session",
      runId: data.runId || "run1",
    };
    
    await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
    await fs.appendFile(LOG_PATH, JSON.stringify(logEntry) + "\n");
  } catch (error) {
    // Silently fail - don't break the app if logging fails
    console.error("Debug log failed:", error);
  }
}

