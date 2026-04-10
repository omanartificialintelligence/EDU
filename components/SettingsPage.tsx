import React, { useState } from 'react';
import { SupervisorConfig } from '../types';
import { Save, Upload, Building2 } from 'lucide-react';

interface SettingsPageProps {
  supervisorConfig: SupervisorConfig;
  onUpdateConfig: (config: Partial<SupervisorConfig>) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ supervisorConfig, onUpdateConfig }) => {
  const [schoolName, setSchoolName] = useState(supervisorConfig.schoolName || 'مدرسة الخضراء للتعليم الأساسي 1-8');
  const [logoUrl, setLogoUrl] = useState(supervisorConfig.appLogoUrl || '');

  const handleSave = () => {
    onUpdateConfig({ schoolName, appLogoUrl: logoUrl });
    alert('تم حفظ الإعدادات بنجاح');
  };

  return (
    <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 space-y-8">
      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
        <Building2 className="w-6 h-6 text-emerald-600" />
        إعدادات المدرسة
      </h2>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">اسم المدرسة</label>
          <input 
            type="text" 
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">رابط الشعار (URL)</label>
          <input 
            type="text" 
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none font-bold text-sm"
          />
        </div>

        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
        >
          <Save className="w-4 h-4" />
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
