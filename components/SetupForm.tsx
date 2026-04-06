
import React, { useState } from 'react';
import { User, UserRole, SupervisorConfig } from '../types';
import { ShieldCheck, GraduationCap, Calendar, Lock, User as UserIcon } from 'lucide-react';

interface SetupFormProps {
  onComplete: (supervisor: User, config: SupervisorConfig) => void;
}

const SetupForm: React.FC<SetupFormProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState('الفصل الدراسي الأول');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !id || !password) {
      setError('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }

    const supervisor: User = {
      id,
      code: id,
      name,
      role: UserRole.SUPERVISOR,
      password,
      isActive: true,
      joinedAt: academicYear,
      auditLogs: [{
        id: Date.now().toString(),
        userId: id,
        userName: name,
        action: 'تم إعداد الحساب الرئيسي للمشرفة',
        timestamp: new Date().toISOString()
      }]
    };

    const config: SupervisorConfig = {
      mainPassword: password,
      backupPassword: password, // Default backup to same as main
      academicYear,
      semester,
      isSetupComplete: true,
      archiveYears: []
    };

    onComplete(supervisor, config);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 sm:px-6 font-['Tajawal'] py-10">
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-12 space-y-8 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="text-center">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-3xl shadow-inner">
            <ShieldCheck className="text-indigo-600 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">إعداد المنصة لأول مرة</h1>
          <p className="text-slate-500 font-bold text-sm">يرجى إدخال بيانات المشرفة الرئيسية لضبط النظام</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black text-slate-400 pr-2 flex items-center gap-2">
              <UserIcon className="w-3 h-3" /> اسم المشرفة بالكامل
            </label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 outline-none font-bold text-slate-900 transition-all" 
              placeholder="مثال: رحمه بنت حمد الشرجيه" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 pr-2 flex items-center gap-2">
              <GraduationCap className="w-3 h-3" /> الرقم الوظيفي للمشرفة
            </label>
            <input 
              type="text" 
              required 
              value={id} 
              onChange={(e) => setId(e.target.value)} 
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 outline-none font-bold text-slate-900 transition-all" 
              placeholder="أدخل الرقم الوظيفي..." 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 pr-2 flex items-center gap-2">
              <Lock className="w-3 h-3" /> كلمة مرور النظام الجديدة
            </label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 outline-none font-bold text-slate-900 transition-all" 
              placeholder="••••••••" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 pr-2 flex items-center gap-2">
              <Calendar className="w-3 h-3" /> السنة الدراسية الحالية
            </label>
            <input 
              type="text" 
              required 
              value={academicYear} 
              onChange={(e) => setAcademicYear(e.target.value)} 
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 outline-none font-bold text-slate-900 transition-all" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 pr-2 flex items-center gap-2">
              <Calendar className="w-3 h-3" /> الفصل الدراسي
            </label>
            <select 
              value={semester} 
              onChange={(e) => setSemester(e.target.value)} 
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 outline-none font-bold text-slate-900 transition-all appearance-none"
            >
              <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
              <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
            </select>
          </div>

          {error && <div className="md:col-span-2 bg-red-50 text-red-600 text-xs font-black p-4 rounded-2xl text-center">{error}</div>}

          <button 
            type="submit" 
            className="md:col-span-2 bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-600 shadow-xl shadow-indigo-100 active:scale-95 transition-all mt-4"
          >
            حفظ البيانات وتشغيل المنصة
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupForm;
