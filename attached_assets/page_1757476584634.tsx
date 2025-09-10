import { PageEditor } from "@/components/admin/pages/page-editor"

export default function CVPage() {
  return (
    <PageEditor
      title="CV Page"
      description="Manage your curriculum vitae and professional experience"
      pageType="cv"
      isEnabled={true}
    />
  )
}
