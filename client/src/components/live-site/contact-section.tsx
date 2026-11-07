import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ActionButton, ActionLink } from "@/components/marketing/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertMessage, ContactSettings } from "@shared/schema";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const [messageSent, setMessageSent] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load contact settings from API
  const { data: contactSettings } = useQuery<ContactSettings>({
    queryKey: ['/api/contact-settings']
  });

  // Default values if no data
  const settings = contactSettings || {
    getInTouchText: "I'd love to hear from you! Whether you're interested in commissioning a piece, purchasing artwork, or collaborating on a project, please don't hesitate to reach out.",
    contactInfo: {
      email: "hello@ottoart.com",
      phone: "(555) 123-4567",
      address: "123 Artist Lane, Chicago, IL 60601"
    },
    studioHours: {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "10:00 AM - 4:00 PM",
      sunday: "By appointment only"
    },
    commissionsText: "I accept commissioned work and am always excited to discuss custom pieces. Please include details about your vision, preferred size, timeline, and budget. I typically respond to inquiries within 24-48 hours."
  };

  const submitMessage = useMutation({
    mutationFn: async (data: InsertMessage) => {
      return await apiRequest('POST', '/api/messages', data);
    },
    onSuccess: () => {
      setMessageSent(true);
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

  const email = settings.contactInfo?.email || "hello@ottoart.com";
  const phone = settings.contactInfo?.phone || "";
  const address = settings.contactInfo?.address || "";
  const field = "h-12 border-input bg-background";

  return (
    <section aria-labelledby="contact-title" className="bg-background" data-testid="contact-section">
      <div className="mx-auto grid w-full max-w-[90rem] gap-14 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:pt-20">
        {/* Who to reach and how */}
        <div className="lg:col-span-5">
          <h1 id="contact-title" className="font-display text-[3rem] leading-[0.98] tracking-[-0.03em] md:text-[4.5rem]">Contact</h1>
          <p className="mt-6 max-w-[46ch] text-xl leading-relaxed">{settings.getInTouchText}</p>

          <dl className="mt-12 flex flex-col gap-6">
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="mt-1 text-lg"><a href={`mailto:${email}`} className="underline-offset-4 hover:underline">{email}</a></dd>
            </div>
            {phone && (
              <div>
                <dt className="text-sm text-muted-foreground">Phone</dt>
                <dd className="mt-1 text-lg"><a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="underline-offset-4 hover:underline">{phone}</a></dd>
              </div>
            )}
            {address && (
              <div>
                <dt className="text-sm text-muted-foreground">Studio</dt>
                <dd className="mt-1 text-lg">{address}</dd>
              </div>
            )}
          </dl>

          <div className="mt-14 bg-secondary p-6 md:p-8">
            <h2 className="text-xl font-semibold">Commissions &amp; inquiries</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed">{settings.commissionsText}</p>
            <div className="mt-6">
              <ActionLink href="/commission" variant="solid">Start a commission request</ActionLink>
            </div>
          </div>
        </div>

        {/* The form */}
        <div className="lg:col-span-6 lg:col-start-7">
          <div className="bg-card p-6 sm:p-8 md:p-10">
            {!messageSent ? (
              <>
                <h2 className="font-display text-[2rem] leading-[1.05] tracking-[-0.02em] md:text-[2.5rem]">Send a message</h2>
                <form className="mt-8 grid gap-6 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
                  <div>
                    <Label htmlFor="name" className="mb-2 block text-sm font-semibold">Name <span className="font-normal text-muted-foreground">(required)</span></Label>
                    <Input id="name" type="text" name="name" autoComplete="name" value={formData.name} onChange={handleInputChange} className={field} required data-testid="contact-name" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="mb-2 block text-sm font-semibold">Email <span className="font-normal text-muted-foreground">(required)</span></Label>
                    <Input id="email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleInputChange} className={field} required data-testid="contact-email" />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="mb-2 block text-sm font-semibold">Phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input id="phone" type="tel" name="phone" autoComplete="tel" value={formData.phone} onChange={handleInputChange} className={field} data-testid="contact-phone" />
                  </div>
                  <div>
                    <Label htmlFor="subject" className="mb-2 block text-sm font-semibold">Subject <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input id="subject" type="text" name="subject" placeholder="Commission, purchase question…" value={formData.subject} onChange={handleInputChange} className={field} data-testid="contact-subject" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="message" className="mb-2 block text-sm font-semibold">Message <span className="font-normal text-muted-foreground">(required)</span></Label>
                    <Textarea id="message" name="message" rows={7} placeholder="Tell me about your project, questions, or how I can help…" value={formData.message} onChange={handleInputChange} className="resize-y border-input bg-background" required data-testid="contact-message" />
                  </div>
                  <div className="sm:col-span-2">
                    <ActionButton type="submit" className="w-full sm:w-auto" disabled={submitMessage.isPending} data-testid="contact-submit">
                      {submitMessage.isPending ? "Sending…" : "Send message"}
                    </ActionButton>
                  </div>
                </form>
              </>
            ) : (
              <div role="status" data-testid="contact-success">
                <h2 className="font-display text-[2rem] leading-[1.05] tracking-[-0.02em] md:text-[2.5rem]">Thank you</h2>
                <p className="mt-4 text-lg leading-relaxed">
                  Your message has been sent successfully. I appreciate you reaching out and will get back to you within 24-48 hours.
                </p>
                <ActionButton variant="quiet" className="mt-8" onClick={() => setMessageSent(false)} data-testid="contact-send-another">
                  Send another message
                </ActionButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
