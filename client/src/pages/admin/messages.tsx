import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Archive, Mail, MailOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function MessagesPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const queryClient = useQueryClient();

  const handleNavigate = (href: string) => {
    setLocation(href);
  };

  const handleViewModeChange = (mode: 'admin' | 'live') => {
    setViewMode(mode);
    if (mode === 'live') {
      setLocation('/');
    }
  };

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    queryFn: () => fetch('/api/messages').then(res => res.json())
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: string) => 
      apiRequest('PATCH', `/api/messages/${messageId}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    }
  });

  // Sort messages by creation date (newest first)
  const sortedMessages = messages.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  // Count unread messages
  const unreadCount = messages.filter(m => !m.isRead).length;

  const handleMessageSelect = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const truncateMessage = (text: string, length: number = 60) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar onNavigate={handleNavigate} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader viewMode={viewMode} onViewModeChange={handleViewModeChange} />
        
        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="max-w-7xl mx-auto space-y-6 fade-in">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Messages</h1>
                  <p className="text-muted-foreground mt-2">Manage customer inquiries and communications</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{unreadCount} unread</Badge>
                  </div>
                  <Button
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={unreadCount === 0}
                    onClick={() => {
                      // Mark all as read functionality can be added later
                    }}
                  >
                    <Archive className="h-4 w-4" />
                    Archive All Read
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Messages List */}
              <div className="col-span-5">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <CardTitle className="text-base">Inbox ({messages.length})</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="p-6 text-center text-muted-foreground">
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm">Messages from your contact form will appear here.</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {sortedMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                              selectedMessage?.id === message.id ? 'bg-muted border-l-2 border-primary' : ''
                            } ${!message.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                            onClick={() => handleMessageSelect(message)}
                            data-testid={`message-item-${message.id}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                  {getInitials(message.name)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className={`text-sm font-medium truncate ${!message.isRead ? 'font-semibold' : ''}`}>
                                    {message.name}
                                  </h4>
                                  <span className="text-xs text-muted-foreground flex-shrink-0">
                                    {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 'Unknown'}
                                  </span>
                                </div>
                                <p className={`text-sm mb-1 ${!message.isRead ? 'font-medium' : 'text-muted-foreground'}`}>
                                  {message.subject || 'No subject'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {truncateMessage(message.message)}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-muted-foreground">{message.email}</span>
                                  {!message.isRead && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Message Detail */}
              <div className="col-span-7">
                <Card className="h-full">
                  {selectedMessage ? (
                    <>
                      <CardHeader className="pb-3 border-b">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-base font-medium text-primary">
                              {getInitials(selectedMessage.name)}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{selectedMessage.name}</CardTitle>
                              <CardDescription className="text-sm">{selectedMessage.email}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" data-testid="button-archive-message">
                              <Archive className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" data-testid="button-delete-message">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg mb-2">{selectedMessage.subject || 'No subject'}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Received {selectedMessage.createdAt ? formatDistanceToNow(new Date(selectedMessage.createdAt), { addSuffix: true }) : 'at unknown time'}
                            </p>
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {selectedMessage.message}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">Select a message to read</h3>
                        <p className="text-sm text-muted-foreground">Choose a message from the list to view its contents.</p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}