import React, { useEffect, useState, useMemo } from 'react';
import api from '../api';
import { Download, Trash2, Edit, X, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, Filter } from 'lucide-react';

const InventoryList = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // Added
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [showLowStockOnly, setShowLowStockOnly] = useState(false); // Added

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

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const displayedItems = useMemo(() => {
        let result = sortedItems;
        if (showLowStockOnly) {
            result = result.filter(item => item.quantity <= (item.min_stock_level || 5));
        }
        return result;
    }, [sortedItems, showLowStockOnly]);


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
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">Inventory</h2>
                    <p className="text-gray-400 text-sm font-medium">Manage your stock and items efficiently.</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search articles..."
                            className="bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold shadow-sm focus:ring-4 focus:ring-[#5D9FD6]/10 outline-none w-64 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                            {/* Small search icon placeholder if lucide integrated */}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm ${showLowStockOnly ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
                    >
                        <AlertTriangle size={16} className={showLowStockOnly ? 'text-red-500' : 'text-gray-400'} />
                        {showLowStockOnly ? 'Low Stock Only' : 'Show Low Stock'}
                    </button>

                    <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-[#5D9FD6] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#5D9FD6]/20 hover:bg-[#4A8FC6] transition-all active:scale-95">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/50">
                            {[
                                { key: 'name', label: 'Item Name' },
                                { key: 'category', label: 'Category' },
                                { key: 'quantity', label: 'Availability' },
                                { key: 'cost_price', label: 'Cost' },
                                { key: 'selling_price', label: 'Selling Price' }
                            ].map(({ key, label }) => (
                                <th
                                    key={key}
                                    onClick={() => requestSort(key)}
                                    className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-900 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {label}
                                        {sortConfig.key === key && (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {displayedItems.length > 0 ? displayedItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <p className="text-sm font-extrabold text-gray-800">{item.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{item.sku || 'No SKU'}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold">{item.category}</span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${item.quantity <= (item.min_stock_level || 5) ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                                            <span className={`text-sm font-black ${item.quantity <= (item.min_stock_level || 5) ? 'text-red-600' : 'text-gray-800'}`}>
                                                {item.quantity} Units
                                            </span>
                                        </div>
                                        {item.quantity <= (item.min_stock_level || 5) && (
                                            <span className="text-[10px] font-bold text-red-400 mt-1 uppercase underline underline-offset-2">Low Stock</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-sm font-bold text-gray-500">₹{item.cost_price.toFixed(2)}</td>
                                <td className="px-8 py-6 text-sm font-black text-gray-800">₹{item.selling_price.toFixed(2)}</td>
                                <td className="px-8 py-6 text-right">
                                    <button
                                        onClick={() => handleOpenEdit(item)}
                                        className="p-3 text-[#5D9FD6] hover:bg-[#5D9FD6] hover:text-white rounded-2xl transition-all"
                                        title="Edit Item"
                                    >
                                        <Edit size={18} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="py-20 text-center">
                                    <p className="text-gray-300 font-black uppercase tracking-widest text-xs italic">No items found in inventory</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Redesigned Minimalist Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-2xl w-full scale-in border border-white">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-800 tracking-tight">{isEditing ? 'Edit Article' : 'New Article'}</h3>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Update your stock information</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-700 transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { label: 'Item Name', key: 'name', type: 'text' },
                                { label: 'SKU / Code', key: 'sku', type: 'text' },
                                { label: 'Category', key: 'category', type: 'text' },
                                { label: 'Material', key: 'material', type: 'text' },
                                { label: 'Stock Quantity', key: 'quantity', type: 'number' },
                                { label: 'Alert Level', key: 'min_stock_level', type: 'number' },
                                { label: 'Cost Price (₹)', key: 'cost_price', type: 'number' },
                                { label: 'Selling Price (₹)', key: 'selling_price', type: 'number' },
                            ].map((field) => (
                                <div key={field.key}>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">{field.label}</label>
                                    <input
                                        type={field.type}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-[#5D9FD6] focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold outline-none transition-all"
                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                        value={newItem[field.key]}
                                        onChange={e => setNewItem({ ...newItem, [field.key]: field.type === 'number' ? (field.key.includes('price') ? parseFloat(e.target.value) : parseInt(e.target.value)) : e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 font-black rounded-3xl hover:bg-gray-100 transition-all uppercase tracking-widest text-xs">
                                Discard
                            </button>
                            <button
                                onClick={handleSaveItem}
                                className="flex-1 py-4 bg-[#5D9FD6] text-white font-black rounded-3xl shadow-xl shadow-[#5D9FD6]/20 hover:bg-[#4A8FC6] transition-all uppercase tracking-widest text-xs"
                            >
                                {isEditing ? 'Confirm Changes' : 'Create Article'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryList;
