import React, { useState, useEffect } from 'react';
import api from '../api';
import { Upload, FileText, Calendar, IndianRupee, Package, ChevronDown, ChevronUp, Trash2, Edit, X, Filter, AlertTriangle, ArrowUpDown, RotateCcw, Check, Plus } from 'lucide-react';

const PurchasePage = () => {
    const [purchases, setPurchases] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [vendorFilter, setVendorFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [appliedDateRange, setAppliedDateRange] = useState({ start: '', end: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Upload Payment Status State
    const [showChoiceModal, setShowChoiceModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);
    const [uploadPaid, setUploadPaid] = useState(true);

    // Payment Action Modal (Full/Partial)
    const [showPaymentActionModal, setShowPaymentActionModal] = useState(false);
    const [selectedPurchasePay, setSelectedPurchasePay] = useState(null);
    const [paymentOption, setPaymentOption] = useState('full'); // 'full' or 'partial'
    const [customAmount, setCustomAmount] = useState('');

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const response = await api.get('/purchases/');
            setPurchases(response.data);
        } catch (error) {
            console.error("Failed to fetch purchases", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleApplyFilter = () => {
        setAppliedDateRange({ start: startDate, end: endDate });
    };

    const handleResetFilters = () => {
        setVendorFilter('');
        setStatusFilter('All');
        setStartDate('');
        setEndDate('');
        setAppliedDateRange({ start: '', end: '' });
        setSortConfig({ key: 'timestamp', direction: 'desc' });
    };

    const filteredPurchases = purchases
        .filter(p => {
            const matchesVendor = !vendorFilter || (p.vendor_name && p.vendor_name.toLowerCase().includes(vendorFilter.toLowerCase()));
            const matchesStatus = statusFilter === 'All' || p.payment_status === statusFilter;

            let matchesDate = true;
            if (appliedDateRange.start) {
                const pDate = new Date(p.timestamp);
                const sDate = new Date(appliedDateRange.start);
                sDate.setHours(0, 0, 0, 0);
                matchesDate = matchesDate && pDate >= sDate;
            }
            if (appliedDateRange.end) {
                const pDate = new Date(p.timestamp);
                const eDate = new Date(appliedDateRange.end);
                eDate.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && pDate <= eDate;
            }

            return matchesVendor && matchesStatus && matchesDate;
        })
        .sort((a, b) => {
            if (sortConfig.key) {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                if (valA === null || valA === undefined) valA = '';
                if (valB === null || valB === undefined) valB = '';

                // Handle string comparisons
                if (typeof valA === 'string' && typeof valB === 'string') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

    const fetchVendors = async () => {
        try {
            const response = await api.get('/vendors/');
            setVendors(response.data);
        } catch (error) {
            console.error("Failed to fetch vendors", error);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    useEffect(() => {
        fetchPurchases();
    }, [vendorFilter]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPendingFile(file);
        setShowChoiceModal(false); // Close choice modal
        setShowUploadModal(true);
        // Clear input to allow same file re-upload if needed
        e.target.value = null;
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/import_export/template/purchase', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'purchase_order_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            setShowChoiceModal(false);
        } catch (error) {
            alert("Failed to download template: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleConfirmUpload = async () => {
        if (!pendingFile) return;

        const formData = new FormData();
        formData.append('file', pendingFile);

        const status = uploadPaid ? 'Paid' : 'Due';

        try {
            await api.post(`/import_export/import?import_type=purchase&payment_status=${status}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`Purchase Order Imported as ${status} Successfully!`);
            setShowUploadModal(false);
            setPendingFile(null);
            fetchPurchases(); // Refresh list
        } catch (error) {
            alert('Import Failed: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handlePayPurchase = (purchase, e) => {
        e.stopPropagation();
        setSelectedPurchasePay(purchase);
        const remaining = purchase.total_amount - (purchase.paid_amount || 0);
        setCustomAmount(remaining.toFixed(2));
        setPaymentOption('full');
        setShowPaymentActionModal(true);
    };

    const handleConfirmPayment = async () => {
        if (!selectedPurchasePay) return;

        const remaining = selectedPurchasePay.total_amount - (selectedPurchasePay.paid_amount || 0);
        const amount = paymentOption === 'full' ? remaining : parseFloat(customAmount);

        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid payment amount");
            return;
        }

        if (amount > remaining + 0.01) {
            alert(`Amount ₹${amount} exceeds remaining balance ₹${remaining.toFixed(2)}`);
            return;
        }

        try {
            await api.post(`/purchases/${selectedPurchasePay.id}/pay?amount=${amount}`);
            setShowPaymentActionModal(false);
            setSelectedPurchasePay(null);
            fetchPurchases();
        } catch (error) {
            alert("Payment failed: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleUnpayPurchase = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Mark this purchase as UNPAID (Due)? This will increase vendor debt.")) return;
        try {
            await api.post(`/purchases/${id}/unpay`);
            fetchPurchases();
        } catch (error) {
            alert("Operation failed: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleDeleteClick = (id, e) => {
        e.stopPropagation();
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async (revertStock) => {
        if (!deleteId) return;
        try {
            await api.delete(`/purchases/${deleteId}?revert_stock=${revertStock}`);
            setShowDeleteModal(false);
            setDeleteId(null);
            fetchPurchases();
        } catch (error) {
            alert("Failed to delete purchase: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleEditClick = (purchase, e) => {
        e.stopPropagation();
        setEditData({ ...purchase });
        setShowEditModal(true);
    };

    const handleEditSave = async () => {
        try {
            await api.put(`/purchases/${editData.id}`, { vendor_id: editData.vendor_id }); // Currently only supporting Vendor update
            setShowEditModal(false);
            fetchPurchases();
        } catch (error) {
            alert("Update failed: " + (error.response?.data?.detail || error.message));
        }
    };

    const toggleExpand = (id) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-gray-800 tracking-tighter">Purchase Orders</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Inbound Stock & Vendor Debt</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Compact Filter Bar */}
                    <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center bg-gray-50 px-3 py-2 rounded-2xl relative">
                            <Filter className="w-3 h-3 text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Vendor..."
                                className="bg-transparent outline-none text-[10px] font-black uppercase w-24 tracking-widest placeholder:text-gray-300"
                                value={vendorFilter}
                                onChange={(e) => setVendorFilter(e.target.value)}
                                list="vendor-list"
                            />
                            <datalist id="vendor-list">
                                {vendors.map(v => (
                                    <option key={v.id} value={v.name}>{v.name}</option>
                                ))}
                            </datalist>
                        </div>

                        <select
                            className="bg-gray-50 outline-none text-xs font-semibold px-4 py-2.5 rounded-2xl cursor-pointer text-gray-600 border border-gray-100"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="Due">Due</option>
                            <option value="Partially Paid">Partial</option>
                            <option value="Paid">Paid</option>
                        </select>

                        <div className="h-6 w-[1px] bg-gray-100 mx-1"></div>

                        <button
                            onClick={handleResetFilters}
                            className="p-2 text-gray-300 hover:text-[#5D9FD6] transition-colors"
                            title="Reset All"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => setShowChoiceModal(true)}
                        className="flex items-center gap-2 bg-[#5D9FD6] text-white px-8 py-4 rounded-[28px] shadow-xl shadow-[#5D9FD6]/20 hover:bg-[#4A8FC6] transition-all active:scale-95 group font-black uppercase text-xs tracking-widest"
                    >
                        <Plus size={18} />
                        New Order
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-5 w-12"></th>
                            {[
                                { key: 'id', label: 'ID' },
                                { key: 'timestamp', label: 'Date' },
                                { key: 'invoice_number', label: 'Invoice' },
                                { key: 'vendor_name', label: 'Vendor' },
                                { key: 'items_count', label: 'Items' },
                                { key: 'total_amount', label: 'Amount' },
                                { key: 'payment_status', label: 'Status' }
                            ].map(({ key, label }) => (
                                <th
                                    key={key}
                                    onClick={() => handleSort(key)}
                                    className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-900 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {label}
                                        {sortConfig.key === key && (
                                            <span className="text-[#5D9FD6]">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredPurchases.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center opacity-20 filter grayscale">
                                        <Package size={48} className="mb-4" />
                                        <p className="font-black uppercase tracking-widest text-xs italic">No orders found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredPurchases.map((purchase) => (
                                <React.Fragment key={purchase.id}>
                                    <tr
                                        className={`group hover:bg-gray-50/50 cursor-pointer transition-colors ${expandedId === purchase.id ? 'bg-[#5D9FD6]/5' : ''}`}
                                        onClick={() => toggleExpand(purchase.id)}
                                    >
                                        <td className="px-8 py-6 text-center text-gray-300 group-hover:text-[#5D9FD6]">
                                            {expandedId === purchase.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </td>
                                        <td className="px-8 py-6 text-[11px] font-black text-gray-400">#{purchase.id}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-extrabold text-gray-800 tracking-tight">{new Date(purchase.timestamp).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(purchase.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-bold text-gray-600 text-sm">{purchase.invoice_number || 'N/A'}</td>
                                        <td className="px-8 py-6 font-extrabold text-gray-800 uppercase tracking-tighter">{purchase.vendor_name}</td>
                                        <td className="px-8 py-6 text-xs font-black text-gray-400">{purchase.items_count} Units</td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-[#66BB6A] text-sm">₹{purchase.total_amount.toLocaleString()}</span>
                                                {purchase.paid_amount > 0 && purchase.payment_status !== 'Paid' && (
                                                    <span className="text-[9px] font-black text-gray-300 uppercase mt-0.5">Paid: ₹{purchase.paid_amount.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${purchase.payment_status === 'Paid' ? 'bg-[#E8F5E9] text-[#66BB6A]' :
                                                purchase.payment_status === 'Partially Paid' ? 'bg-[#FFF9C4] text-[#FBC02D]' :
                                                    'bg-[#FFEBEE] text-[#EF5350]'
                                                }`}>
                                                {purchase.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-end gap-2">
                                                {purchase.payment_status !== 'Paid' ? (
                                                    <button
                                                        onClick={(e) => handlePayPurchase(purchase, e)}
                                                        className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition-colors"
                                                        title="Settle"
                                                    >
                                                        <IndianRupee size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => handleUnpayPurchase(purchase.id, e)}
                                                        className="p-2 text-orange-400 hover:bg-orange-50 rounded-xl transition-colors"
                                                        title="Revert"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => handleDeleteClick(purchase.id, e)}
                                                    className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedId === purchase.id && (
                                        <tr>
                                            <td colSpan="9" className="px-8 py-8 bg-gray-50/30">
                                                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden mx-12">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50/50">
                                                            <tr>
                                                                <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                                                <th className="px-6 py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                                                                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Unit Cost</th>
                                                                <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {purchase.items && purchase.items.map((item) => (
                                                                <tr key={item.id} className="hover:bg-gray-50/50">
                                                                    <td className="px-6 py-4 text-sm font-bold text-gray-600">{item.trophy_name}</td>
                                                                    <td className="px-6 py-4 text-center text-xs font-black text-gray-500">{item.quantity}</td>
                                                                    <td className="px-6 py-4 text-right text-xs font-bold text-gray-500">₹{item.unit_cost.toLocaleString()}</td>
                                                                    <td className="px-6 py-4 text-right text-sm font-black text-gray-800">₹{(item.quantity * item.unit_cost).toLocaleString()}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {showEditModal && editData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Edit Purchase #{editData.id}</h3>
                            <button onClick={() => setShowEditModal(false)}><X className="w-6 h-6" /></button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2">Vendor</label>
                            <select
                                value={editData.vendor_id || ''}
                                onChange={(e) => setEditData({ ...editData, vendor_id: e.target.value })}
                                className="w-full border p-2 rounded"
                            >
                                {vendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                Note: To edit items or quantities, please delete this order and re-upload the corrected file to ensure stock accuracy.
                            </p>
                        </div>

                        <button onClick={handleEditSave} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                            Save Changes
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white p-6 rounded-lg max-w-md w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold flex items-center text-red-600">
                                    <AlertTriangle className="w-6 h-6 mr-2" />
                                    Delete Purchase Order
                                </h3>
                                <button onClick={() => setShowDeleteModal(false)}><X className="w-6 h-6" /></button>
                            </div>

                            <p className="mb-6 text-gray-600">
                                How do you want to handle the inventory stock associated with this purchase?
                            </p>

                            <div className="flex flex-col space-y-3">
                                <button
                                    onClick={() => confirmDelete(true)}
                                    className="w-full bg-red-600 text-white py-3 rounded hover:bg-red-700 flex flex-col items-center justify-center"
                                >
                                    <span className="font-bold">Delete & Remove Stock</span>
                                    <span className="text-xs opacity-75">Use this if the purchase was a mistake or return.</span>
                                </button>

                                <button
                                    onClick={() => confirmDelete(false)}
                                    className="w-full bg-gray-200 text-gray-800 py-3 rounded hover:bg-gray-300 flex flex-col items-center justify-center"
                                >
                                    <span className="font-bold">Delete Only (Keep Stock)</span>
                                    <span className="text-xs opacity-75 text-gray-600">Use this if you plan to re-upload the file to fix data.</span>
                                </button>

                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full border border-gray-300 py-2 rounded text-gray-600 hover:bg-gray-50 mt-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Payment Action Modal */}
            {showPaymentActionModal && selectedPurchasePay && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg max-w-sm w-full shadow-xl">
                        <h3 className="text-xl font-bold mb-4">Register Payment</h3>
                        <p className="text-gray-600 mb-2 text-sm">
                            Purchase Order: <strong>#{selectedPurchasePay.id}</strong> ({selectedPurchasePay.vendor_name})
                        </p>
                        <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
                            <div className="flex justify-between mb-1">
                                <span>Total Amount:</span>
                                <span className="font-semibold">₹{selectedPurchasePay.total_amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mb-1 text-green-600">
                                <span>Already Paid:</span>
                                <span>₹{(selectedPurchasePay.paid_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t font-bold text-red-600">
                                <span>Remaining:</span>
                                <span>₹{(selectedPurchasePay.total_amount - (selectedPurchasePay.paid_amount || 0)).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-3 mb-6">
                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${paymentOption === 'full' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    className="mr-3 w-4 h-4 text-green-600"
                                    checked={paymentOption === 'full'}
                                    onChange={() => {
                                        setPaymentOption('full');
                                        setCustomAmount((selectedPurchasePay.total_amount - (selectedPurchasePay.paid_amount || 0)).toFixed(2));
                                    }}
                                />
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800 text-sm">Full Payment</span>
                                    <span className="text-xs text-gray-500">Settle the entire remaining balance.</span>
                                </div>
                            </label>

                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${paymentOption === 'partial' ? 'border-yellow-500 bg-yellow-50' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    className="mr-3 w-4 h-4 text-yellow-600"
                                    checked={paymentOption === 'partial'}
                                    onChange={() => setPaymentOption('partial')}
                                />
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800 text-sm">Partial Payment</span>
                                    <span className="text-xs text-gray-500">Pay a specific amount.</span>
                                </div>
                            </label>
                        </div>

                        {paymentOption === 'partial' && (
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Payment Amount (₹)</label>
                                <input
                                    type="number"
                                    className="w-full border-2 border-yellow-100 rounded-lg p-3 text-lg focus:border-yellow-400 outline-none transition-colors"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowPaymentActionModal(false); setSelectedPurchasePay(null); }}
                                className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded border"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded shadow-md hover:bg-indigo-700 transition-colors"
                            >
                                Register ₹{parseFloat(customAmount || 0).toFixed(2)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Choice Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg max-w-sm w-full shadow-xl">
                        <h3 className="text-xl font-bold mb-4">Upload Purchase Order</h3>
                        <p className="text-gray-600 mb-6 text-sm">
                            Please specify the payment status for the items in <strong>{pendingFile?.name}</strong>.
                        </p>

                        <div className="flex flex-col space-y-3 mb-6">
                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${uploadPaid ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    className="mr-3 w-4 h-4 text-green-600"
                                    checked={uploadPaid}
                                    onChange={() => setUploadPaid(true)}
                                />
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800 text-sm">Mark as PAID</span>
                                    <span className="text-xs text-gray-500">Stock will be added, balance unchanged.</span>
                                </div>
                            </label>

                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${!uploadPaid ? 'border-red-500 bg-red-50' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    className="mr-3 w-4 h-4 text-red-600"
                                    checked={!uploadPaid}
                                    onChange={() => setUploadPaid(false)}
                                />
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800 text-sm">Mark as DUE (Credit)</span>
                                    <span className="text-xs text-gray-500">Stock will be added, vendor debt will increase.</span>
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowUploadModal(false); setPendingFile(null); }}
                                className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded border"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmUpload}
                                className={`flex-1 px-4 py-2 text-white rounded shadow-md ${uploadPaid ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                Confirm Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Choice Modal */}
            {showChoiceModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-10 shadow-2xl scale-in border-4 border-indigo-50">
                        <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter mb-2 text-center">Update Orders</h2>
                        <p className="text-gray-400 font-bold mb-10 text-center uppercase tracking-widest text-xs mt-2 italic">Choose how you want to proceed</p>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <label className="relative flex flex-col items-center p-8 border-2 border-dashed border-gray-100 rounded-3xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group">
                                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <span className="font-black text-gray-800 uppercase tracking-tighter text-lg">Upload Order</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">Excel or CSV file</span>
                                <input type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx, .xls, .csv" />
                            </label>

                            <button
                                onClick={handleDownloadTemplate}
                                className="flex flex-col items-center p-8 border-2 border-dashed border-gray-100 rounded-3xl cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-all group"
                            >
                                <div className="p-4 bg-green-50 rounded-2xl text-green-600 mb-4 group-hover:scale-110 transition-transform">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <span className="font-black text-gray-800 uppercase tracking-tighter text-lg">Create Order</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 text-center">Download Template</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowChoiceModal(false)}
                            className="w-full py-4 text-gray-400 font-black uppercase tracking-[0.2em] text-xs hover:text-gray-600 transition-colors"
                        >
                            Close Menu
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
};

export default PurchasePage;
