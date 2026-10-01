import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { adminService, AdminUser } from '../services/adminService';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123admin');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = adminService.login(username.trim(), password.trim());
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('نام کاربری یا رمز عبور اشتباه است (اطلاعات ماک: admin / 123admin)');
    }
  };

  const handleQuickDemoLogin = (role: 'super_admin' | 'sales_manager') => {
    const user =
      role === 'super_admin'
        ? adminService.login('admin', '123admin')
        : adminService.login('sales', '123sales');
    if (user) onLoginSuccess(user);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-900/5 selection:bg-[#E06518] selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-right">
        {/* Header Header Bar */}
        <div className="bg-[#55565A] text-white p-8 text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-[#1B293E] border border-slate-700 mx-auto flex items-center justify-center text-[#E06518] shadow-inner mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h1 className="text-xl font-black">ورود به پنل مدیریت هایپر صنعت</h1>
          <p className="text-xs text-slate-300 mt-1">
            سامانه مرکزی بازرگانی تسمه و قطعات صنعتی اطلس یزد
          </p>

          <div className="absolute top-4 left-4">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              v5.0 Admin
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-[#55565A] block">نام کاربری ادمین</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full h-11 pr-10 pl-3 rounded-xl border border-slate-200 text-sm font-mono text-[#55565A] focus:outline-none focus:border-[#E06518]"
                placeholder="admin"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <span className="text-[10px] text-slate-400">نام کاربری پیش‌فرض: admin</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-[#55565A] block">کلمه عبور امنیتی</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full h-11 pr-10 pl-3 rounded-xl border border-slate-200 text-sm font-mono text-[#55565A] focus:outline-none focus:border-[#E06518]"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <span className="text-[10px] text-slate-400">کلمه عبور پیش‌فرض: 123admin</span>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-[#55565A] hover:bg-[#1B293E] text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>ورود امن به داشبورد</span>
            <ArrowRight className="w-4 h-4 text-[#E06518] rotate-180" />
          </button>

          {/* Quick Demo Access Box */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-[#C95210]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>دسترسی سریع بررسی (تست ماک فاز ۵)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('super_admin')}
                className="py-2 px-2.5 bg-orange-50 hover:bg-orange-100 text-[#C95210] font-bold text-[11px] rounded-xl border border-orange-200 transition-colors text-center cursor-pointer"
              >
                ⚡ ورود مدیر کل (admin)
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('sales_manager')}
                className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-[#55565A] font-bold text-[11px] rounded-xl border border-slate-200 transition-colors text-center cursor-pointer"
              >
                کارشناس فروش (sales)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
