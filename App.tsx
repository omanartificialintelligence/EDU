
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, User, AuthState, Project, Post, ResetRequest, LessonMaterial, LessonComment, SupervisorConfig, Notification, Message, Attachment } from './types';
import LoginForm from './components/LoginForm';
import TeacherDashboard from './components/TeacherDashboardV2';
import SupervisorDashboard from './components/SupervisorDashboard';
import ChangePasswordForm from './components/ChangePasswordForm';
import { io, Socket } from 'socket.io-client';

const APP_TITLE = "منصة الإبداع للمجال الأول";

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io();

    socketRef.current.on('initial_messages', (initialMessages: Message[]) => {
      setMessages(initialMessages);
    });

    socketRef.current.on('new_message', (newMessage: Message) => {
      setMessages(prev => [...prev, newMessage]);
    });

    socketRef.current.on('message_updated', (messageId: string) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true } : m));
    });

    socketRef.current.on('new_notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleSendMessage = (text: string, recipientId: string = 'ALL', attachments: Attachment[] = []) => {
    if (socketRef.current && auth.user) {
      const messageData = {
        senderId: auth.user.id,
        senderName: auth.user.name,
        recipientId,
        text,
        attachments,
      };
      socketRef.current.emit('send_message', messageData);
    }
  };

  const handleMarkMessageAsRead = (messageId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('mark_as_read', messageId);
    }
  };

  const [teachers, setTeachers] = useState<User[]>(() => {
    const isReset = localStorage.getItem('app_reset_v5');
    if (!isReset) return [];
    const saved = localStorage.getItem('app_teachers_list');
    let list: User[] = saved ? JSON.parse(saved) : [];
    
    // Filter out all supervisors except 16115506
    list = list.filter(t => 
      t.role === UserRole.TEACHER || t.id === '16115506'
    );

    // Ensure 16115506 exists if it's the main supervisor
    if (!list.some(t => t.id === '16115506')) {
      list.push({
        id: '16115506',
        code: '16115506',
        name: 'رحمه بنت حمد الشرجيه',
        role: UserRole.SUPERVISOR,
        password: 'admin', // Default or from config
        isActive: true,
        joinedAt: '2026',
        mustChangePassword: false
      });
    }

    return list;
  });

  const [lessonMaterials, setLessonMaterials] = useState<LessonMaterial[]>(() => {
    const isReset = localStorage.getItem('app_reset_v5');
    if (!isReset) return [];
    const saved = localStorage.getItem('app_lesson_materials');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const isReset = localStorage.getItem('app_reset_v5');
    if (!isReset) return [];
    const saved = localStorage.getItem('app_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    const isReset = localStorage.getItem('app_reset_v5');
    if (!isReset) return [];
    const saved = localStorage.getItem('app_posts');
    return saved ? JSON.parse(saved) : [];
  });

  const [resetRequests, setResetRequests] = useState<ResetRequest[]>(() => {
    const isReset = localStorage.getItem('app_reset_v5');
    if (!isReset) return [];
    const saved = localStorage.getItem('app_reset_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const isReset = localStorage.getItem('app_reset_v5');
    if (!isReset) return [];
    const saved = localStorage.getItem('app_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [supervisorConfig, setSupervisorConfig] = useState<SupervisorConfig>(() => {
    const isReset = localStorage.getItem('app_reset_v5');
    if (!isReset) {
      return { 
        mainPassword: 'admin', 
        backupPassword: 'admin', 
        academicYear: '2025-2026', 
        semester: 'الفصل الدراسي الأول',
        archiveYears: ['2024-2025', '2023-2024']
      };
    }
    const saved = localStorage.getItem('app_supervisor_config');
    return saved ? JSON.parse(saved) : { 
      mainPassword: 'admin', 
      backupPassword: 'admin', 
      academicYear: '2025-2026', 
      semester: 'الفصل الدراسي الأول',
      archiveYears: ['2024-2025', '2023-2024']
    };
  });

  useEffect(() => {
    // One-time cleanup to remove all supervisors except 16115506
    setTeachers(prev => {
      const filtered = prev.filter(t => 
        t.role === UserRole.TEACHER || t.id === '16115506'
      );
      if (filtered.length !== prev.length) {
        return filtered;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('app_reset_v5')) {
      localStorage.clear();
      localStorage.setItem('app_reset_v5', 'true');
    }
  }, []);

  const currentAcademicYear = supervisorConfig.academicYear || "2025-2026";
  const currentSemester = supervisorConfig.semester || "الفصل الأول";

  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_teachers_list', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('app_lesson_materials', JSON.stringify(lessonMaterials));
  }, [lessonMaterials]);

  useEffect(() => {
    localStorage.setItem('app_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('app_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('app_reset_requests', JSON.stringify(resetRequests));
  }, [resetRequests]);

  useEffect(() => {
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('app_supervisor_config', JSON.stringify(supervisorConfig));
    
    // Automated archiving
    const currentYear = supervisorConfig.academicYear;
    const currentSemester = supervisorConfig.semester;
    
    if (currentYear && currentSemester) {
      setLessonMaterials(prev => prev.map(m => 
        (m.academicYear !== currentYear || m.semester !== currentSemester) && !m.isArchived ? { ...m, isArchived: true } : m
      ));
      setProjects(prev => prev.map(p => 
        (p.academicYear !== currentYear || p.semester !== currentSemester) && !p.isArchived ? { ...p, isArchived: true } : p
      ));
      setPosts(prev => prev.map(p => 
        (p.academicYear !== currentYear || p.semester !== currentSemester) && !p.isArchived ? { ...p, isArchived: true } : p
      ));
    }
  }, [supervisorConfig]);

  const handleLogin = (user: User) => {
    if (!user.isActive) {
      alert('عذراً، هذا الحساب غير نشط.');
      return;
    }
    setAuth({ user, isAuthenticated: true });
    if (user.role === UserRole.TEACHER && user.mustChangePassword) {
      setShowChangePassword(true);
    } else {
      setShowChangePassword(false);
    }
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    setShowChangePassword(false);
  };

  const handleAddLessonMaterial = (material: LessonMaterial) => {
    setLessonMaterials(prev => [material, ...prev]);
  };

  const handleUpdateLessonMaterial = (updated: LessonMaterial) => {
    setLessonMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const handleSoftDeleteLesson = (id: string) => {
    setLessonMaterials(prev => prev.map(m => m.id === id ? { ...m, isActive: false } : m));
  };

  const handleDeletePermanentlyLesson = (id: string) => {
    setLessonMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleRestoreLesson = (id: string) => {
    setLessonMaterials(prev => prev.map(m => m.id === id ? { ...m, isActive: true } : m));
  };

  const handleAddNotification = (notification: Notification) => {
    if (socketRef.current) {
      socketRef.current.emit('send_notification', notification);
    }
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleSoftDeleteTeacher = (id: string) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, isActive: false } : t));
  };

  const handleDeleteTempSupervisor = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  const handleRestoreTeacher = (id: string) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, isActive: true } : t));
  };

  const handleDeletePermanentlyTeacher = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  const handleDeletePermanentlyProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleDeletePermanentlyPost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleResetPassword = (id: string) => {
    // Generate a random password of 8 characters
    const randomPass = Math.random().toString(36).substring(2, 10);
    
    // Update teacher password in the list
    setTeachers(prev => {
      const newList = prev.map(t => 
        t.id === id ? { ...t, password: randomPass, mustChangePassword: true } : t
      );
      return newList;
    });
    // Clear the request from pending
    setResetRequests(prev => prev.filter(req => req.userId !== id));
    return randomPass;
  };

  const handleForgotPasswordRequest = (userId: string) => {
    const teacher = teachers.find(t => t.id === userId && t.isActive);
    if (!teacher) {
      alert('المعلمة غير موجودة أو الحساب معطل.');
      return;
    }
    const newRequest: ResetRequest = {
      id: Date.now().toString(),
      userId: teacher.id,
      userName: teacher.name,
      requestedAt: new Date().toLocaleString('ar-SA'),
      status: 'pending'
    };
    setResetRequests(prev => {
      if (prev.find(r => r.userId === userId)) return prev;
      return [newRequest, ...prev];
    });
    alert('تم إرسال طلب تصفير كلمة المرور للمشرفة.');
  };

  const handlePasswordChanged = (newPassword: string) => {
    if (auth.user) {
      setTeachers(prev => prev.map(t => 
        t.id === auth.user!.id ? { ...t, password: newPassword, mustChangePassword: false } : t
      ));
      setAuth(prev => ({ 
        ...prev, 
        user: prev.user ? { ...prev.user, mustChangePassword: false, password: newPassword } : null 
      }));
      setShowChangePassword(false);
      alert('تم تحديث كلمة المرور بنجاح');
    }
  };

  if (!auth.isAuthenticated) {
    return <LoginForm 
      onLogin={handleLogin} 
      teachers={teachers} 
      onForgotPassword={handleForgotPasswordRequest}
      onUpdateSupervisorConfig={(config) => setSupervisorConfig(prev => ({ ...prev, ...config }))}
      supervisorConfig={supervisorConfig}
      currentYear={currentAcademicYear}
      currentSemester={currentSemester}
    />;
  }

  if (showChangePassword) {
    return <ChangePasswordForm 
      onPasswordChanged={handlePasswordChanged} 
      onLogout={handleLogout} 
      currentPassword={auth.user?.password}
    />;
  }

  // Full-page layout for Supervisor
  if (auth.user?.role === UserRole.SUPERVISOR || auth.user?.role === UserRole.TEMP_SUPERVISOR) {
    return (
      <SupervisorDashboard 
        user={auth.user}
        teachers={teachers}
        posts={posts}
        projects={projects}
        lessonMaterials={lessonMaterials}
        resetRequests={resetRequests}
        messages={messages}
        onSendMessage={handleSendMessage}
        onMarkMessageAsRead={handleMarkMessageAsRead}
        onAddPost={(p) => setPosts(prev => [p, ...prev])}
        onDeletePost={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
        onTogglePinPost={(id) => setPosts(prev => prev.map(p => p.id === id ? { ...p, isPinned: !p.isPinned } : p))}
        onAddTeacher={(id, name, email, phone, assignments) => {
          setTeachers(prev => {
            if (prev.some(t => t.id === id)) {
              alert('عذراً، هذا الرقم الوظيفي مسجل مسبقاً');
              return prev;
            }
            const defaultPass = `OM${id}`;
            const newTeacher: User = { 
              id, 
              code: id, 
              name, 
              role: UserRole.TEACHER, 
              password: defaultPass, 
              mustChangePassword: true, 
              isActive: true, 
              joinedAt: currentAcademicYear, 
              email, 
              phoneNumber: phone,
              assignments,
              auditLogs: [{
                id: Date.now().toString(),
                userId: id,
                userName: name,
                action: 'تم إنشاء الحساب',
                timestamp: new Date().toISOString()
              }]
            };
            return [...prev, newTeacher];
          });
        }}
        onSoftDeleteTeacher={handleSoftDeleteTeacher}
        onRestoreTeacher={handleRestoreTeacher}
        onDeletePermanentlyTeacher={handleDeletePermanentlyTeacher}
        onUpdateTeacher={(originalId, updatedTeacher) => {
          setTeachers(prev => {
            const exists = prev.some(t => t.id === originalId);
            if (exists) {
              return prev.map(t => t.id === originalId ? updatedTeacher : t);
            } else {
              return [...prev, updatedTeacher];
            }
          });
          if (auth.user?.id === originalId) {
            setAuth(prev => ({ ...prev, user: updatedTeacher }));
          }
        }}
        onResetPassword={handleResetPassword}
        onAddProject={(p) => setProjects(prev => [p, ...prev])}
        onDeleteProject={(id) => setProjects(prev => prev.filter(p => p.id !== id))}
        onDeletePermanentlyProject={handleDeletePermanentlyProject}
        onUpdateProjectSubmission={(pid, sub) => {
           setProjects(prev => prev.map(p => p.id === pid ? { ...p, submissions: { ...p.submissions, [sub.teacherId]: sub } } : p));
        }}
        onAddTempSupervisor={(u) => setTeachers(prev => [...prev, u])}
        onDeleteTempSupervisor={handleDeleteTempSupervisor}
        onUpdateSecurity={(newConfig) => setSupervisorConfig(prev => ({ ...prev, ...newConfig }))}
        onUpdateLessonMaterial={handleUpdateLessonMaterial}
        onAddLessonMaterial={handleAddLessonMaterial}
        onSoftDeleteLesson={handleSoftDeleteLesson}
        onRestoreLesson={handleRestoreLesson}
        onDeletePermanentlyLesson={handleDeletePermanentlyLesson}
        onDeletePermanentlyPost={handleDeletePermanentlyPost}
        onAddNotification={handleAddNotification}
        notifications={notifications.filter(n => n.userId === auth.user?.id)}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onLogout={handleLogout}
        supervisorConfig={supervisorConfig}
        academicYear={currentAcademicYear}
        semester={currentSemester}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Tajawal'] antialiased">
      <nav className="bg-white/90 backdrop-blur-md text-slate-900 shadow-sm sticky top-0 z-[100] border-b border-slate-100 h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-gradient-to-tr from-emerald-600 to-teal-600 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-100">
                <span className="text-xl sm:text-2xl">📋</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-xl font-black tracking-tight text-slate-900 leading-none mb-1">{APP_TITLE}</span>
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  المجال الأول - {currentAcademicYear}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
              <div className="hidden sm:flex flex-col items-end text-left">
                <span className="text-sm font-black text-slate-800">{auth.user?.name}</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">
                  عضو هيئة التدريس
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all active:scale-95 border border-slate-100"
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <TeacherDashboard 
          user={auth.user!} 
          posts={posts}
          projects={projects}
          lessonMaterials={lessonMaterials}
          messages={messages}
          onSendMessage={handleSendMessage}
          onMarkMessageAsRead={handleMarkMessageAsRead}
          onAddMaterial={(m) => setLessonMaterials(prev => [{ ...m, status: 'pending', isModelLesson: false }, ...prev])}
          onUpdateMaterial={handleUpdateLessonMaterial}
          updateProjectSubmission={(pid, sub) => {
             setProjects(prev => prev.map(p => p.id === pid ? { ...p, submissions: { ...p.submissions, [sub.teacherId]: sub } } : p));
          }}
          currentYear={currentAcademicYear}
          semester={currentSemester}
          notifications={notifications.filter(n => n.userId === auth.user?.id)}
          onMarkAsRead={handleMarkNotificationAsRead}
        />
      </main>

      <footer className="py-8 text-center text-slate-400 text-[10px] font-bold border-t border-slate-100 mt-12 bg-white/50">
        جميع الحقوق محفوظة - {APP_TITLE} © {currentAcademicYear}
      </footer>
    </div>
  );
};

export default App;
