import { useState } from "react";
import { useLocation } from "wouter";
import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation";

export default function BioPage() {
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
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-foreground">Artist Bio</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400" 
                alt="Otto Artist" 
                className="w-full h-80 object-cover rounded-lg shadow-lg" 
              />
            </div>
            
            <div className="space-y-6">
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Welcome to my artistic journey. I am a contemporary artist specializing in abstract paintings and mixed
                  media works that explore the intersection of color, form, and emotion.
                </p>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  My work invites viewers to discover their own interpretations and connections, creating pieces that 
                  challenge conventional boundaries and inspire new perspectives on familiar subjects.
                </p>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Based in Chicago, I draw inspiration from urban landscapes, natural forms, and the dynamic energy of city
                  life. Each piece represents a dialogue between traditional techniques and modern expression.
                </p>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  With over a decade of experience, my work has been exhibited in galleries across the Midwest and featured 
                  in numerous art publications. I believe art should not just be seen, but experienced.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}