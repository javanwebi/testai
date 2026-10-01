import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, openAuthModal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser) {
      openAuthModal(location.pathname);
    }
  }, [currentUser, location.pathname]);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-[12px] border border-[#CBD2D8] p-8 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-orange-50 text-[#C95210] rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-[#55565A]">ورود به حساب کاربری لازم است</h2>
        <p className="text-xs text-[#777A7D] leading-relaxed">
          برای مشاهده پرتال کاربری، پیگیری سفارش‌ها و استعلام‌ها، یا ادامه فرایند تسویه حساب، لطفاً با شماره موبایل خود وارد شوید.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal(location.pathname)}
          className="w-full h-11 bg-[#E06518] hover:bg-[#C95210] text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          <span>ورود یا ثبت‌نام با شماره موبایل (OTP)</span>
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
