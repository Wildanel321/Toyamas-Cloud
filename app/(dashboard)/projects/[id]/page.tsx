import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectDetailView } from "@/components/projects/project-detail-view";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      domains: {
        orderBy: { createdAt: "asc" },
      },
      environmentVariables: {
        select: {
          id: true,
          key: true,
          isSecret: true,
          createdAt: true,
        },
        orderBy: { key: "asc" },
      },
      deployments: {
        take: 30,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Format masked env variables
  const formattedProject = {
    ...project,
    environmentVariables: project.environmentVariables.map((v) => ({
      ...v,
      value: "••••••••••••",
    })),
  };

  return <ProjectDetailView project={formattedProject} />;
}
