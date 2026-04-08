
import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, Project, Post, ProjectSubmission, Attachment, ResetRequest, 
  LessonMaterial, LessonComment, UserRole, SupervisorConfig, Notification, AuditLog, Message 
} from '../types';
import { 
  LayoutDashboard, Users, Rocket, Palette, Archive, Bell, 
  LogOut, Search, Plus, Filter, CheckCircle, XCircle, X,
  Clock, Shield, MessageSquare, Pin, FileText, Download, Calendar,
  TrendingUp, Award, Activity, Settings, Share2, Send, Trash2,
  Phone, Hash, BookOpen, GraduationCap, User as UserIcon,
  FileIcon, Link as LinkIcon, Video, Music, Image as ImageIcon, ChevronDown, Eye, ListTodo, Edit
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { exportTeachersCSV, exportLessonsCSV, exportProjectsCSV, exportToPDF } from '../src/services/exportService';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SupervisorDashboardProps {
  user: User;
  teachers: User[];
  posts: Post[];
  projects: Project[];
  lessonMaterials: LessonMaterial[];
  resetRequests: ResetRequest[];
  messages: Message[];
  onSendMessage: (text: string, recipientId?: string, attachments?: Attachment[]) => void;
  onMarkMessageAsRead: (id: string) => void;
  onAddPost: (post: Post) => void;
  onDeletePost: (id: string) => void;
  onTogglePinPost: (id: string) => void;
  onAddTeacher: (id: string, name: string, email?: string, phone?: string, assignments?: { grade: string; subject: string }[]) => void;
  onSoftDeleteTeacher: (id: string) => void;
  onRestoreTeacher: (id: string) => void;
  onUpdateTeacher: (originalId: string, teacher: User) => void;
  onResetPassword: (teacherId: string) => Promise<string>;
  onAddProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProjectSubmission: (projectId: string, submission: ProjectSubmission) => void;
  onAddTempSupervisor: (user: User) => void;
  onDeleteTempSupervisor: (id: string) => void;
  onUpdateSecurity: (config: SupervisorConfig) => void;
  onUpdateLessonMaterial: (material: LessonMaterial) => void;
  onAddLessonMaterial: (material: LessonMaterial) => void;
  onSoftDeleteLesson: (id: string) => void;
  onRestoreLesson: (id: string) => void;
  onDeletePermanentlyLesson: (id: string) => void;
  onDeletePermanentlyTeacher: (id: string) => void;
  onDeletePermanentlyProject: (id: string) => void;
  onDeletePermanentlyPost: (id: string) => void;
  onAddNotification: (notification: Notification) => void;
  notifications: Notification[];
  onMarkNotificationAsRead: (id: string) => void;
  onLogout: () => void;
  supervisorConfig: SupervisorConfig;
  academicYear: string;
  semester: string;
}

const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ 
  user, teachers, posts, projects, lessonMaterials, resetRequests,
  messages, onSendMessage, onMarkMessageAsRead,
  onAddPost, onDeletePost, onTogglePinPost,
  onAddTeacher, onSoftDeleteTeacher, onRestoreTeacher, onUpdateTeacher, onResetPassword,
  onAddProject, onDeleteProject, onUpdateProjectSubmission,
  onAddTempSupervisor, onDeleteTempSupervisor, onUpdateSecurity, onUpdateLessonMaterial, onAddLessonMaterial,
  onSoftDeleteLesson, onRestoreLesson, onDeletePermanentlyLesson, onDeletePermanentlyTeacher, onDeletePermanentlyProject, onDeletePermanentlyPost, onAddNotification,
  notifications, onMarkNotificationAsRead,
  onLogout,
  supervisorConfig, academicYear, semester
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'feed' | 'lessons' | 'teachers' | 'archive' | 'security' | 'messages' | 'projects' | 'temp-supervisors'>('overview');
  const [securityView, setSecurityView] = useState<'main' | 'change-main' | 'add-emergency'>('main');
  const [selectedTeacherForMessages, setSelectedTeacherForMessages] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [messageAttachment, setMessageAttachment] = useState<string | null>(null);
  const [messageAttachmentName, setMessageAttachmentName] = useState<string>('');
  const [messageAttachmentType, setMessageAttachmentType] = useState<'image' | 'file'>('file');
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editTeacherPhone, setEditTeacherPhone] = useState('');
  const [editTeacherAssignments, setEditTeacherAssignments] = useState<{grade: string, subject: string}[]>([]);
  const [editAssignmentGrade, setEditAssignmentGrade] = useState('الصف الأول');
  const [editAssignmentSubject, setEditAssignmentSubject] = useState('لغة عربية');
  
  useEffect(() => {
    if (editingTeacher) {
      setEditTeacherName(editingTeacher.name);
      setEditTeacherId(editingTeacher.id);
      setEditTeacherPhone(editingTeacher.phoneNumber || '');
      setEditTeacherAssignments(editingTeacher.assignments || []);
    }
  }, [editingTeacher]);

  const handleUpdateTeacher = () => {
    if (!editingTeacher) return;
    if (!editTeacherName || !editTeacherId) {
      alert('يرجى إدخال الاسم والرقم الوظيفي');
      return;
    }

    const updatedTeacher: any = {
      ...editingTeacher,
      name: editTeacherName,
      id: editTeacherId,
      code: editTeacherId,
      phoneNumber: editTeacherPhone,
      assignments: editTeacherAssignments
    };

    onUpdateTeacher(editingTeacher.id, updatedTeacher as User);
    setEditingTeacher(null);
    alert('تم تحديث بيانات المعلمة بنجاح');
  };
  
  const AVAILABLE_GRADES = ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع'];
  const AVAILABLE_SUBJECTS = ['لغة عربية', 'تربية إسلامية'];

  // Lesson Filters
  const [activeGradeTab, setActiveGradeTab] = useState<string>(AVAILABLE_GRADES[0]);
  const [activeSubjectTab, setActiveSubjectTab] = useState<string>(AVAILABLE_SUBJECTS[0]);
  const [viewingSubject, setViewingSubject] = useState<string | null>(null);

  // Add Attachment State
  const [isAddAttachmentModalOpen, setIsAddAttachmentModalOpen] = useState(false);
  const [attachmentGrade, setAttachmentGrade] = useState(AVAILABLE_GRADES[0]);
  const [attachmentSubject, setAttachmentSubject] = useState(AVAILABLE_SUBJECTS[0]);
  const [attachmentSemester, setAttachmentSemester] = useState(semester);
  const [attachmentLessonId, setAttachmentLessonId] = useState<string>('new');
  const [attachmentNewLessonTitle, setAttachmentNewLessonTitle] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<Attachment[]>([]);
  const [attachmentTeacherId, setAttachmentTeacherId] = useState('');
  const [isZipping, setIsZipping] = useState(false);

  // Sync attachment form with current view
  useEffect(() => {
    setAttachmentSemester(semester);
  }, [semester]);

  useEffect(() => {
    if (isAddAttachmentModalOpen) {
      if (activeGradeTab) setAttachmentGrade(activeGradeTab);
      if (viewingSubject) setAttachmentSubject(viewingSubject);
    }
  }, [isAddAttachmentModalOpen, activeGradeTab, viewingSubject]);



  const handleDownloadAllAttachments = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      let count = 0;

      let relevantLessons = lessonMaterials;

      if (viewingSubject) {
        // Filter by viewingSubject and activeGradeTab
        relevantLessons = relevantLessons.filter(m => 
          (m.tags?.includes(viewingSubject) || m.lessonTitle.includes(viewingSubject) || m.subject === viewingSubject) && 
          (m.tags?.includes(activeGradeTab) || m.academicYear === activeGradeTab || m.grade === activeGradeTab)
        );
      } else {
        // All lessons (maybe filter by supervisor permissions?)
        if (!isMainSupervisor) {
           relevantLessons = relevantLessons.filter(m => filteredTeachers.some(t => t.name === m.teacherName));
        }
      }

      for (const lesson of relevantLessons) {
        for (const attachment of lesson.attachments) {
          try {
            const response = await fetch(attachment.url);
            const blob = await response.blob();
            // Create folder structure: Grade/Subject/LessonTitle/filename
            const folderName = `${lesson.grade || 'General'}/${lesson.subject || 'General'}/${lesson.lessonTitle}`;
            zip.folder(folderName)?.file(attachment.name, blob);
            count++;
          } catch (error) {
            console.error(`Failed to download ${attachment.name}`, error);
          }
        }
      }

      if (count === 0) {
        alert('لا توجد مرفقات لتنزيلها');
        setIsZipping(false);
        return;
      }

      const content = await zip.generateAsync({ type: "blob" });
      const filename = viewingSubject 
        ? `attachments_${activeGradeTab}_${viewingSubject}.zip`
        : `all_attachments_${new Date().toISOString().split('T')[0]}.zip`;
      
      saveAs(content, filename);
    } catch (error) {
      console.error('Error creating zip:', error);
      alert('حدث خطأ أثناء إنشاء الملف المضغوط');
    } finally {
      setIsZipping(false);
    }
  };

  const handleAddAttachment = () => {
    if (!attachmentTeacherId) {
      alert('يرجى اختيار المعلمة');
      return;
    }
    if (attachmentLessonId === 'new' && !attachmentNewLessonTitle) {
      alert('يرجى إدخال عنوان المرفق');
      return;
    }
    if (attachmentFiles.length === 0) {
      alert('يرجى اختيار ملف واحد على الأقل');
      return;
    }

    setIsSubmitting(true);

    const selectedTeacher = teachers.find(t => t.id === attachmentTeacherId);
    const teacherName = selectedTeacher ? selectedTeacher.name : user.name;
    const teacherId = selectedTeacher ? selectedTeacher.id : user.id;

    if (attachmentLessonId === 'new') {
      // Create new lesson with attachments
      const newMaterial: LessonMaterial = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        teacherId: teacherId,
        teacherName: teacherName,
        lessonTitle: attachmentNewLessonTitle,
        description: 'تم إضافة المرفقات بواسطة المشرف',
        attachments: attachmentFiles,
        comments: [],
        createdAt: new Date().toISOString(),
        academicYear: academicYear,
        semester: attachmentSemester,
        grade: attachmentGrade,
        subject: attachmentSubject,
        status: 'approved',
        isModelLesson: false,
        tags: [attachmentSubject, attachmentGrade]
      };
      onAddLessonMaterial(newMaterial);
    } else {
      // Add to existing lesson
      const lesson = lessonMaterials.find(l => l.id === attachmentLessonId);
      if (lesson) {
        const updatedMaterial: LessonMaterial = {
          ...lesson,
          attachments: [...lesson.attachments, ...attachmentFiles]
        };
        onUpdateLessonMaterial(updatedMaterial);
      }
    }

    setIsSubmitting(false);
    setIsAddAttachmentModalOpen(false);
    setAttachmentFiles([]);
    setAttachmentNewLessonTitle('');
    setAttachmentLessonId('new');
    setAttachmentTeacherId('');
    alert('تم إضافة المرفقات بنجاح');
  };

  // Add Teacher State
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newTeacherAssignments, setNewTeacherAssignments] = useState<{grade: string, subject: string}[]>([]);
  const [currentAssignmentGrade, setCurrentAssignmentGrade] = useState('الصف الأول');
  const [currentAssignmentSubject, setCurrentAssignmentSubject] = useState('لغة عربية');
  
  // Temp Supervisor State
  const [newTempName, setNewTempName] = useState('');
  const [newTempId, setNewTempId] = useState('');
  const [newTempPass, setNewTempPass] = useState('');
  const [tempPermView, setTempPermView] = useState(false);
  const [tempPermComment, setTempPermComment] = useState(false);
  const [tempPermApprove, setTempPermApprove] = useState(false);
  const [tempPermManage, setTempPermManage] = useState(false);
  const [tempPermDownload, setTempPermDownload] = useState(false);
  const [tempPermFull, setTempPermFull] = useState(false);
  const [tempPermSubjects, setTempPermSubjects] = useState<string[]>([]);

  const handleAddNewTempSupervisor = () => {
    if (!newTempName || !newTempId || !newTempPass) {
      alert('يرجى إكمال جميع الحقول الأساسية');
      return;
    }
    if (teachers.some(t => t.id === newTempId)) {
      alert('الرقم الوظيفي موجود مسبقاً');
      return;
    }
    onAddTempSupervisor({
      id: newTempId,
      name: newTempName,
      role: UserRole.TEMP_SUPERVISOR,
      code: newTempId,
      password: newTempPass,
      isActive: true,
      joinedAt: new Date().toISOString(),
      tempPermissions: {
        canViewTeachers: tempPermView,
        canComment: tempPermComment,
        canApproveProjects: tempPermApprove,
        canManageUsers: tempPermManage,
        canViewOnly: false,
        canDownloadAttachments: tempPermDownload,
        hasFullAccess: tempPermFull,
        allowedSubjects: tempPermSubjects
      }
    });
    setNewTempName('');
    setNewTempId('');
    setNewTempPass('');
    setTempPermView(false);
    setTempPermComment(false);
    setTempPermApprove(false);
    setTempPermManage(false);
    setTempPermDownload(false);
    setTempPermFull(false);
    setTempPermSubjects([]);
    alert('تم إضافة المشرف المؤقت بنجاح');
  };

  // Password Reset State
  const [resetPassword, setResetPassword] = useState<string | null>(null);
  const [resetTeacherName, setResetTeacherName] = useState<string | null>(null);
  const [resetTeacherPhone, setResetTeacherPhone] = useState<string | null>(null);
  const [resetTeacherId, setResetTeacherId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Security & Config State
  const [newBackupPass, setNewBackupPass] = useState(supervisorConfig.backupPassword || '');
  const [confirmBackupPass, setConfirmBackupPass] = useState(supervisorConfig.backupPassword || '');
  const [newMainPass, setNewMainPass] = useState(supervisorConfig.mainPassword || '');
  const [confirmMainPass, setConfirmMainPass] = useState(supervisorConfig.mainPassword || '');
  const [editName, setEditName] = useState(user.name);
  const [editJobTitle, setEditJobTitle] = useState(user.jobTitle || '');
  const [editStartYear, setEditStartYear] = useState(academicYear.split('-')[0] || '');
  const [editEndYear, setEditEndYear] = useState(academicYear.split('-')[1] || '');
  const [editSemester, setEditSemester] = useState(semester);
  
  // Archive State
  const [selectedArchiveYear, setSelectedArchiveYear] = useState(academicYear);
  const [selectedArchiveGrade, setSelectedArchiveGrade] = useState<string | null>(null);
  const [selectedArchiveSubject, setSelectedArchiveSubject] = useState<string | null>(null);
  const [selectedArchiveSemester, setSelectedArchiveSemester] = useState<string | null>(null);

  const handleAddArchiveYear = () => {
    const year = window.prompt('أدخل العام الدراسي الجديد (مثال: 2022-2023)');
    if (year && /^\d{4}-\d{4}$/.test(year)) {
      const currentYears = supervisorConfig.archiveYears || [];
      if (currentYears.includes(year) || year === academicYear) {
        alert('هذا العام موجود بالفعل');
        return;
      }
      onUpdateSecurity({
        ...supervisorConfig,
        archiveYears: [...currentYears, year]
      });
    } else if (year) {
      alert('يرجى إدخال العام بتنسيق صحيح (YYYY-YYYY)');
    }
  };

  const availableArchiveYears = useMemo(() => {
    const years = new Set<string>();
    years.add(academicYear);
    
    // Add years from config
    if (supervisorConfig.archiveYears) {
      supervisorConfig.archiveYears.forEach(y => years.add(y));
    }
    
    lessonMaterials.forEach(m => years.add(m.academicYear));
    projects.forEach(p => years.add(p.academicYear));
    posts.forEach(p => years.add(p.academicYear));
    
    return Array.from(years)
      .filter(Boolean)
      .filter(y => {
        const year = parseInt(y.split('-')[0]);
        return year >= 2025;
      })
      .sort()
      .reverse();
  }, [academicYear, lessonMaterials, projects, posts, supervisorConfig.archiveYears]);

  const getSemesterForYear = (yearStr: string) => {
    const year = parseInt(yearStr.split('-')[0]);
    // For 2026, we want 'الفصل الدراسي الأول'
    if (year === 2026) return 'الفصل الدراسي الأول';
    return year % 2 !== 0 ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني';
  };

  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  
  const [previewAttachment, setPreviewAttachment] = useState<{url: string, type: string, name: string} | null>(null);

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
  
  // Add Lesson State
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonMaterial | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonSubject, setNewLessonSubject] = useState(AVAILABLE_SUBJECTS[0]);
  const [newLessonGrade, setNewLessonGrade] = useState(AVAILABLE_GRADES[0]);
  const [newLessonSemester, setNewLessonSemester] = useState(semester);
  const [newLessonDescription, setNewLessonDescription] = useState('');
  const [newLessonAttachments, setNewLessonAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Project State
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectTeachers, setNewProjectTeachers] = useState<string[]>([]);
  const [newProjectTasks, setNewProjectTasks] = useState<string[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const [newProjectStartDate, setNewProjectStartDate] = useState('');
  const [newProjectEndDate, setNewProjectEndDate] = useState('');
  const [newProjectAttachments, setNewProjectAttachments] = useState<Attachment[]>([]);



  const handleAddProject = () => {
    if (!newProjectName || !newProjectDescription) {
      alert('يرجى إدخال اسم المشروع ووصفه');
      return;
    }

    onAddProject({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: newProjectName,
      description: newProjectDescription,
      assignedTeacherIds: newProjectTeachers,
      academicYear: academicYear,
      semester: semester,
      tasks: newProjectTasks,
      startDate: newProjectStartDate || undefined,
      endDate: newProjectEndDate || undefined,
      attachments: newProjectAttachments,
      createdAt: new Date().toISOString(),
      submissions: {}
    });

    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectTeachers([]);
    setNewProjectTasks([]);
    setNewTaskInput('');
    setNewProjectDeadline('');
    setNewProjectStartDate('');
    setNewProjectEndDate('');
    setNewProjectAttachments([]);
    setIsAddProjectModalOpen(false);
    alert('تم إضافة المشروع بنجاح');
  };

  // Project Management State
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const handleUpdateSubmissionStatus = (projectId: string, teacherId: string, status: 'approved' | 'needs_work', feedback: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const currentSubmission = project.submissions[teacherId] || {
      teacherId,
      files: [],
      notes: '',
      status: 'pending',
      feedback: '',
      badges: []
    };

    const updatedSubmission: ProjectSubmission = {
      ...currentSubmission,
      status,
      feedback
    };

    onUpdateProjectSubmission(projectId, updatedSubmission);

    // Notify Teacher
    onAddNotification({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: teacherId,
      message: `تم تحديث حالة مشروعك "${project.name}" إلى ${status === 'approved' ? 'مكتمل' : 'يحتاج تعديل'}. ${feedback ? `ملاحظات: ${feedback}` : ''}`,
      isRead: false,
      createdAt: new Date().toISOString(),
      type: 'system'
    });
  };

  const handleSaveConfig = () => {
     if (newMainPass.length > 0 && newMainPass.length < 8) {
        return alert('يجب أن تكون كلمة المرور الرئيسية 8 أحرف على الأقل');
     }
     if (newMainPass !== confirmMainPass) {
        return alert('كلمة المرور الرئيسية وتأكيدها غير متطابقين');
     }
     if (newBackupPass.length > 0 && newBackupPass.length < 8) {
        return alert('يجب أن تكون كلمة مرور الطوارئ 8 أحرف على الأقل');
     }
     if (newBackupPass !== confirmBackupPass) {
        return alert('كلمة مرور الطوارئ وتأكيدها غير متطابقين');
     }

     let finalYear = `${editStartYear}-${editEndYear}`;
     let finalSemester = editSemester;

     // Logic for academic year update
     if (academicYear === '2025-2026' && editStartYear === '2026') {
         finalYear = '2026-2027';
     }
     
     // Logic for semester update
     if (semester === 'الفصل الدراسي الأول' && finalSemester === 'الفصل الدراسي الثاني') {
         if (!window.confirm('هل أنت متأكد من الانتقال إلى الفصل الدراسي الثاني؟')) {
             return;
         }
     }

     // Add old year to archive if changing
     let updatedArchiveYears = [...(supervisorConfig.archiveYears || [])];
     if (finalYear !== academicYear && !updatedArchiveYears.includes(academicYear)) {
         updatedArchiveYears.push(academicYear);
     }

     // Update supervisor profile
     if (editName !== user.name || editJobTitle !== user.jobTitle) {
       onUpdateTeacher(user.id, { ...user, name: editName, jobTitle: editJobTitle });
     }

     onUpdateSecurity({
        backupPassword: newBackupPass.length > 0 ? newBackupPass : supervisorConfig.backupPassword,
        mainPassword: newMainPass.length > 0 ? newMainPass : supervisorConfig.mainPassword,
        academicYear: finalYear,
        semester: finalSemester,
        archiveYears: updatedArchiveYears
     });
     alert('تم حفظ الإعدادات بنجاح');
  };

  const downloadFile = (url: string, filename: string) => {
    if (isTempSupervisor && !user.tempPermissions?.hasFullAccess && !user.tempPermissions?.canDownloadAttachments) {
      alert('عذراً، لا تملك صلاحية تنزيل المرفقات');
      return;
    }

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

  const handleAddComment = (lesson: LessonMaterial) => {
    if (!commentText.trim()) return;
    
    const newComment: LessonComment = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      text: commentText,
      createdAt: new Date().toISOString(),
    };

    const updatedLesson = {
      ...lesson,
      comments: [...(lesson.comments || []), newComment]
    };

    onUpdateLessonMaterial(updatedLesson);
    setCommentText('');
  };

  const handleAddLesson = () => {
    if (!newLessonTitle || !newLessonDescription) {
      alert('يرجى إكمال جميع الحقول');
      return;
    }

    setIsSubmitting(true);
    
    if (editingLesson) {
      const updatedMaterial: LessonMaterial = {
        ...editingLesson,
        lessonTitle: newLessonTitle,
        description: newLessonDescription,
        attachments: newLessonAttachments,
        grade: newLessonGrade,
        semester: newLessonSemester,
        subject: newLessonSubject,
        tags: [newLessonSubject, newLessonGrade]
      };
      onUpdateLessonMaterial(updatedMaterial);
      alert('تم تحديث الدرس بنجاح.');
    } else {
      const newMaterial: LessonMaterial = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        teacherId: user.id,
        teacherName: user.name,
        lessonTitle: newLessonTitle,
        description: newLessonDescription,
        attachments: newLessonAttachments,
        comments: [],
        createdAt: new Date().toISOString(),
        academicYear: academicYear,
        semester: newLessonSemester,
        grade: newLessonGrade,
        subject: newLessonSubject,
        status: 'approved',
        isModelLesson: false,
        tags: [newLessonSubject, newLessonGrade]
      };
      onAddLessonMaterial(newMaterial);
      alert('تمت إضافة الدرس بنجاح.');
    }

    setIsSubmitting(false);
    setIsAddLessonModalOpen(false);
    setEditingLesson(null);
    setNewLessonTitle('');
    setNewLessonDescription('');
    setNewLessonAttachments([]);
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

  // New Post State
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostIsPinned, setNewPostIsPinned] = useState(false);
  const [newPostAttachments, setNewPostAttachments] = useState<Attachment[]>([]);

  // Stats for Charts
  const statsData = useMemo(() => [
    { name: 'المعلمات', value: teachers.filter(t => t.role === UserRole.TEACHER).length, color: '#4f46e5' },
    { name: 'الدروس', value: lessonMaterials.length, color: '#10b981' },
    { name: 'التعاميم', value: posts.length, color: '#ef4444' },
  ], [teachers, lessonMaterials, posts]);

  const isMainSupervisor = user.role === UserRole.SUPERVISOR;
  const isTempSupervisor = user.role === UserRole.TEMP_SUPERVISOR;

  // Filtering Logic
  const filteredTeachers = useMemo(() => {
    let list = teachers.filter(t => t.isActive && t.role === UserRole.TEACHER);
    if (isTempSupervisor && !user.tempPermissions?.hasFullAccess && user.tempPermissions?.allowedSubjects) {
      const allowed = user.tempPermissions.allowedSubjects;
      if (allowed.length > 0) {
        list = list.filter(t => {
          const hasAllowedSubject = t.subject && allowed.includes(t.subject);
          const hasAllowedAssignment = t.assignments?.some(a => allowed.includes(a.subject));
          return hasAllowedSubject || hasAllowedAssignment;
        });
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q));
    }
    return list;
  }, [teachers, isTempSupervisor, user.tempPermissions, searchQuery]);

  const filteredProjects = useMemo(() => {
    let list = projects.filter(p => p.academicYear === academicYear && p.semester === semester);
    if (isTempSupervisor) {
      const allowedTeacherIds = filteredTeachers.map(t => t.id);
      // Show project if ANY of the assigned teachers are visible to the supervisor
      list = list.filter(p => p.assignedTeacherIds.some(id => allowedTeacherIds.includes(id)));
    }
    return list;
  }, [projects, academicYear, semester, isTempSupervisor, filteredTeachers]);

  const filteredPosts = useMemo(() => {
    return posts.filter(p => p.academicYear === academicYear && p.semester === semester);
  }, [posts, academicYear, semester]);

  const filteredLessons = useMemo(() => {
    let list = lessonMaterials.filter(m => m.isActive !== false && m.academicYear === academicYear && m.semester === semester);
    
    if (isTempSupervisor && !user.tempPermissions?.hasFullAccess && user.tempPermissions?.allowedSubjects) {
      const allowed = user.tempPermissions.allowedSubjects;
      if (allowed.length > 0) {
        list = list.filter(m => allowed.includes(m.subject) || (m.tags && m.tags.some(tag => allowed.includes(tag))));
      }
    }

    if (!isMainSupervisor) {
      const allowedTeacherIds = filteredTeachers.map(t => t.id);
      list = list.filter(m => allowedTeacherIds.includes(m.teacherId));
    }
    
    list = list.filter(m => m.grade === activeGradeTab);
    
    if (activeSubjectTab !== 'الكل') {
      list = list.filter(m => m.subject === activeSubjectTab || (m.tags && m.tags.includes(activeSubjectTab)));
    }
    
    return list;
  }, [lessonMaterials, filteredTeachers, isMainSupervisor, isTempSupervisor, user.tempPermissions, activeGradeTab, activeSubjectTab]);

  const sidebarItems = [
    { id: 'overview', label: 'الرئيسية', icon: LayoutDashboard, visible: true },
    { id: 'teachers', label: 'المعلمات', icon: Users, visible: isMainSupervisor || (isTempSupervisor && (user.tempPermissions?.hasFullAccess || user.tempPermissions?.canViewTeachers)) },
    { id: 'lessons', label: 'الدروس', icon: Palette, visible: true },
    { id: 'feed', label: 'التعاميم', icon: MessageSquare, visible: true },
    { id: 'archive', label: 'الأرشيف', icon: Archive, visible: true },
    { id: 'projects', label: 'المشاريع', icon: Rocket, visible: true },
    { id: 'messages', label: 'الرسائل', icon: MessageSquare, visible: true },
    { id: 'temp-supervisors', label: 'المشرفين المؤقتين', icon: Shield, visible: isMainSupervisor },
    { id: 'security', label: 'الأمن والإعدادات', icon: Settings, visible: isMainSupervisor },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-['Tajawal'] text-slate-900" dir="rtl">
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
        "w-72 bg-[#0f172a] text-white flex flex-col fixed lg:sticky top-0 h-screen shadow-2xl z-[110] transition-transform duration-300 lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Award className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight">منصة الإبداع</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">لوحة الإدارة العليا</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-200"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          {sidebarItems.filter(i => i.visible).map(item => (
            <button
              key={item.id}
              onClick={() => { 
                setActiveTab(item.id as any); 
                setIsMobileMenuOpen(false); 
                if (item.id !== 'messages') {
                  setSelectedTeacherForMessages(null);
                }
              }}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group",
                activeTab === item.id 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", activeTab === item.id ? "text-white" : "text-slate-500")} />
              <span className="font-bold text-sm">{item.label}</span>
              {activeTab === item.id && (
                <motion.div layoutId="activeTab" className="mr-auto w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="bg-slate-800/50 p-4 rounded-2xl flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-white">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate">{user.role === UserRole.SUPERVISOR ? 'مشرفة رئيسية' : 'مشرفة مؤقتة'}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-500 font-black text-xs hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-white/80">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 bg-slate-100 rounded-xl text-slate-600"
            >
              <LayoutDashboard className="w-6 h-6" />
            </button>
            <div className="relative flex-1 hidden sm:block">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="بحث سريع..." 
                className="w-full bg-slate-100 border-none rounded-2xl py-3 pr-12 pl-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">العام الدراسي</span>
              <span className="text-xs font-black text-indigo-600">{academicYear}</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-20 left-4 sm:left-8 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-sm text-slate-900">الإشعارات</h3>
                    <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                        <div 
                          key={notification.id} 
                          className={cn(
                            "p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer",
                            !notification.isRead ? "bg-indigo-50/50" : ""
                          )}
                          onClick={() => onMarkNotificationAsRead(notification.id)}
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

        <main className="p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: 'المعلمات النشطات', value: teachers.filter(t => t.isActive && t.role === UserRole.TEACHER).length, icon: Users, color: 'indigo' },
                    { label: 'الدروس المرفوعة', value: lessonMaterials.length, icon: Palette, color: 'amber' },
                    { label: 'التعاميم المنشورة', value: posts.length, icon: MessageSquare, color: 'rose' },
                  ].map((stat, i) => (
                    <div key={stat.label} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", `bg-${stat.color}-50 text-${stat.color}-600`)}>
                        <stat.icon className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-black mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="font-black text-lg flex items-center gap-3">
                        <TrendingUp className="text-indigo-600 w-5 h-5" />
                        إحصائيات المنصة العامة
                      </h3>
                      <select className="bg-slate-50 border-none rounded-xl text-xs font-bold px-4 py-2 outline-none">
                        <option>آخر 7 أيام</option>
                        <option>آخر 30 يوم</option>
                      </select>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            cursor={{ fill: '#f8fafc' }}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                            {statsData.map((entry, index) => (
                              <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* Audit Log & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <h3 className="font-black text-lg mb-8 flex items-center gap-3">
                      <Plus className="text-indigo-600 w-5 h-5" />
                      إجراءات سريعة
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'إضافة تعميم', icon: MessageSquare, color: 'indigo', action: () => setActiveTab('feed') },
                        { label: 'تسجيل معلمة', icon: Users, color: 'amber', action: () => setActiveTab('teachers') },
                      ].map((btn, i) => (
                        <button 
                          key={btn.label} 
                          onClick={btn.action}
                          className={cn(
                            "p-6 rounded-3xl border border-slate-100 flex flex-col items-center gap-4 transition-all hover:shadow-lg hover:-translate-y-1",
                            `bg-${btn.color}-50/30 hover:bg-${btn.color}-50`
                          )}
                        >
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", `bg-${btn.color}-100 text-${btn.color}-600`)}>
                            <btn.icon className="w-6 h-6" />
                          </div>
                          <span className="font-black text-xs text-slate-700">{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'teachers' && (
              <motion.div 
                key="teachers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                  {(isMainSupervisor || (isTempSupervisor && (user.tempPermissions?.hasFullAccess || user.tempPermissions?.canManageUsers))) && (
                    <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-sm border border-slate-100">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900">إضافة معلمة جديدة</h3>
                          <p className="text-slate-500 font-bold text-xs">أدخل بيانات المعلمة والمهام المسندة إليها</p>
                        </div>
                      </div>

                      <form onSubmit={(e) => { 
                        e.preventDefault(); 
                        if (!newTeacherName || !newTeacherId) return alert('الرجاء إدخال الاسم والرقم الوظيفي');
                        onAddTeacher(newTeacherId, newTeacherName, undefined, newTeacherPhone, newTeacherAssignments); 
                        setNewTeacherName(''); 
                        setNewTeacherId(''); 
                        setNewTeacherPhone(''); 
                        setNewTeacherAssignments([]);
                        alert('تم إضافة المعلمة بنجاح'); 
                      }} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mr-2">
                              <UserIcon className="w-3 h-3" /> الاسم الكامل
                            </label>
                            <input 
                              type="text" 
                              placeholder="مثال: فاطمة العامري" 
                              value={newTeacherName} 
                              onChange={(e) => setNewTeacherName(e.target.value)} 
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all shadow-sm" 
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mr-2">
                              <Hash className="w-3 h-3" /> الرقم الوظيفي
                            </label>
                            <input 
                              type="text" 
                              placeholder="مثال: 123456" 
                              value={newTeacherId} 
                              onChange={(e) => setNewTeacherId(e.target.value)} 
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all shadow-sm" 
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mr-2">
                              <Phone className="w-3 h-3" /> رقم الهاتف
                            </label>
                            <input 
                              type="text" 
                              placeholder="مثال: 98765432" 
                              value={newTeacherPhone} 
                              onChange={(e) => setNewTeacherPhone(e.target.value)} 
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all shadow-sm" 
                            />
                          </div>
                        </div>
                        
                        <div className="bg-slate-50/50 p-6 sm:p-8 rounded-[2rem] border border-slate-100 space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                                <BookOpen className="w-5 h-5 text-indigo-600" />
                              </div>
                              <h4 className="font-black text-sm text-slate-700">المواد والصفوف المسندة</h4>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اختياري</span>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">
                                <GraduationCap className="w-3 h-3" /> الصف الدراسي
                              </label>
                              <div className="relative">
                                <select 
                                  value={currentAssignmentGrade} 
                                  onChange={(e) => setCurrentAssignmentGrade(e.target.value)} 
                                  className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-transparent shadow-sm focus:border-indigo-500 font-bold text-sm outline-none appearance-none cursor-pointer"
                                >
                                  {AVAILABLE_GRADES.map((g, i) => <option key={`${g}-${i}`} value={g}>{g}</option>)}
                                </select>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                  <Filter className="w-4 h-4" />
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 space-y-2">
                              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">
                                <Palette className="w-3 h-3" /> المادة العلمية
                              </label>
                              <div className="relative">
                                <select 
                                  value={currentAssignmentSubject} 
                                  onChange={(e) => setCurrentAssignmentSubject(e.target.value)} 
                                  className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-transparent shadow-sm focus:border-indigo-500 font-bold text-sm outline-none appearance-none cursor-pointer"
                                >
                                  {AVAILABLE_SUBJECTS.filter(s => 
                                    !isTempSupervisor || 
                                    user.tempPermissions?.hasFullAccess ||
                                    !user.tempPermissions?.allowedSubjects || 
                                    user.tempPermissions.allowedSubjects.length === 0 || 
                                    user.tempPermissions.allowedSubjects.includes(s)
                                  ).map((s, i) => <option key={`${s}-${i}`} value={s}>{s}</option>)}
                                </select>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                  <Filter className="w-4 h-4" />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-end">
                              <button 
                                type="button" 
                                onClick={() => {
                                  if (currentAssignmentGrade && currentAssignmentSubject) {
                                    if (!newTeacherAssignments.some(a => a.grade === currentAssignmentGrade && a.subject === currentAssignmentSubject)) {
                                      setNewTeacherAssignments([...newTeacherAssignments, { grade: currentAssignmentGrade, subject: currentAssignmentSubject }]);
                                    }
                                  }
                                }} 
                                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                              >
                                <Plus className="w-4 h-4" /> إضافة
                              </button>
                            </div>
                          </div>

                          {newTeacherAssignments.length > 0 ? (
                            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-100">
                              {newTeacherAssignments.map((assignment, idx) => (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  key={`new-assignment-${idx}`} 
                                  className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all"
                                >
                                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                  <span className="font-bold text-xs text-slate-700">{assignment.grade} • {assignment.subject}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => setNewTeacherAssignments(newTeacherAssignments.filter((_, i) => i !== idx))} 
                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-slate-400 font-bold text-xs border-2 border-dashed border-slate-200 rounded-2xl">
                              لم يتم إضافة أي صفوف أو مواد بعد
                            </div>
                          )}
                        </div>

                        <button 
                          type="submit" 
                          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-base shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-3 group"
                        >
                          <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          حفظ وإضافة المعلمة للسجل
                        </button>
                      </form>
                    </div>
                  )}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">سجل الكادر التعليمي</h2>
                    <p className="text-slate-500 font-bold text-sm">إدارة المعلمات، الصلاحيات، وكلمات المرور</p>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="بحث بالاسم أو الرقم الوظيفي..." 
                        className="w-full bg-slate-50 border-none rounded-xl py-3 pr-12 pl-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">

                      <button className="px-4 py-2 rounded-xl bg-slate-50 text-slate-600 font-black text-xs flex items-center gap-2 hover:bg-slate-100">
                        <Filter className="w-4 h-4" />
                        تصفية
                      </button>
                      <button 
                        onClick={() => exportTeachersCSV(filteredTeachers)}
                        className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs flex items-center gap-2 hover:bg-indigo-100 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        تصدير CSV
                      </button>
                      <button 
                        onClick={() => exportToPDF('teachers-grid-container', 'سجل_المعلمات')}
                        className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs flex items-center gap-2 hover:bg-indigo-100 transition-all"
                      >
                        <FileText className="w-4 h-4" />
                        تصدير PDF
                      </button>
                    </div>
                  </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="teachers-grid-container">
                  {filteredTeachers.map((teacher, i) => (
                    <div key={`${teacher.id}-${i}`} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all duration-300 group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-110 transition-transform">
                            {teacher.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{teacher.name}</h3>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {teacher.phoneNumber || 'لا يوجد رقم'}
                            </p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const newPass = await onResetPassword(teacher.id);
                          setResetPassword(newPass);
                          setResetTeacherName(teacher.name);
                          setResetTeacherPhone(teacher.phoneNumber || '');
                          setResetTeacherId(teacher.code || teacher.id);
                          setShowPasswordModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-xs mb-4"
                      >
                        تغيير كلمة المرور
                      </button>

                      <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
                        {teacher.assignments && teacher.assignments.length > 0 ? (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-slate-200/60">
                                <th className="py-2 text-slate-500 font-medium text-right">الصف</th>
                                <th className="py-2 text-slate-500 font-medium text-left">المادة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teacher.assignments.map((assignment, idx) => (
                                <tr key={`assignment-${assignment.grade}-${assignment.subject}-${idx}`} className="border-b border-slate-100 last:border-0">
                                  <td className="py-2 text-slate-800 font-bold flex items-center gap-2">
                                    <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                                    {assignment.grade}
                                  </td>
                                  <td className="py-2 text-slate-800 font-bold text-left">
                                    <div className="flex items-center justify-end gap-2">
                                      {assignment.subject}
                                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <table className="w-full text-xs">
                            <tbody>
                              <tr className="border-b border-slate-200/60">
                                <td className="py-2 text-slate-500 font-medium flex items-center gap-2">
                                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                                  المادة
                                </td>
                                <td className="py-2 text-slate-800 font-bold text-left">
                                  {teacher.subject || '-'}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 text-slate-500 font-medium flex items-center gap-2 pt-2">
                                  <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                                  الصفوف
                                </td>
                                <td className="py-2 text-slate-800 font-bold text-left pt-2">
                                  {teacher.teachingGrades || '-'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-3 px-1">
                        <span>الرقم الوظيفي: <span className="font-mono text-slate-600">{teacher.code}</span></span>
                        <span>{teacher.joinedAt}</span>
                      </div>



                      {(isMainSupervisor || (isTempSupervisor && (user.tempPermissions?.hasFullAccess || user.tempPermissions?.canManageUsers))) && (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                  const pass = await onResetPassword(teacher.id);
                                  setResetPassword(pass);
                                  setResetTeacherName(teacher.name);
                                  setResetTeacherPhone(teacher.phoneNumber || '');
                                  setResetTeacherId(teacher.code || teacher.id);
                              }}
                              className="flex-1 py-2.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors font-bold text-xs flex items-center justify-center gap-2"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              تغيير كلمة المرور
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedTeacherForMessages(teacher.id);
                                setActiveTab('messages');
                              }}
                              className="flex-1 py-2.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors font-bold text-xs flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              عرض المراسلات
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setEditingTeacher(teacher)}
                              className="flex-1 h-10 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 font-bold text-xs"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                              تعديل
                            </button>
                            <button 
                              onClick={() => onSoftDeleteTeacher(teacher.id)}
                              className="flex-1 h-10 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center gap-2 font-bold text-xs"
                              title="أرشفة"
                            >
                              <Archive className="w-4 h-4" />
                              أرشفة
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                </div>
              </motion.div>
            )}



            {activeTab === 'lessons' && (
              <motion.div 
                key="lessons"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">ركن الإبداع الدرسي</h1>
                    <p className="text-slate-500 mt-1 font-medium">متابعة إبداعات المعلمات وتقييم المحتوى التعليمي</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsAddAttachmentModalOpen(true)}
                      className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة مرفق
                    </button>
                    <button 
                      onClick={handleDownloadAllAttachments}
                      disabled={isZipping}
                      className="px-6 py-3 rounded-xl bg-emerald-50 text-emerald-600 font-black text-xs flex items-center gap-2 hover:bg-emerald-100 transition-all disabled:opacity-50"
                    >
                      {isZipping ? (
                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      تنزيل الكل
                    </button>
                  </div>
                </div>

                {!viewingSubject ? (
                  <div className="space-y-12">
                    {AVAILABLE_GRADES.map((grade, i) => (
                      <div key={grade} className="space-y-4">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                          <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                          {grade}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {allSubjects.map((subject, j) => {
                            // Filter materials for this subject and grade
                            const subjectMaterials = lessonMaterials.filter(m => 
                              (m.tags?.includes(subject.name) || m.lessonTitle.includes(subject.name) || m.subject === subject.name) && 
                              (m.tags?.includes(grade) || m.grade === grade) &&
                              m.academicYear === academicYear && m.semester === semester && !m.isArchived
                            );
                            
                            // Get unique teachers
                            const uniqueTeachers = Array.from(new Set(subjectMaterials.map(m => m.teacherName)));

                            return (
                              <div 
                                key={`${grade}-${subject.name}`} 
                                onClick={() => {
                                  setViewingSubject(subject.name);
                                  setActiveGradeTab(grade);
                                }}
                                className={cn(
                                  "relative p-8 rounded-[24px] border-2 transition-all duration-300 overflow-hidden group hover:shadow-xl cursor-pointer",
                                  subject.bg, subject.border
                                )}
                              >
                                {/* Decorative Background Blur */}
                                <div className="absolute -left-12 -top-12 w-40 h-40 bg-white/60 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                                
                                <div className="relative z-10">
                                  <div className="flex justify-between items-start mb-8">
                                    <div>
                                      <span className={cn("text-xs font-black uppercase tracking-wider mb-2 block", subject.text)}>
                                        {grade}
                                      </span>
                                      <h3 className="text-3xl font-black text-slate-900">{subject.name}</h3>
                                    </div>
                                    <div className={cn("w-16 h-16 rounded-[18px] flex items-center justify-center shadow-sm", subject.iconBg, subject.iconText)}>
                                      <subject.icon className="w-8 h-8" />
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 mb-6">
                                    <div className="px-4 py-2.5 bg-white/80 rounded-xl border border-white shadow-sm backdrop-blur-md">
                                      <p className="text-[10px] font-bold text-slate-500">إجمالي الدروس</p>
                                      <p className={cn("text-xl font-black", subject.text)}>{subjectMaterials.length}</p>
                                    </div>
                                    <div className="px-4 py-2.5 bg-white/80 rounded-xl border border-white shadow-sm backdrop-blur-md">
                                      <p className="text-[10px] font-bold text-slate-500">المعلمات المشاركات</p>
                                      <p className="text-xl font-black text-slate-900">{uniqueTeachers.length}</p>
                                    </div>
                                  </div>

                                  <div className="flex -space-x-2 space-x-reverse">
                                    {uniqueTeachers.slice(0, 5).map((teacher, i) => (
                                      <div key={`teacher-avatar-${grade}-${subject.name}-${i}`} className="w-8 h-8 rounded-full bg-white border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm" title={teacher}>
                                        {teacher.charAt(0)}
                                      </div>
                                    ))}
                                    {uniqueTeachers.length > 5 && (
                                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                                        +{uniqueTeachers.length - 5}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
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
                          <div className="flex flex-col gap-1 mt-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-500">{activeGradeTab}</p>
                            {teachers.filter(t => t.assignments?.some(a => a.subject === viewingSubject && a.grade === activeGradeTab)).length > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-slate-400">المعلمة المسؤولة:</span>
                                <div className="flex flex-wrap gap-1">
                                  {teachers.filter(t => t.assignments?.some(a => a.subject === viewingSubject && a.grade === activeGradeTab)).map((t, i) => (
                                    <span key={`responsible-teacher-${t.id}-${i}`} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black">
                                      {t.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {lessonMaterials
                        .filter(m => 
                          m.academicYear === academicYear && m.semester === semester &&
                          (m.tags?.includes(viewingSubject!) || m.lessonTitle.includes(viewingSubject!) || m.subject === viewingSubject) && 
                          (m.tags?.includes(activeGradeTab) || m.grade === activeGradeTab)
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
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                  <button 
                                    onClick={() => {
                                      const attachment = material.attachments[0];
                                      if (attachment) {
                                        if (attachment.type === 'image' || attachment.type === 'video' || attachment.type === 'link') {
                                          setPreviewAttachment(attachment);
                                        } else {
                                          downloadFile(attachment.url, attachment.name || `${material.lessonTitle}.bin`);
                                        }
                                      }
                                    }}
                                    className="flex-1 md:flex-none px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all font-bold text-xs flex items-center justify-center gap-2 border border-slate-200"
                                  >
                                    <Eye className="w-4 h-4" /> معاينة
                                  </button>
                                  {isMainSupervisor && (
                                    <button 
                                      onClick={() => {
                                          onUpdateLessonMaterial({
                                              ...material,
                                              academicYear: 'Archive 2026',
                                              isActive: false
                                          });
                                          alert('تم نقل الملف إلى أرشيف 2026');
                                      }}
                                      className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all font-bold text-xs flex items-center justify-center gap-2 border border-amber-100"
                                    >
                                      <Archive className="w-4 h-4" /> أرشفة
                                    </button>
                                  )}
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

                                      {(isMainSupervisor || (isTempSupervisor && (user.tempPermissions?.hasFullAccess || user.tempPermissions?.canComment))) && (
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
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                        
                        {lessonMaterials.filter(m => 
                          m.academicYear === academicYear && m.semester === semester &&
                          (m.tags?.includes(viewingSubject!) || m.lessonTitle.includes(viewingSubject!) || m.subject === viewingSubject) && 
                          (m.tags?.includes(activeGradeTab) || m.grade === activeGradeTab)
                        ).length === 0 && (
                          <div className="text-center py-20 bg-white rounded-[24px] border border-dashed border-slate-300">
                            <Palette className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 mb-1">لا توجد دروس بعد</h3>
                            <p className="text-slate-500 text-sm">لم يتم إضافة أي محتوى لهذا القسم</p>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Add Attachment Modal */}
            <AnimatePresence>
              {isAddAttachmentModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
                  onClick={() => setIsAddAttachmentModalOpen(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                  >
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900">إضافة مرفق جديد</h3>
                          <p className="text-slate-500 font-bold text-xs">أضيفي ملفات ومرفقات للدروس</p>
                        </div>
                      </div>
                      <button onClick={() => setIsAddAttachmentModalOpen(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors text-slate-400">
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">المعلمة</label>
                        <select 
                          value={attachmentTeacherId}
                          onChange={e => setAttachmentTeacherId(e.target.value)}
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all"
                        >
                          <option value="">اختر المعلمة...</option>
                          {teachers.filter(t => t.isActive).map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">الصف الدراسي</label>
                          <select 
                            value={attachmentGrade}
                            onChange={e => setAttachmentGrade(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all"
                          >
                            {AVAILABLE_GRADES.map((g, i) => <option key={`${g}-${i}`} value={g}>{g}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">المادة</label>
                          <select 
                            value={attachmentSubject}
                            onChange={e => setAttachmentSubject(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all"
                          >
                            {AVAILABLE_SUBJECTS.map((s, i) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">الفصل الدراسي</label>
                        <select 
                          value={attachmentSemester}
                          onChange={e => setAttachmentSemester(e.target.value)}
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all"
                        >
                          <option value="الفصل الأول">الفصل الأول</option>
                          <option value="الفصل الثاني">الفصل الثاني</option>
                        </select>
                      </div>

                      {/* Target Lesson Selection Removed - Always New Attachment */}
                      
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">عنوان المرفق</label>
                        <input 
                          type="text" 
                          value={attachmentNewLessonTitle}
                          onChange={e => setAttachmentNewLessonTitle(e.target.value)}
                          placeholder="مثال: أوراق عمل الوحدة الأولى"
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">المرفقات</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                          <input 
                            type="file" 
                            multiple
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.files) {
                                const files = Array.from(e.target.files);
                                const newAttachments = files.map(file => ({
                                  type: 'file' as const,
                                  url: URL.createObjectURL(file), // In a real app, upload to server
                                  name: file.name
                                }));
                                setAttachmentFiles(prev => [...prev, ...newAttachments]);
                              }
                            }}
                          />
                          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="w-8 h-8" />
                          </div>
                          <p className="font-black text-slate-900 text-sm">اسحبي الملفات هنا أو اضغطي للرفع</p>
                          <p className="text-slate-400 text-xs font-bold mt-2">PDF, Word, Images, PowerPoint</p>
                        </div>

                        {attachmentFiles.length > 0 && (
                          <div className="space-y-2 mt-4">
                            {attachmentFiles.map((file, idx) => (
                              <div key={`att-file-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-bold text-slate-700">{file.name}</span>
                                </div>
                                <button 
                                  onClick={() => setAttachmentFiles(attachmentFiles.filter((_, i) => i !== idx))}
                                  className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                      <button 
                        onClick={() => setIsAddAttachmentModalOpen(false)}
                        className="flex-1 py-4 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-100 transition-all"
                      >
                        إلغاء
                      </button>
                      <button 
                        onClick={handleAddAttachment}
                        disabled={isSubmitting}
                        className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            حفظ المرفقات
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {activeTab === 'feed' && (
              <motion.div 
                key="feed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </div>
                    نشر تعميم جديد
                  </h3>
                  <form className="space-y-6" onSubmit={(e) => {
                    e.preventDefault();
                    if (!newPostTitle || !newPostContent) return alert('يرجى إدخال العنوان والمحتوى');
                    onAddPost({
                      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                      authorId: user.id,
                      authorName: user.name,
                      title: newPostTitle,
                      content: newPostContent,
                      attachments: newPostAttachments,
                      isPinned: newPostIsPinned,
                      createdAt: new Date().toLocaleString('ar-SA'),
                      academicYear: academicYear,
                      semester: semester
                    });

                    // Notify all teachers
                    teachers.forEach(t => {
                      if (t.isActive) {
                        onAddNotification({
                          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                          userId: t.id,
                          message: `تعميم جديد: ${newPostTitle}`,
                          isRead: false,
                          createdAt: new Date().toISOString(),
                          type: 'system'
                        });
                      }
                    });

                    setNewPostTitle('');
                    setNewPostContent('');
                    setNewPostIsPinned(false);
                    setNewPostAttachments([]);
                    alert('تم نشر التعميم بنجاح');
                  }}>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">عنوان التعميم</label>
                      <input 
                        type="text" 
                        value={newPostTitle}
                        onChange={e => setNewPostTitle(e.target.value)}
                        placeholder="مثال: هام بخصوص خطط الأسبوع القادم" 
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">محتوى التعميم</label>
                      <textarea 
                        rows={6}
                        value={newPostContent}
                        onChange={e => setNewPostContent(e.target.value)}
                        placeholder="اكتب تفاصيل التعميم هنا..." 
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all resize-none"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 items-center">
                        <button 
                          type="button" 
                          onClick={() => document.getElementById('post-file-upload')?.click()}
                          className="p-4 rounded-2xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all relative"
                        >
                          <FileText className="w-5 h-5" />
                          {newPostAttachments.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                              {newPostAttachments.length}
                            </span>
                          )}
                        </button>
                        <input 
                          type="file" 
                          id="post-file-upload"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              const files = Array.from(e.target.files);
                              const newAtts = files.map(file => ({
                                type: 'file' as const,
                                url: URL.createObjectURL(file),
                                name: file.name
                              }));
                              setNewPostAttachments([...newPostAttachments, ...newAtts]);
                            }
                          }}
                        />
                        {newPostAttachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {newPostAttachments.map((att, idx) => (
                              <div key={`new-post-att-${idx}`} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-2">
                                <span className="truncate max-w-[100px]">{att.name}</span>
                                <button 
                                  type="button"
                                  onClick={() => setNewPostAttachments(newPostAttachments.filter((_, i) => i !== idx))} 
                                  className="hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={newPostIsPinned}
                            onChange={e => setNewPostIsPinned(e.target.checked)}
                            className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                          />
                          <span className="text-xs font-black text-slate-500 group-hover:text-indigo-600 transition-colors">تثبيت في المقدمة</span>
                        </label>
                        <button type="submit" className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                          نشر الآن
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="space-y-6">
                  {filteredPosts.map((post) => (
                    <div key={post.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                      {post.isPinned && (
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500" />
                      )}
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-500">
                            {post.authorName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900">{post.title}</h4>
                            <p className="text-[10px] text-slate-400 font-bold">{post.createdAt}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => onTogglePinPost(post.id)} className={cn("p-2 rounded-lg transition-all", post.isPinned ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400 hover:bg-slate-100")}>
                            <Pin className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDeletePost(post.id)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-600 font-bold text-sm leading-relaxed mb-6">{post.content}</p>
                      {post.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.attachments.map((att, i) => (
                            <div key={`post-att-${post.id}-${i}`} className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-500 flex items-center gap-2">
                              <FileText className="w-3 h-3" /> {att.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'archive' && (
              <motion.div 
                key="archive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">الأرشيف التاريخي الذكي</h2>
                      <p className="text-slate-500 font-bold text-sm">تصفح سجلات السنوات السابقة والدروس المؤرشفة</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {availableArchiveYears.map(year => (
                        <button 
                          key={year}
                          onClick={() => {
                            setSelectedArchiveYear(year);
                            setSelectedArchiveSemester(getSemesterForYear(year));
                            setSelectedArchiveGrade(null);
                            setSelectedArchiveSubject(null);
                          }}
                          className={cn(
                            "px-6 py-4 rounded-2xl text-xs font-black transition-all text-right flex justify-between items-center",
                            year === selectedArchiveYear ? "bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100" : "bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          <span>{year}</span>
                          <span className="text-[10px] opacity-70 bg-white px-2 py-1 rounded-lg">{getSemesterForYear(year)}</span>
                        </button>
                      ))}
                      <button 
                        onClick={handleAddArchiveYear}
                        className="px-6 py-4 rounded-2xl text-xs font-black bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> إضافة عام
                      </button>
                    </div>
                  </div>

                  {selectedArchiveYear && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                      {/* Grade Tabs */}
                      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 rounded-2xl">
                        {AVAILABLE_GRADES.map((grade) => (
                          <button
                            key={grade}
                            onClick={() => {
                              setSelectedArchiveGrade(grade);
                              setSelectedArchiveSubject(null);
                              setSelectedArchiveSemester(null);
                            }}
                            className={cn(
                              "px-6 py-3 rounded-xl text-xs font-black transition-all",
                              selectedArchiveGrade === grade ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"
                            )}
                          >
                            {grade}
                          </button>
                        ))}
                      </div>

                      {selectedArchiveGrade && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          {allSubjects.map((subject) => (
                            <div 
                              key={subject.name}
                              onClick={() => {
                                setSelectedArchiveSubject(subject.name);
                                setSelectedArchiveSemester('الفصل الدراسي الأول');
                              }}
                              className={cn(
                                "p-6 rounded-[24px] border-2 transition-all cursor-pointer group",
                                selectedArchiveSubject === subject.name ? subject.bg + " " + subject.border : "bg-white border-slate-100 hover:border-slate-200"
                              )}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", subject.iconBg, subject.iconText)}>
                                    <subject.icon className="w-6 h-6" />
                                  </div>
                                  <h4 className="font-black text-slate-900">{subject.name}</h4>
                                </div>
                                <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", selectedArchiveSubject === subject.name ? "rotate-180" : "")} />
                              </div>

                              {selectedArchiveSubject === subject.name && (
                                <div className="mt-6 flex gap-3 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                                  {['الفصل الدراسي الأول'].map((sem) => (
                                    <button
                                      key={sem}
                                      onClick={() => setSelectedArchiveSemester(sem)}
                                      className={cn(
                                        "flex-1 py-3 rounded-xl text-xs font-black transition-all border-2",
                                        selectedArchiveSemester === sem 
                                          ? "bg-white text-indigo-600 border-indigo-200 shadow-sm" 
                                          : "bg-white/50 text-slate-500 border-transparent hover:border-slate-200"
                                      )}
                                    >
                                      {sem}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedArchiveYear && selectedArchiveGrade && selectedArchiveSubject && selectedArchiveSemester && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <Archive className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-slate-900">نتائج الأرشيف</h3>
                            <p className="text-xs font-bold text-slate-400">{selectedArchiveYear} • {selectedArchiveGrade} • {selectedArchiveSubject} • {selectedArchiveSemester}</p>
                          </div>
                        </div>
                        <div className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-black text-slate-500 border border-slate-100">
                          {lessonMaterials.filter(m => 
                            m.academicYear === selectedArchiveYear && 
                            m.grade === selectedArchiveGrade && 
                            m.subject === selectedArchiveSubject && 
                            m.semester === selectedArchiveSemester
                          ).length} درس مؤرشف
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lessonMaterials.filter(m => 
                          m.academicYear === selectedArchiveYear && 
                          m.grade === selectedArchiveGrade && 
                          m.subject === selectedArchiveSubject && 
                          m.semester === selectedArchiveSemester
                        ).map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                <Palette className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{lesson.lessonTitle}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{lesson.teacherName} • {new Date(lesson.createdAt).toLocaleDateString('ar-OM')}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => downloadFile(lesson.attachments[0]?.url, lesson.lessonTitle)}
                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              
                              <button 
                                onClick={() => {
                                  if (window.confirm('هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء.')) {
                                    onDeletePermanentlyLesson(lesson.id);
                                  }
                                }}
                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                                title="حذف نهائي"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              {lesson.isActive === false && (
                                <button 
                                  onClick={() => onRestoreLesson(lesson.id)}
                                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                                >
                                  <CheckCircle className="w-3 h-3" /> استعادة
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {lessonMaterials.filter(m => 
                          m.academicYear === selectedArchiveYear && 
                          m.grade === selectedArchiveGrade && 
                          m.subject === selectedArchiveSubject && 
                          m.semester === selectedArchiveSemester
                        ).length === 0 && (
                          <div className="col-span-full text-center py-20">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Search className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">لا توجد دروس مؤرشفة</h3>
                            <p className="text-slate-400 text-sm">لم يتم العثور على أي محتوى يطابق هذه الفلاتر في الأرشيف</p>
                          </div>
                        )}
                      </div>

                      {/* Archived Projects Section */}
                      <div className="mt-12 pt-12 border-t border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                          <Rocket className="w-6 h-6 text-indigo-600" />
                          المشاريع المؤرشفة
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {projects.filter(p => p.academicYear === selectedArchiveYear).length > 0 ? (
                            projects.filter(p => p.academicYear === selectedArchiveYear).map(project => (
                              <div key={project.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h4 className="font-bold text-lg text-slate-900">{project.name}</h4>
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg mt-1 inline-block">
                                      {project.semester || 'طوال العام'}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      if(window.confirm('هل أنت متأكد من الحذف النهائي للمشروع؟ لا يمكن التراجع عن هذا الإجراء.')) {
                                        onDeletePermanentlyProject(project.id);
                                      }
                                    }}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                                    title="حذف نهائي"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{project.description}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {project.assignedTeacherIds.length} معلمة
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <ListTodo className="w-3 h-3" />
                                    {project.tasks.length} مهمة
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-full text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                              <p className="text-slate-400 text-sm font-bold">لا توجد مشاريع مؤرشفة لهذا العام</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Archived Posts Section */}
                      <div className="mt-12 pt-12 border-t border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                          <MessageSquare className="w-6 h-6 text-indigo-600" />
                          التعاميم والمنشورات المؤرشفة
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          {posts.filter(p => p.academicYear === selectedArchiveYear).length > 0 ? (
                            posts.filter(p => p.academicYear === selectedArchiveYear).map(post => (
                              <div key={post.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-slate-900 mb-1">{post.title}</h4>
                                  <p className="text-xs text-slate-500 mb-2">{new Date(post.createdAt).toLocaleDateString('ar-OM')}</p>
                                  <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>
                                </div>
                                <button 
                                  onClick={() => {
                                    if(window.confirm('هل أنت متأكد من الحذف النهائي للمنشور؟')) {
                                      onDeletePermanentlyPost(post.id);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all shrink-0 mr-4"
                                  title="حذف نهائي"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                              <p className="text-slate-400 text-sm font-bold">لا توجد تعاميم مؤرشفة لهذا العام</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <motion.div 
                key="projects"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-900">إدارة المشاريع</h2>
                  {isMainSupervisor && (
                    <button 
                      onClick={() => setIsAddProjectModalOpen(true)}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> إضافة مشروع جديد
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto snap-y snap-mandatory pr-2 custom-scrollbar focus:outline-none" tabIndex={0}>
                  {filteredProjects.map((project, index) => (
                    <motion.div 
                      key={project.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="snap-start shrink-0 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                    >
                      <div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">{project.name}</h3>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-3">
                          {project.startDate && project.endDate ? (
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                              <Calendar className="w-3 h-3" />
                              {project.startDate} - {project.endDate}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                              <Clock className="w-3 h-3" />
                              مفتوح المدة
                            </span>
                          )}
                          {project.attachments?.length > 0 && (
                            <span className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                              <FileText className="w-3 h-3" />
                              {project.attachments.length} مرفق
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 font-bold text-sm mb-4">{project.description || 'لا يوجد وصف'}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {project.assignedTeacherIds.map((teacherId, idx) => {
                              const teacher = teachers.find(t => t.id === teacherId);
                              const submission = project.submissions?.[teacherId];
                              const status = submission?.status || 'pending';
                              
                              return (
                                <div key={`proj-teacher-${project.id}-${teacherId}-${idx}`} className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 border",
                                  status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                  status === 'submitted' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                  status === 'needs_work' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                  "bg-slate-50 text-slate-500 border-slate-100"
                                )}>
                                  <span>{teacher?.name || teacherId}</span>
                                  {status === 'submitted' && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                                </div>
                              );
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button 
                          onClick={() => setViewingProject(project)}
                          className="flex-1 md:flex-none px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-black text-xs hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" /> متابعة التسليمات
                        </button>
                        {isMainSupervisor && (
                          <button 
                            onClick={() => onDeleteProject(project.id)}
                            className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Project Review Modal */}
            <AnimatePresence>
              {viewingProject && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] overflow-y-auto"
                  >
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900">{viewingProject.name}</h3>
                        <p className="text-sm text-slate-500 font-bold mt-1">متابعة تسليمات المعلمات</p>
                      </div>
                      <button 
                        onClick={() => setViewingProject(null)} 
                        className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600"
                      >
                        <XCircle className="w-7 h-7" />
                      </button>
                    </div>

                    <div className="p-8 space-y-8">
                      {viewingProject.tasks && viewingProject.tasks.length > 0 && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <h4 className="font-black text-slate-800 mb-3 text-sm">مهام المشروع المطلوبة:</h4>
                          <ul className="space-y-2">
                            {viewingProject.tasks.map((task, i) => (
                                  <li key={`proj-task-${viewingProject.id}-${i}`} className="flex items-start gap-2 text-sm text-slate-600">
                                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">
                                      {i + 1}
                                    </span>
                                    {task}
                                  </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {viewingProject.assignedTeacherIds.map((teacherId, idx) => {
                        const teacher = teachers.find(t => t.id === teacherId);
                        const submission = viewingProject.submissions?.[teacherId];
                        const status = submission?.status || 'pending';

                        return (
                          <div key={`view-proj-teacher-${viewingProject.id}-${teacherId}-${idx}`} className="bg-slate-50 rounded-[24px] border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                  {teacher?.name.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-black text-slate-900">{teacher?.name}</h4>
                                  <p className="text-xs text-slate-500 font-bold">
                                    {status === 'pending' ? 'لم يتم التسليم بعد' : 
                                     status === 'submitted' ? `تم التسليم: ${new Date(submission!.submittedAt!).toLocaleDateString('ar-SA')}` :
                                     status === 'approved' ? 'تم الاعتماد' : 'طلب تعديل'}
                                  </p>
                                </div>
                              </div>
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-black",
                                status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                                status === 'submitted' ? "bg-blue-100 text-blue-700" :
                                status === 'needs_work' ? "bg-amber-100 text-amber-700" :
                                "bg-slate-100 text-slate-500"
                              )}>
                                {status === 'approved' ? 'مكتمل' :
                                 status === 'submitted' ? 'بانتظار المراجعة' :
                                 status === 'needs_work' ? 'يحتاج تعديل' : 'قيد العمل'}
                              </span>
                            </div>

                            {submission && submission.status !== 'pending' && (
                              <div className="p-6 space-y-6">
                                {submission.notes && (
                                  <div className="bg-white p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 mb-1">ملاحظات المعلمة:</p>
                                    <p className="text-sm text-slate-700">{submission.notes}</p>
                                  </div>
                                )}

                                {submission.files && submission.files.length > 0 && (
                                  <div className="flex flex-wrap gap-3">
                                    {submission.files.map((file, i) => (
                                      <button 
                                        key={`sub-file-${i}`}
                                        onClick={() => downloadFile(file.url, file.name)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                                      >
                                        <Download className="w-4 h-4" />
                                        {file.name}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {(isMainSupervisor || (isTempSupervisor && (user.tempPermissions?.hasFullAccess || user.tempPermissions?.canApproveProjects))) && (
                                  <div className="flex gap-3 pt-4 border-t border-slate-200">
                                    <button 
                                      onClick={() => handleUpdateSubmissionStatus(viewingProject.id, teacherId, 'approved', 'عمل ممتاز، تم الاعتماد.')}
                                      className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                                    >
                                      اعتماد المشروع
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const feedback = prompt('أدخل ملاحظات التعديل:');
                                        if (feedback) handleUpdateSubmissionStatus(viewingProject.id, teacherId, 'needs_work', feedback);
                                      }}
                                      className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-black text-xs hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                                    >
                                      طلب تعديل
                                    </button>
                                  </div>
                                )}
                                {submission.feedback && (
                                  <p className="text-xs text-slate-400 font-bold text-center">
                                    آخر ملاحظات: {submission.feedback}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {activeTab === 'messages' && (
              <motion.div 
                key="messages"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-[calc(100vh-12rem)] flex flex-col space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-900">
                      {selectedTeacherForMessages 
                        ? `المحادثة مع: ${teachers.find(t => t.id === selectedTeacherForMessages)?.name || 'المعلمة'}`
                        : 'مركز التواصل المباشر'}
                    </h2>
                    {selectedTeacherForMessages && (
                      <button 
                        onClick={() => setSelectedTeacherForMessages(null)}
                        className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        عرض جميع الرسائل
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-slate-500">النظام متصل</span>
                  </div>
                </div>

                <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                  <div className="flex-1 p-8 overflow-y-auto space-y-4 bg-slate-50/30">
                    {messages.filter(m => {
                      if (selectedTeacherForMessages) {
                        return (m.senderId === selectedTeacherForMessages && m.recipientId === user.id) ||
                               (m.senderId === user.id && m.recipientId === selectedTeacherForMessages);
                      }
                      return true;
                    }).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <MessageSquare className="w-20 h-20 text-slate-200 mb-6" />
                        <h3 className="text-xl font-bold text-slate-400">لا توجد رسائل حالياً</h3>
                        <p className="text-sm text-slate-400">ابدأ التواصل مع المعلمات في الميدان</p>
                      </div>
                    ) : (
                      messages.filter(m => {
                        if (selectedTeacherForMessages) {
                          return (m.senderId === selectedTeacherForMessages && m.recipientId === user.id) ||
                                 (m.senderId === user.id && m.recipientId === selectedTeacherForMessages);
                        }
                        return true;
                      }).map((msg) => (
                        <div 
                          key={msg.id} 
                          className={cn(
                            "flex flex-col max-w-[75%]",
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
                            "px-5 py-3 rounded-2xl text-sm font-bold shadow-sm",
                            msg.senderId === user.id 
                              ? "bg-indigo-600 text-white rounded-tr-none" 
                              : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                          )}>
                            {msg.text}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {msg.attachments.map((att, idx) => (
                                  <div key={`msg-att-${msg.id}-${idx}`} className="flex items-center gap-2 bg-black/10 p-2 rounded-lg">
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

                  <div className="p-6 bg-white border-t border-slate-100">
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
                          onSendMessage(newMessageText, selectedTeacherForMessages || undefined, attachments);
                          setNewMessageText('');
                          setMessageAttachment(null);
                          setMessageAttachmentName('');
                          const fileInput = document.getElementById('sup-msg-file-upload') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }
                      }}
                      className="flex gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => document.getElementById('sup-msg-file-upload')?.click()}
                        className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                      <input 
                        type="file"
                        id="sup-msg-file-upload"
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
                        placeholder={selectedTeacherForMessages ? "اكتب رسالة خاصة للمعلمة..." : "اكتب رسالة للمعلمات..."}
                        className="flex-1 px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                      />
                      <button 
                        type="submit"
                        disabled={!newMessageText.trim() && !messageAttachment}
                        className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-600/20"
                      >
                        <Send className="w-6 h-6" />
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'temp-supervisors' && isMainSupervisor && (
              <motion.div 
                key="temp-supervisors"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                  <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                      <Shield className="w-6 h-6" />
                    </div>
                    إدارة المشرفين المؤقتين
                  </h3>
                  
                  <div className="space-y-10">
                    <section className="space-y-6">
                      <h4 className="font-black text-slate-800 text-sm border-r-4 border-indigo-500 pr-4">إضافة مشرف مؤقت جديد</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">اسم المشرف</label>
                          <input type="text" value={newTempName} onChange={e => setNewTempName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">الرقم الوظيفي</label>
                          <input type="text" value={newTempId} onChange={e => setNewTempId(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">كلمة المرور</label>
                          <input type="password" value={newTempPass} onChange={e => setNewTempPass(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all" />
                        </div>
                      </div>

                      <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <h5 className="font-black text-slate-700 text-sm">صلاحيات المشرف المؤقت</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={tempPermView} onChange={e => setTempPermView(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm font-bold text-slate-700">الاطلاع على المعلمات</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={tempPermComment} onChange={e => setTempPermComment(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm font-bold text-slate-700">إضافة تعليقات</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={tempPermApprove} onChange={e => setTempPermApprove(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm font-bold text-slate-700">اعتماد المشاريع</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={tempPermManage} onChange={e => setTempPermManage(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm font-bold text-slate-700">إدارة المستخدمين</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={tempPermDownload} onChange={e => setTempPermDownload(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm font-bold text-slate-700">الوصول للموقع لتحميله (تنزيل المرفقات)</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={tempPermFull} onChange={e => setTempPermFull(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-sm font-bold text-slate-700">التأكد من أن جميع الميزات تعمل بأفضل شكل (صلاحيات كاملة)</span>
                          </label>
                        </div>
                      </div>

                      <button onClick={handleAddNewTempSupervisor} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">إضافة المشرف المؤقت</button>
                    </section>

                    <section className="space-y-6">
                      <h4 className="font-black text-slate-800 text-sm border-r-4 border-red-500 pr-4">المشرفين المؤقتين الحاليين</h4>
                      <div className="space-y-4">
                        {teachers.filter(t => t.role === UserRole.TEMP_SUPERVISOR).map((supervisor) => {
                          return (
                            <div key={supervisor.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="font-bold text-slate-700">{supervisor.name}</span>
                              <button 
                                onClick={() => onDeleteTempSupervisor(supervisor.id)}
                                className="text-red-500 hover:text-red-700 font-bold text-xs"
                              >
                                حذف
                              </button>
                            </div>
                          );
                        })}
                        {teachers.filter(t => t.role === UserRole.TEMP_SUPERVISOR).length === 0 && (
                          <p className="text-sm font-bold text-slate-500 text-center py-4">لا يوجد مشرفين مؤقتين حالياً</p>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && isMainSupervisor && (
              <motion.div 
                key="security"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <Settings className="w-6 h-6" />
                      </div>
                      إعدادات النظام والأمان
                    </h3>
                    {securityView !== 'main' && (
                      <button 
                        onClick={() => setSecurityView('main')}
                        className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
                      >
                        رجوع للإعدادات
                      </button>
                    )}
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {securityView === 'main' ? (
                      <motion.div 
                        key="security-main"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-10"
                      >
                        <section className="space-y-6">
                          <h4 className="font-black text-slate-800 text-sm border-r-4 border-indigo-500 pr-4">بيانات المشرفة</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">اسم المشرفة</label>
                              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">المسمى الوظيفي</label>
                              <input type="text" value={editJobTitle} onChange={e => setEditJobTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all" />
                            </div>
                          </div>
                          <button 
                            onClick={handleSaveConfig}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                          >
                            حفظ التغييرات
                          </button>
                        </section>

                        <section className="space-y-6">
                          <h4 className="font-black text-slate-800 text-sm border-r-4 border-indigo-500 pr-4">إدارة كلمات المرور</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 flex flex-col items-center text-center space-y-4">
                              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
                                <Shield className="w-8 h-8" />
                              </div>
                              <div>
                                <h5 className="font-black text-slate-900">كلمة المرور الرئيسية</h5>
                                <p className="text-[10px] text-slate-500 font-bold mt-1">تستخدم للدخول اليومي للنظام</p>
                              </div>
                              <button 
                                onClick={() => setSecurityView('change-main')}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                              >
                                تغيير كلمة المرور الرئيسية
                              </button>
                            </div>

                            <div className="p-8 bg-amber-50/50 rounded-[2rem] border border-amber-100 flex flex-col items-center text-center space-y-4">
                              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-amber-600">
                                <Clock className="w-8 h-8" />
                              </div>
                              <div>
                                <h5 className="font-black text-slate-900">كلمة مرور الطوارئ</h5>
                                <p className="text-[10px] text-slate-500 font-bold mt-1">تستخدم عند نسيان كلمة المرور الرئيسية</p>
                              </div>
                              <button 
                                onClick={() => setSecurityView('add-emergency')}
                                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
                              >
                                {supervisorConfig.backupPassword ? 'تحديث كلمة مرور الطوارئ' : 'إضافة كلمة مرور للطوارئ'}
                              </button>
                            </div>
                          </div>
                        </section>
                      </motion.div>
                    ) : securityView === 'change-main' ? (
                      <motion.div 
                        key="security-change-main"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6">
                          <h4 className="font-black text-slate-800 text-lg">تغيير كلمة المرور الرئيسية</h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">كلمة المرور الجديدة</label>
                              <input 
                                type="password" 
                                value={newMainPass} 
                                onChange={e => setNewMainPass(e.target.value)} 
                                placeholder="••••••••" 
                                className={cn(
                                  "w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-indigo-500 font-bold text-sm outline-none transition-all shadow-sm",
                                  newMainPass.length > 0 && newMainPass.length < 8 && "border-red-300 focus:border-red-500"
                                )} 
                              />
                              {newMainPass.length > 0 && newMainPass.length < 8 && (
                                <p className="text-[10px] text-red-500 font-bold mr-2">يجب أن تكون 8 أحرف على الأقل</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">تأكيد كلمة المرور</label>
                              <input 
                                type="password" 
                                value={confirmMainPass} 
                                onChange={e => setConfirmMainPass(e.target.value)} 
                                placeholder="••••••••" 
                                className={cn(
                                  "w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-indigo-500 font-bold text-sm outline-none transition-all shadow-sm",
                                  confirmMainPass.length > 0 && confirmMainPass !== newMainPass && "border-red-300 focus:border-red-500"
                                )} 
                              />
                              {confirmMainPass.length > 0 && confirmMainPass !== newMainPass && (
                                <p className="text-[10px] text-red-500 font-bold mr-2">كلمات المرور غير متطابقة</p>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              if (newMainPass.length < 8) return alert('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
                              if (newMainPass !== confirmMainPass) return alert('كلمات المرور غير متطابقة');
                              onUpdateSecurity({ ...supervisorConfig, mainPassword: newMainPass });
                              alert('تم تغيير كلمة المرور بنجاح');
                              setSecurityView('main');
                              setNewMainPass('');
                              setConfirmMainPass('');
                            }}
                            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                          >
                            تأكيد تغيير كلمة المرور
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="security-add-emergency"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6">
                          <h4 className="font-black text-slate-800 text-lg">إضافة كلمة مرور للطوارئ</h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">كلمة مرور الطوارئ الجديدة</label>
                              <input 
                                type="password" 
                                value={newBackupPass} 
                                onChange={e => setNewBackupPass(e.target.value)} 
                                placeholder="••••••••" 
                                className={cn(
                                  "w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-indigo-500 font-bold text-sm outline-none transition-all shadow-sm",
                                  newBackupPass.length > 0 && newBackupPass.length < 8 && "border-red-300 focus:border-red-500"
                                )} 
                              />
                              {newBackupPass.length > 0 && newBackupPass.length < 8 && (
                                <p className="text-[10px] text-red-500 font-bold mr-2">يجب أن تكون 8 أحرف على الأقل</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">تأكيد كلمة المرور</label>
                              <input 
                                type="password" 
                                value={confirmBackupPass} 
                                onChange={e => setConfirmBackupPass(e.target.value)} 
                                placeholder="••••••••" 
                                className={cn(
                                  "w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-indigo-500 font-bold text-sm outline-none transition-all shadow-sm",
                                  confirmBackupPass.length > 0 && confirmBackupPass !== newBackupPass && "border-red-300 focus:border-red-500"
                                )} 
                              />
                              {confirmBackupPass.length > 0 && confirmBackupPass !== newBackupPass && (
                                <p className="text-[10px] text-red-500 font-bold mr-2">كلمات المرور غير متطابقة</p>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              if (newBackupPass.length < 8) return alert('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
                              if (newBackupPass !== confirmBackupPass) return alert('كلمات المرور غير متطابقة');
                              onUpdateSecurity({ ...supervisorConfig, backupPassword: newBackupPass });
                              alert('تم تمكين كلمة مرور الطوارئ بنجاح');
                              setSecurityView('main');
                              setNewBackupPass('');
                              setConfirmBackupPass('');
                            }}
                            className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-sm hover:bg-amber-600 transition-all shadow-xl shadow-amber-100"
                          >
                            تأكيد كلمة مرور الطوارئ
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-10 mt-10">
                    <section className="space-y-6">
                      <h4 className="font-black text-slate-800 text-sm border-r-4 border-emerald-500 pr-4">العام الدراسي الحالي</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">العام الأول</label>
                            <input 
                              type="text" 
                              value={editStartYear} 
                              onChange={e => setEditStartYear(e.target.value)} 
                              placeholder="2025"
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">العام الثاني</label>
                            <input 
                              type="text" 
                              value={editEndYear} 
                              onChange={e => setEditEndYear(e.target.value)} 
                              placeholder="2026"
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">الفصل الدراسي</label>
                          <input type="text" value={editSemester} onChange={e => setEditSemester(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all" />
                        </div>
                      </div>
                    </section>

                    <button onClick={handleSaveConfig} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">حفظ الإعدادات</button>

                    <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                      حفظ كافة التغييرات
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Add Lesson Modal */}
      <AnimatePresence>
        {isAddLessonModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8 border border-slate-100"
            >
              <h3 className="text-xl font-black text-slate-900 mb-6">{editingLesson ? 'تعديل الدرس' : 'إضافة درس جديد'}</h3>
              <div className="space-y-4">
                <input type="text" placeholder="عنوان الدرس" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm" />
                <select value={newLessonGrade} onChange={e => setNewLessonGrade(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm">
                  {AVAILABLE_GRADES.map((g, i) => <option key={`${g}-${i}`} value={g}>{g}</option>)}
                </select>
                <select value={newLessonSemester} onChange={e => setNewLessonSemester(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm">
                  <option value="الفصل الأول">الفصل الأول</option>
                  <option value="الفصل الثاني">الفصل الثاني</option>
                </select>
                <select value={newLessonSubject} onChange={e => setNewLessonSubject(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm">
                  {AVAILABLE_SUBJECTS.map((s, i) => <option key={s} value={s}>{s}</option>)}
                </select>
                <textarea placeholder="وصف الدرس" value={newLessonDescription} onChange={e => setNewLessonDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm" rows={4} />
                
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-bold text-slate-500">المرفقات:</p>
                  {newLessonAttachments.map((att, i) => (
                    <div key={`new-lesson-att-${i}`} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-xs font-bold text-slate-700">
                      {att.name}
                      <button onClick={() => setNewLessonAttachments(newLessonAttachments.filter((_, idx) => idx !== i))} className="text-red-500">حذف</button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input type="text" placeholder="اسم المرفق" id="newAttName" className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border-none font-bold text-xs" />
                    <input type="text" placeholder="رابط المرفق" id="newAttUrl" className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border-none font-bold text-xs" />
                    <button onClick={() => {
                      const nameInput = document.getElementById('newAttName') as HTMLInputElement;
                      const urlInput = document.getElementById('newAttUrl') as HTMLInputElement;
                      if (nameInput.value && urlInput.value) {
                        setNewLessonAttachments([...newLessonAttachments, { name: nameInput.value, url: urlInput.value, type: 'link' }]);
                        nameInput.value = '';
                        urlInput.value = '';
                      }
                    }} className="px-3 py-2 rounded-lg bg-indigo-600 text-white font-black text-xs">+</button>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setIsAddLessonModalOpen(false); setEditingLesson(null); }} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-black text-xs hover:bg-slate-200">إلغاء</button>
                  <button onClick={handleAddLesson} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-700 disabled:opacity-50">{editingLesson ? 'حفظ التعديلات' : 'حفظ الدرس'}</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {resetPassword && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full space-y-6"
            >
              <h3 className="text-lg font-black text-slate-900">تم إعادة تعيين كلمة المرور</h3>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                <p className="text-xs font-bold text-slate-500 mb-2">كلمة المرور الجديدة للمعلمة {resetTeacherName}</p>
                <p className="text-3xl font-mono font-black text-indigo-600">{resetPassword}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { navigator.clipboard.writeText(resetPassword); alert('تم نسخ كلمة المرور'); }}
                  className="bg-slate-100 text-slate-700 py-3 rounded-xl font-black text-xs hover:bg-slate-200 transition-all"
                >
                  نسخ
                </button>
                <button 
                  onClick={() => {
                    const message = `السلام عليكم الأستاذة ${resetTeacherName}\n` +
                                    `تم تحديث بيانات دخولك لمنصة إبداع المجال الأول\n` +
                                    `الرقم الوظيفي: ${resetTeacherId}\n` +
                                    `كلمة المرور: ${resetPassword}\n` +
                                    `رابط المنصة: https://education-489618.web.app`;
                    
                    const encodedMessage = encodeURIComponent(message);
                    let formattedPhone = (resetTeacherPhone || '').replace(/\D/g, '');
                    if (formattedPhone && !formattedPhone.startsWith('968')) {
                        formattedPhone = '968' + formattedPhone;
                    }
                    
                    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="bg-emerald-600 text-white py-3 rounded-xl font-black text-xs hover:bg-emerald-700 transition-all"
                >
                  إرسال عبر واتساب
                </button>
              </div>
              <button 
                onClick={() => setResetPassword(null)}
                className="w-full text-slate-400 font-bold text-xs hover:text-slate-600 transition-all"
              >
                إغلاق
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Project Modal */}
      <AnimatePresence>
        {isAddProjectModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-900">إضافة مشروع جديد</h3>
                <button onClick={() => setIsAddProjectModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <XCircle className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700">اسم المشروع</label>
                  <input 
                    type="text" 
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    placeholder="مثال: مشروع القراءة الممتعة"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none font-bold text-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700">وصف المشروع</label>
                  <textarea 
                    value={newProjectDescription}
                    onChange={e => setNewProjectDescription(e.target.value)}
                    placeholder="اكتب وصفاً مختصراً للمشروع..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none font-bold text-sm transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700">مرفقات المشروع</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => document.getElementById('project-file-upload')?.click()}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> إضافة ملف
                    </button>
                    <input 
                      type="file" 
                      id="project-file-upload"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          const newAtts = files.map(file => ({
                            type: 'file' as const,
                            url: URL.createObjectURL(file),
                            name: file.name
                          }));
                          setNewProjectAttachments([...newProjectAttachments, ...newAtts]);
                        }
                      }}
                    />
                  </div>
                  {newProjectAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newProjectAttachments.map((att, idx) => (
                        <div key={`new-proj-att-${idx}`} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          {att.name}
                          <button onClick={() => setNewProjectAttachments(newProjectAttachments.filter((_, i) => i !== idx))} className="hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700">تاريخ البداية</label>
                    <input 
                      type="date"
                      value={newProjectStartDate}
                      onChange={e => setNewProjectStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none font-bold text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700">تاريخ النهاية</label>
                    <input 
                      type="date"
                      value={newProjectEndDate}
                      onChange={e => setNewProjectEndDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none font-bold text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700">مهام المشروع</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newTaskInput}
                      onChange={e => setNewTaskInput(e.target.value)}
                      placeholder="أضف مهمة جديدة..."
                      className="flex-1 px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none font-bold text-sm transition-all"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newTaskInput.trim()) {
                            setNewProjectTasks([...newProjectTasks, newTaskInput.trim()]);
                            setNewTaskInput('');
                          }
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        if (newTaskInput.trim()) {
                          setNewProjectTasks([...newProjectTasks, newTaskInput.trim()]);
                          setNewTaskInput('');
                        }
                      }}
                      className="p-3 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-all"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                  {newProjectTasks.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {newProjectTasks.map((task, idx) => (
                        <div key={`new-proj-task-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-sm font-bold text-slate-700">{idx + 1}. {task}</span>
                          <button 
                            onClick={() => setNewProjectTasks(newProjectTasks.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700">تعيين المعلمات</label>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100">
                    {teachers.filter(t => t.isActive).map((teacher) => (
                      <label key={teacher.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-500 transition-all">
                        <input 
                          type="checkbox"
                          checked={newProjectTeachers.includes(teacher.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setNewProjectTeachers([...newProjectTeachers, teacher.id]);
                            } else {
                              setNewProjectTeachers(newProjectTeachers.filter(id => id !== teacher.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-700">{teacher.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handleAddProject}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                >
                  إضافة المشروع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* Edit Teacher Modal */}
      <AnimatePresence>
        {editingTeacher && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden my-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Edit className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">تعديل بيانات المعلمة</h3>
                    <p className="text-slate-500 font-bold text-xs">تحديث معلومات المعلمة والمهام المسندة</p>
                  </div>
                </div>
                <button onClick={() => setEditingTeacher(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mr-2">
                      <UserIcon className="w-3 h-3" /> الاسم الكامل
                    </label>
                    <input 
                      type="text" 
                      value={editTeacherName} 
                      onChange={(e) => setEditTeacherName(e.target.value)} 
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all shadow-sm" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mr-2">
                      <Hash className="w-3 h-3" /> الرقم الوظيفي
                    </label>
                    <input 
                      type="text" 
                      value={editTeacherId} 
                      onChange={(e) => setEditTeacherId(e.target.value)} 
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all shadow-sm" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mr-2">
                      <Phone className="w-3 h-3" /> رقم الهاتف
                    </label>
                    <input 
                      type="text" 
                      value={editTeacherPhone} 
                      onChange={(e) => setEditTeacherPhone(e.target.value)} 
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all shadow-sm" 
                    />
                  </div>
                </div>

                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h4 className="font-black text-sm text-slate-700">المواد والصفوف المسندة</h4>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">الصف الدراسي</label>
                      <select 
                        value={editAssignmentGrade} 
                        onChange={(e) => setEditAssignmentGrade(e.target.value)} 
                        className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-transparent shadow-sm focus:border-indigo-500 font-bold text-sm outline-none"
                      >
                        {AVAILABLE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">المادة العلمية</label>
                      <select 
                        value={editAssignmentSubject} 
                        onChange={(e) => setEditAssignmentSubject(e.target.value)} 
                        className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-transparent shadow-sm focus:border-indigo-500 font-bold text-sm outline-none"
                      >
                        {AVAILABLE_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button 
                        type="button" 
                        onClick={() => {
                          if (!editTeacherAssignments.some(a => a.grade === editAssignmentGrade && a.subject === editAssignmentSubject)) {
                            setEditTeacherAssignments([...editTeacherAssignments, { grade: editAssignmentGrade, subject: editAssignmentSubject }]);
                          }
                        }} 
                        className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    {editTeacherAssignments.map((assignment, idx) => (
                      <div key={`edit-assignment-${idx}`} className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="font-bold text-xs text-slate-700">{assignment.grade} • {assignment.subject}</span>
                        <button 
                          type="button" 
                          onClick={() => setEditTeacherAssignments(editTeacherAssignments.filter((_, i) => i !== idx))} 
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleUpdateTeacher}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                >
                  حفظ التغييرات
                </button>
                <button 
                  onClick={() => setEditingTeacher(null)}
                  className="flex-1 bg-white text-slate-600 py-4 rounded-2xl font-black text-base border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewAttachment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setPreviewAttachment(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="text-lg font-black text-slate-900">{previewAttachment.name}</h3>
                <button 
                  onClick={() => setPreviewAttachment(null)} 
                  className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 bg-slate-900 flex items-center justify-center p-4 overflow-auto">
                {previewAttachment.type === 'image' ? (
                  <img 
                    src={previewAttachment.url} 
                    alt={previewAttachment.name} 
                    className="max-w-full max-h-[70vh] rounded-lg object-contain"
                  />
                ) : previewAttachment.type === 'video' ? (
                  <video 
                    src={previewAttachment.url} 
                    controls 
                    className="max-w-full max-h-[70vh] rounded-lg"
                  />
                ) : (
                  <iframe 
                    src={previewAttachment.url} 
                    className="w-full h-[70vh] bg-white rounded-lg"
                    title="Preview"
                  />
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
                <button 
                  onClick={() => downloadFile(previewAttachment.url, previewAttachment.name)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> تحميل الملف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8"
            >
              <h3 className="text-xl font-black text-slate-900 mb-2">كلمة المرور الجديدة</h3>
              <p className="text-slate-500 font-bold text-xs mb-6">تم إعادة تعيين كلمة مرور المعلمة {resetTeacherName}</p>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-center">
                <span className="text-2xl font-mono font-bold text-indigo-600 tracking-widest">{resetPassword}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resetPassword || '');
                    alert('تم نسخ كلمة المرور');
                  }}
                  className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  نسخ
                </button>
                <button
                  onClick={() => {
                    const message = `السلام عليكم الأستاذة ${resetTeacherName}\n` +
                                    `تم تحديث بيانات دخولك لمنصة إبداع المجال الأول\n` +
                                    `الرقم الوظيفي: ${resetTeacherId}\n` +
                                    `كلمة المرور: ${resetPassword}\n` +
                                    `رابط المنصة: https://education-489618.web.app`;
                    
                    const encodedMessage = encodeURIComponent(message);
                    let formattedPhone = (resetTeacherPhone || '').replace(/\D/g, '');
                    if (formattedPhone && !formattedPhone.startsWith('968')) {
                        formattedPhone = '968' + formattedPhone;
                    }
                    
                    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  واتساب
                </button>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-full mt-4 px-4 py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-all"
              >
                إغلاق
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupervisorDashboard;
