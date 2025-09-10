import { LiveSiteNavigation } from "@/components/live-site/live-site-navigation"

export default function EventsPage() {
  const events = [
    {
      id: 1,
      title: "Abstract Art Workshop",
      date: "March 15, 2024",
      time: "2:00 PM - 5:00 PM",
      location: "Studio Gallery, Chicago",
      description: "Join me for a hands-on workshop exploring abstract painting techniques.",
    },
    {
      id: 2,
      title: "Gallery Opening: New Works",
      date: "April 8, 2024",
      time: "6:00 PM - 9:00 PM",
      location: "River North Gallery, Chicago",
      description: "Opening reception for my latest collection of abstract paintings.",
    },
    {
      id: 3,
      title: "Artist Talk: Color & Emotion",
      date: "May 20, 2024",
      time: "7:00 PM - 8:30 PM",
      location: "Art Institute of Chicago",
      description: "A discussion on the role of color in contemporary abstract art.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <LiveSiteNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Upcoming Events</h1>
            <p className="text-muted-foreground mt-2">Join me at these upcoming exhibitions and workshops</p>
          </div>

          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="border border-border rounded-lg p-6 space-y-3">
                <h2 className="text-xl font-semibold">{event.title}</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                  <span>{event.date}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{event.time}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{event.location}</span>
                </div>
                <p className="text-muted-foreground">{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
