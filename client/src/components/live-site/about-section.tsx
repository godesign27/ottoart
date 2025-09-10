import { Button } from "@/components/ui/button";

export function AboutSection() {
  return (
    <section className="py-20 px-6 bg-muted/30" data-testid="about-section">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <img 
              src="https://images.unsplash.com/photo-1456327102063-fb5054efe647?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=500" 
              alt="Artist in studio creating artwork" 
              className="rounded-xl shadow-lg w-full object-cover" 
            />
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-foreground">About the Artist</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Otto Art is a contemporary artist whose work explores the intersection of traditional techniques and modern expression. Based in Chicago, their practice encompasses painting, digital art, and mixed media installations.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              With over a decade of experience, Otto has exhibited in galleries across the Midwest and has been featured in numerous art publications. Their work challenges viewers to see familiar subjects through fresh perspectives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="px-6 py-3 font-medium"
                data-testid="read-full-bio"
              >
                Read Full Bio
              </Button>
              <Button 
                variant="outline" 
                className="px-6 py-3 font-medium"
                data-testid="view-cv"
              >
                View CV
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
