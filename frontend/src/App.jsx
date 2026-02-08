import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import InventoryList from './pages/InventoryList';
import Dashboard from './pages/Dashboard';
import SalesPage from './pages/SalesPage';
import VendorManagement from './pages/VendorManagement';
import PurchasePage from './pages/PurchasePage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import CustomersPage from './pages/CustomersPage';
import { Package, LayoutDashboard, ShoppingCart, Truck, FileText, User } from 'lucide-react';

// Separate Sidebar component to use useLocation hook properly
function Sidebar() {
  const location = useLocation();

  const navLinks = [
    { to: "/", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    { to: "/purchases", icon: <FileText className="w-5 h-5" />, label: "Purchase" },
    { to: "/inventory", icon: <Package className="w-5 h-5" />, label: "Inventory" },
    { to: "/vendors", icon: <Truck className="w-5 h-5" />, label: "Vendors" },
    { to: "/sales", icon: <ShoppingCart className="w-5 h-5" />, label: "POS / Sales" },
    { to: "/sales-history", icon: <FileText className="w-5 h-5" />, label: "Sales History" },
    { to: "/customers", icon: <User className="w-5 h-5" />, label: "Ledger" },
  ];

  return (
    <aside className="w-72 bg-[#5D9FD6] text-white flex flex-col shadow-2xl rounded-r-[32px] my-6 ml-0 overflow-hidden">
      <div className="p-10 mb-6">
        <h1 className="text-3xl font-black tracking-tighter">Natraj India</h1>
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
      <div className="p-8 border-t border-white/10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Natraj India v2.0</p>
      </div>
    </aside>
  );
}

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-[#F8F9FB]">
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/purchases" element={<PurchasePage />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/vendors" element={<VendorManagement />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/sales-history" element={<SalesHistoryPage />} />
            <Route path="/customers" element={<CustomersPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
