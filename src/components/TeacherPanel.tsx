import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Lesson } from '../types';
import { BookOpen, Calendar, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TeacherPanel: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Real-time listener for lessons collection
    // This solves the "auto-refresh" requirement by updating the UI immediately when data changes
    const lessonsQuery = query(collection(db, 'lessons'), orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      lessonsQuery,
      (snapshot) => {
        const lessonsData: Lesson[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Lesson));
        setLessons(lessonsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching lessons:', err);
        setError(`فشل جلب البيانات: ${err.message}`);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">واجهة المعلم (Teacher)</h2>
            <p className="text-slate-500 text-sm">استعراض الدروس المضافة من المشرف</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث تلقائي مفعل
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-500 font-medium">جاري جلب البيانات المحدثة...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          <p className="font-medium">{error}</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center space-y-4">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700">لا توجد دروس حالياً</h3>
          <p className="text-slate-500">سيتم عرض الدروس هنا فور إضافتها من قبل المشرف.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {lessons.map((lesson, index) => (
              <motion.div
                key={`${lesson.id}-${index}`} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {lesson.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    <Calendar className="w-3 h-3" />
                    {lesson.date}
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {lesson.content}
                </p>
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    ID: {lesson.id?.slice(0, 8)}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded">
                    محدث الآن
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default TeacherPanel;
