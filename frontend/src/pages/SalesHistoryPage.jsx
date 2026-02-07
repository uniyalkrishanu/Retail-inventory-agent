import React, { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, User, Search, IndianRupee, Package, FileText } from 'lucide-react';

const SalesHistoryPage = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        customer_name: '',
        invoice_number: '' // Added
    });

    const [customers, setCustomers] = useState([]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            let query = '/sales/?';
            if (filters.start_date) query += `start_date=${new Date(filters.start_date).toISOString()}&`;
            if (filters.end_date) query += `end_date=${new Date(filters.end_date).toISOString()}&`;
            if (filters.customer_name) query += `customer_name=${filters.customer_name}&`;

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

    const handleSearch = (e) => {
        e.preventDefault();
        fetchSales();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold">Sales History</h2>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            name="start_date"
                            value={filters.start_date}
                            onChange={handleFilterChange}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            name="end_date"
                            value={filters.end_date}
                            onChange={handleFilterChange}
                            className="border p-2 rounded w-full"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                name="customer_name"
                                value={filters.customer_name}
                                onChange={handleFilterChange}
                                placeholder="Search by customer..."
                                className="border p-2 pl-9 rounded w-full"
                                list="customer-list"
                            />
                            <datalist id="customer-list">
                                {customers.map((name, index) => (
                                    <option key={index} value={name} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                    <div className="w-40">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No</label>
                        <input
                            type="text"
                            name="invoice_number"
                            value={filters.invoice_number}
                            onChange={handleFilterChange}
                            placeholder="Search..."
                            className="border p-2 rounded w-full"
                        />
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 flex items-center">
                        <Search className="w-4 h-4 mr-2" />
                        Filter
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setFilters({ start_date: '', end_date: '', customer_name: '', invoice_number: '' });
                            setTimeout(fetchSales, 0);
                        }}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                    >
                        Clear
                    </button>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice No</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Party's Name</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">GSTIN</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Taxable</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Tax</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Grand Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-gray-500">
                                    No sales found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            sales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            {new Date(sale.timestamp).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm font-medium">
                                        {sale.invoice_number || sale.id}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm font-medium">
                                        {sale.customer_name || 'Walk-in Customer'}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {sale.gstin || '-'}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                        {((sale.total_amount - (sale.tax_amount || 0))).toFixed(2)}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right text-gray-600">
                                        {(sale.tax_amount || 0).toFixed(2)}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right text-indigo-600 font-bold">
                                        <div className="flex items-center justify-end">
                                            <IndianRupee className="w-3 h-3 mr-1" />
                                            {sale.total_amount.toFixed(2)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesHistoryPage;
