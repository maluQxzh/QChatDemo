
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../services/socketService';
import { storageService } from '../services/storageService';
import { ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [serverHost, setServerHost] = useState('');
  const [serverPort, setServerPort] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
      // Auto-fill last user
      const loadLastUser = async () => {
          const lastUser = await storageService.getLastUser();
          if (lastUser) {
              setUserId(lastUser.id);
              setUsername(lastUser.username);
          } else {
              // Default if no history
              setUserId(`user_${Math.floor(Math.random() * 1000)}`);
              setUsername('我');
          }
          // Prefill server config from settings if any
          const settings = await storageService.getSettings();
          if (settings.serverHost) setServerHost(settings.serverHost);
          if (settings.serverPort) setServerPort(String(settings.serverPort));
      };
      loadLastUser();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!userId.trim() || !username.trim()) return;

    setLoading(true);
    setError(null);
    // Validate Host (IPv4 or Domain) and port if provided
    const hostTrim = serverHost.trim();
    const portTrim = serverPort.trim();
    // Regex for IPv4 or Domain Name (including localhost)
    const hostRegex = /^((25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3})$|^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,63}$|^localhost$/;

    if (hostTrim && !hostRegex.test(hostTrim)) {
        setLoading(false);
        setError('服务器地址格式错误，请输入有效的 IPv4 或域名');
        return;
    }
    if (portTrim) {
        const portNum = Number(portTrim);
        if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
            setLoading(false);
            setError('端口号需为 1-65535 的整数');
            return;
        }
    }
    
    // Create User Object
    const user = {
        id: userId.trim(),
        username: username.trim(),
        status: 'online' as const,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
    };

    // Save Session
    await storageService.setCurrentUser(user);
    
    // Configure server and persist (IPv4 only)
    if (hostTrim || portTrim) {
        socketService.configureServer(hostTrim || undefined, portTrim || undefined);
        const prev = await storageService.getSettings();
        const next = { ...prev, serverHost: hostTrim || undefined } as any;
        if (portTrim) next.serverPort = Number(portTrim);
        await storageService.saveSettings(next);
    } else {
        // Clear to use env/defaults
        socketService.configureServer();
    }

    // Attempt Connection
    socketService.connect(user);
    
    // Poll for connection status
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
        const state = socketService.getState();
        if (state === 'CONNECTED') {
            clearInterval(checkInterval);
            navigate('/app');
        } else if (state === 'DISCONNECTED') {
            // Connection failed (all endpoints tried)
            clearInterval(checkInterval);
            setLoading(false);
            setError('连接服务器失败，请检查网络或确认服务端已启动。');
            socketService.disconnect();
        } else {
            // Still CONNECTING... check timeout
            if (Date.now() - startTime > 8000) { // 8 seconds max
                clearInterval(checkInterval);
                setLoading(false);
                setError('连接超时，请稍后重试。');
                socketService.disconnect();
            }
        }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden transition-colors duration-200">
        <div className="p-8">
            <div className="flex justify-center mb-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-full">
                    <ShieldCheck size={40} className="text-indigo-600 dark:text-indigo-400" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">欢迎回来</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">专为专业人士打造的安全通讯工具。</p>
            
            {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">用户 ID (唯一标识)</label>
                    <input 
                        type="text" 
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="例如: user_001, alice"
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all text-slate-700 font-mono"
                        required
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">好友需要通过此 ID 添加你。</p>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">显示名称</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="例如: 张三"
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all"
                        required
                    />
                </div>

                {/* Signaling Server Address (last section, IPv4 or Domain) */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">信令服务器地址(留空则搜索本地或预设)</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="text"
                            value={serverHost}
                            onChange={(e) => {
                                const raw = e.target.value;
                                // Allow typing 'Host:port' then split if valid shape
                                const trimmed = raw.trim();
                                const hostPortMatch = trimmed.match(/^([a-zA-Z0-9.-]+):(\d{0,5})$/);
                                if (hostPortMatch) {
                                    setServerHost(hostPortMatch[1].replace(/[^a-zA-Z0-9.-]/g, ''));
                                    setServerPort(hostPortMatch[2]);
                                } else {
                                    // Keep only valid domain/IP chars
                                    setServerHost(trimmed.replace(/[^a-zA-Z0-9.-]/g, ''));
                                }
                            }}
                            placeholder={serverHost.trim()==='' ? 'IP 或 域名' : ''}
                            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all font-mono"
                        />
                        <span className="text-slate-400">:</span>
                        <input 
                            type="text"
                            value={serverPort}
                            onChange={(e) => {
                                // Only digits for port
                                setServerPort(e.target.value.replace(/\D/g, ''));
                            }}
                            placeholder={serverPort.trim()==='' ? '端口号' : ''}
                            className="w-28 px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 focus:border-indigo-500 outline-none transition-all font-mono"
                        />
                    </div>
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>登录 <ArrowRight size={20} /></>}
                </button>
            </form>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 px-8 py-4 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors duration-200">
            当前版本: v0.1.0
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
