import React, { useEffect, useState } from 'react';
import api from '../api';
import { TrendingUp, Package, AlertTriangle, IndianRupee, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_sales_count: 0,
        total_revenue: 0,
        total_profit: 0,
        current_stock_value: 0
    });
    const [salesTrend, setSalesTrend] = useState([]);
    const [dateRange, setDateRange] = useState('30'); // '7', '30', '90', '365'

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Stats
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - parseInt(dateRange));

                const statsRes = await api.get(`/analytics/dashboard?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`);
                setStats(statsRes.data);

                // Fetch Trend
                const trendRes = await api.get(`/analytics/sales_trend?days=${dateRange}`);
                setSalesTrend(trendRes.data);

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };

        fetchData();
    }, [dateRange]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold">Dashboard</h2>
                <div className="flex items-center space-x-2 bg-white p-2 rounded shadow">
                    <Calendar size={20} className="text-gray-500" />
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-transparent outline-none cursor-pointer"
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 3 Months</option>
                        <option value="365">Last Year</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full mr-4">
                        <Package className="text-blue-600 w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-500">Sales Count</p>
                        <p className="text-2xl font-bold">{stats.total_sales_count}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                    <div className="p-3 bg-green-100 rounded-full mr-4">
                        <IndianRupee className="text-green-600 w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-500">Revenue</p>
                        <p className="text-2xl font-bold">₹{stats.total_revenue.toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full mr-4">
                        <TrendingUp className="text-purple-600 w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-500">Net Profit</p>
                        <p className="text-2xl font-bold">₹{stats.total_profit.toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-full mr-4">
                        <AlertTriangle className="text-yellow-600 w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-500">Stock Value (Cost)</p>
                        <p className="text-2xl font-bold">₹{stats.current_stock_value.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold mb-4">Sales & Profit Trend</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="amount" fill="#4F46E5" name="Revenue" />
                                <Bar dataKey="profit" fill="#10B981" name="Profit" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold mb-4">Profit Margin Trend</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="profit" stroke="#8884d8" name="Profit" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
