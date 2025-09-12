import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Search, 
  User,
  ShoppingCart,
  Calendar
} from "lucide-react";
import type { Order } from "@shared/schema";

interface Customer {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  initials: string;
}

export default function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch orders data to derive customer information
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Derive customer data from orders
  const customers: Customer[] = [];
  const customerMap = new Map<string, Customer>();

  orders.forEach((order) => {
    const customerKey = order.customerEmail;
    
    if (customerMap.has(customerKey)) {
      const customer = customerMap.get(customerKey)!;
      customer.orderCount++;
      customer.totalSpent += parseFloat(order.totalAmount);
      
      // Update last order date if this order is more recent
      if (!customer.lastOrderDate || (order.createdAt && new Date(order.createdAt) > new Date(customer.lastOrderDate))) {
        customer.lastOrderDate = order.createdAt?.toString() || null;
      }
    } else {
      const initials = order.customerName
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);

      customerMap.set(customerKey, {
        id: customerKey,
        name: order.customerName,
        email: order.customerEmail,
        orderCount: 1,
        totalSpent: parseFloat(order.totalAmount),
        lastOrderDate: order.createdAt?.toString() || null,
        initials
      });
    }
  });

  customerMap.forEach(customer => customers.push(customer));

  // Sort customers by total spent (descending)
  customers.sort((a, b) => b.totalSpent - a.totalSpent);

  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query)
    );
  });

  const handleExportCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Orders', 'Total Spent', 'Last Order'],
      ...filteredCustomers.map(customer => [
        customer.name,
        customer.email,
        customer.orderCount.toString(),
        `$${customer.totalSpent.toFixed(2)}`,
        customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getInitialsColor = (initials: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-yellow-500'
    ];
    
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">View and manage your customer base</p>
        </div>
        <Button 
          onClick={handleExportCSV} 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={customers.length === 0}
          data-testid="export-csv"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border text-foreground"
            data-testid="search-customers"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {/* Customers Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-muted-foreground">Loading customers...</div>
        </div>
      ) : customers.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No customers yet</h3>
            <p className="text-muted-foreground">
              Customers will appear here after they place their first order
            </p>
          </CardContent>
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No customers found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search query
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="bg-card border-border hover:bg-accent/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 ${getInitialsColor(customer.initials)} rounded-full flex items-center justify-center text-white font-semibold`}>
                      {customer.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" data-testid={`view-customer-${customer.id}`}>
                    View
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Orders</span>
                    </div>
                    <span className="font-semibold text-foreground">{customer.orderCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <span className="text-sm text-muted-foreground">Total spent</span>
                    </div>
                    <span className="font-semibold text-foreground">${customer.totalSpent.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Last order</span>
                    </div>
                    <span className="text-sm text-foreground">
                      {customer.lastOrderDate ? 
                        new Date(customer.lastOrderDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : 
                        'N/A'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}