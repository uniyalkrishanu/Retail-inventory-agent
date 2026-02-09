import React, { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, User, Search, IndianRupee, FileText, Trash2, Edit, RotateCcw, ChevronDown, RefreshCw } from 'lucide-react';

const SalesHistoryPage = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        customer_name: '',
        invoice_number: ''
    });

    const [customers, setCustomers] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false); // Added
    const [editForm, setEditForm] = useState({ customer_name: '', payment_status: '', items: [] });
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentType, setPaymentType] = useState('full'); // 'full' or 'partial'
    const [dateRange, setDateRange] = useState('30d');
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
                return null; // Keep existing filters for custom
            default:
                break;
        }
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    };

    const handleDateRangeChange = (range) => {
        setDateRange(range);
        if (range !== 'custom') {
            const dates = calculateDates(range);
            if (dates) {
                setFilters(prev => ({ ...prev, start_date: dates.start, end_date: dates.end }));
            }
        }
        setShowDateDropdown(false);
    };

    const fetchSales = async () => {
        setLoading(true);
        try {
            let query = '/sales/?';
            if (filters.start_date) query += `start_date=${filters.start_date}&`;
            if (filters.end_date) query += `end_date=${filters.end_date}&`;
            if (filters.customer_name) query += `customer_name=${filters.customer_name}&`;
            if (filters.invoice_number) query += `invoice_number=${filters.invoice_number}&`;

            const response = await api.get(query);
            setSales(response.data);
        } catch (error) {
            console.error("Failed to fetch sales history", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/sales/customers');
            setCustomers(response.data);
        } catch (error) {
            console.error("Failed to fetch customers", error);
        }
    };

    useEffect(() => {
        fetchSales();
        fetchCustomers();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSales();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters.start_date, filters.end_date, filters.customer_name, filters.invoice_number]);

    const handleRowClick = (sale) => {
        setSelectedSale(sale);
        setEditForm({
            customer_name: sale.customer_name || 'Walk-in Customer',
            payment_status: sale.payment_status || 'Paid',
            items: sale.items.map(i => ({ trophy_id: i.trophy_id, quantity: i.quantity, name: i.trophy_name }))
        });
        setShowEditModal(true);
    };

    const handleUpdateSale = async () => {
        try {
            await api.put(`/sales/${selectedSale.id}`, {
                customer_name: editForm.customer_name,
                payment_status: editForm.payment_status,
                items: editForm.items.map(i => ({ trophy_id: i.trophy_id, quantity: i.quantity }))
            });
            setShowEditModal(false);
            fetchSales();
            fetchCustomers();
            alert("Sale updated successfully");
        } catch (error) {
            alert("Failed to update sale: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleRegisterPayment = async () => {
        const amountToPay = paymentType === 'full'
            ? (selectedSale.total_amount - (selectedSale.paid_amount || 0))
            : parseFloat(paymentAmount);

        if (!amountToPay || amountToPay <= 0) return;

        try {
            await api.post(`/sales/${selectedSale.id}/pay?amount=${amountToPay}`);
            setPaymentAmount('');
            setPaymentType('full');
            setShowPaymentModal(false); // Close payment modal
            setShowEditModal(false);    // Also close edit modal if open
            fetchSales();
            alert("Payment registered");
        } catch (error) {
            alert("Failed to pay: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleDeleteSale = async (e, id) => {
        e.stopPropagation(); // Avoid opening edit modal
        if (!window.confirm("Are you sure you want to delete this sale? This will revert stock and customer balance impact.")) return;
        try {
            await api.delete(`/sales/${id}`);
            fetchSales();
            fetchCustomers();
            alert("Sale deleted and stock reverted");
        } catch (error) {
            alert("Failed to delete sale: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleOpenPaymentFromTable = (e, sale) => {
        e.stopPropagation();
        setSelectedSale(sale);
        setPaymentAmount('');
        setPaymentType('full');
        setShowPaymentModal(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-gray-800 tracking-tighter">Sales History</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Archive of all completed transactions</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => fetchSales()}
                        className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-[#5D9FD6] transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>

                    {/* Date Range Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDateDropdown(!showDateDropdown)}
                            className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all font-bold text-gray-700"
                        >
                            <Calendar size={18} className="text-[#5D9FD6]" />
                            <span className="text-sm">{relativeRanges[dateRange]}</span>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showDateDropdown && (
                            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-[24px] shadow-2xl z-50 p-3">
                                {Object.entries(relativeRanges).filter(([k]) => k !== 'custom').map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleDateRangeChange(key)}
                                        className={`w-full text-left px-5 py-3 rounded-xl text-sm font-semibold transition-colors ${dateRange === key ? 'bg-[#5D9FD6] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                                <div className="border-t border-gray-100 mt-2 pt-2">
                                    <p className="px-5 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Custom Range</p>
                                    <div className="flex gap-2 px-3 pb-2">
                                        <input
                                            type="date"
                                            name="start_date"
                                            value={filters.start_date}
                                            onChange={(e) => { handleFilterChange(e); setDateRange('custom'); }}
                                            className="flex-1 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl outline-none focus:border-[#5D9FD6]"
                                        />
                                        <input
                                            type="date"
                                            name="end_date"
                                            value={filters.end_date}
                                            onChange={(e) => { handleFilterChange(e); setDateRange('custom'); }}
                                            className="flex-1 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl outline-none focus:border-[#5D9FD6]"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowDateDropdown(false)}
                                        className="w-full mx-3 mb-2 px-4 py-2 bg-[#5D9FD6] text-white rounded-xl text-xs font-bold uppercase tracking-widest"
                                        style={{ width: 'calc(100% - 24px)' }}
                                    >
                                        Apply Custom Range
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Customer Search */}
                    <div className="flex items-center bg-white px-5 py-3.5 rounded-2xl border border-gray-100 shadow-sm">
                        <User className="w-4 h-4 text-gray-400 mr-3" />
                        <input
                            type="text"
                            name="customer_name"
                            value={filters.customer_name}
                            onChange={handleFilterChange}
                            placeholder="Search customer..."
                            className="bg-transparent outline-none text-sm font-semibold w-40 placeholder:text-gray-300"
                            list="customer-list"
                        />
                    </div>

                    <button
                        onClick={() => { setFilters({ start_date: '', end_date: '', customer_name: '', invoice_number: '' }); setDateRange('30d'); handleDateRangeChange('30d'); }}
                        className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-red-500 transition-all"
                        title="Reset All Filters"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/50">
                            {[
                                { key: 'timestamp', label: 'Timeline' },
                                { key: 'invoice_number', label: 'Invoice' },
                                { key: 'customer_name', label: 'Party' },
                                { key: 'payment_status', label: 'Payment Status' },
                                { key: 'balance', label: 'Balance Due' },
                                { key: 'total_amount', label: 'Grand Total' }
                            ].map(({ key, label }) => (
                                <th
                                    key={key}
                                    className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"
                                >
                                    {label}
                                </th>
                            ))}
                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Operation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="7" className="px-8 py-20 text-center text-gray-400 font-black uppercase text-xs animate-pulse">Synchronizing Data...</td></tr>
                        ) : sales.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center opacity-20 filter grayscale">
                                        <FileText size={48} className="mb-4" />
                                        <p className="font-black uppercase tracking-widest text-xs italic">Archive empty</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            sales.map((sale) => (
                                <tr key={sale.id} onClick={() => handleRowClick(sale)} className="group hover:bg-gray-50/50 transition cursor-pointer">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-extrabold text-gray-800 tracking-tight">{new Date(sale.timestamp).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-[11px] font-black text-[#5D9FD6]">#{sale.invoice_number || sale.id}</td>
                                    <td className="px-8 py-6 font-extrabold text-gray-800 uppercase tracking-tighter">
                                        {sale.customer_name || 'Walk-in Customer'}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${sale.payment_status === 'Paid' ? 'bg-[#E8F5E9] text-[#66BB6A]' :
                                            sale.payment_status === 'Partially Paid' ? 'bg-[#FFF9C4] text-[#FBC02D]' :
                                                'bg-[#FFEBEE] text-[#EF5350]'
                                            }`}>
                                            {sale.payment_status || 'Paid'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 font-black text-red-500 text-sm">
                                        {sale.payment_status !== 'Paid' ? `₹${(sale.total_amount - (sale.paid_amount || 0)).toLocaleString()}` : '—'}
                                    </td>
                                    <td className="px-8 py-6 font-black text-gray-800 text-sm">
                                        ₹{sale.total_amount.toLocaleString()}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-end gap-2">
                                            {sale.payment_status !== 'Paid' && (
                                                <button onClick={(e) => handleOpenPaymentFromTable(e, sale)} title="Settle" className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition-colors">
                                                    <IndianRupee size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => handleRowClick(sale)} title="View" className="p-2 text-[#5D9FD6] hover:bg-blue-50 rounded-xl transition-colors">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={(e) => handleDeleteSale(e, sale.id)} title="Remove" className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showEditModal && selectedSale && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto shadow-2xl scale-in">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-gray-800">Sale Details</h2>
                                <p className="text-gray-400 text-sm font-bold">Invoice #{selectedSale.invoice_number || selectedSale.id}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-300 hover:text-gray-600 text-3xl transition">&times;</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <h3 className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Customer & Status</h3>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Party Name</label>
                                    <input type="text" className="w-full border-gray-200 border p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition" value={editForm.customer_name} onChange={e => setEditForm({ ...editForm, customer_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">Payment Status</label>
                                    <select className="w-full border-gray-200 border p-2.5 rounded-xl bg-white font-black text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition" value={editForm.payment_status} onChange={e => setEditForm({ ...editForm, payment_status: e.target.value })}>
                                        <option value="Paid">Paid</option>
                                        <option value="Due">Due</option>
                                        <option value="Partially Paid">Partially Paid</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                <h3 className="font-black text-blue-400 uppercase text-[10px] tracking-widest">Payment Transaction</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-blue-600 font-bold">Total Bill:</span>
                                        <span className="font-black text-gray-800">₹{selectedSale.total_amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-blue-600 font-bold">Received:</span>
                                        <span className="font-black text-green-600">₹{(selectedSale.paid_amount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xl border-t border-blue-100 pt-3 mt-2">
                                        <span className="font-black text-blue-900">Balance:</span>
                                        <span className="font-black text-red-600 font-mono tracking-tighter">₹{(selectedSale.total_amount - (selectedSale.paid_amount || 0)).toFixed(2)}</span>
                                    </div>
                                </div>

                                {selectedSale.payment_status !== 'Paid' && (
                                    <div className="mt-4 pt-4 border-t border-blue-100">
                                        <label className="block text-xs font-black text-blue-400 mb-2 uppercase tracking-widest">Register Payment (₹)</label>
                                        <div className="flex gap-2">
                                            <input type="number" className="flex-1 border-blue-100 border p-2.5 rounded-xl bg-white focus:ring-2 focus:ring-green-100 outline-none transition" placeholder="Amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                                            <button onClick={handleRegisterPayment} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-black hover:bg-green-700 shadow-md shadow-green-200 transition">PAY</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-black text-gray-400 uppercase text-[10px] tracking-widest mb-4 px-2">Order Items</h3>
                            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-400 font-bold text-[10px] uppercase">
                                            <th className="p-4 text-left">Item</th>
                                            <th className="p-4 text-center w-32">Qty</th>
                                            <th className="p-4 text-right w-32">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {editForm.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="p-4 font-bold text-gray-700">{item.name}</td>
                                                <td className="p-4 text-center">
                                                    <input type="number" className="w-20 border-gray-100 border p-2 rounded-lg text-center font-bold focus:ring-2 focus:ring-indigo-50 outline-none" value={item.quantity} onChange={e => {
                                                        const newItems = [...editForm.items];
                                                        newItems[idx].quantity = parseInt(e.target.value) || 0;
                                                        setEditForm({ ...editForm, items: newItems });
                                                    }} />
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => {
                                                        const newItems = editForm.items.filter((_, i) => i !== idx);
                                                        setEditForm({ ...editForm, items: newItems });
                                                    }} className="text-red-400 hover:text-red-600 font-bold transition">Remove</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-gray-100 pt-8 mt-2">
                            <button className="flex items-center px-6 py-3 border-2 border-gray-100 rounded-2xl font-black text-gray-300 cursor-not-allowed text-sm">
                                <FileText size={18} className="mr-2" /> PRINT MINI RECEIPT
                            </button>
                            <div className="flex gap-4">
                                <button onClick={() => setShowEditModal(false)} className="px-6 py-3 text-gray-400 font-black hover:text-gray-600 transition">CANCEL</button>
                                <button onClick={handleUpdateSale} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition tracking-wide">SAVE CHANGES</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Standardized Payment Modal */}
            {showPaymentModal && selectedSale && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl scale-in">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Register Payment</h2>
                            <button onClick={() => setShowPaymentModal(false)} className="text-gray-300 hover:text-gray-600 text-2xl">&times;</button>
                        </div>

                        <p className="text-gray-400 font-bold text-xs uppercase mb-4">Invoice #{selectedSale.invoice_number || selectedSale.id} ({selectedSale.customer_name || 'Walk-in Customer'})</p>

                        <div className="bg-gray-50/50 rounded-2xl p-6 mb-8 border border-gray-100 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Bill</p>
                                <p className="text-lg font-black text-gray-800">₹{selectedSale.total_amount.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Remaining</p>
                                <p className="text-lg font-black text-red-600">₹{(selectedSale.total_amount - (selectedSale.paid_amount || 0)).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div
                                onClick={() => setPaymentType('full')}
                                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentType === 'full' ? 'border-green-500 bg-green-50/50 ring-4 ring-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentType === 'full' ? 'border-green-500 bg-green-500' : 'border-gray-200'}`}>
                                        {paymentType === 'full' && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-800 uppercase text-xs tracking-tight">Full Payment</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Settle the entire balance</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => setPaymentType('partial')}
                                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentType === 'partial' ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentType === 'partial' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-200'}`}>
                                        {paymentType === 'partial' && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-800 uppercase text-xs tracking-tight">Partial Payment</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Pay a specific amount</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {paymentType === 'partial' && (
                            <div className="mb-8 scale-in">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Amount to pay (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full border-2 border-indigo-100 rounded-2xl p-4 text-xl font-black focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                    placeholder="0.00"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1 py-4 text-gray-400 font-black rounded-2xl hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRegisterPayment}
                                className={`flex-1 py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs ${paymentType === 'full' ? 'bg-green-600 shadow-green-100 hover:bg-green-700' : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'}`}
                            >
                                Confirm {paymentType === 'full' ? `₹${(selectedSale.total_amount - (selectedSale.paid_amount || 0)).toFixed(2)}` : 'Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesHistoryPage;
