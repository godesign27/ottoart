import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface TechItem {
  name: string;
  description: string;
  category: string;
  url?: string;
}

const techStack: TechItem[] = [
  {
    name: "React",
    description: "Frontend UI library for building interactive user interfaces",
    category: "Frontend",
    url: "https://react.dev"
  },
  {
    name: "TypeScript",
    description: "Type-safe JavaScript for better developer experience",
    category: "Language",
    url: "https://www.typescriptlang.org"
  },
  {
    name: "Vite",
    description: "Fast build tool and development server",
    category: "Build Tool",
    url: "https://vitejs.dev"
  },
  {
    name: "Tailwind CSS",
    description: "Utility-first CSS framework for rapid styling",
    category: "Styling",
    url: "https://tailwindcss.com"
  },
  {
    name: "shadcn/ui",
    description: "Beautifully designed components built with Radix UI",
    category: "UI Components",
    url: "https://ui.shadcn.com"
  },
  {
    name: "Express.js",
    description: "Backend web framework for Node.js",
    category: "Backend",
    url: "https://expressjs.com"
  },
  {
    name: "PostgreSQL",
    description: "Relational database for storing all app data",
    category: "Database",
    url: "https://www.postgresql.org"
  },
  {
    name: "Drizzle ORM",
    description: "Type-safe database ORM for PostgreSQL",
    category: "Database",
    url: "https://orm.drizzle.team"
  },
  {
    name: "Resend",
    description: "Email API for sending form notifications and confirmations",
    category: "Email",
    url: "https://resend.com"
  },
  {
    name: "Stripe",
    description: "Payment processing for orders and subscriptions",
    category: "Payments",
    url: "https://stripe.com"
  },
  {
    name: "OpenAI",
    description: "AI-powered artwork analysis and descriptions",
    category: "AI",
    url: "https://openai.com"
  },
  {
    name: "TanStack Query",
    description: "Data fetching and caching library for React",
    category: "State Management",
    url: "https://tanstack.com/query"
  },
  {
    name: "React Hook Form",
    description: "Performant form handling with validation",
    category: "Forms",
    url: "https://react-hook-form.com"
  },
  {
    name: "Zod",
    description: "Schema validation for forms and API data",
    category: "Validation",
    url: "https://zod.dev"
  },
  {
    name: "Wouter",
    description: "Lightweight client-side routing",
    category: "Routing",
    url: "https://github.com/molefrog/wouter"
  },
  {
    name: "Lucide React",
    description: "Beautiful icon library",
    category: "Icons",
    url: "https://lucide.dev"
  },
  {
    name: "Replit",
    description: "Cloud development platform and hosting",
    category: "Hosting",
    url: "https://replit.com"
  },
  {
    name: "Brevo",
    description: "Newsletter subscriber list management",
    category: "Marketing",
    url: "https://brevo.com"
  }
];

const categoryColors: Record<string, string> = {
  "Frontend": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Backend": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Database": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "Language": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "Build Tool": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "Styling": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  "UI Components": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  "Email": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "Payments": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  "AI": "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  "State Management": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  "Forms": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  "Validation": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  "Routing": "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300",
  "Icons": "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
  "Hosting": "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  "Marketing": "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300"
};

export default function TechStackPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    }
    return false;
  });

  const handleNavigate = (href: string) => {
    setLocation(href);
  };

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') {
      setLocation('/');
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSidebarToggle = () => {
    const newCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsed);
    localStorage.setItem('admin-sidebar-collapsed', newCollapsed.toString());
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar 
        onNavigate={handleNavigate} 
        isCollapsed={isSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ${
        isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        <AdminHeader 
          viewMode={viewMode} 
          onViewModeChange={handleViewModeChange}
          onMenuToggle={handleMobileMenuToggle}
          isMobileMenuOpen={isMobileMenuOpen}
          onSidebarToggle={handleSidebarToggle}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        
        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto fade-in">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Tech Stack</h1>
                <p className="text-muted-foreground mt-1">
                  Technologies and services powering your Otto Art platform
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {techStack.map((tech) => (
                  <Card key={tech.name} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{tech.name}</CardTitle>
                        <Badge className={categoryColors[tech.category] || "bg-gray-100 text-gray-800"}>
                          {tech.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mb-3">
                        {tech.description}
                      </CardDescription>
                      {tech.url && (
                        <a
                          href={tech.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Learn more <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
