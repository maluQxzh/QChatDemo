
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { AppSettings } from '../types';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>({ theme: 'light', notificationsEnabled: true, logLevel: 'info' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    storageService.getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    await storageService.saveSettings(settings);
    
    // Apply theme only on save
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearData = async () => {
      if(confirm('确定吗？这将删除所有本地消息。')) {
          await storageService.clearAll();
          window.location.reload();
      }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-200">
       <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 h-16 flex items-center px-4 gap-4 draggable transition-colors duration-200">
           <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors no-drag">
               <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
           </button>
           <h1 className="text-lg font-bold text-slate-800 dark:text-white">设置</h1>
       </header>

       <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-200">
               
               {/* Appearance */}
               <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                   <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4">外观</h3>
                   <div className="flex items-center justify-between">
                       <span className="text-slate-600 dark:text-slate-300 text-sm">主题</span>
                       <select 
                        value={settings.theme}
                        onChange={e => setSettings({...settings, theme: e.target.value as any})}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 dark:text-white"
                       >
                           <option value="light">浅色</option>
                           <option value="dark">深色</option>
                       </select>
                   </div>
               </div>

               {/* Notifications */}
               <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                   <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4">通知</h3>
                   <label className="flex items-center justify-between cursor-pointer">
                       <span className="text-slate-600 dark:text-slate-300 text-sm">启用桌面通知</span>
                       <input 
                        type="checkbox" 
                        checked={settings.notificationsEnabled}
                        onChange={e => setSettings({...settings, notificationsEnabled: e.target.checked})}
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                       />
                   </label>
               </div>

               {/* Debugging */}
               <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                   <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4">高级</h3>
                   <div className="flex items-center justify-between mb-4">
                       <span className="text-slate-600 dark:text-slate-300 text-sm">日志等级</span>
                       <select 
                        value={settings.logLevel}
                        onChange={e => setSettings({...settings, logLevel: e.target.value as any})}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 dark:text-white"
                       >
                           <option value="info">信息 (Info)</option>
                           <option value="warn">警告 (Warn)</option>
                           <option value="error">错误 (Error)</option>
                       </select>
                   </div>
                   
                   <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button onClick={clearData} className="flex items-center gap-2 text-red-600 text-sm hover:underline">
                            <Trash2 size={16} /> 清除本地数据 (重置应用)
                        </button>
                   </div>
               </div>

               <div className="p-6 bg-slate-50 dark:bg-slate-900 flex justify-end transition-colors duration-200">
                   <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                   >
                       <Save size={18} /> {saved ? '已保存!' : '保存更改'}
                   </button>
               </div>
           </div>
       </div>
    </div>
  );
};

export default SettingsPage;