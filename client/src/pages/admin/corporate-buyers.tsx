import { MarketingPageAdmin } from "@/components/admin/pages/marketing-page-admin";

export default function AdminCorporateBuyersPage() {
  return (
    <MarketingPageAdmin
      page="corporate-buyers"
      pageName="Corporate Buyers"
      title="Corporate Buyers Page"
      description="The page for businesses buying art for offices, hotels and other spaces"
      livePath="/corporate-buyers"
    />
  );
}
