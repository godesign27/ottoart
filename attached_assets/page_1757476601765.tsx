import { PageEditor } from "@/components/admin/pages/page-editor"

export default function BioPage() {
  return (
    <PageEditor
      title="Bio Page"
      description="Manage your artist biography and personal information"
      pageType="bio"
      isEnabled={true}
    />
  )
}
