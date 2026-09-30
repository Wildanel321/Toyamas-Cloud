import tar from "tar-fs";
import { getDockerClient } from "@/lib/docker/client";

export interface BuildImageOptions {
  workspacePath: string;
  imageTag: string;
  onLog: (line: string) => void;
}

export async function buildDockerImage({
  workspacePath,
  imageTag,
  onLog,
}: BuildImageOptions): Promise<string> {
  const docker = getDockerClient();
  onLog(`[Builder] Packing build context from workspace...`);

  const tarStream = tar.pack(workspacePath, {
    ignore: (name) => {
      const base = name.split(/[\\/]/).pop();
      return Boolean(
        base === "node_modules" ||
        base === ".git" ||
        base === ".next" ||
        base === "dist" ||
        base === ".env" ||
        base === "vendor"
      );
    },
  });

  onLog(`[Builder] Sending context to Docker Engine build daemon...`);

  return new Promise((resolve, reject) => {
    docker.buildImage(
      tarStream as any,
      { t: imageTag, rm: true },
      (err, stream) => {
        if (err) {
          onLog(`[Builder Error] ${err.message}`);
          return reject(err);
        }

        if (!stream) {
          const msg = "Failed to initiate Docker build stream";
          onLog(`[Builder Error] ${msg}`);
          return reject(new Error(msg));
        }

        docker.modem.followProgress(
          stream,
          (buildErr, output) => {
            if (buildErr) {
              onLog(`[Builder Error] ${buildErr.message}`);
              return reject(buildErr);
            }

            // Check if any error in output stream
            if (output && Array.isArray(output)) {
              for (const item of output) {
                if (item.error) {
                  onLog(`[Builder Error] ${item.error}`);
                  return reject(new Error(item.error));
                }
              }
            }

            onLog(`[Builder] Docker image ${imageTag} built successfully.`);
            resolve(imageTag);
          },
          (progressEvent) => {
            if (progressEvent.stream) {
              const text = progressEvent.stream.trim();
              if (text) onLog(text);
            } else if (progressEvent.status) {
              onLog(`[Docker] ${progressEvent.status} ${progressEvent.progress || ""}`);
            }
          }
        );
      }
    );
  });
}
