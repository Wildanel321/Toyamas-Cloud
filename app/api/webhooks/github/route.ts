import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { queueDeployment } from "@/lib/queue/deployment-queue";

function verifyGitHubSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = signatureHeader.replace("sha256=", "");
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    const event = request.headers.get("x-github-event");

    // Only process push events
    if (event !== "push" && event !== "ping") {
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    if (event === "ping") {
      return NextResponse.json({ message: "Pong! Webhook configured successfully." });
    }

    let payload: {
      ref?: string;
      repository?: { clone_url?: string; html_url?: string; full_name?: string };
      head_commit?: { id?: string; message?: string; author?: { name?: string } };
    };

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const branchRef = payload.ref; // e.g. refs/heads/main
    if (!branchRef) {
      return NextResponse.json({ error: "No branch ref in payload" }, { status: 400 });
    }

    const branchName = branchRef.replace("refs/heads/", "");
    const repoUrl = payload.repository?.html_url || payload.repository?.clone_url;

    if (!repoUrl) {
      return NextResponse.json({ error: "No repository URL found" }, { status: 400 });
    }

    // Find all matching projects with this repo URL and branch with autoDeploy = true
    const projects = await prisma.project.findMany({
      where: {
        autoDeploy: true,
        branch: branchName,
      },
    });

    // Filter projects matching the repo URL
    const matchingProjects = projects.filter((p) => {
      const normalizedProj = p.repositoryUrl.toLowerCase().replace(/\.git$/, "");
      const normalizedPayload = repoUrl.toLowerCase().replace(/\.git$/, "");
      return normalizedProj.includes(normalizedPayload) || normalizedPayload.includes(normalizedProj);
    });

    if (matchingProjects.length === 0) {
      return NextResponse.json(
        { message: "No auto-deploy projects configured for this repository and branch." },
        { status: 200 }
      );
    }

    const queuedDeployments = [];

    for (const project of matchingProjects) {
      // Validate signature if webhookSecret is configured on project
      if (project.webhookSecret) {
        const isValid = verifyGitHubSignature(rawBody, signature, project.webhookSecret);
        if (!isValid) {
          console.warn(`[Webhook] Signature verification failed for project ${project.name}`);
          continue;
        }
      }

      const commitHash = payload.head_commit?.id || "HEAD";
      const commitMessage = payload.head_commit?.message || "Webhook automated push";

      const deployment = await prisma.deployment.create({
        data: {
          projectId: project.id,
          status: "QUEUED",
          trigger: "WEBHOOK",
          commitHash,
          commitMessage,
          buildLog: `[Webhook] Triggered by GitHub push to ${branchName} (${commitHash.substring(0, 7)})\n`,
        },
      });

      await queueDeployment({
        deploymentId: deployment.id,
        projectId: project.id,
        createdAt: new Date().toISOString(),
      });

      queuedDeployments.push({ projectId: project.id, deploymentId: deployment.id });
    }

    return NextResponse.json({
      success: true,
      message: `Triggered ${queuedDeployments.length} deployments`,
      deployments: queuedDeployments,
    });
  } catch (error) {
    console.error("[Webhook /github] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
