import CMSSinglePage from "@/components/templates/CmsSinglePage";
export default async function CMSDetailPage({ params }) {
  const { pageName } = await params;
  // console.log(pageName, "pageName");
  return <CMSSinglePage pageName={pageName} />;
}
