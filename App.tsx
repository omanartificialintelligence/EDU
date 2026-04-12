
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, User, AuthState, Project, Post, ResetRequest, LessonMaterial, LessonComment, SupervisorConfig, Notification, Message, Attachment } from './types';
import LoginForm from './components/LoginForm';
import TeacherDashboard from './components/TeacherDashboardV2';
import SupervisorDashboard from './components/SupervisorDashboard';
import ChangePasswordForm from './components/ChangePasswordForm';
import { db, handleFirestoreError, OperationType } from './src/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Shield } from 'lucide-react';
import ErrorBoundary from './src/components/ErrorBoundary';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  getDoc,
  Unsubscribe,
  or,
  limit
} from 'firebase/firestore';
import { auth as firebaseAuth, googleProvider, microsoftProvider } from './src/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider
} from 'firebase/auth';

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

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [isPasswordChangeRequired, setIsPasswordChangeRequired] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      console.log("Auth state changed, user:", user);
      
      if (user) {
        // إذا كان المستخدم مسجلاً، قم بجلب بياناته من Firestore
        if (user.email === "omanartificialintelligence@gmail.com") {
          const adminUser: User = {
            id: user.uid,
            name: user.displayName || 'المشرفة العامة',
            role: UserRole.SUPERVISOR,
            code: 'admin',
            isActive: true,
            joinedAt: '2026'
          };
          setAuth({ user: adminUser, isAuthenticated: true });
        } else {
          try {
            let userData: User | null = null;
            
            // 1. محاولة البحث بالبريد الإلكتروني
            const q = query(collection(db, 'users'), where('email', '==', user.email));
            const snap = await getDocs(q);
            
            if (!snap.empty) {
              userData = { ...snap.docs[0].data() as User, id: snap.docs[0].id };
            } else {
              // 2. محاولة البحث بالمعرف (ID) إذا كان البريد الإلكتروني يتبع النمط ID@moe.om أو ID@app.com
              const email = user.email || '';
              const emailParts = email.split('@');
              if (emailParts.length === 2 && (emailParts[1] === 'moe.om' || emailParts[1] === 'app.com')) {
                const userId = emailParts[0];
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                  userData = { ...userDoc.data() as User, id: userDoc.id };
                }
              }
            }

            if (userData) {
              if (userData.isActive) {
                setAuth({ user: userData, isAuthenticated: true });
              } else {
                console.warn('User account is inactive');
                setAuth({ user: null, isAuthenticated: false });
                await signOut(firebaseAuth);
                alert('عذراً، هذا الحساب غير نشط.');
              }
            } else {
              console.warn('User not found in database for email:', user.email);
              setAuth({ user: null, isAuthenticated: false });
              await signOut(firebaseAuth);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            setAuth({ user: null, isAuthenticated: false });
            await signOut(firebaseAuth);
          }
        }
      } else {
        setAuth({ user: null, isAuthenticated: false });
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!isAuthReady) return;

    let unsubs: Unsubscribe[] = [];

    // Public/Login-required listeners (for everyone including anonymous)
    const setupPublicListeners = () => {
      const unsubConfig = onSnapshot(doc(db, 'config', 'supervisor'), (docSnap) => {
        if (docSnap.exists()) {
          setSupervisorConfig(docSnap.data() as SupervisorConfig);
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, 'config/supervisor'));
      unsubs.push(unsubConfig);

      const unsubTeachers = onSnapshot(query(collection(db, 'users'), limit(200)), (snapshot) => {
        const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
        setTeachers(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
      unsubs.push(unsubTeachers);
      
      const unsubPosts = onSnapshot(query(collection(db, 'posts'), limit(50)), (snapshot) => {
        const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Post));
        setPosts(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'posts'));
      unsubs.push(unsubPosts);
    };

    // Private listeners (only for authenticated users with roles)
    const setupPrivateListeners = () => {
      const qLessons = query(
        collection(db, 'lessonMaterials'),
        where('academicYear', '==', currentAcademicYear),
        where('semester', '==', currentSemester),
        where('isArchived', '==', false)
      );

      const unsubLessons = onSnapshot(qLessons, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LessonMaterial));
        setLessonMaterials(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'lessonMaterials'));
      unsubs.push(unsubLessons);

      let qProjects;
      if (auth.user?.role === UserRole.SUPERVISOR || auth.user?.role === UserRole.TEMP_SUPERVISOR) {
        qProjects = query(collection(db, 'projects'), where('academicYear', '==', currentAcademicYear));
      } else {
        qProjects = query(
          collection(db, 'projects'), 
          where('academicYear', '==', currentAcademicYear),
          where('assignedTeacherIds', 'array-contains', auth.user?.id)
        );
      }

      const unsubProjects = onSnapshot(qProjects, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project));
        setProjects(list);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'projects'));
      unsubs.push(unsubProjects);

      const unsubNotifications = onSnapshot(
        query(collection(db, 'notifications'), where('userId', '==', auth.user?.id), limit(100)), 
        (snapshot) => {
          const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notification));
          setNotifications(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));
      unsubs.push(unsubNotifications);

      const qMessages = query(
        collection(db, 'messages'),
        or(
          where('recipientId', '==', 'ALL'),
          where('recipientId', '==', auth.user?.id),
          where('senderId', '==', auth.user?.id)
        ),
        limit(200)
      );

      const unsubMessages = onSnapshot(qMessages, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Message));
        setMessages(list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));
      unsubs.push(unsubMessages);

      if (auth.user?.role === UserRole.SUPERVISOR || auth.user?.role === UserRole.TEMP_SUPERVISOR) {
        const unsubReset = onSnapshot(collection(db, 'resetRequests'), (snapshot) => {
          const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ResetRequest));
          setResetRequests(list);
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'resetRequests'));
        unsubs.push(unsubReset);
      }
    };

    setupPublicListeners();
    if (auth.isAuthenticated) {
      setupPrivateListeners();
    }

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [isAuthReady, auth.isAuthenticated, auth.user?.role]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(firebaseAuth, provider);
      // حالة المصادقة سيتم تحديثها تلقائياً بواسطة onAuthStateChanged
    } catch (error) {
      console.error("Google login failed:", error);
      alert('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleSendMessage = async (text: string, recipientId: string = 'ALL', attachments: Attachment[] = []) => {
    if (auth.user) {
      const messageData: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        senderId: auth.user.id,
        senderName: auth.user.name,
        recipientId,
        text,
        attachments,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      try {
        const cleanMessage = { ...messageData } as any;
        Object.keys(cleanMessage).forEach(key => {
          if (cleanMessage[key] === undefined) delete cleanMessage[key];
        });
        await setDoc(doc(db, 'messages', messageData.id), cleanMessage);
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

  const handleCleanupOrphanedLessons = async () => {
    const teacherIds = new Set(teachers.map(t => t.id));
    const orphanedLessons = lessonMaterials.filter(m => !teacherIds.has(m.teacherId));
    
    if (orphanedLessons.length === 0) {
      alert('لا توجد دروس يتيمة لحذفها.');
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف ${orphanedLessons.length} درساً لمعلمات غير مسجلات؟`)) {
      try {
        for (const lesson of orphanedLessons) {
          await deleteDoc(doc(db, 'lessonMaterials', lesson.id));
        }
        alert(`تم حذف ${orphanedLessons.length} درساً بنجاح.`);
      } catch (error) {
        console.error("Error cleaning up orphaned lessons:", error);
        alert('حدث خطأ أثناء عملية التنظيف.');
      }
    }
  };

  const currentAcademicYear = supervisorConfig.academicYear || "2025-2026";
  const currentSemester = supervisorConfig.semester || "الفصل الدراسي الأول";

  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    // Automated archiving - Only run if authenticated as Supervisor
    if (!auth.isAuthenticated || (auth.user?.role !== UserRole.SUPERVISOR && auth.user?.role !== UserRole.TEMP_SUPERVISOR)) return;
    
    const currentYear = supervisorConfig.academicYear;
    const currentSemester = supervisorConfig.semester;
    
    if (currentYear && currentSemester) {
      const lessonsToArchive = lessonMaterials.filter(m => 
        (m.academicYear !== currentYear || m.semester !== currentSemester) && !m.isArchived
      );
      
      if (lessonsToArchive.length > 0) {
        console.log(`Archiving ${lessonsToArchive.length} lessons due to year/semester mismatch`);
        lessonsToArchive.forEach(async (m) => {
          try {
            await updateDoc(doc(db, 'lessonMaterials', m.id), { isArchived: true });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `lessonMaterials/${m.id}`);
          }
        });
      }

      const projectsToArchive = projects.filter(p => 
        (p.academicYear !== currentYear || p.semester !== currentSemester) && !p.isArchived
      );

      if (projectsToArchive.length > 0) {
        projectsToArchive.forEach(async (p) => {
          try {
            await updateDoc(doc(db, 'projects', p.id), { isArchived: true });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `projects/${p.id}`);
          }
        });
      }

      const postsToArchive = posts.filter(p => 
        (p.academicYear !== currentYear || p.semester !== currentSemester) && !p.isArchived
      );

      if (postsToArchive.length > 0) {
        postsToArchive.forEach(async (p) => {
          try {
            await updateDoc(doc(db, 'posts', p.id), { isArchived: true });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `posts/${p.id}`);
          }
        });
      }
    }
  }, [supervisorConfig, lessonMaterials, projects, posts]);

  const handleLogin = async (user: User) => {
    if (user.code === '16115506' && user.password === 'admin') {
      try {
        const email = `16115506@moe.om`;
        const firebasePassword = `admin`; // Using the requested password
        try {
          await signInWithEmailAndPassword(firebaseAuth, email, firebasePassword);
        } catch (signInError: any) {
          if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
            try {
              await createUserWithEmailAndPassword(firebaseAuth, email, firebasePassword);
            } catch (createError: any) {
              if (createError.code === 'auth/email-already-in-use') {
                // If email already in use, try to sign in one more time with the fixed password
                try {
                  await signInWithEmailAndPassword(firebaseAuth, email, firebasePassword);
                } catch (retrySignInError) {
                  const fallbackEmail = `16115506@app.com`;
                  try {
                    await signInWithEmailAndPassword(firebaseAuth, fallbackEmail, firebasePassword);
                  } catch (fallbackSignInError2: any) {
                    if (fallbackSignInError2.code === 'auth/user-not-found' || fallbackSignInError2.code === 'auth/invalid-credential') {
                      try {
                        await createUserWithEmailAndPassword(firebaseAuth, fallbackEmail, firebasePassword);
                      } catch (fallbackCreateError) {
                        throw fallbackCreateError;
                      }
                    } else {
                      throw fallbackSignInError2;
                    }
                  }
                }
              } else {
                throw createError;
              }
            }
          } else if (signInError.code === 'auth/operation-not-allowed') {
            alert("يرجى تفعيل المصادقة بكلمة المرور والبريد الإلكتروني (Email/Password Authentication) من لوحة تحكم Firebase.");
            return;
          } else {
            throw signInError;
          }
        }
      } catch (error: any) {
        console.error("Failed to sign in admin for setup:", error);
        if (error.code === 'auth/operation-not-allowed') {
          alert("يرجى تفعيل المصادقة بكلمة المرور والبريد الإلكتروني (Email/Password Authentication) من لوحة تحكم Firebase.");
        } else {
          alert("فشل تسجيل دخول المشرفة. يرجى التأكد من إعدادات Firebase.");
        }
        return;
      }
      setIsPasswordChangeRequired(true);
      return;
    }
    if (!user.isActive) {
      alert('عذراً، هذا الحساب غير نشط.');
      return;
    }

    // Ensure Firebase Auth session for custom login
    try {
      const email = `${user.id}@moe.om`;
      const firebasePassword = `SecurePass_${user.id}_2026!`; // Use a strong fixed password for Firebase Auth
      try {
        await signInWithEmailAndPassword(firebaseAuth, email, firebasePassword);
      } catch (signInError: any) {
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
          // Try with the user's actual password in case it was created with that previously
          try {
            await signInWithEmailAndPassword(firebaseAuth, email, user.password);
            // If successful, we should probably update it to the fixed password, but we need to be signed in to do that.
            // Since we are now signed in, we can update it.
            const currentUser = firebaseAuth.currentUser;
            if (currentUser) {
              const { updatePassword } = await import('firebase/auth');
              await updatePassword(currentUser, firebasePassword).catch(console.error);
            }
          } catch (fallbackSignInError: any) {
            // If both fail, try to create
            try {
              await createUserWithEmailAndPassword(firebaseAuth, email, firebasePassword);
              if (user.role === UserRole.SUPERVISOR || user.role === UserRole.TEMP_SUPERVISOR) {
                try {
                  await setDoc(doc(db, 'users', user.id), user);
                } catch (docError) {
                  console.error("Failed to create supervisor doc:", docError);
                }
              }
            } catch (createError: any) {
              if (createError.code === 'auth/email-already-in-use') {
                // If email already in use, try to sign in one more time with the fixed password
                try {
                  await signInWithEmailAndPassword(firebaseAuth, email, firebasePassword);
                } catch (retrySignInError) {
                  // Fallback to @app.com if the @moe.om account is completely out of sync
                  const fallbackEmail = `${user.id}@app.com`;
                  try {
                    await signInWithEmailAndPassword(firebaseAuth, fallbackEmail, firebasePassword);
                  } catch (fallbackSignInError2: any) {
                    if (fallbackSignInError2.code === 'auth/user-not-found' || fallbackSignInError2.code === 'auth/invalid-credential') {
                      try {
                        await createUserWithEmailAndPassword(firebaseAuth, fallbackEmail, firebasePassword);
                      } catch (fallbackCreateError) {
                        console.error("Fallback create failed:", fallbackCreateError);
                        alert("تعذر تسجيل الدخول للمصادقة. يرجى التواصل مع الدعم الفني لإعادة تعيين حسابك.");
                        return; // Stop login process
                      }
                    } else {
                      console.error("Fallback sign in failed:", fallbackSignInError2);
                      alert("تعذر تسجيل الدخول للمصادقة. يرجى التواصل مع الدعم الفني لإعادة تعيين حسابك.");
                      return; // Stop login process
                    }
                  }
                }
              } else if (createError.code === 'auth/too-many-requests') {
                console.warn("Too many requests, please wait.");
                return; // Stop login process
              } else if (createError.code === 'auth/operation-not-allowed') {
                alert("يرجى تفعيل المصادقة بكلمة المرور والبريد الإلكتروني (Email/Password Authentication) من لوحة تحكم Firebase.");
                return; // Stop login process
              } else {
                alert("فشل إنشاء حساب المصادقة. قد لا تعمل بعض الميزات بشكل صحيح.");
                return; // Stop login process
              }
            }
          }
        } else if (signInError.code === 'auth/too-many-requests') {
          console.warn("Too many requests, please wait.");
          return; // Stop login process
        } else if (signInError.code === 'auth/operation-not-allowed') {
          alert("يرجى تفعيل المصادقة بكلمة المرور والبريد الإلكتروني (Email/Password Authentication) من لوحة تحكم Firebase.");
          return; // Stop login process
        } else {
          console.error("Sign in failed:", signInError);
          alert("فشل تسجيل الدخول للمصادقة. قد لا تعمل بعض الميزات بشكل صحيح.");
          return; // Stop login process
        }
      }
    } catch (error) {
      console.warn("Firebase auth failed:", error);
      return; // Stop login process
    }

    setAuth({ user, isAuthenticated: true });
    if (user.role === UserRole.TEACHER && user.mustChangePassword) {
      setShowChangePassword(true);
    } else {
      setShowChangePassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.error("Error signing out of Firebase:", error);
    }
    setAuth({ user: null, isAuthenticated: false });
    setShowChangePassword(false);
  };

  const handleAddLessonMaterial = async (material: LessonMaterial) => {
    console.log("Attempting to save lesson:", material);
    try {
      const cleanMaterial = { ...material } as any;
      Object.keys(cleanMaterial).forEach(key => {
        if (cleanMaterial[key] === undefined) delete cleanMaterial[key];
      });
      await setDoc(doc(db, 'lessonMaterials', material.id), cleanMaterial);
      console.log("Lesson saved successfully:", material.id);
    } catch (error) {
      console.error("Error saving lesson:", error);
      handleFirestoreError(error, OperationType.WRITE, `lessonMaterials/${material.id}`);
    }
  };

  const handleUpdateLessonMaterial = async (updated: LessonMaterial) => {
    try {
      const cleanMaterial = { ...updated } as any;
      Object.keys(cleanMaterial).forEach(key => {
        if (cleanMaterial[key] === undefined) delete cleanMaterial[key];
      });
      await setDoc(doc(db, 'lessonMaterials', updated.id), cleanMaterial);
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
      const cleanNotification = { ...notification } as any;
      Object.keys(cleanNotification).forEach(key => {
        if (cleanNotification[key] === undefined) delete cleanNotification[key];
      });
      await setDoc(doc(db, 'notifications', notification.id), cleanNotification);
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
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: teacher.id,
      userName: teacher.name,
      requestedAt: new Date().toLocaleString('ar-SA'),
      status: 'pending'
    };
    try {
      const cleanRequest = { ...newRequest } as any;
      Object.keys(cleanRequest).forEach(key => {
        if (cleanRequest[key] === undefined) delete cleanRequest[key];
      });
      await setDoc(doc(db, 'resetRequests', newRequest.id), cleanRequest);
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

  const handleUpdateUserPreferences = async (preferences: any) => {
    if (auth.user) {
      try {
        await updateDoc(doc(db, 'users', auth.user.id), { preferences });
        setAuth(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, preferences } : null
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${auth.user.id}`);
      }
    }
  };

  const renderContent = () => {
    if (!isAuthReady) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-['Tajawal']">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 font-bold">جاري الاتصال بالنظام...</p>
          </div>
        </div>
      );
    }

    if (isPasswordChangeRequired) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Tajawal']" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 border border-slate-100"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-900">تغيير كلمة المرور</h2>
              <p className="text-slate-500 text-sm font-bold mt-2">يرجى تغيير كلمة المرور الافتراضية</p>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newPassword = formData.get('newPassword') as string;
                const confirmPassword = formData.get('confirmPassword') as string;

                if (newPassword !== confirmPassword) return alert('كلمات المرور غير متطابقة');
                if (newPassword.length < 8) return alert('يجب أن تكون كلمة المرور 8 أحرف على الأقل');

                try {
                  await setDoc(doc(db, 'config', 'supervisor'), {
                    ...supervisorConfig,
                    mainPassword: newPassword,
                    backupPassword: newPassword
                  });
                  setIsPasswordChangeRequired(false);
                  setAuth({ user: { id: '16115506', name: 'رحمه بنت حمد الشرجيه', role: UserRole.SUPERVISOR, code: '16115506', password: newPassword, isActive: true, joinedAt: '2026' }, isAuthenticated: true });
                  alert('تم تغيير كلمة المرور بنجاح');
                } catch (error) {
                  handleFirestoreError(error, OperationType.WRITE, 'config/supervisor');
                }
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">كلمة المرور الجديدة</label>
                <input name="newPassword" type="password" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">تأكيد كلمة المرور</label>
                <input name="confirmPassword" type="password" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">تغيير كلمة المرور والدخول</button>
            </form>
          </motion.div>
        </div>
      );
    }

    if (isFirstTimeSetup) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Tajawal']" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 border border-slate-100"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">إعداد المشرفة العامة</h2>
              <p className="text-slate-500 text-sm font-bold mt-2">يرجى إدخال بيانات المشرفة المسؤولة عن النظام</p>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const code = formData.get('code') as string;
                const password = formData.get('password') as string;

                if (!name || !code || !password) return alert('يرجى إكمال جميع الحقول');
                if (password.length < 8) return alert('يجب أن تكون كلمة المرور 8 أحرف على الأقل');

                const adminUser: User = {
                  id: code,
                  code: code,
                  name: name,
                  password: password,
                  role: UserRole.SUPERVISOR,
                  isActive: true,
                  joinedAt: currentAcademicYear
                };

                try {
                  await setDoc(doc(db, 'users', code), adminUser);
                  await setDoc(doc(db, 'config', 'supervisor'), {
                    ...supervisorConfig,
                    mainPassword: password,
                    backupPassword: password
                  });
                  setAuth({ user: adminUser, isAuthenticated: true });
                  setIsFirstTimeSetup(false);
                  alert('تم إعداد حساب المشرفة بنجاح');
                } catch (error) {
                  handleFirestoreError(error, OperationType.WRITE, 'users/admin');
                }
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">اسم المشرفة</label>
                <input name="name" type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all" placeholder="الاسم الكامل" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">الرقم الوظيفي (كود الدخول)</label>
                <input name="code" type="text" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all" placeholder="مثلاً: 12345" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">كلمة المرور الجديدة</label>
                <input name="password" type="password" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white font-bold text-sm outline-none transition-all" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">إتمام الإعداد والدخول</button>
            </form>
          </motion.div>
        </div>
      );
    }

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
      if (isPreviewMode) {
        return (
          <TeacherDashboard 
            user={auth.user} 
            posts={posts}
            projects={projects}
            lessonMaterials={lessonMaterials}
            messages={messages}
            onSendMessage={handleSendMessage}
            onMarkMessageAsRead={handleMarkMessageAsRead}
            onAddMaterial={onAddMaterial}
            onUpdateMaterial={onUpdateMaterial}
            updateProjectSubmission={updateProjectSubmission}
            currentYear={currentAcademicYear}
            semester={currentSemester}
            notifications={notifications.filter(n => n.userId === auth.user?.id)}
            onMarkAsRead={onMarkAsRead}
            onAddNotification={onAddNotification}
            onSwitchBackToSupervisorView={() => setIsPreviewMode(false)}
          />
        );
      }
      return (
        <SupervisorDashboard 
          user={auth.user}
          teachers={teachers}
          posts={posts}
          projects={projects}
          lessonMaterials={lessonMaterials}
          resetRequests={resetRequests}
          messages={messages}
          onUpdateUserPreferences={handleUpdateUserPreferences}
          onSendMessage={handleSendMessage}
          onMarkMessageAsRead={handleMarkMessageAsRead}
          onAddPost={onAddPost}
          onDeletePost={onDeletePost}
          onTogglePinPost={onTogglePinPost}
          onAddTeacher={onAddTeacher}
          onSoftDeleteTeacher={handleSoftDeleteTeacher}
          onRestoreTeacher={handleRestoreTeacher}
          onDeletePermanentlyTeacher={handleDeletePermanentlyTeacher}
          onUpdateTeacher={onUpdateTeacher}
          onResetPassword={handleResetPassword}
          onAddProject={onAddProject}
          onDeleteProject={onDeleteProject}
          onDeletePermanentlyProject={onDeletePermanentlyProject}
          onUpdateProjectSubmission={onUpdateProjectSubmission}
          onAddTempSupervisor={onAddTempSupervisor}
          onDeleteTempSupervisor={handleDeleteTempSupervisor}
          onUpdateSecurity={onUpdateSecurity}
          onUpdateLessonMaterial={handleUpdateLessonMaterial}
          onAddLessonMaterial={handleAddLessonMaterial}
          onSoftDeleteLesson={handleSoftDeleteLesson}
          onRestoreLesson={handleRestoreLesson}
          onDeletePermanentlyLesson={handleDeletePermanentlyLesson}
          onDeletePermanentlyPost={handleDeletePermanentlyPost}
          onAddNotification={handleAddNotification}
          onCleanupOrphanedLessons={handleCleanupOrphanedLessons}
          notifications={notifications.filter(n => n.userId === auth.user?.id)}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onLogout={handleLogout}
          supervisorConfig={supervisorConfig}
          academicYear={currentAcademicYear}
          semester={currentSemester}
          onSwitchToTeacherView={() => setIsPreviewMode(true)}
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
              const material = { ...m, status: 'pending', isModelLesson: false } as any;
              Object.keys(material).forEach(key => {
                if (material[key] === undefined) delete material[key];
              });
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
            onAddNotification={handleAddNotification}
          />
        </main>

        <footer className="py-8 text-center text-slate-400 text-[10px] font-bold border-t border-slate-100 mt-12 bg-white/50">
          جميع الحقوق محفوظة - {APP_TITLE} © {currentAcademicYear}
        </footer>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      {renderContent()}
    </ErrorBoundary>
  );
};

export default App;
