import React, { useState, useEffect } from 'react';
import api from '../api';
import { Upload, FileText, Calendar, IndianRupee, Package, ChevronDown, ChevronUp, Trash2, Edit, X, Filter, AlertTriangle } from 'lucide-react';

const PurchasePage = () => {
    const [purchases, setPurchases] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [vendorFilter, setVendorFilter] = useState('');

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

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

    // Client-side filter for vendor name type-ahead
    const filteredPurchases = purchases.filter(p =>
        !vendorFilter || (p.vendor_name && p.vendor_name.toLowerCase().includes(vendorFilter.toLowerCase()))
    );

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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/import_export/import?import_type=purchase', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Purchase Order Imported Successfully!');
            fetchPurchases(); // Refresh list
        } catch (error) {
            alert('Import Failed: ' + (error.response?.data?.detail || error.message));
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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold">Purchase Orders</h2>
                <div className="flex items-center space-x-4">

                    {/* Vendor Type-Ahead Filter */}
                    <div className="flex items-center bg-white px-3 py-2 rounded shadow relative">
                        <Filter className="w-4 h-4 text-gray-500 mr-2" />
                        <input
                            type="text"
                            placeholder="Filter by Vendor..."
                            className="bg-transparent outline-none text-sm w-40"
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

                    <label className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer shadow-md">
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Purchase Order
                        <input type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx, .xls, .csv" />
                    </label>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-10"></th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice No</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vendor</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Amount</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPurchases.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-gray-500">
                                    No purchase orders found.
                                </td>
                            </tr>
                        ) : (
                            filteredPurchases.map((purchase) => (
                                <React.Fragment key={purchase.id}>
                                    <tr
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => toggleExpand(purchase.id)}
                                    >
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            {expandedId === purchase.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <div className="flex items-center">
                                                <FileText className="w-4 h-4 mr-2 text-gray-400" />
                                                #{purchase.id}
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                {new Date(purchase.timestamp).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm font-medium">
                                            {purchase.invoice_number || '-'}
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm font-medium">
                                            {purchase.vendor_name}
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <div className="flex items-center">
                                                <Package className="w-4 h-4 mr-2 text-gray-400" />
                                                {purchase.items_count} Items
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                                                <span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                                                <span className="relative flex items-center">
                                                    <IndianRupee className="w-3 h-3 mr-1" />
                                                    {purchase.total_amount.toFixed(2)}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={(e) => handleDeleteClick(purchase.id, e)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                    title="Delete Purchase"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedId === purchase.id && (
                                        <tr>
                                            <td colSpan="7" className="px-5 py-5 border-b border-gray-200 bg-gray-50">
                                                <div className="px-4 py-2">
                                                    <h4 className="text-sm font-bold text-gray-700 mb-2">Order Details</h4>
                                                    <table className="min-w-full bg-white rounded-md overflow-hidden shadow-sm">
                                                        <thead className="bg-gray-100">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Item Name</th>
                                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Unit Cost</th>
                                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Total Cost</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {purchase.items && purchase.items.map((item) => (
                                                                <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                                                                    <td className="px-4 py-2 text-sm text-gray-700">{item.trophy_name}</td>
                                                                    <td className="px-4 py-2 text-sm text-gray-700">{item.quantity}</td>
                                                                    <td className="px-4 py-2 text-sm text-gray-700">₹{item.unit_cost.toFixed(2)}</td>
                                                                    <td className="px-4 py-2 text-sm text-gray-700 font-medium">₹{(item.quantity * item.unit_cost).toFixed(2)}</td>
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
        </div >
    );
};

export default PurchasePage;
