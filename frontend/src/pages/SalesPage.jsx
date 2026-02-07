import React, { useState, useEffect } from 'react';
import api from '../api';
import { ShoppingCart, Plus, Trash2, Printer } from 'lucide-react';

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

    const [lastSale, setLastSale] = useState(null);
    const [showBill, setShowBill] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null); // Object, not ID
    const [quantity, setQuantity] = useState(1);
    const [isPaid, setIsPaid] = useState(true); // Payment Status Toggle

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invRes, custRes] = await Promise.all([
                    api.get('/inventory/'),
                    api.get('/customers/')
                ]);
                setInventory(invRes.data);
                setCustomers(custRes.data);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
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

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        let finalCustomerId = selectedCustomerId;
        let finalCustomerName = customerSearch.trim();

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
                payment_status: isPaid ? "Paid" : "Due",
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
            setIsPaid(true);

            // Refresh inventory and customers
            const [invRes, custRes] = await Promise.all([
                api.get('/inventory/'),
                api.get('/customers/')
            ]);
            setInventory(invRes.data);
            setCustomers(custRes.data);

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

    return (
        <div className="flex h-full gap-6">
            {/* Product Selection Area */}
            <div className="w-2/3 bg-white p-6 rounded-lg shadow-md flex flex-col">
                <h2 className="text-2xl font-semibold mb-6">New Sale</h2>

                <div className="flex space-x-4 mb-6 items-start">
                    <div className="flex-1 relative">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Select Product</label>
                        <input
                            type="text"
                            className="w-full border p-2 rounded"
                            placeholder="Type to search product..."
                            value={productSearch}
                            onChange={(e) => {
                                setProductSearch(e.target.value);
                                setShowProductDropdown(true);
                                setSelectedProduct(null);
                            }}
                            onFocus={() => setShowProductDropdown(true)}
                        />
                        {showProductDropdown && productSearch && (
                            <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto mt-1">
                                {filteredProducts.map(item => (
                                    <div
                                        key={item.id}
                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                            setSelectedProduct(item);
                                            setProductSearch(item.name);
                                            setShowProductDropdown(false);
                                        }}
                                    >
                                        <div className="font-bold">{item.name}</div>
                                        <div className="text-sm text-gray-600">₹{item.selling_price} | Stock: {item.quantity}</div>
                                    </div>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div className="p-2 text-gray-500">No products found</div>
                                )}
                            </div>
                        )}
                        {selectedProduct && (
                            <div className="text-sm text-green-600 mt-1">
                                Selected: {selectedProduct.name} (Stock: {selectedProduct.quantity})
                            </div>
                        )}
                    </div>

                    <div className="w-24">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full border p-2 rounded"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                    </div>

                    <button
                        onClick={addToCart}
                        disabled={!selectedProduct}
                        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400 h-10 flex items-center mt-7"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add
                    </button>
                </div>

                {/* Optional: Grid of Quick Access Items (Top Sellers? or just all items) */}
                <div className="flex-1 overflow-y-auto border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Quick Add</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {inventory.slice(0, 9).map(item => (
                            <div key={item.id}
                                onClick={() => {
                                    setSelectedProduct(item);
                                    setProductSearch(item.name);
                                }}
                                className={`border p-3 rounded cursor-pointer hover:bg-gray-50 ${selectedProduct?.id == item.id ? 'border-indigo-500 bg-indigo-50' : ''}`}
                            >
                                <p className="font-bold truncate">{item.name}</p>
                                <p className="text-sm text-gray-500">₹{item.selling_price}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cart & Checkout */}
            <div className="w-1/3 bg-white p-6 rounded-lg shadow-md flex flex-col">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <ShoppingCart className="mr-2" /> Cart
                </h2>

                <div className="relative mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Customer</label>
                    <input
                        type="text"
                        placeholder="Search Customer..."
                        className="w-full p-2 border rounded"
                        value={customerSearch}
                        onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setShowCustomerDropdown(true);
                            setSelectedCustomerId(null); // Reset ID if typing manual name
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                    />
                    {showCustomerDropdown && customerSearch && !selectedCustomerId && (
                        <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto mt-1">
                            {filteredCustomers.map(c => (
                                <div
                                    key={c.id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                        setCustomerSearch(c.name);
                                        setSelectedCustomerId(c.id);
                                        setShowCustomerDropdown(false);
                                    }}
                                >
                                    <div className="font-bold">{c.name}</div>
                                    <div className={`text-xs ${c.current_balance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        Balance: ₹{c.current_balance}
                                    </div>
                                </div>
                            ))}
                            <div
                                className="p-2 hover:bg-gray-100 cursor-pointer text-blue-600 border-t"
                                onClick={() => setShowCustomerDropdown(false)}
                            >
                                <span className="font-semibold">+ Create New:</span> "{customerSearch}"
                            </div>
                        </div>
                    )}
                    {selectedCustomerId && (
                        <div className="text-xs text-green-600 mt-1">
                            Linked to Registered Customer
                        </div>
                    )}
                </div>

                <div className="flex items-center mb-4 bg-gray-50 p-2 rounded">
                    <input
                        type="checkbox"
                        id="paymentInfo"
                        className="mr-2 w-5 h-5 cursor-pointer"
                        checked={isPaid}
                        onChange={(e) => setIsPaid(e.target.checked)}
                    />
                    <label htmlFor="paymentInfo" className="cursor-pointer font-semibold select-none">
                        Mark as Paid?
                    </label>
                    <div className="ml-auto text-sm text-gray-500">
                        {isPaid ? "Balance Unchanged" : "Added to Dues"}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center border-b pb-2">
                            <div className="flex-1">
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-sm text-gray-500">₹{item.selling_price} each</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    min="1"
                                    className="w-16 border rounded p-1 text-center"
                                    value={item.cartQuantity}
                                    onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value))}
                                />
                                <span className="font-bold w-16 text-right">₹{(item.cartQuantity * item.selling_price).toFixed(2)}</span>
                                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <p className="text-center text-gray-400 mt-10">Cart is empty</p>}
                </div>

                <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold mb-4">
                        <span>Total:</span>
                        <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400">
                        Checkout
                    </button>
                </div>
            </div>

            {/* Bill Modal */}
            {showBill && lastSale && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-lg max-w-md w-full">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold">RECEIPT</h2>
                            <p className="text-gray-500">Trophy Retailer Inc.</p>
                            <p className="text-sm text-gray-400">{new Date(lastSale.timestamp).toLocaleString()}</p>
                        </div>

                        <div className="mb-4 border-b pb-4">
                            <p><strong>Customer:</strong> {lastSale.customer_name || 'Walk-in'}</p>
                            <p><strong>Sale ID:</strong> #{lastSale.id}</p>
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
        </div>
    );
};

export default SalesPage;
