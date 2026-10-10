import { PortalRoute } from "@/components/portal-route";
import { AdminDashboardContent } from "@/components/admin/admin-dashboard";

export default function AdminDashboardRoute() {
  return (
    <PortalRoute portal="admin" section="Dashboard">
      <AdminDashboardContent />
    </PortalRoute>
  );
}
