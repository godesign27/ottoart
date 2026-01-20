import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, MailOpen, ExternalLink, DollarSign, Maximize } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { CommissionRequest } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-800" },
  { value: "in-progress", label: "In Progress", color: "bg-purple-100 text-purple-800" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
  { value: "declined", label: "Declined", color: "bg-red-100 text-red-800" },
];

export default function CommissionsPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'admin' | 'live'>('admin');
  const [selectedCommission, setSelectedCommission] = useState<CommissionRequest | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    }
    return false;
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const { data: commissions = [], isLoading } = useQuery<CommissionRequest[]>({
    queryKey: ['/api/commissions'],
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest('PUT', `/api/commissions/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      apiRequest('PUT', `/api/commissions/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
      toast({
        title: "Status updated",
        description: "Commission request status has been updated.",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', `/api/commissions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
      setSelectedCommission(null);
      toast({
        title: "Commission deleted",
        description: "The commission request has been removed.",
      });
    }
  });

  const sortedCommissions = [...commissions].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const unreadCount = commissions.filter(c => !c.isRead).length;

  const handleCommissionSelect = (commission: CommissionRequest) => {
    setSelectedCommission(commission);
    if (!commission.isRead) {
      markAsReadMutation.mutate(commission.id);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const statusConfig = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return (
      <Badge className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getBudgetDisplay = (budget: string) => {
    const budgetMap: Record<string, string> = {
      "under-1000": "Under $1,000",
      "1000-2500": "$1,000–$2,500",
      "2500-5000": "$2,500–$5,000",
      "5000-plus": "$5,000+",
      "not-sure": "Not sure yet"
    };
    return budgetMap[budget] || budget;
  };

  const getSizeDisplay = (size: string) => {
    const sizeMap: Record<string, string> = {
      "small": "Small (under 24\")",
      "medium": "Medium (24–40\")",
      "large": "Large (40\"+)",
      "open": "Open to recommendation"
    };
    return sizeMap[size] || size;
  };

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
          <div className="max-w-7xl mx-auto space-y-6 fade-in">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Commission Requests</h1>
                  <p className="text-muted-foreground mt-2">Manage artwork commission inquiries</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{unreadCount} new</Badge>
                  <Link href="/commission" target="_blank">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View Form
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-5">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">All Requests ({commissions.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Loading commission requests...
                      </div>
                    ) : sortedCommissions.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No commission requests yet</p>
                        <p className="text-sm mt-2">Commission requests from the form will appear here.</p>
                      </div>
                    ) : (
                      <div className="divide-y max-h-[600px] overflow-auto">
                        {sortedCommissions.map((commission) => (
                          <div
                            key={commission.id}
                            className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                              selectedCommission?.id === commission.id ? 'bg-muted' : ''
                            } ${!commission.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                            onClick={() => handleCommissionSelect(commission)}
                            data-testid={`commission-item-${commission.id}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                                !commission.isRead ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              }`}>
                                {commission.fullName.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium ${!commission.isRead ? 'font-semibold' : ''}`}>
                                    {commission.fullName}
                                  </span>
                                  {!commission.isRead && (
                                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {commission.commissionType}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {getStatusBadge(commission.status)}
                                  <span className="text-xs text-muted-foreground">
                                    {commission.createdAt && formatDistanceToNow(new Date(commission.createdAt), { addSuffix: true })}
                                  </span>
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

              <div className="col-span-12 lg:col-span-7">
                {selectedCommission ? (
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl flex items-center gap-2">
                            {selectedCommission.isRead ? (
                              <MailOpen className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Mail className="h-5 w-5 text-primary" />
                            )}
                            {selectedCommission.fullName}
                          </CardTitle>
                          <p className="text-muted-foreground mt-1">
                            {selectedCommission.email}
                            {selectedCommission.phone && ` • ${selectedCommission.phone}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedCommission.status || "new"}
                            onValueChange={(value) => updateStatusMutation.mutate({ 
                              id: selectedCommission.id, 
                              status: value 
                            })}
                          >
                            <SelectTrigger className="w-[140px]" data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete commission request?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this commission request.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(selectedCommission.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <span>Commission Type</span>
                          </div>
                          <p className="font-medium">{selectedCommission.commissionType}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Maximize className="h-4 w-4" />
                            <span>Size</span>
                          </div>
                          <p className="font-medium">{getSizeDisplay(selectedCommission.sizePreference)}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <DollarSign className="h-4 w-4" />
                            <span>Budget</span>
                          </div>
                          <p className="font-medium">{getBudgetDisplay(selectedCommission.budgetRange)}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Mail className="h-4 w-4" />
                            <span>Preferred Contact</span>
                          </div>
                          <p className="font-medium capitalize">{selectedCommission.preferredContact || 'Email'}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Vision / Description</h3>
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <p className="whitespace-pre-wrap">{selectedCommission.vision}</p>
                        </div>
                      </div>

                      {selectedCommission.referenceFileUrl && (
                        <div>
                          <h3 className="font-semibold mb-2">Reference Image</h3>
                          <a 
                            href={selectedCommission.referenceFileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Reference Image
                          </a>
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Submitted {selectedCommission.createdAt && formatDistanceToNow(new Date(selectedCommission.createdAt), { addSuffix: true })}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button asChild className="flex-1">
                          <a href={`mailto:${selectedCommission.email}?subject=Re: Your Commission Request`}>
                            <Mail className="h-4 w-4 mr-2" />
                            Reply via Email
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center py-12">
                      <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium text-muted-foreground">Select a commission request</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Click on a request from the list to view details
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
