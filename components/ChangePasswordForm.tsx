
import React, { useState } from 'react';

interface ChangePasswordFormProps {
  onPasswordChanged: (newPassword: string) => void;
  onLogout: () => void;
  currentPassword?: string;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onPasswordChanged, onLogout, currentPassword }) => {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 4) return setError('كلمة المرور قصيرة جداً');
    if (newPass !== confirmPass) return setError('كلمات المرور غير متطابقة');
    if (currentPassword && newPass === currentPassword) return setError('لا يمكن استخدام نفس كلمة المرور الحالية، يرجى اختيار كلمة مرور جديدة لضمان الأمان.');
    
    onPasswordChanged(newPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 sm:px-6 font-['Tajawal'] py-10">
      <div className="max-w-md w-full bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 space-y-6 sm:space-y-8 border-t-8 border-amber-500">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 sm:mb-4 tracking-tight">تحديث كلمة المرور</h2>
          <p className="text-slate-500 font-bold text-xs sm:text-sm leading-relaxed">
            لقد تم تصفير حسابك، يرجى تعيين كلمة مرور شخصية جديدة للاستمرار.
            <br/>
            <span className="text-[10px] sm:text-xs text-amber-600">يجب أن تكون كلمة المرور الجديدة مختلفة عن الحالية.</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-xs sm:text-sm font-black text-slate-700 pr-2">كلمة المرور الجديدة</label>
            <input 
              type="password" 
              required 
              value={newPass} 
              onChange={(e) => setNewPass(e.target.value)} 
              className="w-full px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-amber-500 outline-none text-center font-extrabold text-base sm:text-lg text-slate-900 placeholder:text-slate-400 transition-all"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-xs sm:text-sm font-black text-slate-700 pr-2">تأكيد كلمة المرور</label>
            <input 
              type="password" 
              required 
              value={confirmPass} 
              onChange={(e) => setConfirmPass(e.target.value)} 
              className="w-full px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-amber-500 outline-none text-center font-extrabold text-base sm:text-lg text-slate-900 placeholder:text-slate-400 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center font-black text-[10px] sm:text-xs animate-pulse">{error}</div>}

          <div className="flex flex-col gap-3 sm:gap-4 pt-2 sm:pt-4">
            <button type="submit" className="w-full bg-amber-500 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl hover:bg-amber-600 shadow-xl transition-all active:scale-95">حفظ وتحديث</button>
            <button type="button" onClick={onLogout} className="text-slate-400 font-bold text-xs sm:text-sm hover:underline">تسجيل الخروج والعودة لاحقاً</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordForm;
