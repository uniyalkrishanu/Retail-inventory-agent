import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, Edit, Trash2, Phone, Mail, MapPin, IndianRupee, FileText, Filter, AlertCircle, X } from 'lucide-react';

const VendorManagement = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [formData, setFormData] = useState({
        name: '', address: '', mobile: '', email: ''
    });

    // Vendor ledger states
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [vendorPurchases, setVendorPurchases] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentType, setPaymentType] = useState('full'); // 'full' or 'partial'
    const [isDues, setIsDues] = useState(false);
    const [showDuesOnly, setShowDuesOnly] = useState(false); // Added

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const response = await api.get('/vendors/');
            setVendors(response.data);
        } catch (error) {
            console.error("Failed to fetch vendors", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleSave = async () => {
        try {
            if (editingVendor) {
                await api.put(`/vendors/${editingVendor.id}`, formData);
            } else {
                await api.post('/vendors/', formData);
            }
            setShowModal(false);
            setEditingVendor(null);
            setFormData({ name: '', address: '', mobile: '', email: '' });
            fetchVendors();
        } catch (error) {
            alert("Failed to save vendor: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleEdit = (vendor) => {
        setEditingVendor(vendor);
        setFormData({
            name: vendor.name,
            address: vendor.address || '',
            mobile: vendor.mobile || '',
            email: vendor.email || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this vendor?")) return;
        try {
            await api.delete(`/vendors/${id}`);
            fetchVendors();
        } catch (error) {
            alert("Failed to delete vendor");
        }
    };

    const [vendorSearch, setVendorSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredVendors = React.useMemo(() => {
        let result = vendors.filter(v =>
            v.name.toLowerCase().includes(vendorSearch.toLowerCase())
        );

        if (showDuesOnly) {
            result = result.filter(v => v.current_balance < 0);
        }

        if (sortConfig.key) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [vendors, vendorSearch, sortConfig, showDuesOnly]);

    // Fetch vendor purchase history
    const handleViewHistory = async (vendor) => {
        setSelectedVendor(vendor);
        setShowHistoryModal(true);
        try {
            const res = await api.get(`/vendors/${vendor.id}/purchases`);
            setVendorPurchases(res.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    // Open payment modal
    const openPaymentModal = (vendor) => {
        setSelectedVendor(vendor);
        setPaymentAmount('');
        setIsDues(false);
        setShowPaymentModal(true);
    };

    // Register payment to vendor
    const handleRegisterPayment = async () => {
        let amountToPay = 0;

        if (isDues) {
            amountToPay = -parseFloat(paymentAmount);
        } else {
            amountToPay = paymentType === 'full'
                ? Math.abs(selectedVendor.current_balance)
                : parseFloat(paymentAmount);
        }

        if (!amountToPay || Math.abs(amountToPay) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            const res = await api.post(`/vendors/${selectedVendor.id}/payments?amount=${amountToPay}`);
            alert(res.data.message);
            setShowPaymentModal(false);
            setPaymentType('full');
            setPaymentAmount('');
            fetchVendors();
        } catch (error) {
            alert('Failed to register transaction');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">Suppliers</h2>
                    <p className="text-gray-400 text-sm font-medium">Manage your vendor connections and balances.</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Find vendors..."
                            className="bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold shadow-sm focus:ring-4 focus:ring-[#5D9FD6]/10 outline-none w-64 transition-all"
                            value={vendorSearch}
                            onChange={(e) => setVendorSearch(e.target.value)}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowDuesOnly(!showDuesOnly)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm ${showDuesOnly ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
                    >
                        <AlertCircle size={16} className={showDuesOnly ? 'text-red-500' : 'text-gray-400'} />
                        {showDuesOnly ? 'Showing Dues' : 'Show Pending Dues'}
                    </button>

                    <button
                        onClick={() => {
                            setEditingVendor(null);
                            setFormData({ name: '', address: '', mobile: '', email: '' });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-[#5D9FD6] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#5D9FD6]/20 hover:bg-[#4A8FC6] transition-all active:scale-95"
                    >
                        <Plus size={16} />
                        Add Supplier
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/50">
                            {[
                                { key: 'name', label: 'Company Name' },
                                { key: 'mobile', label: 'Contact Details' },
                                { key: 'current_balance', label: 'Financial Status' }
                            ].map(({ key, label }) => (
                                <th
                                    key={key}
                                    onClick={() => requestSort(key)}
                                    className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-900 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {label}
                                        {sortConfig.key === key && (
                                            sortConfig.direction === 'asc' ? <span className="text-[#5D9FD6]">↑</span> : <span className="text-[#5D9FD6]">↓</span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Operation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredVendors.length > 0 ? filteredVendors.map((vendor) => (
                            <tr key={vendor.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <p className="text-sm font-extrabold text-gray-800">{vendor.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter max-w-xs truncate">{vendor.address || 'Global Supplier'}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <p className="text-xs font-bold text-gray-700">{vendor.mobile || 'No Contact'}</p>
                                        <p className="text-[10px] font-medium text-gray-400 lowercase">{vendor.email || '-'}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col items-start border-l-2 pl-4 border-gray-50 group-hover:border-[#5D9FD6]/20 transition-all">
                                        <span className={`text-sm font-black ${vendor.current_balance < 0 ? 'text-red-500' : vendor.current_balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                            ₹{Math.abs(vendor.current_balance || 0).toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                                            {vendor.current_balance < 0 ? 'Credit Due' : vendor.current_balance > 0 ? 'Advance Paid' : 'Settled'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => handleViewHistory(vendor)} title="View History" className="p-3 text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"><FileText size={18} /></button>
                                        <button onClick={() => openPaymentModal(vendor)} title="Record Payment" className="p-3 text-green-600 hover:bg-green-50 rounded-2xl transition-all"><IndianRupee size={18} /></button>
                                        <button onClick={() => handleEdit(vendor)} title="Edit Vendor" className="p-3 text-[#5D9FD6] hover:bg-blue-50 rounded-2xl transition-all"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(vendor.id)} title="Delete Vendor" className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="py-20 text-center">
                                    <p className="text-gray-300 font-black uppercase tracking-widest text-xs italic">No suppliers in your records</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Redesigned Minimalist Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-lg w-full scale-in border border-white">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-800 tracking-tight">{editingVendor ? 'Edit Supplier' : 'New Supplier'}</h3>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Enter vendor and contact details</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-700 transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: 'Supplier Name', key: 'name', type: 'text' },
                                { label: 'Office Address', key: 'address', type: 'text' },
                                { label: 'Mobile Number', key: 'mobile', type: 'text' },
                                { label: 'Email Address', key: 'email', type: 'email' },
                            ].map((field) => (
                                <div key={field.key}>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{field.label}</label>
                                    <input
                                        type={field.type}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-[#5D9FD6] focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold outline-none transition-all"
                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                        value={formData[field.key]}
                                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 font-black rounded-3xl hover:bg-gray-100 transition-all uppercase tracking-widest text-xs">
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-4 bg-[#5D9FD6] text-white font-black rounded-3xl shadow-xl shadow-[#5D9FD6]/20 hover:bg-[#4A8FC6] transition-all uppercase tracking-widest text-xs"
                            >
                                {editingVendor ? 'Confirm Changes' : 'Register Supplier'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Purchase History Modal */}
            {showHistoryModal && selectedVendor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
                        <h3 className="text-xl font-bold mb-4">Purchase History - {selectedVendor.name}</h3>
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-2 text-left">Date</th>
                                    <th className="p-2 text-left">Invoice</th>
                                    <th className="p-2 text-right">Amount</th>
                                    <th className="p-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendorPurchases.map(p => (
                                    <tr key={p.id} className="border-b">
                                        <td className="p-2">{new Date(p.timestamp).toLocaleDateString()}</td>
                                        <td className="p-2">{p.invoice_number || '-'}</td>
                                        <td className="p-2 text-right">₹{p.total_amount.toFixed(2)}</td>
                                        <td className="p-2 text-center">
                                            <span className={`px-2 py-1 rounded text-xs ${p.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {p.payment_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {vendorPurchases.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-4 text-center text-gray-500">No purchases found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className="mt-4 flex justify-end">
                            <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedVendor && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl scale-in">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">{isDues ? 'Add Dues/Debt' : 'Register Payment'}</h2>
                            <button onClick={() => setShowPaymentModal(false)} className="text-gray-300 hover:text-gray-600 text-2xl">&times;</button>
                        </div>

                        <div className="space-y-1 mb-6">
                            <p className="text-gray-500 font-bold">Vendor: <span className="text-gray-800">{selectedVendor.name}</span></p>
                            <p className={`font-bold ${selectedVendor.current_balance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                Balance: ₹{Math.abs(selectedVendor.current_balance || 0).toFixed(2)} {selectedVendor.current_balance < 0 ? '(Due)' : '(Advance)'}
                            </p>
                        </div>

                        <div className="flex bg-gray-100 p-1.5 rounded-xl mb-8">
                            <button
                                onClick={() => setIsDues(false)}
                                className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 ${!isDues ? 'bg-white shadow-sm text-green-600' : 'text-gray-400'}`}
                            >
                                PAYMENT TO VENDOR
                            </button>
                            <button
                                onClick={() => setIsDues(true)}
                                className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 ${isDues ? 'bg-white shadow-sm text-red-600' : 'text-gray-400'}`}
                            >
                                ADD DUES/DEBT
                            </button>
                        </div>

                        {!isDues && selectedVendor.current_balance < 0 && (
                            <div className="space-y-3 mb-8">
                                <div
                                    onClick={() => setPaymentType('full')}
                                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentType === 'full' ? 'border-green-500 bg-green-50/50 ring-4 ring-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentType === 'full' ? 'border-green-500 bg-green-500' : 'border-gray-200'}`}>
                                            {paymentType === 'full' && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-800 uppercase text-[10px] tracking-tight">Full Settlement</p>
                                            <p className="text-[10px] text-gray-500 font-bold">Pay ₹{Math.abs(selectedVendor.current_balance).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => setPaymentType('partial')}
                                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentType === 'partial' ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentType === 'partial' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-200'}`}>
                                            {paymentType === 'partial' && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-800 uppercase text-[10px] tracking-tight">Partial Payment</p>
                                            <p className="text-[10px] text-gray-500 font-bold">Pay specific amount</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(isDues || paymentType === 'partial' || (paymentType === 'full' && selectedVendor.current_balance >= 0)) && (
                            <div className="mb-8 scale-in">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className={`w-full border-2 rounded-2xl p-4 text-xl font-black focus:ring-4 outline-none transition-all ${isDues ? 'border-red-50 focus:ring-red-50' : 'border-indigo-50 focus:ring-indigo-50'}`}
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
                                className={`flex-1 py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs ${isDues ? 'bg-red-600 shadow-red-100 hover:bg-red-700' : 'bg-green-600 shadow-green-100 hover:bg-green-700'}`}
                            >
                                Confirm {isDues ? 'Dues' : (paymentType === 'full' && selectedVendor.current_balance < 0 ? `₹${Math.abs(selectedVendor.current_balance).toFixed(2)}` : 'Payment')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorManagement;
