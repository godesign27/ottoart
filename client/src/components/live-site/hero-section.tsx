import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="gradient-bg py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Contemporary Art
              <span className="text-primary block">Redefined</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Explore a curated collection of original paintings, prints, and artistic expressions that challenge conventional boundaries and inspire new perspectives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="px-6 py-3 font-medium"
                data-testid="view-portfolio-button"
              >
                View Portfolio
              </Button>
              <Button 
                variant="outline" 
                className="px-6 py-3 font-medium"
                data-testid="shop-originals-button"
              >
                Shop Originals
              </Button>
            </div>
          </div>

          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Artist's creative workspace" 
              className="rounded-xl shadow-2xl w-full object-cover" 
            />
            <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-lg p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100" 
                  alt="Otto Artist" 
                  className="h-12 w-12 rounded-full object-cover" 
                />
                <div>
                  <p className="font-semibold text-foreground">Otto Art</p>
                  <p className="text-sm text-muted-foreground">Contemporary Artist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
