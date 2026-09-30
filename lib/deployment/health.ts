import http from "http";

export interface HealthCheckOptions {
  host?: string;
  port: number;
  path?: string;
  timeoutMs?: number;
  retries?: number;
  onLog?: (msg: string) => void;
}

export async function checkContainerHealth({
  host = "127.0.0.1",
  port,
  path = "/",
  timeoutMs = 1500,
  retries = 15,
  onLog,
}: HealthCheckOptions): Promise<boolean> {
  const log = (m: string) => {
    if (onLog) onLog(`[HealthCheck] ${m}`);
  };

  log(`Beginning health check probe on http://${host}:${port}${path} (max ${retries} attempts)...`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    const isOk = await new Promise<boolean>((resolve) => {
      const req = http.get(
        {
          host,
          port,
          path,
          timeout: timeoutMs,
        },
        (res) => {
          // Any response status code (< 500) confirms the application HTTP server is running
          if (res.statusCode && res.statusCode < 500) {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      );

      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    });

    if (isOk) {
      log(`Health check passed on attempt ${attempt}. Container is responding.`);
      return true;
    }

    // Wait 1.5s between retries
    await new Promise((r) => setTimeout(r, 1500));
  }

  log(`Health check timed out after ${retries} attempts.`);
  return false;
}
