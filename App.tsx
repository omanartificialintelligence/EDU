
import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminPanel from './src/components/AdminPanel';
import TeacherPanel from './src/components/TeacherPanel';
import { LayoutDashboard, Users, BookOpen, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

const App: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'واجهة المشرف', icon: LayoutDashboard },
    { path: '/teacher', label: 'واجهة المعلم', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-tajawal">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">بوابة البيانات التعليمية</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">نظام الإدارة الموحد</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-800">مرحباً بك</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">متصل الآن</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<AdminPanel />} />
          <Route path="/teacher" element={<TeacherPanel />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm font-medium">
            بوابة البيانات التعليمية - جميع الحقوق محفوظة © {new Date().getFullYear()}
          </p>
          <div className="mt-4 flex justify-center gap-6 text-xs font-bold text-slate-300 uppercase tracking-widest">
            <span>نظام آمن</span>
            <span>تحديث فوري</span>
            <span>دعم فني</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
