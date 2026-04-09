import React, { useState } from 'react';
import { User, Project, Post, LessonMaterial, LessonComment, Notification, ProjectSubmission, Message, Attachment } from '../types';
import { 
  LayoutDashboard, BookOpen, FolderOpen, Search, Bell, ChevronDown, 
  Plus, FileText, ExternalLink, Play, Image as ImageIcon, XCircle, Eye,
  MessageSquare, Settings, Award, FileIcon, Link as LinkIcon, Video,
  TrendingUp, Users, ClipboardList, Send, Music, CheckCircle2, AlertCircle,
  Calendar, ListTodo, Trash2, Clock, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TeacherDashboardV2Props {
  user: User;
  posts: Post[];
  projects: Project[];
  lessonMaterials: LessonMaterial[];
  messages: Message[];
  onSendMessage: (text: string, recipientId?: string, attachments?: Attachment[]) => void;
  onMarkMessageAsRead: (id: string) => void;
  onAddMaterial: (material: LessonMaterial) => void;
  onUpdateMaterial: (material: LessonMaterial) => void;
  updateProjectSubmission: (projectId: string, submission: ProjectSubmission) => void;
  currentYear: string;
  semester: string;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

const TeacherDashboardV2: React.FC<TeacherDashboardV2Props> = ({
  user, posts, lessonMaterials, onAddMaterial, onUpdateMaterial, notifications,
  messages, onSendMessage, onMarkMessageAsRead, projects, updateProjectSubmission, onMarkAsRead, currentYear, semester
}) => {
  // Dynamic Grades and Subjects based on Assignments
  const teacherAssignments = user.assignments || [];
  const assignedGrades = Array.from(new Set(teacherAssignments.map(a => a.grade)));
  const assignedSubjects = Array.from(new Set(teacherAssignments.map(a => a.subject)));

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedGrade, setSelectedGrade] = useState(assignedGrades[0] || 'الصف الأول');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [viewingSubject, setViewingSubject] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [messageAttachment, setMessageAttachment] = useState<string | null>(null);
  const [messageAttachmentName, setMessageAttachmentName] = useState<string>('');
  const [messageAttachmentType, setMessageAttachmentType] = useState<'image' | 'file'>('file');
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  
  // New Lesson State
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<string | null>(null);
  const [newLessonUrl, setNewLessonUrl] = useState('');
  const [newLessonAttachments, setNewLessonAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setNewLessonUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Project Submission State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [submissionFiles, setSubmissionFiles] = useState<Attachment[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkName, setNewLinkName] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');
  const [projectFilter, setProjectFilter] = useState<'all' | 'pending' | 'submitted' | 'completed'>('all');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleAddLink = () => {
    if (!newLinkUrl || !newLinkName) return;
    setSubmissionFiles(prev => [...prev, {
      type: 'link',
      url: newLinkUrl,
      name: newLinkName,
      comment: ''
    }]);
    setNewLinkUrl('');
    setNewLinkName('');
    setIsAddingLink(false);
  };

  const removeSubmissionFile = (index: number) => {
    setSubmissionFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitProject = () => {
    if (!selectedProject) return;
    
    if (submissionFiles.length === 0 && !submissionNote) {
      alert('يرجى إرفاق ملف أو كتابة ملاحظة');
      return;
    }

    const submission: ProjectSubmission = {
      teacherId: user.id,
      files: submissionFiles,
      notes: submissionNote,
      status: 'submitted',
      feedback: '',
      badges: [],
      submittedAt: new Date().toISOString()
    };

    updateProjectSubmission(selectedProject.id, submission);
    
    alert('تم تسليم المشروع بنجاح!');
    setSelectedProject(null);
    setSubmissionFiles([]);
    setSubmissionNote('');
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);

  const grades = assignedGrades.length > 0 ? assignedGrades : ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع'];
  
  const allSubjects = [
    { 
      name: 'لغة عربية', 
      theme: 'emerald',
      bg: 'bg-emerald-50', 
      border: 'border-emerald-200', 
      text: 'text-emerald-700', 
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600',
      icon: BookOpen 
    },
    { 
      name: 'تربية إسلامية', 
      theme: 'sky',
      bg: 'bg-sky-50', 
      border: 'border-sky-200', 
      text: 'text-sky-700', 
      iconBg: 'bg-sky-100',
      iconText: 'text-sky-600',
      icon: BookOpen 
    }
  ];

  const subjects = teacherAssignments.length > 0 
    ? allSubjects.filter(s => teacherAssignments.some(a => a.subject === s.name && a.grade === selectedGrade))
    : allSubjects;

  const uploadOptions = [
    { id: 'ppt', label: 'باور بوينت', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-300' },
    { id: 'doc', label: 'ملف وورد', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-300' },
    { id: 'video', label: 'فيديو', icon: Video, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-300' },
    { id: 'image', label: 'صورة', icon: ImageIcon, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-300' },
    { id: 'audio', label: 'صوت', icon: Music, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-300' },
    { id: 'link', label: 'رابط', icon: LinkIcon, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-300' },
  ];

  // Cross-Access Logic: Can edit if it's their subject or if they are a supervisor
  const canEditSubject = (subjectName: string | null) => {
    if (!subjectName) return false;
    if (user.role === 'SUPERVISOR') return true;
    return teacherAssignments.some(a => a.subject === subjectName && a.grade === selectedGrade);
  };

  const handleOpenUpload = (subjectName: string) => {
    setSelectedSubject(subjectName);
    setNewLessonTitle('');
    setNewLessonType(null);
    setNewLessonUrl('');
    setNewLessonAttachments([]);
    setIsUploadModalOpen(true);
  };

  const handleAddAttachment = () => {
    if (newLessonType !== 'text' && !newLessonUrl) return;
    
    if (newLessonType !== 'text') {
      setNewLessonAttachments(prev => [...prev, {
        type: newLessonType === 'link' ? 'link' : (newLessonType === 'image' ? 'image' : (newLessonType === 'video' ? 'video' : (newLessonType === 'audio' ? 'audio' : 'file'))),
        url: newLessonUrl,
        name: newLessonTitle || `مرفق ${prev.length + 1}`
      }]);
    }
    
    setNewLessonType(null);
    setNewLessonUrl('');
  };

  const handleRemoveAttachment = (index: number) => {
    setNewLessonAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddLesson = () => {
    if (!newLessonTitle || !selectedSubject) {
      alert('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }

    if (newLessonAttachments.length === 0) {
      alert('يرجى إضافة مرفق واحد على الأقل');
      return;
    }

    setIsSubmitting(true);
    
    const newMaterial: LessonMaterial = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      teacherId: user.id,
      teacherName: user.name,
      lessonTitle: newLessonTitle,
      description: `درس: ${newLessonTitle}`,
      attachments: newLessonAttachments,
      comments: [],
      createdAt: new Date().toISOString(),
      academicYear: currentYear,
      semester: semester,
      grade: selectedGrade,
      subject: selectedSubject,
      status: 'pending',
      isModelLesson: false,
      tags: [selectedSubject, selectedGrade]
    };

    onAddMaterial(newMaterial);
    setIsSubmitting(false);
    setIsUploadModalOpen(false);
    alert('تمت إضافة الدرس بنجاح وسيتم مراجعته من قبل المشرفة.');
  };

  const downloadFile = (url: string, filename: string) => {
    if (url && url.startsWith('http')) {
      window.open(url, '_blank');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddComment = (material: LessonMaterial) => {
    if (!commentText.trim()) return;
    
    const newComment: LessonComment = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      text: commentText,
      createdAt: new Date().toISOString(),
    };

    const updatedMaterial = {
      ...material,
      comments: [...(material.comments || []), newComment]
    };

    onUpdateMaterial(updatedMaterial);
    setCommentText('');
  };

  const getFileIcon = (material: LessonMaterial) => {
    const typeTag = material.tags?.find(tag => ['ppt', 'video', 'link', 'image', 'doc', 'audio', 'text'].includes(tag || ''));
    const attachment = material.attachments[0];
    const fileName = attachment?.name?.toLowerCase() || '';
    const url = attachment?.url?.toLowerCase() || '';

    if (typeTag === 'text') {
      return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-100', label: 'نص' };
    }
    if (typeTag === 'ppt' || fileName.includes('powerpoint') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
      return { icon: FileIcon, color: 'text-orange-500', bg: 'bg-orange-50', label: 'PPT' };
    }
    if (typeTag === 'video' || fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi')) {
      return { icon: Video, color: 'text-red-500', bg: 'bg-red-50', label: 'فيديو' };
    }
    if (typeTag === 'audio' || fileName.endsWith('.mp3') || fileName.endsWith('.wav')) {
      return { icon: Music, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'صوت' };
    }
    if (typeTag === 'image' || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.gif')) {
      return { icon: ImageIcon, color: 'text-purple-500', bg: 'bg-purple-50', label: 'صورة' };
    }
    if (typeTag === 'link' || attachment?.type === 'link') {
      return { icon: LinkIcon, color: 'text-blue-500', bg: 'bg-blue-50', label: 'رابط' };
    }
    if (fileName.endsWith('.pdf')) {
      return { icon: FileText, color: 'text-red-600', bg: 'bg-red-50', label: 'PDF' };
    }
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'DOCX' };
    }
    
    return { icon: FileText, color: 'text-slate-400', bg: 'bg-slate-50', label: 'ملف' };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900" dir="rtl">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "bg-white w-64 fixed h-full border-l border-slate-200 z-[110] flex flex-col transition-transform duration-300 lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">منصة الإبداع</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all", activeTab === 'dashboard' ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>لوحة التحكم</span>
          </button>
          <button 
            onClick={() => { setActiveTab('projects'); setIsMobileMenuOpen(false); }}
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all", activeTab === 'projects' ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}
          >
            <FolderOpen className="w-5 h-5" />
            <span>المشاريع</span>
          </button>

          <button 
            onClick={() => { setActiveTab('messages'); setIsMobileMenuOpen(false); }}
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all", activeTab === 'messages' ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}
          >
            <MessageSquare className="w-5 h-5" />
            <span>الرسائل</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <p className="text-[10px] text-slate-500 font-bold">{user.subject || 'معلمة'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:mr-64 flex flex-col min-h-screen w-full">
        {/* Header */}
        <header className="bg-white h-20 border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 bg-slate-50 rounded-xl text-slate-600"
            >
              <LayoutDashboard className="w-6 h-6" />
            </button>
            <div className="relative max-w-md w-full hidden sm:block">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="ابحثي عن الدروس..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 hover:bg-slate-100 rounded-full transition-all"
            >
              <Bell className="w-6 h-6 text-slate-600" />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-16 left-4 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-sm text-slate-900">الإشعارات</h3>
                    <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={cn(
                            "p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer",
                            !notification.isRead ? "bg-indigo-50/50" : ""
                          )}
                          onClick={() => onMarkAsRead(notification.id)}
                        >
                          <div className="flex gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              notification.type === 'system' ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"
                            )}>
                              <Bell className="w-4 h-4" />
                            </div>
                            <div>
                              <p className={cn("text-xs text-slate-700 leading-relaxed", !notification.isRead && "font-bold")}>
                                {notification.message}
                              </p>
                              <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                                {new Date(notification.createdAt).toLocaleString('ar-SA')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs font-bold">
                        لا توجد إشعارات جديدة
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
          {activeTab === 'dashboard' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">مرحباً بكِ في منصة الإبداع</h1>
                  <p className="text-slate-500 mt-1 font-medium">الوصول الشامل والتركيز الخاص - تصفحي إبداعات الزميلات وشاركي إبداعك.</p>
                </div>
              </div>

              {/* Circulars Section */}
              <div className="grid grid-cols-1 gap-6">
                {/* Circulars (Posts) */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-lg text-slate-800">أحدث التعاميم</h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[200px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {posts.filter(p => !p.isArchived).length > 0 ? (
                      posts.filter(p => !p.isArchived).slice(0, 3).map(post => (
                        <div key={post.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all group">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm text-slate-800 group-hover:text-amber-700 transition-colors">{post.title}</h4>
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
                              {new Date(post.createdAt).toLocaleDateString('ar-OM')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{post.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-xs font-bold">لا توجد تعاميم جديدة</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grade Selection Filter Bar */}
              <div className="flex overflow-x-auto pb-2 sm:pb-0 items-center gap-2 sm:gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-fit scrollbar-hide">
                {grades.map((grade, i) => (
                  <button
                    key={grade}
                    onClick={() => { setSelectedGrade(grade); setViewingSubject(null); }}
                    className={cn(
                      "px-4 sm:px-8 py-2.5 sm:py-3 rounded-[12px] text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap",
                      selectedGrade === grade 
                        ? "bg-slate-900 text-white shadow-md" 
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {grade}
                  </button>
                ))}
              </div>

              {/* Subject Grid */}
              {!viewingSubject ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subjects.map((subject, i) => {
                    // Filter materials for this subject and grade
                    const subjectMaterials = lessonMaterials.filter(m => 
                      m.academicYear === currentYear &&
                      !m.isArchived &&
                      (m.tags?.includes(subject.name) || m.lessonTitle.includes(subject.name)) && 
                      (m.tags?.includes(selectedGrade) || m.grade === selectedGrade)
                    );
                    
                    // Calculate stats
                    const addedThisWeek = subjectMaterials.filter(m => {
                      const d = new Date(m.createdAt);
                      const now = new Date();
                      return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
                    }).length;

                    const canEdit = canEditSubject(subject.name);

                    return (
                      <div 
                        key={subject.name} 
                        className={cn(
                          "relative p-8 rounded-[24px] border-2 transition-all duration-300 overflow-hidden group hover:shadow-xl",
                          subject.bg, subject.border
                        )}
                      >
                        {/* Decorative Background Blur */}
                        <div className="absolute -left-12 -top-12 w-40 h-40 bg-white/60 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                        
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-8">
                            <div>
                              <span className={cn("text-xs font-black uppercase tracking-wider mb-2 block", subject.text)}>
                                {selectedGrade}
                              </span>
                              <h3 className="text-3xl font-black text-slate-900">{subject.name}</h3>
                            </div>
                            <div className={cn("w-16 h-16 rounded-[18px] flex items-center justify-center shadow-sm", subject.iconBg, subject.iconText)}>
                              <subject.icon className="w-8 h-8" />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-8">
                            <div className="px-4 py-2.5 bg-white/80 rounded-xl border border-white shadow-sm backdrop-blur-md">
                              <p className="text-[10px] font-bold text-slate-500">إجمالي الدروس</p>
                              <p className={cn("text-xl font-black", subject.text)}>{subjectMaterials.length}</p>
                            </div>
                            <div className="px-4 py-2.5 bg-white/80 rounded-xl border border-white shadow-sm backdrop-blur-md flex items-center gap-2">
                              <div>
                                <p className="text-[10px] font-bold text-slate-500">هذا الأسبوع</p>
                                <p className="text-xl font-black text-slate-900">+{addedThisWeek}</p>
                              </div>
                              {addedThisWeek > 0 && (
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                  <TrendingUp className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setViewingSubject(subject.name)}
                              className="flex-1 py-4 bg-white text-slate-900 rounded-2xl text-sm font-black shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 border border-slate-100 hover:border-slate-300"
                            >
                              <Eye className="w-5 h-5" />
                              تصفح الإبداعات
                            </button>
                            
                            {canEdit && (
                              <button 
                                onClick={() => handleOpenUpload(subject.name)}
                                className={cn(
                                  "w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 hover:-translate-y-1",
                                  subject.theme === 'emerald' ? "bg-emerald-500 shadow-emerald-500/30" : "bg-sky-500 shadow-sky-500/30"
                                )}
                                title="إضافة محتوى جديد"
                              >
                                <Plus className="w-7 h-7" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Subject Detail View */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 sm:p-6 rounded-[24px] border border-slate-200 shadow-sm gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <button 
                        onClick={() => setViewingSubject(null)}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500"
                      >
                        <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 rotate-90" />
                      </button>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">{viewingSubject}</h2>
                        <p className="text-xs sm:text-sm font-bold text-slate-500">{selectedGrade}</p>
                      </div>
                    </div>
                    {canEditSubject(viewingSubject) && (
                      <button 
                        onClick={() => handleOpenUpload(viewingSubject)}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" /> إضافة محتوى
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Render actual materials here */}
                    {lessonMaterials
                      .filter(m => 
                        m.academicYear === currentYear &&
                        !m.isArchived &&
                        (m.tags?.includes(viewingSubject) || m.lessonTitle.includes(viewingSubject)) && 
                        (m.tags?.includes(selectedGrade) || m.grade === selectedGrade)
                      )
                      .map((material, index) => {
                        const fileInfo = getFileIcon(material);
                        const Icon = fileInfo.icon;
                        
                        return (
                          <div key={material.id} className="bg-white rounded-[20px] shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-all">
                            <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="flex items-center gap-4">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border relative", fileInfo.bg, fileInfo.color, "border-slate-100")}>
                                  <Icon className="w-7 h-7" />
                                {material.isModelLesson && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center border border-amber-200 shadow-sm">
                                    <Award className="w-3.5 h-3.5 text-amber-600" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h5 className="font-black text-slate-900 text-base">{material.lessonTitle}</h5>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                      {material.teacherName}
                                    </span>
                                    <span className="text-xs font-medium text-slate-400">
                                      {new Date(material.createdAt).toLocaleDateString('ar-OM')}
                                    </span>
                                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", fileInfo.bg, fileInfo.color)}>
                                      {fileInfo.label}
                                    </span>
                                  </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
                                {material.attachments.map((attachment, idx) => (
                                  <button 
                                    key={idx}
                                    onClick={() => {
                                      downloadFile(attachment.url, `${attachment.name || material.lessonTitle}.${attachment.type === 'link' ? 'html' : 'bin'}`);
                                    }}
                                    className="flex-1 md:flex-none px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all font-bold text-xs flex items-center justify-center gap-2 border border-slate-200"
                                  >
                                    {attachment.type === 'link' ? <LinkIcon className="w-4 h-4" /> : 
                                     attachment.type === 'image' ? <ImageIcon className="w-4 h-4" /> :
                                     attachment.type === 'video' ? <Video className="w-4 h-4" /> :
                                     attachment.type === 'audio' ? <Music className="w-4 h-4" /> :
                                     <FileText className="w-4 h-4" />}
                                    {attachment.type === 'link' ? 'فتح' : 'تحميل'} {attachment.name || `مرفق ${idx + 1}`}
                                  </button>
                                ))}
                              <button 
                                onClick={() => setExpandedLessonId(expandedLessonId === material.id ? null : material.id)}
                                className={cn(
                                  "flex-1 md:flex-none px-4 py-2 rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-2 border",
                                  expandedLessonId === material.id 
                                    ? "bg-blue-600 text-white border-blue-600" 
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700"
                                )}
                              >
                                <MessageSquare className="w-4 h-4" />
                                التعليقات ({material.comments?.length || 0})
                              </button>
                            </div>
                          </div>

                          {/* Comments Section */}
                          <AnimatePresence>
                            {expandedLessonId === material.id && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-100 bg-slate-50/50 overflow-hidden"
                              >
                                <div className="p-6 space-y-4">
                                  <div className="space-y-3">
                                    {material.comments && material.comments.length > 0 ? (
                                      material.comments.map((comment, index) => (
                                        <div key={comment.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-slate-900">{comment.authorName}</span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                              {new Date(comment.createdAt).toLocaleDateString('ar-OM')} {new Date(comment.createdAt).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </div>
                                          <p className="text-sm text-slate-600 font-medium leading-relaxed">{comment.text}</p>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-center py-4">
                                        <p className="text-xs font-bold text-slate-400">لا توجد تعليقات بعد</p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="pt-4 border-t border-slate-200">
                                    <div className="flex gap-2">
                                      <input 
                                        type="text" 
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="اكتبي تعليقك هنا..."
                                        className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-bold"
                                      />
                                      <button 
                                        onClick={() => handleAddComment(material)}
                                        disabled={!commentText.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/10 flex items-center gap-2 text-xs font-bold"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                        إضافة
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                      
                      {lessonMaterials.filter(m => 
                        m.academicYear === currentYear &&
                        !m.isArchived &&
                        (m.tags?.includes(viewingSubject) || m.lessonTitle.includes(viewingSubject)) && 
                        (m.tags?.includes(selectedGrade) || m.grade === selectedGrade)
                      ).length === 0 && (
                        <div className="text-center py-20 bg-white rounded-[24px] border border-dashed border-slate-300">
                          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-slate-900 mb-1">لا توجد دروس بعد</h3>
                          <p className="text-slate-500 text-sm">كوني أول من يضيف محتوى إبداعي لهذا الصف!</p>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-900">مشاريعي</h2>
                <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                  {(['all', 'pending', 'submitted', 'completed'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setProjectFilter(filter)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        projectFilter === filter 
                          ? "bg-white text-indigo-600 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {filter === 'all' ? 'الكل' :
                       filter === 'pending' ? 'قيد العمل' :
                       filter === 'submitted' ? 'تم التسليم' : 'مكتمل'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto snap-y snap-mandatory pr-2 custom-scrollbar focus:outline-none" tabIndex={0}>
                {projects.filter(p => {
                  if (p.academicYear !== currentYear) return false;
                  const isAssigned = p.assignedTeacherIds.includes(user.id);
                  if (!isAssigned) return false;
                  
                  const mySubmission = p.submissions?.[user.id];
                  const status = mySubmission?.status || 'pending';
                  
                  if (projectFilter === 'all') return true;
                  if (projectFilter === 'pending') return status === 'pending' || status === 'needs_work';
                  if (projectFilter === 'submitted') return status === 'submitted';
                  if (projectFilter === 'completed') return status === 'approved';
                  return true;
                }).map((project, index) => {
                  const mySubmission = project.submissions?.[user.id];
                  const status = mySubmission?.status || 'pending';
                  
                  return (
                    <motion.div 
                      key={project.id} 
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="snap-start shrink-0 bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1",
                            status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                            status === 'submitted' ? "bg-blue-100 text-blue-700" :
                            status === 'needs_work' ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-500"
                          )}>
                            {status === 'approved' ? <Award className="w-3 h-3" /> :
                             status === 'submitted' ? <CheckCircle2 className="w-3 h-3" /> :
                             status === 'needs_work' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {status === 'approved' ? 'مكتمل' :
                             status === 'submitted' ? 'تم التسليم' :
                             status === 'needs_work' ? 'يحتاج تعديل' : 'قيد العمل'}
                          </span>
                          {project.startDate && project.endDate ? (
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {project.startDate} - {project.endDate}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              مفتوح المدة
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-900 mb-2">{project.name}</h3>
                        <p className="text-slate-600 mb-4 text-sm line-clamp-2">{project.description}</p>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <ListTodo className="w-4 h-4" />
                            <span>{project.tasks?.length || 0} مهام مطلوبة</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">فريق العمل:</span>
                            <div className="flex -space-x-2 space-x-reverse">
                              {project.assignedTeacherIds.map((teacherId, i) => (
                                <div key={`teacher-${project.id}-${teacherId}-${i}`} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600" title={teacherId === user.id ? 'أنا' : 'زميلة'}>
                                  {teacherId === user.id ? 'أنا' : 'ز'}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setSelectedProject(project);
                          setSubmissionNote(project.submissions?.[user.id]?.notes || '');
                          // Load existing files if any
                          const existingFiles = project.submissions?.[user.id]?.files || [];
                          setSubmissionFiles(existingFiles);
                        }}
                        className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Eye className="w-4 h-4" /> عرض التفاصيل وتسليم العمل
                      </button>
                    </motion.div>
                  );
                })}
                {projects.filter(p => p.assignedTeacherIds.includes(user.id)).length === 0 && (
                  <div className="text-center py-12 bg-white rounded-[24px] border border-dashed border-slate-300">
                    <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-1">لا توجد مشاريع حالياً</h3>
                    <p className="text-slate-500 text-sm">سوف تظهر المشاريع هنا عند تكليفك بها من قبل المشرفة.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Project Submission Modal */}
          <AnimatePresence>
            {selectedProject && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto"
                >
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">{selectedProject.name}</h3>
                      <p className="text-sm text-slate-500 font-bold mt-1">تسليم المشروع</p>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedProject(null);
                        setSubmissionFiles([]);
                        setSubmissionNote('');
                      }} 
                      className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600"
                    >
                      <XCircle className="w-7 h-7" />
                    </button>
                  </div>

                  <div className="p-8 space-y-8">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <h4 className="font-black text-slate-800 mb-2">وصف المشروع</h4>
                      <p className="text-slate-600 text-sm leading-relaxed">{selectedProject.description}</p>
                      
                      {selectedProject.attachments && selectedProject.attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <h5 className="font-bold text-slate-700 text-xs mb-3">مرفقات المشروع:</h5>
                          <div className="flex flex-wrap gap-2">
                            {selectedProject.attachments.map((att, idx) => (
                              <a 
                                key={`proj-att-${selectedProject.id}-${att.name}-${idx}`}
                                href={att.url}
                                download={att.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all"
                              >
                                <FileText className="w-3 h-3" />
                                {att.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      {selectedProject.tasks && selectedProject.tasks.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                          <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                            <ListTodo className="w-5 h-5 text-indigo-600" />
                            مهام المشروع
                          </h4>
                          <ul className="space-y-3">
                            {selectedProject.tasks.map((task, i) => (
                              <li key={`proj-task-${selectedProject.id}-${task}-${i}`} className="flex items-start gap-3 text-sm text-slate-600">
                                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">
                                  {i + 1}
                                </span>
                                {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <h4 className="font-black text-slate-800 border-r-4 border-indigo-500 pr-3">منطقة التسليم</h4>
                      
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-700 block">ملفات المشروع</label>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {submissionFiles.map((file, idx) => (
                            <div key={`sub-file-${file.name}-${idx}`} className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 text-slate-400">
                                    {file.type === 'image' ? <ImageIcon className="w-5 h-5" /> : file.type === 'link' ? <LinkIcon className="w-5 h-5" /> : <FileIcon className="w-5 h-5" />}
                                  </div>
                                  <div className="truncate">
                                    <p className="text-sm font-bold text-slate-700 truncate">{file.name}</p>
                                    <a href={file.url} download={file.name} className="text-xs text-indigo-600 hover:underline">
                                      {file.type === 'link' ? 'فتح الرابط' : 'تحميل'}
                                    </a>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => removeSubmissionFile(idx)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <input 
                                type="text" 
                                placeholder="أضيفي تعليقاً على هذا الرابط..."
                                value={file.comment || ''}
                                onChange={(e) => {
                                  const newFiles = [...submissionFiles];
                                  newFiles[idx].comment = e.target.value;
                                  setSubmissionFiles(newFiles);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setIsAddingLink(true)}
                            className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-[24px] bg-white hover:bg-slate-50 cursor-pointer transition-all group"
                          >
                            <LinkIcon className="w-8 h-8 text-slate-300 mb-2 group-hover:text-indigo-500 transition-colors" />
                            <span className="text-xs font-bold text-slate-500">إضافة رابط</span>
                          </button>
                          <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-[24px] bg-white hover:bg-slate-50 cursor-pointer transition-all group">
                            <FileIcon className="w-8 h-8 text-slate-300 mb-2 group-hover:text-indigo-500 transition-colors" />
                            <span className="text-xs font-bold text-slate-500">إضافة ملف</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSubmissionFiles(prev => [...prev, {
                                    type: file.type.startsWith('image/') ? 'image' : 'file',
                                    url: URL.createObjectURL(file),
                                    name: file.name,
                                    comment: ''
                                  }]);
                                }
                              }}
                            />
                          </label>
                        </div>

                        {isAddingLink && (
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <input 
                              type="text" 
                              placeholder="عنوان الرابط"
                              value={newLinkName}
                              onChange={e => setNewLinkName(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
                            />
                            <input 
                              type="url" 
                              placeholder="الرابط (URL)"
                              value={newLinkUrl}
                              onChange={e => setNewLinkUrl(e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={handleAddLink}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                              >
                                إضافة
                              </button>
                              <button 
                                onClick={() => setIsAddingLink(false)}
                                className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-300"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 block">ملاحظات إضافية</label>
                        <textarea 
                          rows={4}
                          value={submissionNote}
                          onChange={e => setSubmissionNote(e.target.value)}
                          placeholder="اكتبي أي ملاحظات أو توضيحات هنا..."
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-sm resize-none"
                        />
                      </div>

                      {selectedProject.submissions?.[user.id]?.feedback && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                          <h5 className="font-black text-amber-800 text-xs mb-1">ملاحظات المشرفة:</h5>
                          <p className="text-amber-700 text-sm">{selectedProject.submissions[user.id].feedback}</p>
                        </div>
                      )}

                      <button 
                        onClick={handleSubmitProject}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        {selectedProject.submissions?.[user.id] ? 'تحديث التسليم' : 'تسليم المشروع'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>



          {activeTab === 'messages' && (
            <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-12rem)] flex flex-col">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900">الرسائل والتواصل المباشر</h2>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-slate-500">متصل الآن</span>
                </div>
              </div>
              
              <div className="flex-1 bg-white rounded-[24px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {/* Chat Messages Area */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
                      <h3 className="text-lg font-bold text-slate-400">لا توجد رسائل بعد</h3>
                      <p className="text-sm text-slate-400">ابدئي المحادثة مع الزميلات والمشرفات</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={cn(
                          "flex flex-col max-w-[80%]",
                          msg.senderId === user.id ? "mr-auto items-end" : "ml-auto items-start"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-slate-500">{msg.senderName}</span>
                          <span className="text-[8px] font-bold text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm font-bold shadow-sm",
                          msg.senderId === user.id 
                            ? "bg-blue-600 text-white rounded-tr-none" 
                            : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                        )}>
                          {msg.text}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map((att, idx) => (
                                <div key={`msg-att-${msg.id}-${att.name}-${idx}`} className="flex items-center gap-2 bg-black/10 p-2 rounded-lg">
                                  {att.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileIcon className="w-4 h-4" />}
                                  <a href={att.url} download={att.name} target="_blank" rel="noopener noreferrer" className="underline text-xs truncate max-w-[150px] block">
                                    {att.name}
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                  {messageAttachment && (
                    <div className="mb-2 flex items-center gap-2 bg-slate-100 p-2 rounded-lg w-fit">
                      <span className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{messageAttachmentName}</span>
                      <button 
                        onClick={() => {
                          setMessageAttachment(null);
                          setMessageAttachmentName('');
                        }}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newMessageText.trim() || messageAttachment) {
                        const attachments = messageAttachment ? [{
                          type: messageAttachmentType,
                          url: messageAttachment,
                          name: messageAttachmentName
                        }] : [];
                        onSendMessage(newMessageText, undefined, attachments);
                        setNewMessageText('');
                        setMessageAttachment(null);
                        setMessageAttachmentName('');
                        const fileInput = document.getElementById('msg-file-upload') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }
                    }}
                    className="flex gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => document.getElementById('msg-file-upload')?.click()}
                      className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <input 
                      type="file"
                      id="msg-file-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setMessageAttachmentName(file.name);
                          setMessageAttachmentType(file.type.startsWith('image/') ? 'image' : 'file');
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setMessageAttachment(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <input 
                      type="text" 
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="اكتبي رسالتك هنا..."
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessageText.trim() && !messageAttachment}
                      className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Multimedia Upload Hub Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">مركز إضافة المحتوى</h3>
                  <p className="text-sm text-slate-500 font-bold mt-1">
                    {selectedSubject} - {selectedGrade}
                  </p>
                </div>
                <button 
                  onClick={() => setIsUploadModalOpen(false)} 
                  className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-7 h-7" />
                </button>
              </div>

              <div className="p-8 bg-slate-50/50 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 block">عنوان الدرس</label>
                  <input 
                    type="text" 
                    value={newLessonTitle}
                    onChange={e => setNewLessonTitle(e.target.value)}
                    placeholder="مثال: درس المدود في اللغة العربية"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm"
                  />
                </div>

                {!newLessonType ? (
                  <div className="space-y-4">
                    {newLessonAttachments.length > 0 && (
                      <div className="space-y-3 mb-6">
                        <label className="text-sm font-black text-slate-700 block">المرفقات المضافة</label>
                        <div className="space-y-2">
                          {newLessonAttachments.map((att, idx) => (
                            <div key={`new-att-${idx}`} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                                  {att.type === 'link' ? <LinkIcon className="w-5 h-5 text-indigo-500" /> : 
                                   att.type === 'image' ? <ImageIcon className="w-5 h-5 text-emerald-500" /> :
                                   att.type === 'video' ? <Video className="w-5 h-5 text-red-500" /> :
                                   att.type === 'audio' ? <Music className="w-5 h-5 text-purple-500" /> :
                                   <FileText className="w-5 h-5 text-blue-500" />}
                                </div>
                                <span className="text-sm font-bold text-slate-700">{att.name}</span>
                              </div>
                              <button onClick={() => handleRemoveAttachment(idx)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <label className="text-sm font-black text-slate-700 block">إضافة مرفق جديد</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {uploadOptions.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setNewLessonType(type.id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-[24px] border-2 transition-all group bg-white hover:shadow-md",
                            type.border, "hover:border-transparent"
                          )}
                        >
                          <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 shadow-sm", 
                            type.bg, type.color
                          )}>
                            <type.icon className="w-8 h-8" />
                          </div>
                          <span className="text-sm font-black text-slate-700">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 p-6 bg-white rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-black text-slate-700">إضافة {uploadOptions.find(o => o.id === newLessonType)?.label}</label>
                      <button 
                        onClick={() => { setNewLessonType(null); setNewLessonUrl(''); }}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        إلغاء
                      </button>
                    </div>
                    
                    {newLessonType === 'link' ? (
                      <input 
                        type="url" 
                        value={newLessonUrl}
                        onChange={e => setNewLessonUrl(e.target.value)}
                        placeholder="أدخل رابط المورد التعليمي هنا..."
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm"
                      />
                    ) : newLessonType !== 'text' ? (
                      <input 
                        type="file" 
                        onChange={handleFileSelect}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-sm"
                      />
                    ) : null}

                    <button 
                      onClick={handleAddAttachment}
                      disabled={!newLessonUrl}
                      className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      تأكيد إضافة المرفق
                    </button>
                  </div>
                )}

                <button 
                  onClick={handleAddLesson}
                  disabled={isSubmitting || !newLessonTitle || newLessonAttachments.length === 0}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isSubmitting ? 'جاري النشر...' : 'نشر الدرس الآن'}
                </button>
              </div>

              <div className="px-8 py-6 bg-blue-50/50 border-t border-blue-100 flex items-start gap-3">
                <div className="mt-0.5 text-blue-500">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs text-blue-800 font-bold leading-relaxed">
                  التزامن مع الإدارة: بمجرد الضغط على "نشر" لأي محتوى، سيتم إرسال نسخة تلقائياً إلى "الأرشيف الزمني" وسيصل إشعار للمشرف للمراجعة والاعتماد.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherDashboardV2;
