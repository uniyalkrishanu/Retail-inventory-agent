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
import LoginPage from './pages/LoginPage';

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
    return <Navigate to="/login" replace />;
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
    <aside className="w-64 bg-[#5D9FD6] text-white flex flex-col shadow-2xl rounded-r-[32px] overflow-hidden">
      <div className="p-8 mb-2">
        <h1 className="text-2xl font-black tracking-tighter">Inventory Agent</h1>
        <div className="mt-4 flex items-center gap-3 p-2 bg-white/10 rounded-2xl border border-white/10 overflow-hidden">
          <div className="w-8 h-8 min-w-[32px] rounded-xl bg-white/20 flex items-center justify-center font-black uppercase text-xs">
            {user.username.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold truncate capitalize">{user.username}</span>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60 truncate">{user.role}</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-white/10 ${isActive ? 'bg-white/20 font-bold text-white' : 'text-white/80'}`}
            >
              <span className="mr-3 group-hover:scale-110 transition-transform">{link.icon}</span>
              <span className="text-[11px] font-bold uppercase tracking-widest">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto bg-black/5">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-white/10 text-white/80 hover:text-white"
        >
          <span className="mr-3 group-hover:scale-110 transition-transform"><LogOut className="w-5 h-5" /></span>
          <span className="text-[11px] font-bold uppercase tracking-widest">Logout</span>
        </button>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 mt-3 text-center">Natraj India v2.0</p>
      </div>
    </aside>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex h-screen bg-[#F8F9FB]">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="*"
              element={
                <>
                  <Sidebar />
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
                </>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
