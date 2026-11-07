import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RentalInquiry } from "@shared/schema";
import { formatCents } from "@shared/rentalPricing";

const STATUSES = ["new", "contacted", "quoted", "closed"] as const;
const TERM_LABEL: Record<string, string> = { "3": "3 months", "6": "6 months", "12": "12 months", "not-sure": "Not sure" };
const INTEREST_LABEL: Record<string, string> = { originals: "Originals", prints: "Prints", both: "Both", "not-sure": "Not sure" };

type Estimate = {
  type?: string; term?: number; count?: number; referenceValueCents?: number; artworkName?: string; pricingVersion?: string;
  result?: { status: string; monthlySubtotalCents?: number; termSubtotalCents?: number; discountBps?: number } | null;
};

// Rental inquiries sent from /art-rental-leasing, newest first. Every inquiry is saved before the visitor
// is told it was received, so this list is the record (email notifications are a later step).
export function RentalInquiriesList() {
  const { toast } = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: inquiries = [], isLoading, isError } = useQuery<RentalInquiry[]>({ queryKey: ["/api/rental-inquiries"] });

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; status?: string; isRead?: boolean }) =>
      apiRequest("PATCH", `/api/rental-inquiries/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/rental-inquiries"] }),
    onError: () => toast({ title: "Couldn't save", description: "The inquiry didn't change. Please try again.", variant: "destructive" }),
  });

  const unread = inquiries.filter((i) => !i.isRead).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Rental inquiries
          {unread > 0 && <Badge data-testid="badge-unread-inquiries">{unread} new</Badge>}
        </CardTitle>
        <CardDescription>Sent from the rental page. Estimates are illustrative and recalculated on the server.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />)}</div>}
        {isError && <p className="text-destructive">Inquiries couldn't be loaded. Refresh the page to try again.</p>}
        {!isLoading && !isError && inquiries.length === 0 && (
          <p className="text-muted-foreground" data-testid="text-no-inquiries">
            No rental inquiries yet. When someone sends the form on the rental page, it appears here.
          </p>
        )}
        <ul className="divide-y divide-border">
          {inquiries.map((q) => {
            const open = openId === q.id;
            const est = q.estimate as Estimate | null;
            return (
              <li key={q.id} className="py-3" data-testid={`inquiry-${q.reference}`}>
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                  aria-expanded={open}
                  onClick={() => {
                    setOpenId(open ? null : q.id);
                    if (!q.isRead) update.mutate({ id: q.id, isRead: true });
                  }}
                >
                  <span className="flex items-center gap-2">
                    {!q.isRead && <span className="h-2 w-2 rounded-full bg-brand" aria-label="Unread" />}
                    <span className="font-medium">{q.name}</span>
                    {q.company && <span className="text-muted-foreground">· {q.company}</span>}
                  </span>
                  <span className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{q.reference}</span>
                    <Badge variant={q.status === "new" ? "default" : "secondary"} className="capitalize">{q.status}</Badge>
                    <span>{q.createdAt ? formatDistanceToNow(new Date(q.createdAt), { addSuffix: true }) : ""}</span>
                  </span>
                </button>
                {open && (
                  <div className="mt-4 grid gap-4 rounded-md bg-muted/50 p-4 text-sm md:grid-cols-2">
                    <dl className="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1">
                      <dt className="text-muted-foreground">Email</dt><dd><a className="underline" href={`mailto:${q.email}`}>{q.email}</a></dd>
                      {q.phone && (<><dt className="text-muted-foreground">Phone</dt><dd>{q.phone}</dd></>)}
                      <dt className="text-muted-foreground">Location</dt><dd>{q.location}</dd>
                      {q.spaceType && (<><dt className="text-muted-foreground">Space</dt><dd>{q.spaceType}</dd></>)}
                      <dt className="text-muted-foreground">Interest</dt><dd>{INTEREST_LABEL[q.artworkInterest] ?? q.artworkInterest}</dd>
                      <dt className="text-muted-foreground">Artworks</dt><dd>{q.artworkCount ?? "Not sure"}</dd>
                      <dt className="text-muted-foreground">Term</dt><dd>{TERM_LABEL[q.preferredTerm] ?? q.preferredTerm}</dd>
                      {q.preferredStartDate && (<><dt className="text-muted-foreground">Start</dt><dd>{q.preferredStartDate}</dd></>)}
                    </dl>
                    <div className="space-y-3">
                      {q.details && <p className="whitespace-pre-wrap">{q.details}</p>}
                      {est && (
                        <div className="rounded-md bg-background p-3">
                          <p className="font-medium">Illustrative estimate (pricing {est.pricingVersion})</p>
                          <p className="mt-1">
                            {est.count} × {est.type}{est.artworkName ? ` (${est.artworkName})` : ""}, {est.term} months,
                            reference {est.referenceValueCents ? formatCents(est.referenceValueCents) : "?"} each
                          </p>
                          {est.result?.status === "priced" && (
                            <p className="mt-1">
                              {formatCents(est.result.monthlySubtotalCents!)} a month, {formatCents(est.result.termSubtotalCents!)} over the term
                              {est.result.discountBps ? ` (${est.result.discountBps / 100}% collection discount)` : ""}
                            </p>
                          )}
                          {est.result?.status === "custom" && <p className="mt-1">31+ artworks: custom quote</p>}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={q.status} onValueChange={(status) => update.mutate({ id: q.id, status })}>
                          <SelectTrigger className="w-40" aria-label="Status"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" asChild><a href={`mailto:${q.email}?subject=${encodeURIComponent(`Your art rental inquiry (${q.reference})`)}`}>Reply by email</a></Button>
                        <Button variant="ghost" size="sm" onClick={() => update.mutate({ id: q.id, isRead: false })}>Mark unread</Button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
