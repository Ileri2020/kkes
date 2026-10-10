import { PortalRoute } from "@/components/portal-route";
import { TopicCoverageManager } from "@/components/teacher/topic-coverage-manager";

export default function TeacherTopicCoverage() {
  return (
    <PortalRoute portal="teacher" section="Topic Coverage">
      <TopicCoverageManager />
    </PortalRoute>
  );
}
