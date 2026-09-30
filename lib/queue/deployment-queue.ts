import Redis from "ioredis";
import { runDeploymentPipeline } from "@/lib/deployment/engine";

const QUEUE_KEY = "toyamas:deployments:queue";
let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  try {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    return redisClient;
  } catch {
    return null;
  }
}

export interface DeploymentJob {
  deploymentId: string;
  projectId: string;
  createdAt: string;
}

export async function queueDeployment(
  job: DeploymentJob
): Promise<{ queued: boolean; mode: "redis" | "in-memory" }> {
  const redis = getRedis();

  if (redis) {
    try {
      if (redis.status === "wait" || redis.status === "close") {
        await redis.connect();
      }
      await redis.lpush(QUEUE_KEY, JSON.stringify(job));
      return { queued: true, mode: "redis" };
    } catch {
      // Fallback to in-process execution if Redis is not currently reachable
    }
  }

  // Graceful fallback: run asynchronously in Node process
  setTimeout(() => {
    runDeploymentPipeline({
      deploymentId: job.deploymentId,
      projectId: job.projectId,
    }).catch((err) => {
      console.error("[Queue Fallback Error]", err);
    });
  }, 100);

  return { queued: true, mode: "in-memory" };
}

export async function popDeploymentJob(
  timeoutSeconds = 5
): Promise<DeploymentJob | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    if (redis.status === "wait" || redis.status === "close") {
      await redis.connect();
    }
    const result = await redis.brpop(QUEUE_KEY, timeoutSeconds);
    if (result && result[1]) {
      return JSON.parse(result[1]) as DeploymentJob;
    }
    return null;
  } catch {
    return null;
  }
}
