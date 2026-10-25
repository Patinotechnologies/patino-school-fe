import { StaffDetailPage } from "@/features/staff/pages/staff-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StaffDetailPage staffId={id} />;
}
