import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation"

export default function BioPage() {
  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Artist Bio</h1>
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground">
              Welcome to my artistic journey. I am a contemporary artist specializing in abstract paintings and mixed
              media works.
            </p>
            <p className="text-muted-foreground">
              My work explores the intersection of color, form, and emotion, creating pieces that invite viewers to
              discover their own interpretations and connections.
            </p>
            <p className="text-muted-foreground">
              Based in Chicago, I draw inspiration from urban landscapes, natural forms, and the dynamic energy of city
              life.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
