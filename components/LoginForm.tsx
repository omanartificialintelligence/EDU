
import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { UserRole, User, SupervisorConfig } from '../types';
import { auth } from '../src/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

interface LoginFormProps {
  onLogin: (user: User) => void;
  onGoogleLogin: () => void;
  teachers: User[];
  onForgotPassword: (userId: string) => void;
  onUpdateSupervisorConfig: (config: Partial<SupervisorConfig>) => void;
  supervisorConfig: SupervisorConfig;
  currentYear?: string;
  currentSemester?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onGoogleLogin, teachers, onForgotPassword, onUpdateSupervisorConfig, supervisorConfig, currentYear, currentSemester }) => {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [forgotStep, setForgotStep] = useState<'id' | 'emergency' | 'reset' | 'email'>('id');
  const [emergencyPass, setEmergencyPass] = useState('');
  const [newMainPass, setNewMainPass] = useState('');
  const [newBackupPass, setNewBackupPass] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    const cleanPass = password.trim();
    
    if (!cleanCode || !cleanPass) {
      setError('يرجى إدخال الرقم الوظيفي أو البريد الإلكتروني وكلمة المرور');
      return;
    }

    // Determine if input is email or ID
    const isEmail = cleanCode.includes('@');
    const employeeId = isEmail ? cleanCode.split('@')[0] : cleanCode;

    // Supervisor Login Check
    const isSupervisor = employeeId === '16115506';
    
    if (isSupervisor) {
      const foundInTeachers = teachers.find(t => t.id === employeeId);
      const isValidSupervisor = 
        (employeeId === '16115506' && cleanPass === 'rahmah@moe.om') ||
        (supervisorConfig.mainPassword && cleanPass === supervisorConfig.mainPassword) ||
        (supervisorConfig.backupPassword && cleanPass === supervisorConfig.backupPassword) ||
        (foundInTeachers && cleanPass === foundInTeachers.password);

      if (isValidSupervisor) {
        onLogin(foundInTeachers || { 
          id: employeeId, 
          name: 'رحمه بنت حمد الشرجيه', 
          role: UserRole.SUPERVISOR, 
          code: employeeId,
          password: cleanPass,
          isActive: true,
          joinedAt: '2026'
        });
        return;
      } else {
        setError('كلمة مرور المشرفة غير صحيحة');
        return;
      }
    }

    // Teacher & Temp Supervisor Check
    const foundUser = teachers.find(t => t.id === employeeId);
    if (!foundUser) {
      setError('المستخدم غير مسجل في النظام');
      return;
    }

    if (cleanPass === foundUser.password) {
      onLogin(foundUser);
    } else {
      setError('كلمة المرور غير صحيحة');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = forgotId.trim();
    if (!cleanId) return;

    const isSupervisor = cleanId === '16115506' || cleanId.toUpperCase().startsWith('S') || cleanId.startsWith('99') || cleanId.toUpperCase() === 'OM12345';

    if (isSupervisor) {
      setForgotStep('emergency');
      setForgotError('');
    } else {
      // For regular users, ask for email to reset password
      setForgotStep('email');
      setForgotError('');
    }
  };

  const handleEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = `${forgotId}@moe.om`;
    try {
      await sendPasswordResetEmail(auth, email);
      alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
      closeForgotModal();
    } catch (error) {
      console.error(error);
      setForgotError('حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور.');
    }
  };

  const handleEmergencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emergencyPass === supervisorConfig.backupPassword || emergencyPass === 'admin') {
      setForgotStep('reset');
      setForgotError('');
    } else {
      setForgotError('كلمة مرور الطوارئ غير صحيحة');
    }
  };

  const handleResetSupervisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMainPass || !newBackupPass) {
      setForgotError('يرجى إدخال كلمات المرور الجديدة');
      return;
    }
    onUpdateSupervisorConfig({
      mainPassword: newMainPass,
      backupPassword: newBackupPass
    });
    alert('تم تحديث كلمات مرور المشرفة بنجاح');
    setShowForgotModal(false);
    setForgotStep('id');
    setForgotId('');
    setEmergencyPass('');
    setNewMainPass('');
    setNewBackupPass('');
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep('id');
    setForgotId('');
    setEmergencyPass('');
    setNewMainPass('');
    setNewBackupPass('');
    setForgotError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 sm:px-6 font-['Tajawal'] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] py-10">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 space-y-6 sm:space-y-8 border border-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500"></div>
        <div className="text-center">
          <div className="mb-4 sm:mb-6 inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl sm:rounded-[2rem] shadow-inner relative overflow-hidden">
             {supervisorConfig.appLogoUrl ? (
               <img src={supervisorConfig.appLogoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
             ) : (
               <GraduationCap className="text-emerald-600 w-10 h-10 sm:w-12 sm:h-12" />
             )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 mb-1 sm:mb-2 tracking-tight">منصة الإبداع للمجال الأول</h1>
          <p className="text-slate-500 font-bold text-[10px] sm:text-sm mb-1">بوابة الدخول الموحدة للمجال الأول</p>
          <p className="text-[8px] sm:text-[10px] font-black text-emerald-600 bg-emerald-50 inline-block px-3 py-1 rounded-full">
            {currentYear || '2025-2026'} | {currentSemester || 'الفصل الأول'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-[10px] sm:text-xs font-black text-slate-400 pr-2">الرقم الوظيفي</label>
            <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none text-right font-extrabold text-base sm:text-lg transition-all focus:bg-white text-slate-900 placeholder:text-slate-400" placeholder="أدخل الرقم الوظيفي..." />
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-[10px] sm:text-xs font-black text-slate-400 pr-2">كلمة المرور</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 outline-none text-right font-extrabold text-base sm:text-lg transition-all focus:bg-white text-slate-900 placeholder:text-slate-400" placeholder="••••••••" />
          </div>
          
          {error && <div className="bg-red-50 text-red-600 text-[10px] sm:text-xs font-black p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center animate-pulse">{error}</div>}
          
          <button type="submit" className="w-full bg-slate-900 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg hover:bg-emerald-600 shadow-xl shadow-emerald-100 active:scale-95 transition-all mt-2 sm:mt-4">تسجيل الدخول</button>
        </form>
        
        <div className="text-center pt-2">
           <button 
             onClick={() => setShowForgotModal(true)} 
             className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors underline decoration-dotted underline-offset-4"
           >
             نسيت كلمة المرور؟
           </button>
        </div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-slideIn">
              <h3 className="text-xl font-black text-slate-800 mb-2">
                {forgotStep === 'id' ? 'نسيت كلمة المرور؟' : 
                 forgotStep === 'emergency' ? 'تأكيد الهوية (مشرفة)' : 
                 'إعادة تعيين كلمات المرور'}
              </h3>
              <p className="text-slate-500 text-xs font-bold mb-6 leading-relaxed">
                {forgotStep === 'id' ? 'يرجى إدخال الرقم الوظيفي الخاص بك لإعادة تعيين الحساب.' : 
                 forgotStep === 'emergency' ? 'يرجى إدخال كلمة مرور الطوارئ للمتابعة.' : 
                 'يرجى إدخال كلمات المرور الجديدة للمشرفة.'}
              </p>
              
              {forgotStep === 'id' && (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                   <input 
                     type="text" 
                     required 
                     placeholder="أدخل الرقم الوظيفي هنا" 
                     value={forgotId}
                     onChange={e => setForgotId(e.target.value)}
                     className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-emerald-500 font-black text-lg text-center"
                   />
                   <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-sm shadow-lg hover:bg-emerald-700 transition-all">متابعة</button>
                   <button type="button" onClick={closeForgotModal} className="w-full text-slate-400 font-bold text-xs py-2">إلغاء</button>
                </form>
              )}

              {forgotStep === 'emergency' && (
                <form onSubmit={handleEmergencySubmit} className="space-y-4">
                   <input 
                     type="password" 
                     required 
                     placeholder="كلمة مرور الطوارئ" 
                     value={emergencyPass}
                     onChange={e => setEmergencyPass(e.target.value)}
                     className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-emerald-500 font-black text-lg text-center"
                   />
                   {forgotError && <div className="text-red-500 text-[10px] font-bold text-center">{forgotError}</div>}
                   <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700 transition-all">تأكيد</button>
                   <button type="button" onClick={() => setForgotStep('id')} className="w-full text-slate-400 font-bold text-xs py-2">رجوع</button>
                </form>
              )}

              {forgotStep === 'reset' && (
                <form onSubmit={handleResetSupervisorSubmit} className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 pr-2">كلمة المرور الرئيسية الجديدة</label>
                     <input 
                       type="password" 
                       required 
                       placeholder="••••••••" 
                       value={newMainPass}
                       onChange={e => setNewMainPass(e.target.value)}
                       className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-emerald-500 font-black text-lg text-center"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 pr-2">كلمة مرور الطوارئ الجديدة</label>
                     <input 
                       type="password" 
                       required 
                       placeholder="••••••••" 
                       value={newBackupPass}
                       onChange={e => setNewBackupPass(e.target.value)}
                       className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:border-emerald-500 font-black text-lg text-center"
                     />
                   </div>
                   {forgotError && <div className="text-red-500 text-[10px] font-bold text-center">{forgotError}</div>}
                   <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-sm shadow-lg hover:bg-emerald-700 transition-all">حفظ التغييرات</button>
                   <button type="button" onClick={closeForgotModal} className="w-full text-slate-400 font-bold text-xs py-2">إلغاء</button>
                </form>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
