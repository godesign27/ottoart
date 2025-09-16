import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Mail, Phone, MapPin } from "lucide-react";
import type { InsertMessage } from "@shared/schema";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMessage = useMutation({
    mutationFn: async (data: InsertMessage) => {
      return await apiRequest('POST', '/api/messages', data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "Thank you for your message. I'll get back to you soon.",
      });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    submitMessage.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section className="min-h-screen bg-slate-800 text-white" data-testid="contact-section">
      <div className="max-w-7xl mx-auto p-6 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column - Contact Information */}
          <div className="space-y-8">
            {/* Page Title */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">Contact</h1>
            </div>
            
            {/* Get In Touch Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Get In Touch</h2>
              <p className="text-white/80 leading-relaxed">
                I'd love to hear from you! Whether you're interested in commissioning a 
                piece, purchasing artwork, or collaborating on a project, please don't 
                hesitate to reach out.
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-white mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Email: </span>
                    <span className="text-white/80">hello@ottoart.com</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-white mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Phone: </span>
                    <span className="text-white/80">(555) 123-4567</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-white mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Studio: </span>
                    <span className="text-white/80">123 Artist Lane, Chicago, IL 60601</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Studio Hours */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Studio Hours</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-white font-medium">Monday - Friday: </span>
                  <span className="text-white/80">9:00 AM - 6:00 PM</span>
                </div>
                <div>
                  <span className="text-white font-medium">Saturday: </span>
                  <span className="text-white/80">10:00 AM - 4:00 PM</span>
                </div>
                <div>
                  <span className="text-white font-medium">Sunday: </span>
                  <span className="text-white/80">By appointment only</span>
                </div>
              </div>
            </div>

            {/* Commissions & Inquiries */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Commissions & Inquiries</h2>
              <div className="space-y-3">
                <p className="text-white/80 leading-relaxed">
                  I accept commissioned work and am always excited to discuss custom 
                  pieces. Please include details about:
                </p>
                <ul className="list-disc list-inside text-white/80 space-y-1 ml-4">
                  <li>Timeline for completion</li>
                  <li>Budget considerations</li>
                </ul>
                <p className="text-white/80">
                  I typically respond to inquiries within 24-48 hours.
                </p>
              </div>
            </div>

            {/* Contact Icons at Bottom */}
            <div className="flex items-center space-x-4 pt-4">
              <div className="flex items-center gap-2 text-white/80">
                <Mail className="h-5 w-5" />
                <span className="text-sm">hello@ottoart.com</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Phone className="h-5 w-5" />
                <span className="text-sm">(555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="h-5 w-5" />
                <span className="text-sm">123 Artist Lane, Chicago, IL 60601</span>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:pl-8">
            <div className="bg-slate-700/50 rounded-lg p-6 lg:p-8 border border-slate-600">
              <h2 className="text-2xl font-bold text-white mb-6">Send a Message</h2>
              
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="name" className="text-white text-sm font-medium mb-2 block">
                    Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="bg-white text-black border-0 h-12"
                    data-testid="contact-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-white text-sm font-medium mb-2 block">
                    Email <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-white text-black border-0 h-12"
                    data-testid="contact-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-white text-sm font-medium mb-2 block">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="bg-white text-black border-0 h-12"
                    data-testid="contact-phone"
                  />
                </div>
                
                <div>
                  <Label htmlFor="subject" className="text-white text-sm font-medium mb-2 block">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    type="text"
                    name="subject"
                    placeholder="Commission inquiry, purchase question, etc."
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="bg-white text-black border-0 h-12 placeholder:text-gray-500"
                    data-testid="contact-subject"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message" className="text-white text-sm font-medium mb-2 block">
                    Message <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={6}
                    placeholder="Tell me about your project, questions, or how I can help you..."
                    value={formData.message}
                    onChange={handleInputChange}
                    className="bg-white text-black border-0 placeholder:text-gray-500 resize-none"
                    data-testid="contact-message"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-12 flex items-center justify-center gap-2"
                  disabled={submitMessage.isPending}
                  data-testid="contact-submit"
                >
                  <Send className="h-4 w-4" />
                  {submitMessage.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
