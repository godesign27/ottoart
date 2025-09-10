import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation"

export default function CVPage() {
  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">Curriculum Vitae</h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Education</h2>
              <div className="space-y-2">
                <p>
                  <strong>2018</strong> - MFA in Fine Arts, Art Institute of Chicago
                </p>
                <p>
                  <strong>2015</strong> - BFA in Painting, University of Illinois
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Solo Exhibitions</h2>
              <div className="space-y-2">
                <p>
                  <strong>2023</strong> - "Abstract Expressions", Gallery Modern, Chicago
                </p>
                <p>
                  <strong>2022</strong> - "Color & Form", River North Gallery, Chicago
                </p>
                <p>
                  <strong>2021</strong> - "Urban Abstractions", Contemporary Art Space, Milwaukee
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Group Exhibitions</h2>
              <div className="space-y-2">
                <p>
                  <strong>2023</strong> - "Emerging Artists", Museum of Contemporary Art, Chicago
                </p>
                <p>
                  <strong>2022</strong> - "Midwest Abstract", Regional Art Center, Detroit
                </p>
                <p>
                  <strong>2021</strong> - "New Voices", Chicago Cultural Center
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
