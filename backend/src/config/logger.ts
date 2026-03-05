export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

function emit(entry: LogEntry): void {
  const target = entry.level === "error" ? process.stderr : process.stdout;
  target.write(JSON.stringify(entry) + "\n");
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    emit({ timestamp: new Date().toISOString(), level: "info", message, meta });
  },
  warn(message: string, meta?: Record<string, unknown>) {
    emit({ timestamp: new Date().toISOString(), level: "warn", message, meta });
  },
  error(message: string, meta?: Record<string, unknown>) {
    emit({ timestamp: new Date().toISOString(), level: "error", message, meta });
  },
  debug(message: string, meta?: Record<string, unknown>) {
    if (process.env.LOG_LEVEL === "debug") {
      emit({ timestamp: new Date().toISOString(), level: "debug", message, meta });
    }
  },
};
