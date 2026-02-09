import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import InventoryList from './pages/InventoryList';
import Dashboard from './pages/Dashboard';
import SalesPage from './pages/SalesPage';
import VendorManagement from './pages/VendorManagement';
import PurchasePage from './pages/PurchasePage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import CustomersPage from './pages/CustomersPage';
import { Package, LayoutDashboard, ShoppingCart, Truck, FileText, User as UserIcon, LogOut, Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8F9FB]">
        <Loader2 className="w-12 h-12 text-[#5D9FD6] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#5D9FD6] animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Authenticating...</p>
        </div>
      </div>
    );
  }

  return children;
};

// Separate Sidebar component to use useLocation hook properly
function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navLinks = [
    { to: "/", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    { to: "/purchases", icon: <FileText className="w-5 h-5" />, label: "Purchase" },
    { to: "/inventory", icon: <Package className="w-5 h-5" />, label: "Inventory" },
    { to: "/vendors", icon: <Truck className="w-5 h-5" />, label: "Vendors" },
    { to: "/sales", icon: <ShoppingCart className="w-5 h-5" />, label: "POS / Sales" },
    { to: "/sales-history", icon: <FileText className="w-5 h-5" />, label: "Sales History" },
    { to: "/customers", icon: <UserIcon className="w-5 h-5" />, label: "Ledger" },
  ];

  if (!user) return null;

  return (
    <aside className="w-72 bg-[#5D9FD6] text-white flex flex-col shadow-2xl rounded-r-[32px] my-6 ml-0 overflow-hidden">
      <div className="p-10 mb-6">
        <h1 className="text-3xl font-black tracking-tighter">Inventory Agent</h1>
        <div className="mt-4 flex items-center gap-3 p-3 bg-white/10 rounded-2xl border border-white/10 overflow-hidden">
          <div className="w-10 h-10 min-w-10 rounded-xl bg-white/20 flex items-center justify-center font-black uppercase text-sm">
            {user.username.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate capitalize">{user.username}</span>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 truncate">{user.role}</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center px-6 py-4 rounded-2xl transition-all duration-200 group hover:bg-white/10 ${isActive ? 'bg-white/20 font-bold text-white' : 'text-white/80'}`}
            >
              <span className="mr-4 group-hover:scale-110 transition-transform">{link.icon}</span>
              <span className="text-sm font-medium uppercase tracking-widest">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-white/10">
        {/* Logout removed as per requirement */}
      </div>

      <div className="p-8 border-t border-white/10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Natraj India v2.0</p>
      </div>
    </aside>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex h-screen bg-[#F8F9FB]">
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-8">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/purchases" element={<ProtectedRoute><PurchasePage /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><InventoryList /></ProtectedRoute>} />
              <Route path="/vendors" element={<ProtectedRoute><VendorManagement /></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
              <Route path="/sales-history" element={<ProtectedRoute><SalesHistoryPage /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
