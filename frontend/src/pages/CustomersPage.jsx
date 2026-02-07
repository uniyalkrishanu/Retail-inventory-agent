import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, MapPin, IndianRupee } from 'lucide-react';

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

    useEffect(() => {
        fetchCustomers();
    }, [searchTerm]);

    const fetchCustomers = async () => {
        try {
            let url = 'http://localhost:8000/customers/';
            if (searchTerm) {
                url += `?search=${searchTerm}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            setCustomers(data);
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
            const url = currentCustomer
                ? `http://localhost:8000/customers/${currentCustomer.id}`
                : 'http://localhost:8000/customers/';

            const method = currentCustomer ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchCustomers();
                resetForm();
            }
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
        setShowHistory(true);
        try {
            const response = await fetch(`http://localhost:8000/sales/?customer_id=${customer.id}`);
            const data = await response.json();
            setCustomerHistory(data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Customer Ledger</h1>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Add Customer
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map((customer) => (
                    <div key={customer.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <User className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800">{customer.name}</h3>
                                    <p className="text-sm text-gray-500">ID: {customer.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => openModal(customer)}
                                className="text-gray-400 hover:text-blue-600"
                            >
                                <Edit size={20} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-gray-600">
                                <Phone size={18} />
                                <span>{customer.mobile || 'No Mobile'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <Mail size={18} />
                                <span>{customer.email || 'No Email'}</span>
                            </div>

                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <span className="text-gray-600 font-medium">Current Balance:</span>
                                <span className={`text-xl font-bold ${customer.current_balance > 0 ? 'text-green-600' :
                                    customer.current_balance < 0 ? 'text-red-600' : 'text-gray-800'
                                    }`}>
                                    ₹{customer.current_balance.toFixed(2)}
                                </span>
                            </div>
                            <div className="text-xs text-right mt-1">
                                {customer.current_balance > 0 ? '(Advance)' : customer.current_balance < 0 ? '(Pending Due)' : '(Settled)'}
                            </div>

                            <button
                                onClick={() => handleViewHistory(customer)}
                                className="w-full mt-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
                            >
                                <IndianRupee size={16} /> View Ledger History
                            </button>

                        </div>
                    </div>
                ))}
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
            )}

            {/* History Modal */}
            {showHistory && currentCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-2xl font-bold">Transaction History</h2>
                                <p className="text-gray-500">{currentCustomer.name}</p>
                            </div>
                            <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-gray-800">
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
            )}
        </div>
    );
};

export default CustomersPage;
