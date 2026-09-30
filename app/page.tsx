import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      redirect("/setup");
    }

    const session = await getCurrentSession();
    if (!session) {
      redirect("/login");
    }

    redirect("/dashboard");
  } catch {
    // If DB is unreachable or during initial setup
    redirect("/login");
  }
}
