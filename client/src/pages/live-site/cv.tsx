import { useState } from "react";
import { useLocation } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";
import { Footer } from "@/components/live-site/footer";

export default function CVPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('live');

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'admin') {
      setLocation('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation viewMode={viewMode} onViewModeChange={handleViewModeChange} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-foreground">Curriculum Vitae</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">Education</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground">Master of Fine Arts (MFA)</h3>
                    <p className="text-muted-foreground">Art Institute of Chicago, 2018</p>
                    <p className="text-sm text-muted-foreground">Concentration: Contemporary Painting & Mixed Media</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Bachelor of Fine Arts (BFA)</h3>
                    <p className="text-muted-foreground">University of Illinois, 2015</p>
                    <p className="text-sm text-muted-foreground">Major: Painting, Minor: Art History</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">Solo Exhibitions</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground">"Abstract Expressions"</h3>
                    <p className="text-muted-foreground">Gallery Modern, Chicago | 2023</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">"Color & Form"</h3>
                    <p className="text-muted-foreground">River North Gallery, Chicago | 2022</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">"Urban Abstractions"</h3>
                    <p className="text-muted-foreground">Contemporary Art Space, Milwaukee | 2021</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">"Emerging Visions"</h3>
                    <p className="text-muted-foreground">Local Art Collective, Chicago | 2020</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">Awards & Recognition</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground">Emerging Artist Grant</h3>
                    <p className="text-muted-foreground">Chicago Arts Council | 2023</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Excellence in Contemporary Art</h3>
                    <p className="text-muted-foreground">Midwest Art Foundation | 2022</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Dean's List</h3>
                    <p className="text-muted-foreground">Art Institute of Chicago | 2017-2018</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">Group Exhibitions</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground">"Emerging Artists"</h3>
                    <p className="text-muted-foreground">Museum of Contemporary Art, Chicago | 2023</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">"Midwest Abstract"</h3>
                    <p className="text-muted-foreground">Regional Art Center, Detroit | 2022</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">"New Voices"</h3>
                    <p className="text-muted-foreground">Chicago Cultural Center | 2021</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">"Contemporary Currents"</h3>
                    <p className="text-muted-foreground">Gallery 400, Chicago | 2020</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">"Young Painters"</h3>
                    <p className="text-muted-foreground">Arts District Gallery, Chicago | 2019</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">Publications</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground">"Abstract Art in the Digital Age"</h3>
                    <p className="text-muted-foreground">Art Today Magazine | 2023</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">"Chicago's Rising Artists"</h3>
                    <p className="text-muted-foreground">Windy City Arts Review | 2022</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">"Color Theory in Practice"</h3>
                    <p className="text-muted-foreground">Contemporary Art Quarterly | 2021</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">Collections</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-muted-foreground">Private Collections across Illinois, Wisconsin, and Michigan</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Corporate Collection: United Airlines Headquarters</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Permanent Collection: Chicago Cultural Center</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}