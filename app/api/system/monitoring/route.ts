import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getSystemMetrics } from "@/lib/system/info";
import { getDockerClient, checkDockerConnection } from "@/lib/docker/client";
import { getContainerStats } from "@/lib/docker/container";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hostMetrics = getSystemMetrics();
    const dockerStatus = await checkDockerConnection();

    // Query active projects with containers
    const runningProjects = await prisma.project.findMany({
      where: {
        status: "RUNNING",
        containerId: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        runtime: true,
        containerId: true,
        containerName: true,
        cpuLimit: true,
        memoryLimit: true,
      },
    });

    const containerStatsList = [];

    if (dockerStatus.connected) {
      for (const p of runningProjects) {
        if (!p.containerId) continue;
        const stats = await getContainerStats(p.containerId);
        containerStatsList.push({
          projectId: p.id,
          projectName: p.name,
          slug: p.slug,
          runtime: p.runtime,
          containerId: p.containerId,
          containerName: p.containerName || `toyamas-${p.slug}`,
          cpuLimit: p.cpuLimit,
          memoryLimitMB: p.memoryLimit,
          stats: stats || {
            cpuPercent: 0,
            memoryUsageBytes: 0,
            memoryLimitBytes: p.memoryLimit * 1024 * 1024,
            memoryPercent: 0,
            networkRxBytes: 0,
            networkTxBytes: 0,
            pidsCount: 0,
          },
        });
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      host: hostMetrics,
      docker: dockerStatus,
      containers: containerStatsList,
    });
  } catch (error) {
    console.error("[API /system/monitoring GET] Error:", error);
    return NextResponse.json({ error: "Failed to collect metrics" }, { status: 500 });
  }
}
