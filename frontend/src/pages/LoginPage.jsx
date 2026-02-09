import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Loader2, Package } from 'lucide-react';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    const handleRootLogin = async () => {
        setError('');
        setLoading(true);

        // Root bypass logic: send 'root' with empty password
        const result = await login('root', 'root123'); // Or any password, backend bypasses it

        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo Area */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#5D9FD6] rounded-3xl shadow-xl shadow-blue-100 mb-6">
                        <Package className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-tight">
                        Retail Inventory <br />
                        <span className="text-[#5D9FD6]">Agent</span>
                    </h1>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-[32px] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-8">Welcome Back</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-shake">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#5D9FD6] transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-[#5D9FD6] focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-700"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#5D9FD6] transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-[#5D9FD6] focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-700"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#5D9FD6] hover:bg-[#4A8EC5] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">or</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleRootLogin}
                            disabled={loading}
                            className="w-full py-4 border-2 border-slate-100 hover:border-[#5D9FD6] hover:bg-slate-50 text-slate-600 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            <User className="w-5 h-5" />
                            Quick Root Login
                        </button>
                    </form>
                </div>

                {/* Footer Link */}
                <p className="text-center mt-12 text-slate-400 text-xs font-bold uppercase tracking-[0.3em] opacity-50">
                    Retail Inventory Agent v2.0
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
