import { PupilDetailPage } from "@/features/pupils/pages/pupil-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PupilDetailPage pupilId={id} />;
}
