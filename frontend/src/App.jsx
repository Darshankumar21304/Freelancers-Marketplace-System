import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Freelancers from './pages/Freelancers';
import GigDetail from './pages/GigDetail';
import Checkout from './pages/Checkout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import FreelancerJoin from './pages/auth/FreelancerJoin/FreelancerJoin';
import ClientJoin from './pages/auth/ClientJoin/ClientJoin';
import FreelancerProfile from './pages/profile/FreelancerProfile';

import DashboardLayout from './components/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import CreateGig from './pages/dashboard/CreateGig';
import Orders from './pages/dashboard/Orders';
import Chat from './pages/dashboard/Chat';
import Wallet from './pages/dashboard/Wallet';
import Profile from './pages/dashboard/Profile';
import MyProposals from './pages/dashboard/MyProposals';
import ReceivedProposals from './pages/dashboard/ReceivedProposals';
import ActiveProjects from './pages/dashboard/ActiveProjects';
import Portfolio from './pages/dashboard/Portfolio';
import GigHistory from './pages/dashboard/GigHistory';
import FreelancerChat from './pages/dashboard/FreelancerChat';
import Reviews from './pages/dashboard/Reviews';
import Settings from './pages/dashboard/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import HiredFreelancers from './pages/dashboard/HiredFreelancers';
import ClientOverview from './pages/dashboard/ClientOverview';
import ClientAnalytics from './pages/dashboard/ClientAnalytics';
import ClientSpending from './pages/dashboard/ClientSpending';
import ClientReviews from './pages/dashboard/ClientReviews';
import FreelancerAnalytics from './pages/dashboard/FreelancerAnalytics';
import Notifications from './pages/dashboard/Notifications';
import Disputes from './pages/dashboard/Disputes';
import BrowseFreelancers from './pages/dashboard/BrowseFreelancers';
import FreelancerPitches from './pages/dashboard/FreelancerPitches';


import AdminLayout from './components/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminListings from './pages/admin/AdminListings';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminPayouts from './pages/admin/AdminPayouts';
import AdminAiSecurity from './pages/admin/AdminAiSecurity';
import AdminTrustFraud from './pages/admin/AdminTrustFraud';
import AdminKyc from './pages/admin/AdminKyc';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StyleTest from './pages/StyleTest';
import { initTheme } from './utils/themeUtils';
import './App.css';

function App() {
  React.useEffect(() => {
    initTheme();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/freelancer-join" element={<FreelancerJoin />} />
            <Route path="/auth/client-join" element={<ClientJoin />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/freelancers" element={<Freelancers />} />
            <Route path="/freelancer/:id" element={<FreelancerProfile />} />
            <Route path="/gig/:id" element={<GigDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/style-test" element={<StyleTest />} />
            
            <Route path="/client/dashboard" element={<ProtectedRoute allowedRole="client"><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<ClientOverview />} />
              <Route path="chat" element={<Chat />} />
              <Route path="my-projects" element={<Orders />} />
              <Route path="proposals" element={<ReceivedProposals />} />
              <Route path="wallet" element={<ClientSpending />} />
              <Route path="create-project" element={<CreateGig />} />
              <Route path="post-project" element={<CreateGig />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="hired" element={<HiredFreelancers />} />
              <Route path="analytics" element={<ClientAnalytics />} />
              <Route path="browse-freelancers" element={<BrowseFreelancers />} />
              <Route path="reviews" element={<ClientReviews />} />
              <Route path="disputes" element={<Disputes />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="browse-projects" element={<Explore />} />
              <Route path="explore" element={<Explore />} />
              <Route path="gig/:id" element={<GigDetail />} />
            </Route>
            
            <Route path="/freelancer/dashboard" element={<ProtectedRoute allowedRole="freelancer"><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Overview />} />
              <Route path="chat" element={<FreelancerChat />} />
              <Route path="pitches" element={<FreelancerPitches />} />
              <Route path="my-proposals" element={<MyProposals />} />
              <Route path="active-projects" element={<ActiveProjects />} />
              <Route path="gig-history" element={<GigHistory />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="analytics" element={<FreelancerAnalytics />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="create-gig" element={<CreateGig />} />
              <Route path="profile" element={<Profile />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="disputes" element={<Disputes />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="browse-projects" element={<Explore />} />
              <Route path="explore" element={<Explore />} />
              <Route path="gig/:id" element={<GigDetail />} />
            </Route>

            {/* Admin Dashboard Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="listings" element={<AdminListings />} />
              <Route path="disputes" element={<AdminDisputes />} />
              <Route path="payouts" element={<AdminPayouts />} />
              <Route path="kyc" element={<AdminKyc />} />
              <Route path="trust-fraud" element={<AdminTrustFraud />} />
              <Route path="ai-security" element={<AdminAiSecurity />} />
            </Route>
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
