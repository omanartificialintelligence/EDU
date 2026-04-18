import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Video, Music, CheckCircle2, AlertCircle } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../src/firebase';
import { Attachment } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LessonAttachmentUploader = ({
  lessonTitle,
  onUploadComplete,
  compact = false
}: {
  lessonTitle: string;
  onUploadComplete: (attachment: Attachment) => void;
  compact?: boolean;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!lessonTitle) {
      setError('يرجى تحديد عنوان الدرس أولاً قبل إضافة المرفقات');
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);

    const safeTitle = lessonTitle.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '').trim() || 'Untitled';
    const filePath = `lessons/${safeTitle}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      },
      (err) => {
        setIsUploading(false);
        setError('تعذر رفع الملف. يرجى المحاولة مرة أخرى.');
        console.error('Upload Error:', err);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        let type: any = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';

        const newAtt: Attachment = {
          id: `${Date.now()}`,
          name: file.name,
          url: downloadURL,
          type,
          uploadedAt: new Date().toISOString()
        };
        
        onUploadComplete(newAtt);
        setIsUploading(false);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    );
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx"
      />
      
      {!isUploading ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "w-full border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer",
            compact ? "py-4" : "py-8"
          )}
        >
          <div className={cn("bg-slate-100 rounded-full flex items-center justify-center", compact ? "w-8 h-8" : "w-12 h-12")}>
            <Upload className={cn(compact ? "w-4 h-4" : "w-6 h-6")} />
          </div>
          <div className="text-center">
            <p className={cn("font-bold text-slate-600", compact ? "text-xs" : "text-sm")}>اضغط هنا لإضافة مرفق جديد</p>
            {!compact && <p className="text-xs text-slate-400 mt-1">يدعم (PDF, صور, فيديو, Word, PowerPoint)</p>}
          </div>
        </button>
      ) : (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 text-blue-600">
              <Upload className="w-5 h-5 animate-bounce" />
              <span className="font-bold text-sm">جاري رفع المرفق...</span>
            </div>
            <span className="text-sm font-black">{Math.round(progress)}%</span>
          </div>
          
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
