
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, User, AuthState, Project, Post, ResetRequest, LessonMaterial, LessonComment, SupervisorConfig, Notification, Message, Attachment } from './types';
import LoginForm from './components/LoginForm';
import TeacherDashboard from './components/TeacherDashboardV2';
import SupervisorDashboard from './components/SupervisorDashboard';
import ChangePasswordForm from './components/ChangePasswordForm';
import { db, handleFirestoreError, OperationType } from './src/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs
} from 'firebase/firestore';

const APP_TITLE = "منصة الإبداع للمجال الأول";

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [lessonMaterials, setLessonMaterials] = useState<LessonMaterial[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [supervisorConfig, setSupervisorConfig] = useState<SupervisorConfig>({ 
    mainPassword: 'admin', 
    backupPassword: 'admin', 
    academicYear: '2025-2026', 
    semester: 'الفصل الدراسي الأول',
    archiveYears: ['2024-2025', '2023-2024']
  });

  // Firestore Listeners
  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'config', 'supervisor'), (docSnap) => {
      if (docSnap.exists()) {
        setSupervisorConfig(docSnap.data() as SupervisorConfig);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'config/supervisor'));

    const unsubTeachers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as User);
      setTeachers(list);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubLessons = onSnapshot(collection(db, 'lessonMaterials'), (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as LessonMaterial);
      setLessonMaterials(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'lessonMaterials'));

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as Project);
      setProjects(list);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'projects'));

    const unsubPosts = onSnapshot(collection(db, 'posts'), (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as Post);
      setPosts(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'posts'));

    const unsubReset = onSnapshot(collection(db, 'resetRequests'), (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as ResetRequest);
      setResetRequests(list);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'resetRequests'));

    const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as Notification);
      setNotifications(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));

    const unsubMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data() as Message);
      setMessages(list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));

    return () => {
      unsubConfig();
      unsubTeachers();
      unsubLessons();
      unsubProjects();
      unsubPosts();
      unsubReset();
      unsubNotifications();
      unsubMessages();
    };
  }, []);

  const handleSendMessage = async (text: string, recipientId: string = 'ALL', attachments: Attachment[] = []) => {
    if (auth.user) {
      const messageData: Message = {
        id: Date.now().toString(),
        senderId: auth.user.id,
        senderName: auth.user.name,
        recipientId,
        text,
        attachments,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      try {
        await setDoc(doc(db, 'messages', messageData.id), messageData);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `messages/${messageData.id}`);
      }
    }
  };

  const handleMarkMessageAsRead = async (messageId: string) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `messages/${messageId}`);
    }
  };

  const currentAcademicYear = supervisorConfig.academicYear || "2025-2026";
  const currentSemester = supervisorConfig.semester || "الفصل الأول";

  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    // Automated archiving
    const currentYear = supervisorConfig.academicYear;
    const currentSemester = supervisorConfig.semester;
    
    if (currentYear && currentSemester) {
      lessonMaterials.forEach(async (m) => {
        if ((m.academicYear !== currentYear || m.semester !== currentSemester) && !m.isArchived) {
          try {
            await updateDoc(doc(db, 'lessonMaterials', m.id), { isArchived: true });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `lessonMaterials/${m.id}`);
          }
        }
      });
      projects.forEach(async (p) => {
        if ((p.academicYear !== currentYear || p.semester !== currentSemester) && !p.isArchived) {
          try {
            await updateDoc(doc(db, 'projects', p.id), { isArchived: true });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `projects/${p.id}`);
          }
        }
      });
      posts.forEach(async (p) => {
        if ((p.academicYear !== currentYear || p.semester !== currentSemester) && !p.isArchived) {
          try {
            await updateDoc(doc(db, 'posts', p.id), { isArchived: true });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `posts/${p.id}`);
          }
        }
      });
    }
  }, [supervisorConfig, lessonMaterials, projects, posts]);

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

  const handleAddLessonMaterial = async (material: LessonMaterial) => {
    try {
      await setDoc(doc(db, 'lessonMaterials', material.id), material);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `lessonMaterials/${material.id}`);
    }
  };

  const handleUpdateLessonMaterial = async (updated: LessonMaterial) => {
    try {
      await setDoc(doc(db, 'lessonMaterials', updated.id), updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `lessonMaterials/${updated.id}`);
    }
  };

  const handleSoftDeleteLesson = async (id: string) => {
    try {
      await updateDoc(doc(db, 'lessonMaterials', id), { isActive: false });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `lessonMaterials/${id}`);
    }
  };

  const handleDeletePermanentlyLesson = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'lessonMaterials', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `lessonMaterials/${id}`);
    }
  };

  const handleRestoreLesson = async (id: string) => {
    try {
      await updateDoc(doc(db, 'lessonMaterials', id), { isActive: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `lessonMaterials/${id}`);
    }
  };

  const handleAddNotification = async (notification: Notification) => {
    try {
      await setDoc(doc(db, 'notifications', notification.id), notification);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `notifications/${notification.id}`);
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const handleSoftDeleteTeacher = async (id: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { isActive: false });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const handleDeleteTempSupervisor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  };

  const handleRestoreTeacher = async (id: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { isActive: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const handleDeletePermanentlyTeacher = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  };

  const handleDeletePermanentlyProject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
    }
  };

  const handleDeletePermanentlyPost = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'posts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${id}`);
    }
  };

  const handleResetPassword = async (id: string) => {
    const randomPass = Math.random().toString(36).substring(2, 10);
    try {
      await updateDoc(doc(db, 'users', id), { password: randomPass, mustChangePassword: true });
      // Clear the request
      const q = query(collection(db, 'resetRequests'), where('userId', '==', id));
      const snap = await getDocs(q);
      snap.forEach(async (d) => await deleteDoc(d.ref));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
    return randomPass;
  };

  const handleForgotPasswordRequest = async (userId: string) => {
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
    try {
      await setDoc(doc(db, 'resetRequests', newRequest.id), newRequest);
      alert('تم إرسال طلب تصفير كلمة المرور للمشرفة.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `resetRequests/${newRequest.id}`);
    }
  };

  const handlePasswordChanged = async (newPassword: string) => {
    if (auth.user) {
      try {
        await updateDoc(doc(db, 'users', auth.user.id), { password: newPassword, mustChangePassword: false });
        setAuth(prev => ({ 
          ...prev, 
          user: prev.user ? { ...prev.user, mustChangePassword: false, password: newPassword } : null 
        }));
        setShowChangePassword(false);
        alert('تم تحديث كلمة المرور بنجاح');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${auth.user.id}`);
      }
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
        onAddPost={async (p) => {
          try {
            await setDoc(doc(db, 'posts', p.id), p);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `posts/${p.id}`);
          }
        }}
        onDeletePost={async (id) => {
          try {
            await deleteDoc(doc(db, 'posts', id));
          } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `posts/${id}`);
          }
        }}
        onTogglePinPost={async (id) => {
          const post = posts.find(p => p.id === id);
          if (post) {
            try {
              await updateDoc(doc(db, 'posts', id), { isPinned: !post.isPinned });
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
            }
          }
        }}
        onAddTeacher={async (id, name, email, phone, assignments) => {
          if (teachers.some(t => t.id === id)) {
            alert('عذراً، هذا الرقم الوظيفي مسجل مسبقاً');
            return;
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
          try {
            await setDoc(doc(db, 'users', id), newTeacher);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${id}`);
          }
        }}
        onSoftDeleteTeacher={handleSoftDeleteTeacher}
        onRestoreTeacher={handleRestoreTeacher}
        onDeletePermanentlyTeacher={handleDeletePermanentlyTeacher}
        onUpdateTeacher={async (originalId, updatedTeacher) => {
          try {
            await setDoc(doc(db, 'users', originalId), updatedTeacher);
            if (auth.user?.id === originalId) {
              setAuth(prev => ({ ...prev, user: updatedTeacher }));
            }
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${originalId}`);
          }
        }}
        onResetPassword={handleResetPassword}
        onAddProject={async (p) => {
          try {
            await setDoc(doc(db, 'projects', p.id), p);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `projects/${p.id}`);
          }
        }}
        onDeleteProject={async (id) => {
          try {
            await deleteDoc(doc(db, 'projects', id));
          } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
          }
        }}
        onDeletePermanentlyProject={handleDeletePermanentlyProject}
        onUpdateProjectSubmission={async (pid, sub) => {
          try {
            const project = projects.find(p => p.id === pid);
            if (project) {
              await updateDoc(doc(db, 'projects', pid), {
                [`submissions.${sub.teacherId}`]: sub
              });
            }
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `projects/${pid}`);
          }
        }}
        onAddTempSupervisor={async (u) => {
          try {
            await setDoc(doc(db, 'users', u.id), u);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${u.id}`);
          }
        }}
        onDeleteTempSupervisor={handleDeleteTempSupervisor}
        onUpdateSecurity={async (newConfig) => {
          try {
            await setDoc(doc(db, 'config', 'supervisor'), { ...supervisorConfig, ...newConfig });
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, 'config/supervisor');
          }
        }}
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
          onAddMaterial={async (m) => {
            const material = { ...m, status: 'pending', isModelLesson: false };
            try {
              await setDoc(doc(db, 'lessonMaterials', material.id), material);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `lessonMaterials/${material.id}`);
            }
          }}
          onUpdateMaterial={handleUpdateLessonMaterial}
          updateProjectSubmission={async (pid, sub) => {
            try {
              const project = projects.find(p => p.id === pid);
              if (project) {
                await updateDoc(doc(db, 'projects', pid), {
                  [`submissions.${sub.teacherId}`]: sub
                });
              }
            } catch (error) {
              handleFirestoreError(error, OperationType.UPDATE, `projects/${pid}`);
            }
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
