import { PortalRoute } from "@/components/portal-route";
import { TeacherClassesManager } from "@/components/teacher/classes-manager";

export default function TeacherClasses() {
	return <PortalRoute portal="teacher" section="My Classes"><TeacherClassesManager /></PortalRoute>;
}
