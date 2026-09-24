import { StudentLayout, StudentSection } from "@/components/student/student-layout";
import { DashboardContent } from "@/components/student/dashboard-content";

export default function StudentDashboardRoute() {
  return <StudentLayout title="Dashboard"><StudentSection eyebrow="Student command center" title="Your learning dashboard"><DashboardContent /></StudentSection></StudentLayout>;
}
