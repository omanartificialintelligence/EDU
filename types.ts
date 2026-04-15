
export enum UserRole {
  TEACHER = 'TEACHER',
  SUPERVISOR = 'SUPERVISOR',
  TEMP_SUPERVISOR = 'TEMP_SUPERVISOR'
}

export interface TempPermissions {
  canViewTeachers: boolean;
  canComment: boolean;
  canApproveProjects: boolean;
  canManageUsers: boolean; // Can reset passwords or add teachers
  canViewOnly: boolean; // New permission: View only
  canDownloadAttachments?: boolean; // Can download attachments
  hasFullAccess?: boolean; // Ensure all features are working at their best
  allowedSubjects: string[]; // e.g., ['لغة عربية', 'تربية إسلامية']
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  code: string;
  password?: string;
  mustChangePassword?: boolean;
  isActive: boolean;
  joinedAt: string;
  email?: string;
  phoneNumber?: string;
  jobTitle?: string;
  subject?: string; // المادة: لغة عربية، إسلامية، دراسات
  teachingGrades?: string; // الصفوف التي تدرسها
  assignments?: { grade: string; subject: string }[];
  supervisoryVisitDate?: string; // وقت الزيارة الإشرافية
  tempPermissions?: TempPermissions; // For Temp Supervisors
  auditLogs?: AuditLog[];
}

export interface SupervisorConfig {
  mainPassword?: string;
  backupPassword?: string;
  academicYear?: string; // السنة الدراسية (نص)
  semester?: string; // الفصل الدراسي (نص)
  appLogoUrl?: string;
  schoolName?: string; // اسم المدرسة
  archiveYears?: string[];
}

export interface LessonComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
  isEdited?: boolean;
}

export interface LessonMaterial {
  id: string;
  teacherId: string;
  teacherName: string;
  lessonTitle: string;
  description: string;
  attachments: Attachment[];
  comments: LessonComment[];
  createdAt: string;
  academicYear: string;
  semester?: string;
  subject?: string;
  grade?: string;
  status: 'pending' | 'approved' | 'rejected';
  isActive?: boolean;
  isModelLesson: boolean;
  supervisorNotes?: string;
  teacherNotes?: string; // ملاحظات المعلمة للمشرفة
  isStarred?: boolean;
  publishDate?: string; // ISO date string for scheduling
  tags?: string[];
  voiceNoteUrl?: string;
  isArchived?: boolean;
}

export interface Notification {
  id: string;
  userId: string; // Recipient ID
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'comment' | 'system';
}

export interface ResetRequest {
  id: string;
  userId: string;
  userName: string;
  requestedAt: string;
  status: 'pending' | 'resolved';
}

export type AttachmentType = 'link' | 'image' | 'video' | 'audio' | 'file';

export interface Attachment {
  id: string;
  type: AttachmentType;
  url: string;
  name: string;
  isFeatured?: boolean;
  comment?: string; // Optional comment for the attachment
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  attachments: Attachment[];
  isPinned: boolean;
  createdAt: string;
  academicYear: string;
  semester?: string;
  isArchived?: boolean;
}

export interface ProjectSubmission {
  teacherId: string;
  files: Attachment[];
  notes: string;
  status: 'pending' | 'submitted' | 'approved' | 'needs_work';
  feedback: string;
  badges: string[];
  points?: number;
  submittedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  attachments: Attachment[]; // Attachments from supervisor
  tasks: string[];
  assignedTeacherIds: string[];
  startDate?: string; // Project start date
  endDate?: string;   // Project end date (deadline)
  createdAt: string;
  academicYear: string;
  semester?: string;
  submissions: Record<string, ProjectSubmission>;
  isArchived?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string; // 'ALL' for broadcasts or specific user ID
  text: string;
  attachments?: Attachment[];
  createdAt: string;
  isRead: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
