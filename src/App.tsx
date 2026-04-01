/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LogOut, 
  Users, 
  LayoutGrid, 
  Shuffle, 
  RotateCcw, 
  Edit2, 
  Save, 
  X, 
  User, 
  Lock, 
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Monitor,
  Download,
  FileText,
  Image as ImageIcon,
  UserRound,
  UserRoundPlus,
  Plus,
  Key,
  ZoomIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import domtoimage from 'dom-to-image-more';
import jsPDF from 'jspdf';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Student, Seat, UserRole, AuthState } from './types';
import { INITIAL_STUDENTS, TEACHER_CREDENTIALS } from './constants';
import { cn } from './lib/utils';

// --- Utils ---
const getFirstName = (fullName: string) => {
  const parts = fullName.trim().split(' ');
  return parts[parts.length - 1];
};

const getDisplayName = (student: Student, allStudents: Student[]) => {
  const firstName = getFirstName(student.name);
  const duplicates = allStudents.filter(s => s.id !== student.id && getFirstName(s.name) === firstName);
  
  if (duplicates.length > 0) {
    const parts = student.name.trim().split(' ');
    if (parts.length >= 2) {
      // Return "Middle First"
      return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
    }
  }
  return firstName;
};

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// --- Components ---

interface SortableSeatProps {
  seat: Seat;
  student: Student | null;
  isTeacher: boolean;
  isCurrentStudent?: boolean;
  onAssign?: (seatId: number) => void;
  allStudents: Student[];
}

const SortableSeat: React.FC<SortableSeatProps & { isPrinting?: boolean }> = ({ 
  seat, 
  student, 
  isTeacher, 
  isCurrentStudent,
  onAssign,
  allStudents,
  isPrinting
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: seat.id.toString(),
    disabled: !isTeacher || !student
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const groupColors = [
    'from-teal-400 to-teal-600 border-teal-700 text-white',
    'from-blue-400 to-blue-600 border-blue-700 text-white',
    'from-purple-400 to-purple-600 border-purple-700 text-white',
    'from-amber-400 to-amber-600 border-amber-700 text-white',
    'from-rose-400 to-rose-600 border-rose-700 text-white',
  ];

  const colorClass = student 
    ? groupColors[(student.group - 1) % groupColors.length] 
    : 'from-gray-100 to-gray-200 border-gray-300 text-gray-400';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !student && isTeacher && onAssign?.(seat.id)}
      className={cn(
        "relative group h-24 w-full rounded-xl border-b-4 transition-all duration-300 flex flex-col items-center justify-center p-2 text-center cursor-default",
        "bg-gradient-to-br shadow-[0_8px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1",
        colorClass,
        isDragging ? "opacity-0" : "hover:scale-[1.02]",
        isCurrentStudent && "ring-4 ring-yellow-400 ring-offset-2 scale-105 z-10",
        !student && isTeacher && "cursor-pointer hover:border-teal-500 hover:from-teal-50 to-teal-100",
        !student && "border-dashed"
      )}
      title={student ? `Tổ ${student.group}` : isTeacher ? "Nhấn để xếp học sinh" : "Ghế trống"}
    >
      {!isPrinting && (
        <div className="absolute -top-2 -left-2 bg-teal-600 border-2 border-white rounded-full w-7 h-7 flex items-center justify-center text-[11px] font-black text-white shadow-md z-20">
          {seat.id}
        </div>
      )}
      
      {student ? (
        <div className="flex flex-col items-center">
          {!isPrinting && (
            <div className="mb-1">
              {student.gender === 'Nam' ? (
                <UserRound size={20} className="text-white/80" />
              ) : (
                <UserRound size={20} className="text-white/80" />
              )}
            </div>
          )}
          <span className={cn(
            "font-black leading-tight tracking-tight text-center",
            isPrinting ? "text-[20px]" : "text-[17px] drop-shadow-lg"
          )}>
            {getDisplayName(student, allStudents)}
          </span>
          {!isPrinting && (
            <>
              <span className="text-[9px] mt-0.5 opacity-80 uppercase font-bold tracking-wider">Tổ {student.group}</span>
              {student.isNearsighted && (
                <div className="absolute top-1 right-1 bg-white/20 backdrop-blur-sm p-0.5 rounded-full" title="Cận thị">
                  <Eye size={10} className="text-white" />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center opacity-40">
          {isTeacher ? <Plus size={20} /> : <div className="h-5" />}
          <span className="text-[10px] font-bold uppercase mt-1">{isTeacher ? "Xếp chỗ" : "Trống"}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  // --- State ---
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('class_students_v7');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [seats, setSeats] = useState<Seat[]>(() => {
    const saved = localStorage.getItem('class_seats_v7');
    if (saved) return JSON.parse(saved);
    
    // Default layout: 8 columns
    // Col 1: 5 seats, Col 8: 5 seats, Col 2-7: 4 seats each
    // Numbering horizontally: Row 1 (1-8), Row 2 (9-16), Row 3 (17-24), Row 4 (25-32), Row 5 (33, 34)
    const initialSeats: Seat[] = [];
    
    // Row 1-4: 8 seats each
    let seatId = 1;
    for (let row = 1; row <= 4; row++) {
      for (let col = 1; col <= 8; col++) {
        initialSeats.push({ id: seatId++, studentId: null, row, column: col });
      }
    }
    // Row 5: 2 seats (Col 1 and Col 8)
    initialSeats.push({ id: seatId++, studentId: null, row: 5, column: 1 });
    initialSeats.push({ id: seatId++, studentId: null, row: 5, column: 8 });

    return initialSeats;
  });

  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('class_auth_v7');
    return saved ? JSON.parse(saved) : { user: null, role: null };
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<'chart' | 'list' | 'stats'>('chart');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isNearsighted, setIsNearsighted] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);
  const [assigningToSeat, setAssigningToSeat] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('class_students_v7', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('class_seats_v7', JSON.stringify(seats));
  }, [seats]);

  useEffect(() => {
    localStorage.setItem('class_auth_v7', JSON.stringify(auth));
  }, [auth]);

  // --- Sensors for DND ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // Teacher check
    if (loginEmail === TEACHER_CREDENTIALS.email && loginPassword === TEACHER_CREDENTIALS.password) {
      setAuth({ user: { email: loginEmail, role: 'teacher' }, role: 'teacher' });
      return;
    }

    // Student check
    const student = students.find(s => s.email === loginEmail && s.password === loginPassword);
    if (student) {
      setAuth({ user: student, role: 'student' });
      setIsNearsighted(!!student.isNearsighted);
      return;
    }

    setLoginError('Email hoặc mật khẩu không chính xác.');
  };

  const handleLogout = () => {
    setAuth({ user: null, role: null });
    setLoginEmail('');
    setLoginPassword('');
    setAssignmentMessage(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      setSeats((items) => {
        const oldIndex = items.findIndex((i) => i.id.toString() === active.id);
        const newIndex = items.findIndex((i) => i.id.toString() === over.id);
        
        // Swap or move
        const newSeats = [...items];
        const temp = newSeats[oldIndex].studentId;
        newSeats[oldIndex].studentId = newSeats[newIndex].studentId;
        newSeats[newIndex].studentId = temp;
        return newSeats;
      });
    }
  };

  const shuffleSeats = () => {
    const studentIds = seats.map(s => s.studentId).filter(id => id !== null) as string[];
    if (studentIds.length === 0) return;
    const shuffledIds = [...studentIds].sort(() => Math.random() - 0.5);
    
    setSeats(prev => {
      const newSeats = [...prev];
      let idIdx = 0;
      newSeats.forEach(s => {
        if (s.studentId !== null) {
          s.studentId = shuffledIds[idIdx++];
        }
      });
      return newSeats;
    });
  };

  const resetSeats = () => {
    setSeats(prev => {
      const newSeats = [...prev];
      newSeats.forEach(s => s.studentId = null);
      return newSeats;
    });
  };

  const generateAllPasswords = () => {
    setStudents(prev => prev.map(s => ({ ...s, password: generateRandomPassword() })));
    setAssignmentMessage("Đã tạo mật khẩu ngẫu nhiên cho toàn bộ học sinh!");
  };

  const handleManualAssign = (studentId: string) => {
    if (assigningToSeat === null) return;
    
    setSeats(prev => {
      const newSeats = [...prev];
      const targetIdx = newSeats.findIndex(s => s.id === assigningToSeat);
      
      // If student already has a seat, remove it from there
      const oldIdx = newSeats.findIndex(s => s.studentId === studentId);
      if (oldIdx !== -1) {
        newSeats[oldIdx].studentId = null;
      }
      
      newSeats[targetIdx].studentId = studentId;
      return newSeats;
    });
    
    setAssigningToSeat(null);
  };

  const downloadAsImage = async () => {
    const unassignedCount = stats.unassigned.length;
    if (unassignedCount > 0) {
      setAssignmentMessage(`Vui lòng sắp xếp chỗ ngồi cho ${unassignedCount} học sinh còn thiếu trước khi tải sơ đồ.`);
      return;
    }

    setIsDownloading(true);
    setIsPrinting(true);
    const currentView = view;
    if (view !== 'chart') setView('chart');
    
    // Wait for view to switch and for printing styles to apply
    setTimeout(async () => {
      const element = document.getElementById('seating-chart-capture');
      if (!element) {
        setIsDownloading(false);
        setIsPrinting(false);
        return;
      }
      
      try {
        // dom-to-image-more handles modern CSS like oklch better than html2canvas
        // We use a slightly larger width and height to ensure nothing is cut off
        const dataUrl = await domtoimage.toPng(element, {
          bgcolor: '#ffffff',
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
            margin: '0',
            padding: '60px',
            width: '1300px',
            height: 'auto'
          },
          width: 1300,
          height: element.scrollHeight + 120,
          quality: 1.0
        });
        
        const link = document.createElement('a');
        link.download = `so-do-cho-ngoi-10A7-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.png`;
        link.href = dataUrl;
        link.click();
        
        if (currentView !== 'chart') setView(currentView);
      } catch (err) {
        console.error("Error generating image:", err);
        setAssignmentMessage("Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại.");
      } finally {
        setIsDownloading(false);
        setIsPrinting(false);
      }
    }, 1000);
  };

  const downloadAsPDF = async () => {
    const unassignedCount = stats.unassigned.length;
    if (unassignedCount > 0) {
      setAssignmentMessage(`Vui lòng sắp xếp chỗ ngồi cho ${unassignedCount} học sinh còn thiếu trước khi tải sơ đồ.`);
      return;
    }

    setIsDownloading(true);
    setIsPrinting(true);
    const currentView = view;
    if (view !== 'chart') setView('chart');

    setTimeout(async () => {
      const element = document.getElementById('seating-chart-capture');
      if (!element) {
        setIsDownloading(false);
        setIsPrinting(false);
        return;
      }
      
      try {
        const width = 1300;
        const height = element.scrollHeight + 120;

        const dataUrl = await domtoimage.toPng(element, {
          bgcolor: '#ffffff',
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
            margin: '0',
            padding: '60px',
            width: `${width}px`,
            height: 'auto'
          },
          width: width,
          height: height,
          quality: 1.0
        });
        
        const pdf = new jsPDF({
          orientation: width > height ? 'l' : 'p',
          unit: 'px',
          format: [width, height]
        });
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
        pdf.save(`so-do-cho-ngoi-10A7-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.pdf`);
        
        if (currentView !== 'chart') setView(currentView);
      } catch (err) {
        console.error("Error generating PDF:", err);
        setAssignmentMessage("Có lỗi xảy ra khi tạo PDF. Vui lòng thử lại.");
      } finally {
        setIsDownloading(false);
        setIsPrinting(false);
      }
    }, 1000);
  };

  const handleRandomSeatForStudent = () => {
    if (auth.role !== 'student' || !auth.user) return;
    const studentId = (auth.user as Student).id;
    
    // Check if already has a seat
    const currentSeat = seats.find(s => s.studentId === studentId);
    
    if (currentSeat) {
      setAssignmentMessage("Bạn đã có chỗ ngồi. Mỗi học sinh chỉ được chọn chỗ một lần duy nhất.");
      return;
    }
    
    // Available seats (empty ones)
    let availableSeats = seats.filter(s => s.studentId === null);

    // If nearsighted, only rows 1-2
    if (isNearsighted) {
      availableSeats = availableSeats.filter(s => s.row <= 2);
    }

    if (availableSeats.length === 0) {
      setAssignmentMessage("Không còn chỗ trống phù hợp với yêu cầu của bạn.");
      return;
    }

    const randomTargetSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
    
    setSeats(prev => {
      const newSeats = [...prev];
      const targetIdx = newSeats.findIndex(s => s.id === randomTargetSeat.id);
      
      // If student already had a seat, clear it
      if (currentSeat) {
        const oldIdx = newSeats.findIndex(s => s.id === currentSeat.id);
        newSeats[oldIdx].studentId = null;
      }
      
      newSeats[targetIdx].studentId = studentId;
      return newSeats;
    });

    // Update nearsighted status in student list
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, isNearsighted } : s));
    
    setAssignmentMessage(`Chúc mừng! Bạn đã chọn được chỗ ngồi số ${randomTargetSeat.id} (Hàng ${randomTargetSeat.row}, Cột ${randomTargetSeat.column}).`);
  };

  const updateStudent = (id: string, email: string, pass: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, email, password: pass } : s));
    setEditingStudent(null);
  };

  // --- Stats Helpers ---
  const stats = useMemo(() => {
    const assignedIds = new Set(seats.map(s => s.studentId).filter(id => id !== null));
    const assigned = students.filter(s => assignedIds.has(s.id));
    const unassigned = students.filter(s => !assignedIds.has(s.id));
    return { assigned, unassigned };
  }, [seats, students]);

  // --- Render Helpers ---
  if (!auth.role) {
    return (
      <div className="min-h-screen bg-teal-50 flex items-center justify-center p-4 font-['Inter']">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="bg-teal-600 p-8 text-white text-center">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Monitor size={32} />
            </div>
            <h1 className="text-2xl font-bold">ClassSeat</h1>
            <p className="text-teal-100 text-sm mt-1">Hệ thống quản lý chỗ ngồi thông minh</p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  placeholder="Email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Mật khẩu"
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-rose-500 text-sm bg-rose-50 p-3 rounded-lg"
              >
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </motion.div>
            )}

            <button 
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-200 transition-all active:scale-95"
            >
              Đăng nhập
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const isTeacher = auth.role === 'teacher';
  const currentStudent = auth.role === 'student' ? (auth.user as Student) : null;

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter'] pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-2 rounded-lg text-white">
              <Monitor size={20} />
            </div>
            <span className="font-bold text-xl text-gray-800 hidden sm:inline">ClassSeat</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-teal-50 rounded-full border border-teal-100">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-teal-700">
                {isTeacher ? 'Chế độ Giáo viên' : `Học sinh: ${currentStudent?.name}`}
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-rose-600 transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit">
            <button 
              onClick={() => setView('chart')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                view === 'chart' ? "bg-teal-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              <LayoutGrid size={18} />
              Sơ đồ lớp
            </button>
            {isTeacher && (
              <>
                <button 
                  onClick={() => setView('list')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    view === 'list' ? "bg-teal-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <Users size={18} />
                  Danh sách
                </button>
                <button 
                  onClick={() => setView('stats')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    view === 'stats' ? "bg-teal-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <CheckCircle2 size={18} />
                  Thống kê
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isTeacher ? (
              <>
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                  <button 
                    onClick={downloadAsImage}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all"
                    title="Tải ảnh PNG"
                  >
                    <ImageIcon size={16} />
                    PNG
                  </button>
                  <button 
                    onClick={downloadAsPDF}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all"
                    title="Tải PDF"
                  >
                    <FileText size={16} />
                    PDF
                  </button>
                </div>
                <button 
                  onClick={shuffleSeats}
                  className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 transition-all shadow-sm"
                >
                  <Shuffle size={18} />
                  Xáo trộn
                </button>
                <button 
                  onClick={resetSeats}
                  className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-all shadow-sm"
                >
                  <RotateCcw size={18} />
                  Xóa hết chỗ
                </button>
                <button 
                  onClick={generateAllPasswords}
                  className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all shadow-sm"
                  title="Tạo mật khẩu ngẫu nhiên cho tất cả học sinh"
                >
                  <Key size={18} />
                  Tạo mật khẩu
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      className="peer sr-only"
                      checked={isNearsighted}
                      onChange={(e) => setIsNearsighted(e.target.checked)}
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-teal-500 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-teal-600 transition-colors">Cận thị</span>
                </label>
                <div className="w-px h-6 bg-gray-200" />
                <button 
                  onClick={handleRandomSeatForStudent}
                  className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 active:scale-95"
                >
                  <Shuffle size={18} />
                  Chọn chỗ ngẫu nhiên
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {view === 'chart' ? (
            <motion.div 
              key="chart"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-3xl p-4 md:p-8 shadow-xl border border-gray-100 overflow-x-auto"
            >
              {/* Seating Grid Controls */}
              <div className="flex items-center justify-end px-6 mb-6 gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                  <ZoomIn size={14} />
                  Phóng to: {Math.round(zoom * 100)}%
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.1" 
                  value={zoom} 
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-32 accent-teal-600"
                />
              </div>

              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="overflow-auto p-4 flex justify-center">
                  <div 
                    id="seating-chart-capture"
                    className="bg-white p-12 rounded-[40px] shadow-2xl border border-gray-100 relative transition-transform duration-300 origin-top"
                    style={{ transform: `scale(${zoom})`, minWidth: '1100px' }}
                  >
                    {/* Header for Download */}
                    <div className={cn("text-center mb-16", isPrinting && "tracking-normal")}>
                      <h2 className={cn(
                        "text-5xl font-black text-teal-900 uppercase mb-3",
                        isPrinting ? "tracking-normal" : "tracking-[0.2em] drop-shadow-sm"
                      )}>
                        Sơ Đồ Chỗ Ngồi Lớp 10A7
                      </h2>
                      <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-teal-200" />
                        <p className={cn(
                          "text-teal-600 font-black text-base uppercase",
                          isPrinting ? "tracking-normal" : "tracking-widest"
                        )}>
                          Ngày khởi tạo: {new Date().toLocaleDateString('vi-VN')}
                        </p>
                        <div className="h-px w-12 bg-teal-200" />
                      </div>
                    </div>

                    {/* Blackboard Area */}
                    <div className="w-full max-w-4xl mx-auto mb-24 relative">
                      <div className={cn(
                        "h-10 bg-teal-950 rounded-2xl border-b-8 border-teal-900 flex items-center justify-center relative overflow-hidden",
                        !isPrinting && "shadow-[0_15px_30px_-10px_rgba(0,0,0,0.4)]"
                      )}>
                        {/* CSS-based chalkboard texture instead of external image */}
                        <div className="absolute inset-0 opacity-10" style={{ 
                          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                          backgroundSize: '24px 24px' 
                        }} />
                        <div className="w-1/2 h-1 bg-white/10 rounded-full blur-sm" />
                      </div>
                      <div className={cn(
                        "absolute -bottom-12 left-1/2 -translate-x-1/2 text-lg font-black text-teal-900 uppercase",
                        isPrinting ? "tracking-normal" : "tracking-[0.4em] drop-shadow-sm"
                      )}>
                        Bảng viết / Giáo viên
                      </div>
                    </div>

                    <SortableContext 
                      items={seats.map(s => s.id.toString())}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-8 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(col => (
                          <div key={col} className="flex flex-col gap-6">
                            {seats
                              .filter(s => s.column === col)
                              .sort((a, b) => a.row - b.row)
                              .map(seat => (
                                <SortableSeat 
                                  key={seat.id} 
                                  seat={seat} 
                                  student={students.find(s => s.id === seat.studentId) || null}
                                  isTeacher={auth.role === 'teacher'}
                                  isCurrentStudent={auth.role === 'student' && auth.user && (auth.user as Student).id === seat.studentId}
                                  onAssign={setAssigningToSeat}
                                  allStudents={students}
                                  isPrinting={isPrinting}
                                />
                              ))}
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                </div>

                <DragOverlay dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                      active: {
                        opacity: '0.5',
                      },
                    },
                  }),
                }}>
                  {activeId ? (
                    <div className="w-24 h-24 bg-teal-500 rounded-xl border-b-4 border-teal-700 shadow-2xl flex items-center justify-center text-white font-bold">
                      {getDisplayName(
                        students.find(s => s.id === seats.find(seat => seat.id.toString() === activeId)?.studentId)!,
                        students
                      )}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </motion.div>
          ) : view === 'list' ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Họ tên</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mật khẩu</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tổ</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-teal-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                            student.gender === 'Nam' ? "bg-blue-100 text-blue-600" : "bg-rose-100 text-rose-600"
                          )}>
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{student.name}</div>
                            <div className="text-xs text-gray-400">{student.birthday}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">••••••••</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-500 uppercase">Tổ {student.group}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setEditingStudent(student)}
                          className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-teal-600 p-4 text-white font-bold flex items-center gap-2">
                  <CheckCircle2 size={20} />
                  Đã chọn chỗ ({stats.assigned.length})
                </div>
                <div className="p-4 max-h-[500px] overflow-y-auto">
                  {stats.assigned.length === 0 ? (
                    <p className="text-gray-400 text-center py-8 italic">Chưa có học sinh nào chọn chỗ.</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.assigned.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 bg-teal-50 rounded-xl border border-teal-100">
                          <span className="font-medium text-teal-800">{s.name}</span>
                          <span className="text-xs font-bold text-teal-600 bg-white px-2 py-1 rounded-lg">
                            Ghế {seats.find(seat => seat.studentId === s.id)?.id}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-rose-600 p-4 text-white font-bold flex items-center gap-2">
                  <AlertCircle size={20} />
                  Chưa chọn chỗ ({stats.unassigned.length})
                </div>
                <div className="p-4 max-h-[500px] overflow-y-auto">
                  {stats.unassigned.length === 0 ? (
                    <p className="text-gray-400 text-center py-8 italic">Tất cả học sinh đã chọn chỗ.</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.unassigned.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-100">
                          <span className="font-medium text-rose-800">{s.name}</span>
                          <span className="text-[10px] font-bold text-rose-400 uppercase">Đang chờ...</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Loading Overlay for Downloads */}
      <AnimatePresence>
        {isDownloading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-10 rounded-[40px] shadow-2xl text-center space-y-6 max-w-sm"
            >
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-teal-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-teal-600 rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-teal-600">
                  <Download size={32} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-widest">Đang xử lý...</h3>
                <p className="text-gray-500 font-medium">Hệ thống đang tạo sơ đồ chất lượng cao. Vui lòng đợi trong giây lát.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assignment Message Modal */}
      <AnimatePresence>
        {assignmentMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssignmentMessage(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative z-10"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-800">Thông báo</h3>
                  <p className="text-gray-600 leading-relaxed">{assignmentMessage}</p>
                </div>
                <button 
                  onClick={() => setAssignmentMessage(null)}
                  className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {assigningToSeat !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssigningToSeat(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="bg-teal-600 p-6 text-white flex items-center justify-between">
                <h3 className="text-lg font-bold">Xếp học sinh vào ghế {assigningToSeat}</h3>
                <button onClick={() => setAssigningToSeat(null)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {students
                    .filter(s => !seats.find(seat => seat.studentId === s.id))
                    .map(student => (
                      <button
                        key={student.id}
                        onClick={() => handleManualAssign(student.id)}
                        className="flex items-center gap-3 p-3 hover:bg-teal-50 rounded-xl border border-transparent hover:border-teal-100 transition-all text-left"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white",
                          student.gender === 'Nam' ? "bg-blue-500" : "bg-rose-500"
                        )}>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{student.name}</div>
                          <div className="text-xs text-gray-400">Tổ {student.group}</div>
                        </div>
                      </button>
                    ))}
                  {students.filter(s => !seats.find(seat => seat.studentId === s.id)).length === 0 && (
                    <p className="text-center py-8 text-gray-400 italic">Tất cả học sinh đã có chỗ ngồi.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingStudent(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="bg-teal-600 p-6 text-white flex items-center justify-between">
                <h3 className="text-lg font-bold">Chỉnh sửa học sinh</h3>
                <button onClick={() => setEditingStudent(null)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xl font-bold">
                    {editingStudent.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{editingStudent.name}</div>
                    <div className="text-sm text-gray-500">ID: {editingStudent.id}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="email" 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                        defaultValue={editingStudent.email}
                        id="edit-email"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Mật khẩu mới</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                        defaultValue={editingStudent.password}
                        id="edit-password"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setEditingStudent(null)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={() => {
                      const email = (document.getElementById('edit-email') as HTMLInputElement).value;
                      const pass = (document.getElementById('edit-password') as HTMLInputElement).value;
                      updateStudent(editingStudent.id, email, pass);
                    }}
                    className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-4 mt-12 text-center">
        <p className="text-xs text-gray-400 font-medium">
          &copy; 2026 ClassSeat Management System. Thiết kế bởi ldman87.
        </p>
      </footer>
    </div>
  );
}
