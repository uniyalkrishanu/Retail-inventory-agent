import React, { useEffect, useState, useMemo } from 'react';
import api from '../api';
import { TrendingUp, Package, AlertTriangle, IndianRupee, Calendar, ChevronDown, RefreshCw, Users, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_sales_count: 0,
        total_revenue: 0,
        total_profit: 0,
        total_expense: 0,
        current_stock_value: 0
    });
    const [salesTrend, setSalesTrend] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('mtd');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [showDateDropdown, setShowDateDropdown] = useState(false);

    const relativeRanges = {
        'today': 'Today',
        'yesterday': 'Yesterday',
        '7d': 'Last 7 Days',
        '30d': 'Last 30 Days',
        'mtd': 'Month to Date',
        'ytd': 'Year to Date',
        'last_month': 'Last Month',
        'all': 'All Time',
        'custom': 'Custom Range'
    };

    const calculateDates = (range) => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        switch (range) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                break;
            case 'yesterday':
                start.setDate(now.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(now.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                break;
            case '7d':
                start.setDate(now.getDate() - 7);
                break;
            case '30d':
                start.setDate(now.getDate() - 30);
                break;
            case 'mtd':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'ytd':
                start = new Date(now.getFullYear(), 0, 1);
                break;
            case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;
            case 'all':
                start = new Date(2000, 0, 1);
                break;
            case 'custom':
                if (customRange.start && customRange.end) {
                    start = new Date(customRange.start);
                    end = new Date(customRange.end);
                    end.setHours(23, 59, 59, 999);
                }
                break;
            default:
                break;
        }
        return { start, end };
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const { start, end } = calculateDates(dateRange);
            const startISO = start.toISOString();
            const endISO = end.toISOString();

            const [statsRes, trendRes, topRes, inventoryRes] = await Promise.all([
                api.get(`/analytics/dashboard?start_date=${startISO}&end_date=${endISO}`),
                api.get(`/analytics/sales_trend?start_date=${startISO}&end_date=${endISO}`),
                api.get('/inventory/top-sellers/'),
                api.get('/inventory/')
            ]);

            setStats(statsRes.data);
            setSalesTrend(trendRes.data);
            setTopProducts(topRes.data.slice(0, 5));

            // Find low stock items (quantity < 10)
            const lowStock = inventoryRes.data.filter(item => item.quantity < 10 && item.quantity > 0).slice(0, 5);
            setLowStockItems(lowStock);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange, customRange]);

    const displayRange = relativeRanges[dateRange] || "Custom Range";

    const COLORS = ['#5D9FD6', '#66BB6A', '#FBC02D', '#EF5350', '#AB47BC'];

    const pieData = topProducts.map((p, i) => ({
        name: p.name,
        value: p.total_sold || 1,
        color: COLORS[i % COLORS.length]
    }));

    return (
        <div className="space-y-10 pb-12">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Dashboard</h1>
                    <p className="text-gray-400 text-sm font-medium">Business overview for Natraj India</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => fetchData()}
                        className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-[#5D9FD6] transition-all"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowDateDropdown(!showDateDropdown)}
                            className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all font-bold text-gray-700"
                        >
                            <Calendar size={18} className="text-[#5D9FD6]" />
                            <span>{displayRange}</span>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showDateDropdown && (
                            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-[24px] shadow-2xl z-50 p-3">
                                {Object.entries(relativeRanges).filter(([k]) => k !== 'custom').map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => { setDateRange(key); setShowDateDropdown(false); }}
                                        className={`w-full text-left px-5 py-3 rounded-xl text-sm font-bold transition-colors ${dateRange === key ? 'bg-[#5D9FD6] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                                <div className="border-t border-gray-100 mt-2 pt-2">
                                    <p className="px-5 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Custom Range</p>
                                    <div className="flex gap-2 px-3 pb-2">
                                        <input
                                            type="date"
                                            value={customRange.start}
                                            onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                            className="flex-1 px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl outline-none focus:border-[#5D9FD6]"
                                        />
                                        <input
                                            type="date"
                                            value={customRange.end}
                                            onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                            className="flex-1 px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl outline-none focus:border-[#5D9FD6]"
                                        />
                                    </div>
                                    <button
                                        onClick={() => { setDateRange('custom'); setShowDateDropdown(false); }}
                                        disabled={!customRange.start || !customRange.end}
                                        className="w-full mx-3 mb-2 px-4 py-2 bg-[#5D9FD6] text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ width: 'calc(100% - 24px)' }}
                                    >
                                        Apply Custom Range
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Revenue', value: `₹${stats.total_revenue.toLocaleString()}`, bgColor: 'bg-[#E8F5E9]', icon: IndianRupee, iconColor: 'text-[#66BB6A]' },
                    { label: 'Transactions', value: stats.total_sales_count.toLocaleString(), bgColor: 'bg-[#E3F2FD]', icon: ShoppingCart, iconColor: 'text-[#5D9FD6]' },
                    { label: 'Total Expenses', value: `₹${stats.total_expense.toLocaleString()}`, bgColor: 'bg-[#FCE4EC]', icon: TrendingUp, iconColor: 'text-[#EF5350]' },
                    { label: 'Stock Value', value: `₹${stats.current_stock_value.toLocaleString()}`, bgColor: 'bg-[#F3E5F5]', icon: Package, iconColor: 'text-[#AB47BC]' },
                ].map((item, idx) => (
                    <div key={idx} className={`${item.bgColor} p-8 rounded-[24px] shadow-sm transition-transform hover:-translate-y-1`}>
                        <div className={`flex justify-end mb-4 ${item.iconColor}`}>
                            <item.icon size={24} />
                        </div>
                        <p className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-1">{item.label}</p>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">{item.value}</h3>
                    </div>
                ))}
            </div>

            {/* Sales Trend Chart */}
            <div className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-100">
                <div className="mb-10">
                    <h3 className="text-xl font-extrabold text-gray-800">Sales Trend</h3>
                    <p className="text-gray-400 text-sm font-medium">Revenue over time for {displayRange}</p>
                </div>
                <div className="h-[300px] w-full">
                    {salesTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesTrend}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#5D9FD6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#5D9FD6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#66BB6A" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#66BB6A" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F0F0F0" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#BDBDBD', fontSize: 11, fontWeight: 'bold' }}
                                    dy={15}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#BDBDBD', fontSize: 11, fontWeight: 'bold' }}
                                    dx={-10}
                                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#5D9FD6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    name="Revenue"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="profit"
                                    stroke="#66BB6A"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorProfit)"
                                    name="Profit"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-300 font-bold">
                            No sales data for selected period
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Selling Products */}
                <div className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-extrabold text-gray-800">Top Products</h3>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">By Units Sold</span>
                    </div>
                    {topProducts.length > 0 ? (
                        <div className="space-y-4">
                            {topProducts.map((product, idx) => (
                                <div key={product.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-extrabold text-gray-800 text-sm uppercase tracking-tight">{product.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400">{product.total_sold || 0} units sold</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-[#5D9FD6]">₹{product.selling_price?.toLocaleString() || 0}</p>
                                        <p className="text-[10px] font-bold text-gray-400">Stock: {product.quantity || 0}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-300 font-bold">
                            No sales data available
                        </div>
                    )}
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-extrabold text-gray-800">Low Stock Alerts</h3>
                        <span className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase">{lowStockItems.length} Items</span>
                    </div>
                    {lowStockItems.length > 0 ? (
                        <div className="space-y-4">
                            {lowStockItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 p-4 bg-red-50/50 rounded-2xl border border-red-100">
                                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                        <AlertTriangle size={18} className="text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-extrabold text-gray-800 text-sm uppercase tracking-tight">{item.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400">SKU: {item.sku || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-red-500">{item.quantity} left</p>
                                        <p className="text-[10px] font-bold text-gray-400">Reorder soon</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-green-400 font-bold">
                            <Package size={24} className="mr-2" />
                            All items well stocked!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
