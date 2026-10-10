import { PortalRoute } from "@/components/portal-route";
import { MediaSubjectManager } from "@/components/teacher/media-subject-manager";

export default function TeacherMedia() {
	return <PortalRoute portal="teacher" section="Media"><MediaSubjectManager /></PortalRoute>;
}
