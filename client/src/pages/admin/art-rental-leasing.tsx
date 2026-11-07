import { MarketingPageAdmin } from "@/components/admin/pages/marketing-page-admin";
import { RentalInquiriesList } from "@/components/admin/pages/rental-inquiries-list";

export default function AdminArtRentalLeasingPage() {
  return (
    <MarketingPageAdmin
      page="art-rental-leasing"
      pageName="Art Rental & Leasing"
      title="Art Rental & Leasing Page"
      description="Rental pricing, the estimator and rental inquiries"
      livePath="/art-rental-leasing"
    >
      <RentalInquiriesList />
    </MarketingPageAdmin>
  );
}
