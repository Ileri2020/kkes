import { JambPractice } from "@/components/student/jamb-practice";
import { StudentLayout, StudentSection } from "@/components/student/student-layout";

export default function JambQuestions() {
	return (
		<StudentLayout title="JAMB past questions">
			<StudentSection
				eyebrow="Joint Admissions and Matriculation Board"
				title="JAMB past questions"
				description="Choose the subjects and paper years for a full CBT practice session."
			>
				<JambPractice />
			</StudentSection>
		</StudentLayout>
	);
}
