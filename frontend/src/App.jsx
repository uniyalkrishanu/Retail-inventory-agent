import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import InventoryList from './pages/InventoryList';
import Dashboard from './pages/Dashboard';
import SalesPage from './pages/SalesPage';
import VendorManagement from './pages/VendorManagement';
import PurchasePage from './pages/PurchasePage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import CustomersPage from './pages/CustomersPage';
import { Package, LayoutDashboard, ShoppingCart, Truck, FileText, User } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800">Trophy Manager</h1>
          </div>
          <nav className="mt-6">
            <Link to="/" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link to="/purchases" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
              <FileText className="w-5 h-5 mr-3" />
              Purchase
            </Link>
            <Link to="/inventory" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
              <Package className="w-5 h-5 mr-3" />
              Inventory
            </Link>
            <Link to="/vendors" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
              <Truck className="w-5 h-5 mr-3" />
              Vendors
            </Link>
            <Link to="/sales" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
              <ShoppingCart className="w-5 h-5 mr-3" />
              POS / Sales
            </Link>
            <Link to="/sales-history" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
              <FileText className="w-5 h-5 mr-3" />
              Sales History
            </Link>
            <Link to="/customers" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
              <User className="w-5 h-5 mr-3" />
              Ledger
            </Link>
          </nav>
        </aside>

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
