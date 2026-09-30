import { getSystemMetrics } from "@/lib/system/info";
import { MonitoringView } from "@/components/monitoring/monitoring-view";

export const dynamic = "force-dynamic";

export default function MonitoringPage() {
  const metrics = getSystemMetrics();
  return <MonitoringView initialHost={metrics} />;
}
