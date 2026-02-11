import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, MapPin, IndianRupee, FileText, AlertCircle } from 'lucide-react';

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [showHistory, setShowHistory] = useState(false); // Added
    const [customerHistory, setCustomerHistory] = useState([]); // Added
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        address: '',
        current_balance: 0.0
    });
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false); // Consistent with Vendor
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentType, setPaymentType] = useState('full'); // 'full' or 'partial'
    const [isDues, setIsDues] = useState(false);
    const [showDuesOnly, setShowDuesOnly] = useState(false); // Added

    useEffect(() => {
        fetchCustomers();
    }, [searchTerm]);

    const fetchCustomers = async () => {
        try {
            const url = searchTerm ? `/customers/?search=${searchTerm}` : '/customers/';
            const response = await api.get(url);
            setCustomers(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching customers:', error);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'current_balance' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentCustomer) {
                await api.put(`/customers/${currentCustomer.id}`, formData);
            } else {
                await api.post('/customers/', formData);
            }
            setIsModalOpen(false);
            fetchCustomers();
            resetForm();
        } catch (error) {
            console.error('Error saving customer:', error);
        }
    };

    const openModal = (customer = null) => {
        if (customer) {
            setCurrentCustomer(customer);
            setFormData({
                name: customer.name,
                mobile: customer.mobile || '',
                email: customer.email || '',
                address: customer.address || '',
                current_balance: customer.current_balance
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setCurrentCustomer(null);
        setFormData({
            name: '',
            mobile: '',
            email: '',
            address: '',
            current_balance: 0.0
        });
    };

    const handleViewHistory = async (customer) => {
        setCurrentCustomer(customer);
        setShowHistoryModal(true);
        try {
            const response = await api.get(`/sales/?customer_id=${customer.id}`);
            setCustomerHistory(response.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    }

    const openPaymentModal = (customer) => {
        setCurrentCustomer(customer);
        setPaymentAmount('');
        setIsDues(false);
        setShowPaymentModal(true);
    };

    const handleRegisterPayment = async () => {
        let amountToPay = 0;

        if (isDues) {
            amountToPay = -parseFloat(paymentAmount);
        } else {
            amountToPay = paymentType === 'full'
                ? Math.abs(currentCustomer.current_balance)
                : parseFloat(paymentAmount);
        }

        if (!amountToPay || Math.abs(amountToPay) <= 0) {
            console.log('Please enter a valid amount');
            return;
        }

        try {
            const res = await api.post(`/customers/${currentCustomer.id}/payments?amount=${amountToPay}`);
            console.log(res.data.message);
            setShowPaymentModal(false);
            setPaymentType('full');
            setPaymentAmount('');
            fetchCustomers();
        } catch (error) {
            console.error('Error registering payment:', error);
            console.log('Error registering payment');
        }
    };

    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedCustomers = React.useMemo(() => {
        let result = [...customers];

        if (showDuesOnly) {
            result = result.filter(c => c.current_balance < 0);
        }

        if (sortConfig.key !== null) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [customers, sortConfig, showDuesOnly]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">Customer Ledger</h2>
                    <p className="text-gray-400 text-sm font-medium">Track client debts, advances, and transaction history.</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Find clients..."
                            className="bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold shadow-sm focus:ring-4 focus:ring-[#5D9FD6]/10 outline-none w-64 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-[#5D9FD6] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#5D9FD6]/20 hover:bg-[#4A8FC6] transition-all active:scale-95"
                    >
                        <Plus size={16} />
                        Add Client
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/50">
                            {[
                                { key: 'name', label: 'Client Identity' },
                                { key: 'mobile', label: 'Contact Info' },
                                { key: 'current_balance', label: 'Account Status' }
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
                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sortedCustomers.length > 0 ? sortedCustomers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <p className="text-sm font-extrabold text-gray-800">{customer.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter max-w-xs truncate">{customer.address || 'Retail Customer'}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <p className="text-xs font-bold text-gray-700">{customer.mobile || 'No Phone'}</p>
                                        <p className="text-[10px] font-medium text-gray-400 lowercase">{customer.email || '-'}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col items-start border-l-2 pl-4 border-gray-50 group-hover:border-[#5D9FD6]/20 transition-all">
                                        <span className={`text-sm font-black ${customer.current_balance < 0 ? 'text-red-500' : customer.current_balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                            ₹{Math.abs(customer.current_balance || 0).toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                                            {customer.current_balance < 0 ? 'Outstanding' : customer.current_balance > 0 ? 'Advance Balance' : 'Settled'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => handleViewHistory(customer)} title="View History" className="p-3 text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"><FileText size={18} /></button>
                                        <button onClick={() => openPaymentModal(customer)} title="Record Payment" className="p-3 text-green-600 hover:bg-green-50 rounded-2xl transition-all"><IndianRupee size={18} /></button>
                                        <button onClick={() => openModal(customer)} title="Edit Customer" className="p-3 text-[#5D9FD6] hover:bg-blue-50 rounded-2xl transition-all"><Edit size={18} /></button>
                                        <button onClick={() => {/* Delete logic if added elsewhere */ }} title="Delete Customer" className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="py-20 text-center">
                                    <p className="text-gray-300 font-black uppercase tracking-widest text-xs italic">No client records found</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (

                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-md p-6">
                        <h2 className="text-2xl font-bold mb-4">
                            {currentCustomer ? 'Edit Customer' : 'Add New Customer'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full border rounded-lg p-2"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                                <input
                                    type="text"
                                    name="mobile"
                                    className="w-full border rounded-lg p-2"
                                    value={formData.mobile}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full border rounded-lg p-2"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    name="address"
                                    className="w-full border rounded-lg p-2"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Manual Balance Adjustment (₹)
                                    <span className="text-xs text-gray-500 block">Positive = Advance, Negative = Due</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="current_balance"
                                    className="w-full border rounded-lg p-2"
                                    value={formData.current_balance}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save Customer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }

            {/* History Modal */}
            {showHistoryModal && currentCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-2xl font-bold">Sales History - {currentCustomer.name}</h2>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-gray-800">
                                <span className="text-2xl">×</span>
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            <table className="w-full">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="p-3 text-left">Date</th>
                                        <th className="p-3 text-left">ID</th>
                                        <th className="p-3 text-right">Amount</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-center">Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customerHistory.map(sale => (
                                        <tr key={sale.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">{new Date(sale.timestamp).toLocaleDateString()}</td>
                                            <td className="p-3">#{sale.id}</td>
                                            <td className="p-3 text-right font-mono">₹{sale.total_amount.toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 rounded text-xs ${sale.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {sale.payment_status || 'Paid'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center text-gray-500 text-sm">₹{sale.total_profit.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {customerHistory.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-gray-500">
                                                No transaction history found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 pt-4 border-t flex justify-end">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Current Net Balance</p>
                                <p className={`text-2xl font-bold ${currentCustomer.current_balance > 0 ? 'text-green-600' :
                                    currentCustomer.current_balance < 0 ? 'text-red-600' : 'text-gray-800'
                                    }`}>
                                    ₹{currentCustomer.current_balance.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Payment Modal */}
            {showPaymentModal && currentCustomer && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl scale-in">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">{isDues ? 'Add Dues/Debt' : 'Register Payment'}</h2>
                            <button onClick={() => setShowPaymentModal(false)} className="text-gray-300 hover:text-gray-600 text-2xl">&times;</button>
                        </div>

                        <div className="space-y-1 mb-6">
                            <p className="text-gray-500 font-bold">Party: <span className="text-gray-800">{currentCustomer.name}</span></p>
                            <p className={`font-bold ${currentCustomer.current_balance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                Balance: ₹{Math.abs(currentCustomer.current_balance || 0).toFixed(2)} {currentCustomer.current_balance < 0 ? '(Due)' : '(Advance)'}
                            </p>
                        </div>

                        <div className="flex bg-gray-100 p-1.5 rounded-xl mb-8">
                            <button
                                onClick={() => setIsDues(false)}
                                className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 ${!isDues ? 'bg-white shadow-sm text-green-600' : 'text-gray-400'}`}
                            >
                                PAYMENT FROM CUSTOMER
                            </button>
                            <button
                                onClick={() => setIsDues(true)}
                                className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 ${isDues ? 'bg-white shadow-sm text-red-600' : 'text-gray-400'}`}
                            >
                                ADD DUES/DEBT
                            </button>
                        </div>

                        {!isDues && currentCustomer.current_balance < 0 && (
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
                                            <p className="text-[10px] text-gray-500 font-bold">Pay ₹{Math.abs(currentCustomer.current_balance).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => setPaymentType('partial')}
                                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentType === 'partial' ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentType === 'partial' ? 'border-indigo-500 bg-indigo-50500' : 'border-gray-200'}`}>
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

                        {(isDues || paymentType === 'partial' || (paymentType === 'full' && currentCustomer.current_balance >= 0)) && (
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
                                Confirm {isDues ? 'Dues' : (paymentType === 'full' && currentCustomer.current_balance < 0 ? `₹${Math.abs(currentCustomer.current_balance).toFixed(2)}` : 'Payment')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default CustomersPage;
