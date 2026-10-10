import { PortalRoute } from "@/components/portal-route";
import { TopicCoverageDetail } from "@/components/teacher/topic-coverage-detail";

interface Props {
  params: Promise<{ subjectId: string }>;
}

export default async function TeacherTopicCoverageDetail({ params }: Props) {
  const { subjectId } = await params;
  return (
    <PortalRoute portal="teacher" section="Topic Coverage">
      <TopicCoverageDetail subjectId={subjectId} />
    </PortalRoute>
  );
}
