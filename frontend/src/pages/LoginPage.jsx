import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
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

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo Area */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-28 h-28 bg-white rounded-[32px] shadow-2xl shadow-blue-200/50 mb-6 rotate-3 border-4 border-white overflow-hidden">
                        <img src={logoImg} alt="Logo" className="w-full h-full object-cover transform scale-110" />
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
