import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSystemMetrics } from "@/lib/system/info";
import Redis from "ioredis";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "unknown";
  let dbLatencyMs = 0;
  let redisStatus = "unknown";
  let redisLatencyMs = 0;

  // 1. Check PostgreSQL Database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "connected";
  } catch (err: unknown) {
    dbStatus = "error";
    console.error("[Health] Database check failed:", err);
  }

  // 2. Check Redis (Optional / Non-blocking)
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  try {
    const redisStart = Date.now();
    const redis = new Redis(redisUrl, {
      connectTimeout: 1000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await redis.connect();
    await redis.ping();
    redisLatencyMs = Date.now() - redisStart;
    redisStatus = "connected";
    redis.disconnect();
  } catch {
    redisStatus = "disconnected";
  }

  const systemMetrics = getSystemMetrics();
  const totalResponseTimeMs = Date.now() - startTime;

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      redis: {
        status: redisStatus,
        latencyMs: redisLatencyMs,
      },
    },
    system: systemMetrics,
    totalResponseTimeMs,
  });
}
