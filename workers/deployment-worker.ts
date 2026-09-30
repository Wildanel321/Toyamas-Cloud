import { popDeploymentJob } from "@/lib/queue/deployment-queue";
import { runDeploymentPipeline } from "@/lib/deployment/engine";

async function startWorker() {
  console.log("==========================================");
  console.log("  Toyamas Cloud - Deployment Worker       ");
  console.log("==========================================");
  console.log("[Worker] Listening for deployment jobs from Redis queue...");

  let isRunning = true;

  process.on("SIGINT", () => {
    console.log("\n[Worker] Gracefully shutting down worker...");
    isRunning = false;
  });

  process.on("SIGTERM", () => {
    console.log("\n[Worker] Received SIGTERM. Exiting...");
    isRunning = false;
  });

  while (isRunning) {
    try {
      const job = await popDeploymentJob(5);
      if (job) {
        console.log(`[Worker] Received job: deploymentId=${job.deploymentId}, projectId=${job.projectId}`);
        await runDeploymentPipeline({
          deploymentId: job.deploymentId,
          projectId: job.projectId,
        });
      }
    } catch (error) {
      console.error("[Worker] Error during job processing loop:", error);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  process.exit(0);
}

if (require.main === module) {
  startWorker().catch((err) => {
    console.error("[Worker Fatal]", err);
    process.exit(1);
  });
}
