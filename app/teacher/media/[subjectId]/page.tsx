import { PortalRoute } from "@/components/portal-route";
import { SubjectMediaLibrary } from "@/components/teacher/subject-media-library";

type Props = { params: Promise<{ subjectId: string }> };

export default async function TeacherSubjectMedia({ params }: Props) {
  const { subjectId } = await params;
  return <PortalRoute portal="teacher" section="Media"><SubjectMediaLibrary subjectId={subjectId} /></PortalRoute>;
}
