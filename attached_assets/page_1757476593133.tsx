import { PageEditor } from "@/components/admin/pages/page-editor"

export default function ContactPage() {
  return (
    <PageEditor
      title="Contact Page"
      description="Manage your contact information and form settings"
      pageType="contact"
      isEnabled={false}
    />
  )
}
