import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, EyeOff } from "lucide-react";

interface PageEditorProps {
  title: string;
  description: string;
  pageType: 'bio' | 'cv' | 'contact';
  isEnabled: boolean;
}

export function PageEditor({ title, description, pageType, isEnabled: initialEnabled }: PageEditorProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [content, setContent] = useState(getInitialContent(pageType));
  const [isPreview, setIsPreview] = useState(false);

  function getInitialContent(type: string): string {
    switch (type) {
      case 'bio':
        return `Welcome to my artistic journey. I am a contemporary artist specializing in abstract paintings and mixed media works that explore the intersection of color, form, and emotion.

My work invites viewers to discover their own interpretations and connections, creating pieces that challenge conventional boundaries and inspire new perspectives on familiar subjects.

Based in Chicago, I draw inspiration from urban landscapes, natural forms, and the dynamic energy of city life. Each piece represents a dialogue between traditional techniques and modern expression.

With over a decade of experience, my work has been exhibited in galleries across the Midwest and featured in numerous art publications. I believe art should not just be seen, but experienced.`;
      
      case 'cv':
        return `## Education
**2018** - MFA in Fine Arts, Art Institute of Chicago
**2015** - BFA in Painting, University of Illinois

## Solo Exhibitions
**2023** - "Abstract Expressions", Gallery Modern, Chicago
**2022** - "Color & Form", River North Gallery, Chicago
**2021** - "Urban Abstractions", Contemporary Art Space, Milwaukee

## Group Exhibitions
**2023** - "Emerging Artists", Museum of Contemporary Art, Chicago
**2022** - "Midwest Abstract", Regional Art Center, Detroit
**2021** - "New Voices", Chicago Cultural Center

## Awards & Recognition
**2023** - Emerging Artist Grant, Chicago Arts Council
**2022** - Excellence in Contemporary Art, Midwest Art Foundation

## Collections
Private Collections across Illinois, Wisconsin, and Michigan
Corporate Collection: United Airlines Headquarters
Permanent Collection: Chicago Cultural Center`;
      
      case 'contact':
        return `## Get in Touch

I'd love to hear from you! Whether you're interested in commissioning a piece, have questions about my work, or would like to discuss a potential collaboration, please don't hesitate to reach out.

**Studio Address:**
123 Artist Lane
Chicago, IL 60601

**Email:**
hello@ottoart.com

**Phone:**
(555) 123-4567

**Studio Hours:**
Monday - Friday: 9:00 AM - 6:00 PM
Saturday: 10:00 AM - 4:00 PM
Sunday: By appointment only

For commission inquiries, please include details about your vision, preferred size, timeline, and budget. I typically respond to all inquiries within 24-48 hours.`;
      
      default:
        return '';
    }
  }

  const handleSave = () => {
    // Implementation for saving content
    console.log('Saving content for', pageType, ':', content);
    // Would typically make API call here
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <Button onClick={togglePreview} variant="outline" className="flex items-center gap-2">
            {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Page Settings</CardTitle>
              <CardDescription>Configure the visibility and content of this page</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="page-enabled">Enable this page</Label>
              <Switch
                id="page-enabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page Content</CardTitle>
          <CardDescription>
            {isPreview ? 'Preview how your content will appear on the live site' : 'Edit your page content using Markdown formatting'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPreview ? (
            <div className="prose prose-lg max-w-none">
              {content.split('\n').map((line, index) => {
                if (line.startsWith('## ')) {
                  return <h2 key={index} className="text-xl font-semibold mt-6 mb-3">{line.substring(3)}</h2>;
                } else if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={index} className="font-medium mt-4 mb-1">{line.slice(2, -2)}</p>;
                } else if (line.trim() === '') {
                  return <br key={index} />;
                } else {
                  return <p key={index} className="text-muted-foreground leading-relaxed mb-2">{line}</p>;
                }
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Enter your content here... You can use Markdown formatting."
              />
              <div className="text-xs text-muted-foreground">
                <p>Formatting tips:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Use ## for headings</li>
                  <li>Use **text** for bold text</li>
                  <li>Leave blank lines between paragraphs</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isEnabled && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-orange-600" />
              <p className="text-orange-800 dark:text-orange-200">
                This page is currently disabled and will not appear on your live site. Enable it in the page settings to make it visible to visitors.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}