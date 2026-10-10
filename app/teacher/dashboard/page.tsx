import { PortalRoute } from "@/components/portal-route";
import { TeacherDashboardActions } from "@/components/teacher/dashboard-actions";

export default function TeacherDashboardRoute() {
	return <PortalRoute portal="teacher" section="Dashboard"><TeacherDashboardActions /></PortalRoute>;
}
