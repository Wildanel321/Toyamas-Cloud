import { prisma } from "@/lib/prisma";
import { ProjectsView } from "@/components/projects/projects-view";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          deployments: true,
          domains: true,
          environmentVariables: true,
        },
      },
    },
  });

  return <ProjectsView initialProjects={projects} />;
}
