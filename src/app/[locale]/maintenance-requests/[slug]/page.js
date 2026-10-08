import MaintenanceRequestDetail from "@/components/templates/MaintenanceRequests/MaintenanceRequestDetail";

export default async function MaintenanceRequestDetailPage({ params }) {
  const { slug } = await params;
  return <MaintenanceRequestDetail slug={slug} />;
}
