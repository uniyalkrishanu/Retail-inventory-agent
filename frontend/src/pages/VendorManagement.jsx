import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';

const VendorManagement = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [formData, setFormData] = useState({
        name: '', address: '', mobile: '', email: ''
    });

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

    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(vendorSearch.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold">Vendor Management</h2>
                <button
                    onClick={() => {
                        setEditingVendor(null);
                        setFormData({ name: '', address: '', mobile: '', email: '' });
                        setShowModal(true);
                    }}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Vendor
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search vendors by name..."
                    className="w-full md:w-1/3 border p-2 rounded shadow-sm"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map(vendor => (
                    <div key={vendor.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold">{vendor.name}</h3>
                            <div className="flex space-x-2">
                                <button onClick={() => handleEdit(vendor)} className="text-blue-500 hover:text-blue-700">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(vendor.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2 text-gray-600">
                            {vendor.address && (
                                <p className="flex items-center"><MapPin size={16} className="mr-2" /> {vendor.address}</p>
                            )}
                            {vendor.mobile && (
                                <p className="flex items-center"><Phone size={16} className="mr-2" /> {vendor.mobile}</p>
                            )}
                            {vendor.email && (
                                <p className="flex items-center"><Mail size={16} className="mr-2" /> {vendor.email}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
                        <div className="space-y-4">
                            <input
                                className="w-full border p-2 rounded"
                                placeholder="Vendor Name *"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <input
                                className="w-full border p-2 rounded"
                                placeholder="Address"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                            <input
                                className="w-full border p-2 rounded"
                                placeholder="Mobile"
                                value={formData.mobile}
                                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                            />
                            <input
                                className="w-full border p-2 rounded"
                                placeholder="Email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorManagement;
