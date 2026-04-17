import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, ExternalLink, FileIcon, ImageIcon, Video, Music } from 'lucide-react';
import { Attachment } from '../types';

interface FilePreviewModalProps {
  attachment: Attachment | null;
  onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ attachment, onClose }) => {
  if (!attachment) return null;

  const isImage = attachment.type === 'image' || attachment.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  const isVideo = attachment.type === 'video' || attachment.url.match(/\.(mp4|webm|ogg)$/i);
  const isAudio = attachment.type === 'audio' || attachment.url.match(/\.(mp3|wav|ogg)$/i);
  const isDoc = attachment.url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i);
  const isPdf = attachment.url.match(/\.pdf$/i);

  const renderPreview = () => {
    if (isImage) {
      return (
        <img
          src={attachment.url}
          alt={attachment.name || 'Preview'}
          className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
          referrerPolicy="no-referrer"
        />
      );
    }

    if (isVideo) {
      return (
        <video
          src={attachment.url}
          controls
          autoPlay
          className="max-w-full max-h-[70vh] rounded-lg shadow-2xl"
        />
      );
    }

    if (isAudio) {
      return (
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
          <Music className="w-16 h-16 text-indigo-500 animate-pulse" />
          <p className="font-bold text-slate-800">{attachment.name}</p>
          <audio src={attachment.url} controls className="w-full max-w-md" />
        </div>
      );
    }

    if (isPdf) {
      return (
        <iframe
          src={`${attachment.url}#toolbar=0`}
          className="w-full h-[70vh] border-0 rounded-lg shadow-2xl"
          title={attachment.name}
        />
      );
    }

    // Fallback for other documents or types
    return (
      <div className="bg-white p-12 rounded-3xl shadow-2xl flex flex-col items-center gap-6 text-center max-w-md">
        <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center">
          <FileIcon className="w-10 h-10 text-indigo-500" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 mb-2">{attachment.name || 'ملف غير معروف'}</h3>
          <p className="text-slate-500 font-medium">هذا النوع من الملفات قد لا يدعم المعاينة المباشرة. يمكنك تحميله لفتحه.</p>
        </div>
        <div className="flex gap-3 w-full">
          <a
            href={attachment.url}
            download={attachment.name}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            تحميل الملف
          </a>
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-black text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            فتح في نافذة جديدة
          </a>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative max-w-5xl w-full flex flex-col items-center"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="absolute -top-12 left-0 right-0 flex justify-between items-center text-white px-2">
            <h2 className="font-bold text-lg truncate max-w-[70%]">{attachment.name || 'معاينة الملف'}</h2>
            <div className="flex gap-4">
              <a
                href={attachment.url}
                download={attachment.name}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="تحميل"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="w-full flex justify-center items-center">
            {renderPreview()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FilePreviewModal;
