import React, { useState, useEffect } from 'react';
import api from '../api';
import { ShoppingCart, Plus, Trash2, Printer, User, Search, IndianRupee } from 'lucide-react';

const SalesPage = () => {
    const [inventory, setInventory] = useState([]);
    const [customers, setCustomers] = useState([]); // Added
    const [cart, setCart] = useState([]);

    // Product Search State
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    // Customer Search State
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [showConfirmCheckout, setShowConfirmCheckout] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false); // Added

    const [lastSale, setLastSale] = useState(null);
    const [showBill, setShowBill] = useState(false);
    const dropdownRef = React.useRef(null);
    const customerDropdownRef = React.useRef(null);
    const [selectedProduct, setSelectedProduct] = useState(null); // Object, not ID
    const [quantity, setQuantity] = useState(1);
    const [recommendations, setRecommendations] = useState([]); // Customer's top products
    const [topSellers, setTopSellers] = useState([]); // Overall top products

    const fetchData = async () => {
        try {
            const [invRes, custRes, topRes] = await Promise.all([
                api.get('/inventory/'),
                api.get('/customers/'),
                api.get('/inventory/top-sellers/')
            ]);
            setInventory(invRes.data);
            setCustomers(custRes.data);
            setTopSellers(topRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        fetchData();

        // Handle clicks outside of dropdowns to close them
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProductDropdown(false);
            }
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addToCart = () => {
        if (!selectedProduct) return;

        const item = selectedProduct; // Already an object now

        const existingItem = cart.find(i => i.id === item.id);
        const currentQty = existingItem ? existingItem.cartQuantity : 0;

        if (currentQty + quantity > item.quantity) {
            alert(`Not enough stock! Available: ${item.quantity}`);
            return;
        }

        if (existingItem) {
            setCart(cart.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + quantity } : i));
        } else {
            setCart([...cart, { ...item, cartQuantity: quantity }]);
        }

        // Reset selection
        setQuantity(1);
        setSelectedProduct(null);
        setProductSearch('');
    };

    const updateCartQuantity = (id, newQty) => {
        if (newQty < 1) return;
        const item = inventory.find(i => i.id === id);
        if (newQty > item.quantity) {
            alert(`Not enough stock! Available: ${item.quantity}`);
            return;
        }
        setCart(cart.map(i => i.id === id ? { ...i, cartQuantity: newQty } : i));
    }

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return cart.reduce((acc, item) => acc + (item.selling_price * item.cartQuantity), 0);
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setShowConfirmCheckout(true);
    };

    const handleConfirmCheckout = () => {
        let finalCustomerName = customerSearch.trim();
        if (finalCustomerName === '') {
            if (window.confirm("No customer name provided. Use 'Walk-in Customer' as default?")) {
                setCustomerSearch('Walk-in Customer');
            } else {
                return;
            }
        }
        setShowConfirmCheckout(false);
        setShowCheckoutModal(true);
    };

    const completeCheckout = async (status) => {
        let finalCustomerId = selectedCustomerId;
        let finalCustomerName = customerSearch.trim() || 'Walk-in Customer';

        try {
            // Auto-create customer if name provided but not selected from list
            if (!finalCustomerId && finalCustomerName !== '') {
                const createCustRes = await api.post('/customers/', {
                    name: finalCustomerName,
                    current_balance: 0.0
                });
                finalCustomerId = createCustRes.data.id;
            }

            const saleData = {
                customer_name: finalCustomerName,
                customer_id: finalCustomerId,
                payment_status: status,
                items: cart.map(item => ({
                    trophy_id: item.id,
                    quantity: item.cartQuantity
                }))
            };

            const response = await api.post('/sales/', saleData);
            setLastSale({ ...response.data, items: cart });
            setShowBill(true);
            setCart([]);
            setCustomerSearch('');
            setSelectedCustomerId(null);
            setShowCheckoutModal(false);

            // Refresh all data
            fetchData();

        } catch (error) {
            console.error("Sale failed", error);
            alert("Sale failed: " + (error.response?.data?.detail || error.message));
        }
    };

    // Filter products based on search
    const filteredProducts = inventory.filter(item =>
        item.name.toLowerCase().includes(productSearch.toLowerCase()) && item.quantity > 0
    );

    // Filter customers based on search
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.mobile && c.mobile.includes(customerSearch))
    );

    // Fetch recommendations when customer is selected
    const fetchRecommendations = async (customerId) => {
        if (!customerId) {
            setRecommendations([]);
            return;
        }
        try {
            const res = await api.get(`/customers/${customerId}/recommendations`);
            setRecommendations(res.data);
        } catch (error) {
            console.error("Failed to fetch recommendations", error);
            setRecommendations([]);
        }
    };

    const fetchTopSellers = async () => {
        try {
            const res = await api.get('/inventory/top-sellers/');
            setTopSellers(res.data);
        } catch (error) {
            console.error("Failed to fetch top sellers", error);
        }
    };

    // Quick add recommendation to cart
    const addRecommendationToCart = (product) => {
        const item = inventory.find(i => i.id === product.id);
        if (!item || item.quantity < 1) {
            alert("Item out of stock!");
            return;
        }
        const existingItem = cart.find(i => i.id === item.id);
        if (existingItem) {
            if (existingItem.cartQuantity + 1 > item.quantity) {
                alert(`Not enough stock! Available: ${item.quantity}`);
                return;
            }
            setCart(cart.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i));
        } else {
            setCart([...cart, { ...item, cartQuantity: 1 }]);
        }
    };

    return (
        <div className="flex h-full gap-8">
            {/* Product Selection Area */}
            <div className="flex-1 space-y-8">
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-gray-800 tracking-tight">Point of Sale</h2>
                        <p className="text-gray-400 text-sm font-medium">Scan products or select from top sellers below.</p>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="flex-1 relative" ref={dropdownRef}>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Search Catalog</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-[#5D9FD6] focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all shadow-sm"
                                    placeholder="Start typing product name..."
                                    value={productSearch}
                                    onChange={(e) => {
                                        setProductSearch(e.target.value);
                                        setShowProductDropdown(true);
                                        setSelectedProduct(null);
                                    }}
                                    onFocus={() => setShowProductDropdown(true)}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#5D9FD6]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>
                            </div>

                            {showProductDropdown && (
                                <div className="absolute z-20 w-full bg-white border border-gray-100 rounded-3xl shadow-2xl max-h-80 overflow-y-auto mt-2 p-2">
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map(item => (
                                            <div
                                                key={item.id}
                                                className="p-4 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors group"
                                                onClick={() => {
                                                    setSelectedProduct(item);
                                                    setProductSearch(item.name);
                                                    setShowProductDropdown(false);
                                                }}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-extrabold text-gray-800 group-hover:text-[#5D9FD6] transition-colors">{item.name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase">SKU: {item.sku || 'N/A'} • ₹{item.selling_price.toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${item.quantity < 10 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                                                            {item.quantity} In Stock
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 font-black uppercase tracking-widest text-xs italic">Catalog mismatch</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="w-28">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Qty</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#5D9FD6] focus:bg-white rounded-2xl px-4 py-4 text-center text-lg font-black outline-none transition-all"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </div>

                        <button
                            onClick={addToCart}
                            disabled={!selectedProduct}
                            className="bg-[#5D9FD6] text-white p-5 rounded-2xl shadow-xl shadow-[#5D9FD6]/20 hover:bg-[#4A8FC6] disabled:bg-gray-100 disabled:text-gray-300 transition-all active:scale-95 h-[62px] mt-6"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        {recommendations.length > 0 ? (
                            <><span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span> Personal Recommendations</>
                        ) : (
                            <><span className="w-2 h-2 bg-red-400 rounded-full"></span> Rapid Selection</>
                        )}
                    </h3>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {(recommendations.length > 0 ? recommendations : topSellers).map(item => (
                            <div key={item.id}
                                onClick={() => {
                                    if (recommendations.length > 0) {
                                        addRecommendationToCart(item);
                                    } else {
                                        const fullItem = inventory.find(i => i.id === item.id);
                                        if (fullItem) {
                                            setSelectedProduct(fullItem);
                                            setProductSearch(fullItem.name);
                                        }
                                    }
                                }}
                                className={`p-6 rounded-[28px] border-2 cursor-pointer transition-all active:scale-95 flex flex-col justify-between h-36 ${selectedProduct?.id == item.id
                                    ? 'border-[#5D9FD6] bg-[#5D9FD6]/5 scale-[1.02]'
                                    : recommendations.length > 0
                                        ? 'border-yellow-50 bg-yellow-50/30 hover:border-yellow-200'
                                        : 'border-gray-50 bg-gray-50/30 hover:border-gray-100'
                                    }`}
                            >
                                <div className="space-y-1">
                                    <p className="font-extrabold text-sm text-gray-800 leading-tight line-clamp-2 uppercase tracking-tighter">{item.name}</p>
                                    <p className="text-sm font-black text-[#5D9FD6]">₹{item.selling_price.toLocaleString()}</p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">STOCK: {item.stock || item.quantity}</span>
                                    {item.total_purchased && (
                                        <span className="text-[9px] font-black bg-yellow-400/20 text-yellow-700 px-2 py-0.5 rounded-full">LOVED</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className="w-[400px] flex flex-col gap-6">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gray-50 rounded-2xl">
                                <ShoppingCart size={20} className="text-gray-400" />
                            </div>
                            <h2 className="text-xl font-black text-gray-800 tracking-tight">Checkout</h2>
                        </div>
                        <span className="bg-[#5D9FD6] text-white text-[10px] font-black px-3 py-1 rounded-full">{cart.length} ITEMS</span>
                    </div>

                    <div className="relative mb-8" ref={customerDropdownRef}>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Customer Search</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Find or add customer..."
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#5D9FD6] focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all"
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value);
                                    setShowCustomerDropdown(true);
                                    setSelectedCustomerId(null);
                                }}
                                onFocus={() => setShowCustomerDropdown(true)}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                                <User size={18} />
                            </div>
                        </div>

                        {showCustomerDropdown && (
                            <div className="absolute z-30 w-full bg-white border border-gray-100 rounded-3xl shadow-2xl max-h-60 overflow-y-auto mt-2 p-2">
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map(c => (
                                        <div
                                            key={c.id}
                                            className={`p-4 hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors ${selectedCustomerId === c.id ? 'bg-[#5D9FD6]/5' : ''}`}
                                            onClick={() => {
                                                setCustomerSearch(c.name);
                                                setSelectedCustomerId(c.id);
                                                setShowCustomerDropdown(false);
                                                fetchRecommendations(c.id);
                                            }}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-extrabold text-gray-800">{c.name}</span>
                                                {selectedCustomerId === c.id && <span className="text-[#5D9FD6] text-[10px] font-black uppercase">Active</span>}
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                                <span className="text-gray-400">{c.mobile || 'NEW CLIENT'}</span>
                                                <span className={c.current_balance < 0 ? 'text-red-500' : 'text-green-500'}>
                                                    BAL: ₹{Math.abs(c.current_balance || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        className="p-6 hover:bg-gray-50 rounded-2xl cursor-pointer text-[#5D9FD6] text-center font-black uppercase text-xs tracking-widest"
                                        onClick={() => setShowCustomerDropdown(false)}
                                    >
                                        + Onboard "{customerSearch}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {cart.map(item => (
                            <div key={item.id} className="group bg-gray-50/50 hover:bg-white hover:shadow-md hover:ring-1 hover:ring-gray-100 p-4 rounded-3xl transition-all">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <p className="font-extrabold text-gray-800 text-sm uppercase tracking-tighter">{item.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">₹{item.selling_price.toLocaleString()} unit price</p>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                    <div className="flex items-center bg-white rounded-xl border border-gray-100">
                                        <button onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)} className="p-2 px-3 text-gray-400 hover:text-gray-600">-</button>
                                        <span className="w-8 text-center font-black text-xs text-gray-700">{item.cartQuantity}</span>
                                        <button onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)} className="p-2 px-3 text-gray-400 hover:text-gray-600">+</button>
                                    </div>
                                    <span className="font-black text-gray-800">₹{(item.cartQuantity * item.selling_price).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-20 filter grayscale">
                                <ShoppingCart size={48} className="mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs italic">Waiting for items</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-100">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Total Payable</p>
                                <p className="text-3xl font-black text-gray-800 tracking-tighter">₹{calculateTotal().toLocaleString()}</p>
                            </div>
                            <span className="text-[10px] font-black text-gray-300 uppercase italic mb-1 tracking-tighter">Tax Incl.</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                            className="w-full bg-[#5D9FD6] text-white py-6 rounded-[32px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-[#5D9FD6]/30 hover:bg-[#4A8FC6] disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none transition-all active:scale-95"
                        >
                            Complete Order
                        </button>
                    </div>
                </div>
            </div>

            {/* Checkout Confirmation Prompt */}
            {showConfirmCheckout && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl text-center">
                        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart className="text-blue-600 w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter mb-2">Confirm Checkout?</h2>
                        <p className="text-gray-500 mb-6">Are you sure you want to proceed with this sale for <span className="font-bold text-gray-700">{customerSearch || 'Walk-in Customer'}</span>?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmCheckout(false)}
                                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmCheckout}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bill Modal */}
            {showBill && lastSale && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-lg max-w-md w-full">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold">RECEIPT</h2>
                            <p className="text-gray-500">Natraj India</p>
                            <p className="text-sm text-gray-400">{new Date(lastSale.timestamp).toLocaleString()}</p>
                        </div>

                        <div className="mb-4 border-b pb-4 space-y-1">
                            <p><strong>Customer:</strong> {lastSale.customer_name || 'Walk-in'}</p>
                            <p><strong>Sale ID:</strong> #{lastSale.id}</p>
                            <div className="flex items-center">
                                <span className="font-bold mr-2">Payment:</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${lastSale.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {lastSale.payment_status}
                                </span>
                            </div>
                        </div>

                        <div className="mb-4">
                            {lastSale.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between py-1">
                                    <span>{item.name} (x{item.cartQuantity})</span>
                                    <span>₹{(item.selling_price * item.cartQuantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4 flex justify-between font-bold text-xl">
                            <span>TOTAL</span>
                            <span>₹{lastSale.total_amount.toFixed(2)}</span>
                        </div>

                        <div className="mt-8 flex justify-end space-x-3">
                            <button onClick={() => window.print()} className="flex items-center px-4 py-2 border rounded hover:bg-gray-100">
                                <Printer size={16} className="mr-2" /> Print
                            </button>
                            <button onClick={() => setShowBill(false)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Checkout Confirmation Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShoppingCart className="text-blue-600 w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Complete Order</h2>
                            <p className="text-gray-400 font-bold">Party: {customerSearch || 'Walk-in Customer'}</p>
                        </div>

                        <div className="bg-indigo-50/50 p-6 rounded-2xl mb-8 flex justify-between items-center border border-indigo-100">
                            <span className="font-black text-indigo-400 uppercase text-[10px] tracking-widest">Grand Total</span>
                            <span className="text-3xl font-black text-indigo-700">₹{calculateTotal().toFixed(2)}</span>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => completeCheckout('Paid')}
                                className="w-full bg-green-600 text-white py-4 rounded-2xl font-black hover:bg-green-700 shadow-xl shadow-green-100 transition flex flex-col items-center"
                            >
                                <span>SETTLE AS PAID</span>
                                <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Cash / UPI / Online</span>
                            </button>
                            <button
                                onClick={() => completeCheckout('Due')}
                                className="w-full bg-red-600 text-white py-4 rounded-2xl font-black hover:bg-red-700 shadow-xl shadow-red-100 transition flex flex-col items-center"
                            >
                                <span>MARK AS DUE</span>
                                <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Add to Member Balance</span>
                            </button>
                            <button
                                onClick={() => setShowCheckoutModal(false)}
                                className="w-full text-gray-400 font-black py-4 hover:text-gray-600 transition text-xs uppercase tracking-widest"
                            >
                                ← Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesPage;
