import React, { useState, useRef } from 'react';
import { Student, Seat, AppSettings } from '../types';
import SeatingMap from './SeatingMap';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { toast } from 'sonner';
import { db } from '../firebase';
import { doc, updateDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { 
  Download, 
  RotateCcw, 
  UserPlus, 
  Users, 
  LayoutGrid, 
  Save, 
  Search,
  ArrowLeftRight,
  Trash2,
  FileText,
  Image as ImageIcon,
  Edit2,
  Key,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { INITIAL_STUDENTS } from '../constants';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";

interface TeacherViewProps {
  students: Student[];
  seats: Seat[];
  settings: AppSettings | null;
  currentUser: Student;
}

export default function TeacherView({ students, seats, settings, currentUser }: TeacherViewProps) {
  const [activeTab, setActiveTab] = useState("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ email: '', password: '', group: '' });
  const mapRef = useRef<HTMLDivElement>(null);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.stt - b.stt);

  const handleModeChange = async (mode: string) => {
    console.log("Changing mode to:", mode);
    try {
      await updateDoc(doc(db, 'settings', 'global'), { mode });
      toast.success(`Đã chuyển sang chế độ: ${mode}`);
    } catch (error) {
      console.error("Error updating mode:", error);
      toast.error("Không thể cập nhật chế độ. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const handleReset = async () => {
    // confirm() is blocked in sandbox, using a simple prompt or just executing for now
    // In a production app, we'd use a custom Dialog component
    try {
      const batch = writeBatch(db);
      
      // Reset all students
      students.forEach(s => {
        batch.update(doc(db, 'students', s.id), { seatId: null });
      });

      // Reset all seats
      seats.forEach(s => {
        batch.update(doc(db, 'seats', s.id), { studentId: null });
      });

      await batch.commit();
      toast.success("Đã làm mới toàn bộ sơ đồ");
    } catch (error) {
      toast.error("Lỗi khi reset dữ liệu");
    }
  };

  const handleSeatClick = async (seatId: string) => {
    if (settings?.mode !== 'teacher-manual') {
      toast.error("Bạn chỉ có thể xếp chỗ thủ công khi ở chế độ 'GV xếp thủ công'");
      return;
    }

    if (!selectedStudentId) {
      const seat = seats.find(s => s.id === seatId);
      if (seat?.studentId) {
        setSelectedStudentId(seat.studentId);
        toast.info("Đã chọn học sinh. Click vào ghế khác để hoán đổi hoặc ghế trống để di chuyển.");
      } else {
        toast.info("Vui lòng chọn một học sinh trước (click vào ghế có người).");
      }
      return;
    }

    const targetSeat = seats.find(s => s.id === seatId);
    const sourceStudent = students.find(s => s.id === selectedStudentId);
    
    if (!sourceStudent) return;

    try {
      const batch = writeBatch(db);

      if (targetSeat?.studentId) {
        // Swap
        const targetStudent = students.find(s => s.id === targetSeat.studentId);
        if (targetStudent) {
          const sourceSeatId = sourceStudent.seatId;
          
          batch.update(doc(db, 'students', sourceStudent.id), { seatId: seatId });
          batch.update(doc(db, 'students', targetStudent.id), { seatId: sourceSeatId });
          
          batch.update(doc(db, 'seats', seatId), { studentId: sourceStudent.id });
          if (sourceSeatId) {
            batch.update(doc(db, 'seats', sourceSeatId), { studentId: targetStudent.id });
          }
        }
      } else {
        // Move to empty seat
        const oldSeatId = sourceStudent.seatId;
        
        batch.update(doc(db, 'students', sourceStudent.id), { seatId: seatId });
        batch.update(doc(db, 'seats', seatId), { studentId: sourceStudent.id });
        
        if (oldSeatId) {
          batch.update(doc(db, 'seats', oldSeatId), { studentId: null });
        }
      }

      await batch.commit();
      toast.success("Đã cập nhật vị trí");
    } catch (error) {
      toast.error("Lỗi khi cập nhật vị trí");
    } finally {
      setSelectedStudentId(null);
    }
  };

  const exportAsImage = async () => {
    if (!mapRef.current) {
      toast.error("Không tìm thấy sơ đồ để xuất");
      return;
    }
    
    const toastId = toast.loading("Đang chuẩn bị ảnh...");
    try {
      // Small delay to ensure any pending renders are finished
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(mapRef.current, {
        scale: 3, // Increase scale for better quality
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 1200, // Fixed width for consistent export
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('seating-map-container');
          if (el) {
            el.style.width = '1200px';
            el.style.display = 'block';
            el.style.overflow = 'visible';
            el.style.padding = '40px';
            const inner = el.querySelector('div');
            if (inner) {
              inner.style.minWidth = '1100px';
              inner.style.transform = 'scale(1)';
            }
            // Ensure all text is visible and not truncated
            const names = clonedDoc.querySelectorAll('.student-name');
            names.forEach((n: any) => {
              n.style.fontSize = '12px';
              n.style.whiteSpace = 'normal';
              n.style.overflow = 'visible';
              n.style.display = 'block';
            });
          }
        }
      });
      
      const link = document.createElement('a');
      link.download = `So_do_lop_hoc_${new Date().toLocaleDateString().replace(/\//g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss(toastId);
      toast.success("Đã tải ảnh sơ đồ về máy");
    } catch (error) {
      console.error("Export Image Error:", error);
      toast.dismiss(toastId);
      toast.error("Lỗi khi xuất ảnh. Vui lòng thử lại.");
    }
  };

  const exportAsPDF = async () => {
    if (!mapRef.current) {
      toast.error("Không tìm thấy sơ đồ để xuất");
      return;
    }

    const toastId = toast.loading("Đang chuẩn bị file PDF...");
    try {
      // Small delay to ensure any pending renders are finished
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(mapRef.current, { 
        scale: 3,
        useCORS: true,
        logging: false,
        width: 1200,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('seating-map-container');
          if (el) {
            el.style.width = '1200px';
            el.style.display = 'block';
            el.style.overflow = 'visible';
            el.style.padding = '40px';
            const inner = el.querySelector('div');
            if (inner) {
              inner.style.minWidth = '1100px';
              inner.style.transform = 'scale(1)';
            }
            const names = clonedDoc.querySelectorAll('.student-name');
            names.forEach((n: any) => {
              n.style.fontSize = '12px';
              n.style.whiteSpace = 'normal';
              n.style.overflow = 'visible';
              n.style.display = 'block';
            });
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`So_do_lop_hoc_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
      
      toast.dismiss(toastId);
      toast.success("Đã tải file PDF về máy");
    } catch (error) {
      console.error("Export PDF Error:", error);
      toast.dismiss(toastId);
      toast.error("Lỗi khi xuất PDF. Vui lòng thử lại.");
    }
  };

  const autoRandomAll = async () => {
    const availableSeats = Array.from({ length: 34 }, (_, i) => (i + 1).toString())
      .filter(id => !seats.find(s => s.id === id)?.studentId);
    
    const unassignedStudents = students.filter(s => !s.seatId && s.role !== 'admin');

    if (unassignedStudents.length > availableSeats.length) {
      toast.error("Không đủ ghế trống cho tất cả học sinh!");
      return;
    }

    try {
      const batch = writeBatch(db);
      const shuffledSeats = [...availableSeats].sort(() => Math.random() - 0.5);

      unassignedStudents.forEach((student, index) => {
        const seatId = shuffledSeats[index];
        batch.update(doc(db, 'students', student.id), { seatId });
        batch.update(doc(db, 'seats', seatId), { studentId: student.id });
      });

      await batch.commit();
      toast.success(`Đã xếp chỗ tự động cho ${unassignedStudents.length} học sinh`);
    } catch (error) {
      toast.error("Lỗi khi xếp chỗ tự động");
    }
  };

  const initializeDatabase = async () => {
    try {
      const batch = writeBatch(db);
      
      // Initialize 34 seats
      for (let i = 1; i <= 34; i++) {
        batch.set(doc(db, 'seats', i.toString()), { studentId: null });
      }

      // Initialize all students from INITIAL_STUDENTS
      INITIAL_STUDENTS.forEach((s) => {
        // We use a deterministic ID based on email to avoid duplicates if re-initialized
        // In a real app, we'd use the Auth UID, but for pre-populating the list:
        const studentId = `student_${s.stt}`;
        batch.set(doc(db, 'students', studentId), {
          ...s,
          id: studentId,
          seatId: null,
          isNearsighted: false,
          role: 'student',
          password: '123' // Default password for all students
        });
      });

      // Initialize settings
      batch.set(doc(db, 'settings', 'global'), {
        mode: 'student-random',
        lastReset: new Date().toISOString()
      });

      await batch.commit();
      toast.success("Đã khởi tạo cơ sở dữ liệu (34 chỗ ngồi & 33 học sinh)");
    } catch (error) {
      toast.error("Lỗi khi khởi tạo database");
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditForm({ 
      email: student.email || '', 
      password: student.password || '', 
      group: student.group || '' 
    });
  };

  const saveStudentEdit = async () => {
    if (!editingStudent) return;
    try {
      await updateDoc(doc(db, 'students', editingStudent.id), {
        email: editForm.email,
        password: editForm.password,
        group: editForm.group
      });
      toast.success("Đã cập nhật thông tin học sinh");
      setEditingStudent(null);
    } catch (error) {
      toast.error("Lỗi khi cập nhật thông tin");
    }
  };

  const stats = {
    total: students.filter(s => s.role !== 'admin').length,
    assigned: students.filter(s => s.seatId && s.role !== 'admin').length,
    unassigned: students.filter(s => !s.seatId && s.role !== 'admin').length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển Giáo viên</h1>
          <p className="text-gray-500">Quản lý sơ đồ và danh sách học sinh</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={initializeDatabase} className="gap-2 bg-blue-50 text-blue-700 border-blue-200">
            <Save className="w-4 h-4" /> Khởi tạo
          </Button>
          <Button variant="outline" onClick={exportAsImage} className="gap-2">
            <ImageIcon className="w-4 h-4" /> Xuất Ảnh
          </Button>
          <Button variant="outline" onClick={exportAsPDF} className="gap-2">
            <FileText className="w-4 h-4" /> Xuất PDF
          </Button>
          <Button variant="destructive" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-teal-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Tổng học sinh</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-teal-50 rounded-full">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Đã nhận chỗ</p>
                <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Chưa nhận chỗ</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unassigned}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="map" className="gap-2">
            <LayoutGrid className="w-4 h-4" /> Sơ đồ lớp
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <Users className="w-4 h-4" /> Danh sách
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sơ đồ Realtime</CardTitle>
                <CardDescription>Click vào ghế để hoán đổi hoặc di chuyển học sinh</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Chế độ:</span>
                  <Select value={settings?.mode || "student-random"} onValueChange={handleModeChange}>
                    <SelectTrigger className="w-[200px] border-teal-500 ring-teal-500/20">
                      <SelectValue placeholder="Chọn chế độ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student-random">HS tự chọn (Random)</SelectItem>
                      <SelectItem value="teacher-manual">GV xếp thủ công</SelectItem>
                      <SelectItem value="teacher-random">GV random cả lớp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {settings?.mode === 'teacher-random' && (
                  <Button onClick={autoRandomAll} className="bg-purple-600 hover:bg-purple-700">
                    Random cả lớp
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div ref={mapRef} id="seating-map-container">
                <SeatingMap 
                  students={students} 
                  seats={seats} 
                  onSeatClick={handleSeatClick}
                  highlightedSeatId={selectedStudentId}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Danh sách học sinh ({students.length})</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Tìm tên, email..." 
                    className="pl-8" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">STT</TableHead>
                      <TableHead>Họ và tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tổ</TableHead>
                      <TableHead>Mật khẩu</TableHead>
                      <TableHead>Vị trí</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.stt}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell className="text-gray-500">{s.email}</TableCell>
                        <TableCell>{s.group}</TableCell>
                        <TableCell className="font-mono text-xs">{s.password || '---'}</TableCell>
                        <TableCell>
                          {s.seatId ? (
                            <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-md font-bold">
                              Ghế {s.seatId}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Chưa có chỗ</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {s.isNearsighted && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold">
                              CẬN THỊ
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditStudent(s)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Student Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin: {editingStudent?.name}</DialogTitle>
            <DialogDescription>Cập nhật Email, Tổ và Mật khẩu cho học sinh.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input 
                id="email" 
                value={editForm.email} 
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group" className="text-right">Tổ</Label>
              <Input 
                id="group" 
                value={editForm.group} 
                onChange={(e) => setEditForm({...editForm, group: e.target.value})}
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Mật khẩu</Label>
              <Input 
                id="password" 
                type="text"
                placeholder="Đặt mật khẩu đăng nhập"
                value={editForm.password} 
                onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                className="col-span-3" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStudent(null)}>Hủy</Button>
            <Button onClick={saveStudentEdit} className="bg-teal-600 hover:bg-teal-700">Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
