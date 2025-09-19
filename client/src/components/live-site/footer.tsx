import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Twitter, Facebook, Linkedin, Youtube } from "lucide-react";
import { SiTiktok, SiPinterest } from "react-icons/si";
import type { PageSettings, SocialSettings } from "@shared/schema";

export function Footer() {
  const [location] = useLocation();

  // Fetch page settings to determine which pages are enabled
  const { data: pageSettings = [] } = useQuery({
    queryKey: ['/api/page-settings'],
    queryFn: () => fetch('/api/page-settings').then(res => res.json()) as Promise<PageSettings[]>
  });

  // Fetch social settings for social media links
  const { data: socialSettings } = useQuery<SocialSettings>({
    queryKey: ['/api/social-settings'],
    queryFn: () => fetch('/api/social-settings').then(res => res.json())
  });

  const getPageEnabled = (page: string) => {
    const setting = pageSettings.find(p => p.page === page);
    return setting?.enabled ?? true;
  };

  // Static navigation items (always shown)
  const staticNavItems = [
    { href: "/", label: "Home" },
    { href: "/shop-all", label: "Shop All" },
    { href: "/originals", label: "Originals" },
    { href: "/prints", label: "Prints" },
    { href: "/accessories", label: "Accessories" }
  ];

  // Page-based navigation items (filtered by page settings)
  const pageNavItems = [
    { href: "/bio", label: "Bio", page: "bio" },
    { href: "/gallery", label: "Gallery", page: "gallery" },
    { href: "/events", label: "Events", page: "events" },
    { href: "/cv", label: "CV", page: "cv" }
  ].filter(item => getPageEnabled(item.page));

  // Contact is always last
  const contactNavItem = { href: "/contact", label: "Contact" };

  // Combine all navigation items
  const navItems = [...staticNavItems, ...pageNavItems, contactNavItem];

  // Social media platforms configuration
  const socialPlatforms = [
    { 
      key: 'instagram', 
      url: socialSettings?.instagram, 
      icon: Instagram, 
      label: 'Instagram',
      color: 'hover:text-pink-500'
    },
    { 
      key: 'twitter', 
      url: socialSettings?.twitter, 
      icon: Twitter, 
      label: 'Twitter',
      color: 'hover:text-blue-400'
    },
    { 
      key: 'facebook', 
      url: socialSettings?.facebook, 
      icon: Facebook, 
      label: 'Facebook',
      color: 'hover:text-blue-600'
    },
    { 
      key: 'linkedin', 
      url: socialSettings?.linkedin, 
      icon: Linkedin, 
      label: 'LinkedIn',
      color: 'hover:text-blue-700'
    },
    { 
      key: 'youtube', 
      url: socialSettings?.youtube, 
      icon: Youtube, 
      label: 'YouTube',
      color: 'hover:text-red-600'
    },
    { 
      key: 'tiktok', 
      url: socialSettings?.tiktok, 
      icon: SiTiktok, 
      label: 'TikTok',
      color: 'hover:text-black dark:hover:text-white'
    },
    { 
      key: 'pinterest', 
      url: socialSettings?.pinterest, 
      icon: SiPinterest, 
      label: 'Pinterest',
      color: 'hover:text-red-700'
    }
  ];

  // Filter social platforms that have URLs and are enabled for footer
  const enabledSocialLinks = socialPlatforms.filter(platform => 
    platform.url && 
    platform.url.trim() !== '' && 
    (socialSettings?.showInFooter ?? true)
  );

  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-bold text-foreground" data-testid="footer-logo">
              Otto Art
            </Link>
            <p className="text-muted-foreground text-sm">
              Contemporary art that challenges conventional boundaries and inspires new perspectives.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Navigation</h3>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`text-sm transition-colors ${
                    location === item.href 
                      ? 'text-primary font-medium' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid={`footer-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Follow</h3>
            {enabledSocialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {enabledSocialLinks.map((platform) => {
                  const IconComponent = platform.icon;
                  return (
                    <a
                      key={platform.key}
                      href={platform.url!}
                      target={socialSettings?.openInNewTab ? "_blank" : "_self"}
                      rel={socialSettings?.openInNewTab ? "noopener noreferrer" : undefined}
                      className={`p-2 rounded-full bg-muted text-muted-foreground transition-colors ${platform.color}`}
                      aria-label={platform.label}
                      data-testid={`footer-social-${platform.key}`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Social media links not configured.
              </p>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Otto Art. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Link 
                href="/checkout" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="footer-cart"
              >
                Shopping Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}