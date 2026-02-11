import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, Loader2, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [guestLoading, setGuestLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(username, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setGuestLoading(true);
        setError('');

        const result = await login('guest', 'guest123');
        if (result.success) {
            navigate('/');
        } else {
            setError('Guest login failed. Please contact administrator.');
            setGuestLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FB] p-6">
            <div className="max-w-md w-full">
                {/* Branding */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#5D9FD6] text-white shadow-xl shadow-blue-200 mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                        <ShieldCheck size={40} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Retail Agent</h1>
                    <p className="text-slate-400 font-medium">Manage your inventory with intelligence</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold border border-red-100 animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#5D9FD6] transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#5D9FD6] transition-all"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#5D9FD6] transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#5D9FD6] transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || guestLoading}
                            className="w-full flex items-center justify-center py-4 px-6 bg-[#5D9FD6] hover:bg-[#4A8CC3] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-50 relative z-10">
                        <p className="text-center text-[10px] font-black uppercase tracking-[0.1em] text-slate-300 mb-6">Or try it out</p>
                        <button
                            onClick={handleGuestLogin}
                            disabled={loading || guestLoading}
                            className="w-full flex items-center justify-center py-4 px-6 bg-emerald-50 text-emerald-600 border-2 border-emerald-100 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                            {guestLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login as Guest'}
                        </button>
                    </div>
                </div>

                <p className="text-center mt-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                    Natraj India v2.0
                </p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            ` }} />
        </div>
    );
};

export default LoginPage;
