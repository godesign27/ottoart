import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import NotFound from "@/pages/not-found";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminCustomers from "@/pages/admin/customers";
import AdminOrders from "@/pages/admin/orders";
import AdminSubscriptions from "@/pages/admin/subscriptions";
import AdminMessages from "@/pages/admin/messages";
import AdminMailClub from "@/pages/admin/mail-club";
import AdminCategories from "@/pages/admin/categories";
import AdminGallery from "@/pages/admin/gallery";
import AdminEvents from "@/pages/admin/events";
import AdminCommissions from "@/pages/admin/commissions";
import AdminCV from "@/pages/admin/cv";
import AdminContact from "@/pages/admin/contact";
import AdminBio from "@/pages/admin/bio";
import AdminHome from "@/pages/admin/home";
import ArtistSettingsPage from "@/pages/admin/settings/artist";
import BusinessSettingsPage from "@/pages/admin/settings/business";
import ThemeSettingsPage from "@/pages/admin/settings/theme";
import SocialSettingsPage from "@/pages/admin/settings/social";
import TechStackPage from "@/pages/admin/settings/tech-stack";
import LiveSiteHome from "@/pages/live-site/home";
import ShopAllPage from "@/pages/live-site/shop-all";
import OriginalsPage from "@/pages/live-site/originals";
import PrintsPage from "@/pages/live-site/prints";
import AccessoriesPage from "@/pages/live-site/accessories";
import BioPage from "@/pages/live-site/bio";
import GalleryPage from "@/pages/live-site/gallery";
import EventsPage from "@/pages/live-site/events";
import CVPage from "@/pages/live-site/cv";
import ContactPage from "@/pages/live-site/contact";
import ProductDetailPage from "@/pages/live-site/product-detail";
import CheckoutPage from "@/pages/live-site/checkout";
import CheckoutSuccessPage from "@/pages/live-site/checkout-success";
import FavoritesPage from "@/pages/live-site/favorites";
import MailClubPage from "@/pages/live-site/mail-club";
import MailClubSuccessPage from "@/pages/live-site/mail-club-success";
import AccountPage from "@/pages/live-site/account";
import OrdersPage from "@/pages/orders";
import ProfilePage from "@/pages/profile";
import { ArtWallPage } from "@/pages/live-site/art-wall";
import CorporateBuyersPage from "@/pages/live-site/corporate-buyers";
import CommissionPage from "@/pages/live-site/commission";
import AdminBoardsPage from "@/pages/admin/boards";
import AdminBoardDetailPage from "@/pages/admin/board-detail";
import BoardViewPage from "@/pages/live-site/board-view";
import AdminArtShowsPage from "@/pages/admin/art-shows";
import AdminArtShowDetailPage from "@/pages/admin/art-show-detail";
import PosCheckoutPage from "@/pages/live-site/pos-checkout";
import CertificatesPage from "@/pages/admin/certificates";
import PostsPage from "@/pages/admin/posts";
import MailingListPage from "@/pages/admin/mailing-list";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LiveSiteHome} />
      <Route path="/shop-all" component={ShopAllPage} />
      <Route path="/originals" component={OriginalsPage} />
      <Route path="/prints" component={PrintsPage} />
      <Route path="/accessories" component={AccessoriesPage} />
      <Route path="/bio" component={BioPage} />
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/art-wall" component={ArtWallPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/cv" component={CVPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/corporate-buyers" component={CorporateBuyersPage} />
      <Route path="/commission" component={CommissionPage} />
      <Route path="/board/:slug" component={BoardViewPage} />
      <Route path="/product/:id" component={ProductDetailPage} />
      <Route path="/favorites" component={FavoritesPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/account" component={AccountPage} />
      <Route path="/mail-club/success" component={MailClubSuccessPage} />
      <Route path="/mail-club" component={MailClubPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/home" component={AdminHome} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/subscriptions" component={AdminSubscriptions} />
      <Route path="/admin/messages" component={AdminMessages} />
      <Route path="/admin/mail-club" component={AdminMailClub} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/gallery" component={AdminGallery} />
      <Route path="/admin/events" component={AdminEvents} />
      <Route path="/admin/boards" component={AdminBoardsPage} />
      <Route path="/admin/boards/:id" component={AdminBoardDetailPage} />
      <Route path="/admin/art-shows" component={AdminArtShowsPage} />
      <Route path="/admin/art-shows/:id" component={AdminArtShowDetailPage} />
      <Route path="/admin/certificates" component={CertificatesPage} />
      <Route path="/admin/posts" component={PostsPage} />
      <Route path="/admin/mailing-list" component={MailingListPage} />
      <Route path="/pos/:id" component={PosCheckoutPage} />
      <Route path="/admin/commissions" component={AdminCommissions} />
      <Route path="/admin/cv" component={AdminCV} />
      <Route path="/admin/contact" component={AdminContact} />
      <Route path="/admin/bio" component={AdminBio} />
      <Route path="/admin/settings/artist" component={ArtistSettingsPage} />
      <Route path="/admin/settings/business" component={BusinessSettingsPage} />
      <Route path="/admin/settings/theme" component={ThemeSettingsPage} />
      <Route path="/admin/settings/social" component={SocialSettingsPage} />
      <Route path="/admin/settings/tech-stack" component={TechStackPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
