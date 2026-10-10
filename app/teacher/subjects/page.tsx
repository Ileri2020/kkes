import { PortalRoute } from "@/components/portal-route";
import { TeacherSubjectsManager } from "@/components/teacher/subjects-manager";

export default function TeacherSubjects() {
	return <PortalRoute portal="teacher" section="Subjects"><TeacherSubjectsManager /></PortalRoute>;
}
