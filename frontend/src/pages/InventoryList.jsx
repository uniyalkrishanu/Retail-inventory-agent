import React, { useEffect, useState } from 'react';
import api from '../api';
import { Upload, Download, Plus, Trash2, Edit, X } from 'lucide-react';

const InventoryList = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // Added
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [importType, setImportType] = useState('inventory'); // 'inventory' or 'purchase'

    const [newItem, setNewItem] = useState({
        name: '', category: '', material: '', quantity: 0, cost_price: 0, selling_price: 0, sku: '', min_stock_level: 5
    });

    const fetchInventory = async () => {
        setLoading(true);
        try {
            let url = '/inventory/';
            if (searchTerm) {
                url += `?search=${searchTerm}`;
            }
            const response = await api.get(url);
            setItems(response.data);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchInventory();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post(`/import_export/import?import_type=${importType}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Import Successful');
            fetchInventory();
        } catch (error) {
            alert('Import Failed: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/import_export/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'inventory_export.xlsx');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error("Export failed", error);
        }
    };

    const handleOpenAdd = () => {
        setIsEditing(false);
        setNewItem({ name: '', category: '', material: '', quantity: 0, cost_price: 0, selling_price: 0, sku: '', min_stock_level: 5 });
        setShowModal(true);
    }

    const handleOpenEdit = (item) => {
        setIsEditing(true);
        setEditId(item.id);
        setNewItem({ ...item });
        setShowModal(true);
    }

    const handleSaveItem = async () => {
        try {
            if (isEditing) {
                await api.put(`/inventory/${editId}`, newItem);
            } else {
                await api.post('/inventory/', newItem);
            }
            setShowModal(false);
            fetchInventory();
        } catch (error) {
            alert("Failed to save item");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold">Inventory</h2>
                <div className="flex space-x-2 items-center">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="border p-2 rounded"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <button onClick={handleOpenAdd} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </button>

                    <div className="flex items-center space-x-2 bg-white border rounded px-2">
                        <select
                            value={importType}
                            onChange={(e) => setImportType(e.target.value)}
                            className="p-2 bg-transparent outline-none cursor-pointer"
                        >
                            <option value="inventory">Inventory Update</option>
                            <option value="purchase">Purchase Order</option>
                        </select>
                        <label className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer text-sm">
                            <Upload className="w-3 h-3 mr-1" />
                            Upload
                            <input type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx, .xls, .csv" />
                        </label>
                    </div>

                    <button onClick={handleExport} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                            {/* SKU Hidden as requested */}
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sell Price</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.name}</td>
                                {/* <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.sku}</td> */}
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.category}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${item.quantity <= item.min_stock_level ? 'text-red-900' : 'text-green-900'}`}>
                                        <span aria-hidden className={`absolute inset-0 ${item.quantity <= item.min_stock_level ? 'bg-red-200' : 'bg-green-200'} opacity-50 rounded-full`}></span>
                                        <span className="relative">{item.quantity}</span>
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">₹{item.cost_price}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">₹{item.selling_price}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-900 mx-2"><Edit size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Item Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg max-w-lg w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
                            <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input className="border p-2 rounded w-full" placeholder="Name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">SKU</label>
                                <input className="border p-2 rounded w-full" placeholder="SKU" value={newItem.sku} onChange={e => setNewItem({ ...newItem, sku: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <input className="border p-2 rounded w-full" placeholder="Category" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Material</label>
                                <input className="border p-2 rounded w-full" placeholder="Material" value={newItem.material} onChange={e => setNewItem({ ...newItem, material: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                <input type="number" className="border p-2 rounded w-full" placeholder="Quantity" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Min Stock Level</label>
                                <input type="number" className="border p-2 rounded w-full" placeholder="Min Stock Level" value={newItem.min_stock_level} onChange={e => setNewItem({ ...newItem, min_stock_level: parseInt(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cost Price (₹)</label>
                                <input type="number" className="border p-2 rounded w-full" placeholder="Cost Price (₹)" value={newItem.cost_price} onChange={e => setNewItem({ ...newItem, cost_price: parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Selling Price (₹)</label>
                                <input type="number" className="border p-2 rounded w-full" placeholder="Selling Price (₹)" value={newItem.selling_price} onChange={e => setNewItem({ ...newItem, selling_price: parseFloat(e.target.value) })} />
                            </div>
                        </div>
                        <button onClick={handleSaveItem} className="mt-6 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                            {isEditing ? 'Update Item' : 'Add Item'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryList;
