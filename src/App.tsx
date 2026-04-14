import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  writeBatch, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { Student, Seat, AppSettings } from './types';
import { INITIAL_STUDENTS, TEACHER_EMAIL, TEACHER_PASSWORD } from './constants';
import { firestoreService } from './lib/firestore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { Loader2, LogOut, User as UserIcon, Settings, Users, Grid } from 'lucide-react';
import StudentView from './components/StudentView';
import TeacherView from './components/TeacherView';
import { Button } from './components/ui/button';
import { Label } from './components/ui/label';
import { Input } from './components/ui/input';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isCustomAuth, setIsCustomAuth] = useState(false);
  const isCustomAuthRef = React.useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (isCustomAuthRef.current) return; // Skip if we are using custom auth
      
      setUser(user);
      if (user) {
        // 1. Check if student profile exists by UID
        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (studentDoc.exists()) {
          setStudentProfile({ id: studentDoc.id, ...studentDoc.data() } as Student);
        } else {
          // 2. Check if a student with this email already exists (from initialization)
          const q = await getDocs(collection(db, 'students'));
          const existingStudentDoc = q.docs.find(d => d.data().email?.toLowerCase() === user.email?.toLowerCase());
          
          if (existingStudentDoc) {
            // Migrate existing student to use user.uid
            const data = existingStudentDoc.data() as Student;
            const newStudent: Student = {
              ...data,
              id: user.uid,
              role: data.role || 'student'
            };
            
            const batch = writeBatch(db);
            batch.set(doc(db, 'students', user.uid), newStudent);
            
            // If they already have a seat, update the seat document to point to the new UID
            if (data.seatId) {
              batch.update(doc(db, 'seats', data.seatId), { studentId: user.uid });
            }
            
            // Only delete if it's one of the auto-generated IDs
            if (existingStudentDoc.id.startsWith('student_')) {
              batch.delete(doc(db, 'students', existingStudentDoc.id));
            }
            await batch.commit();
            setStudentProfile(newStudent);
          } else if (user.email === TEACHER_EMAIL || user.email === 'ledinhmannct2026@gmail.com' || user.email === 'ldman87@gmail.com') {
            // Admin role
            const adminProfile: Student = {
              id: user.uid,
              stt: 0,
              name: "Giáo viên",
              dob: "",
              gender: "Nam",
              group: "Admin",
              address: "",
              email: user.email!,
              seatId: null,
              isNearsighted: false,
              role: 'admin'
            };
            await setDoc(doc(db, 'students', user.uid), adminProfile);
            setStudentProfile(adminProfile);
          } else {
            toast.error("Email không có trong danh sách lớp.");
            await signOut(auth);
          }
        }
      } else {
        setStudentProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Keep studentProfile in sync with real-time students collection
  useEffect(() => {
    if (user && students.length > 0) {
      const currentProfile = students.find(s => s.id === user.uid);
      if (currentProfile) {
        setStudentProfile(currentProfile);
      }
    }
  }, [students, user]);

  useEffect(() => {
    if (!user) return;

    const unsubStudents = firestoreService.subscribeCollection<Student>('students', setStudents);
    const unsubSeats = firestoreService.subscribeCollection<Seat>('seats', setSeats);
    
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      console.log("Settings snapshot received:", snapshot.exists(), snapshot.data());
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      } else {
        console.log("Initializing global settings...");
        // Initialize settings if not exists
        setDoc(doc(db, 'settings', 'global'), {
          mode: 'student-random',
          lastReset: new Date().toISOString()
        });
      }
    });

    return () => {
      unsubStudents();
      unsubSeats();
      unsubSettings();
    };
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
      toast.error("Đăng nhập thất bại");
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password.trim();

    if (!email || !password) {
      toast.error("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    const toastId = toast.loading("Đang đăng nhập...");
    console.log("Attempting local login for:", email);

    try {
      // 1. Check local admin fallback
      if (email === TEACHER_EMAIL.toLowerCase() && password === TEACHER_PASSWORD) {
        const mockAdmin: Student = {
          id: 'admin_fallback',
          stt: 0,
          name: "Giáo viên (Local)",
          dob: "",
          gender: "Nam",
          group: "Admin",
          address: "",
          email: TEACHER_EMAIL,
          seatId: null,
          isNearsighted: false,
          role: 'admin'
        };
        setStudentProfile(mockAdmin);
        setIsCustomAuth(true);
        isCustomAuthRef.current = true;
        setUser({ email: TEACHER_EMAIL, uid: 'admin_fallback' } as any);
        toast.success("Đăng nhập Giáo viên thành công!");
        setShowEmailLogin(false);
        return;
      }

      // 2. Check students in Firestore (Local Auth)
      try {
        const q = await getDocs(collection(db, 'students'));
        
        if (q.empty) {
          console.warn("Students collection is empty.");
          toast.error("Cơ sở dữ liệu trống. Vui lòng liên hệ Giáo viên để 'Khởi tạo' dữ liệu.");
          return;
        }

        const studentDoc = q.docs.find(d => {
          const data = d.data();
          return data.email?.toLowerCase() === email && data.password === password;
        });

        if (studentDoc) {
          const data = studentDoc.data() as Student;
          setStudentProfile({ ...data, id: studentDoc.id });
          setIsCustomAuth(true);
          isCustomAuthRef.current = true;
          setUser({ email: data.email, uid: studentDoc.id } as any);
          toast.success(`Chào mừng ${data.name}!`);
          setShowEmailLogin(false);
          return;
        } else {
          console.log("No student found matching credentials in Firestore.");
          // Check if email exists but password wrong
          const emailExists = q.docs.some(d => d.data().email?.toLowerCase() === email);
          if (emailExists) {
            toast.error("Sai mật khẩu. Mật khẩu mặc định là 123.");
            return;
          }
        }
      } catch (fetchError) {
        console.error("Local auth fetch error:", fetchError);
      }

      // 3. Try Firebase Auth as last resort
      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Đăng nhập thành công!");
        setShowEmailLogin(false);
      } catch (fbError: any) {
        console.error("Firebase Auth Error:", fbError);
        if (fbError.code === 'auth/operation-not-allowed' || fbError.code === 'auth/invalid-credential' || fbError.code === 'auth/user-not-found' || fbError.code === 'auth/wrong-password' || fbError.code === 'auth/invalid-email') {
          toast.error("Tài khoản không tồn tại hoặc sai mật khẩu.");
        } else {
          toast.error("Đăng nhập thất bại. Vui lòng kiểm tra lại.");
        }
      }
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleLogout = async () => {
    if (isCustomAuth) {
      setIsCustomAuth(false);
      isCustomAuthRef.current = false;
      setUser(null);
      setStudentProfile(null);
    } else {
      await signOut(auth);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-teal-50">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-teal-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-teal-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sơ đồ lớp học</h1>
          <p className="text-gray-500 mb-8">Vui lòng đăng nhập để tiếp tục</p>
          
          {!showEmailLogin ? (
            <div className="space-y-4">
              <div className="text-left space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Dành cho Học sinh</Label>
                <Button 
                  onClick={handleGoogleLogin}
                  className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-12 text-lg font-medium"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 mr-2" alt="Google" />
                  Đăng nhập bằng Google
                </Button>
                <p className="text-[10px] text-gray-400 text-center italic">Sử dụng Email đã đăng ký trong danh sách lớp</p>
              </div>
              
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">Hoặc</span>
                </div>
              </div>

              <div className="text-left space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Sử dụng Tài khoản & Mật khẩu</Label>
                <Button 
                  onClick={() => setShowEmailLogin(true)}
                  className="w-full bg-teal-600 text-white hover:bg-teal-700 h-12 text-lg font-medium"
                >
                  Đăng nhập Email/Mật khẩu
                </Button>
                <p className="text-[10px] text-gray-400 text-center italic">Mật khẩu mặc định cho học sinh là: 123</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input 
                  id="login-email" 
                  type="email" 
                  placeholder="name@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mật khẩu</Label>
                <Input 
                  id="login-password" 
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
              <Button 
                onClick={handleTeacherLogin}
                className="w-full bg-teal-600 text-white hover:bg-teal-700 h-12 text-lg font-medium mt-4"
              >
                Đăng nhập
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setShowEmailLogin(false)}
                className="w-full text-gray-500"
              >
                Quay lại
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Grid className="w-6 h-6 text-teal-600" />
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">Quản lý Chỗ ngồi</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                <UserIcon className="w-4 h-4" />
                <span className="font-medium truncate max-w-[150px]">{studentProfile?.name || user.email}</span>
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full uppercase font-bold">
                  {studentProfile?.role === 'admin' ? 'GV' : 'HS'}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {studentProfile?.role === 'admin' ? (
            <TeacherView 
              students={students} 
              seats={seats} 
              settings={settings} 
              currentUser={studentProfile}
            />
          ) : (
            <StudentView 
              student={studentProfile!} 
              students={students} 
              seats={seats} 
              settings={settings} 
            />
          )}
        </main>
        <Toaster position="top-center" richColors />
      </div>
    </ErrorBoundary>
  );
}
