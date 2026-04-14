import React, { useState } from 'react';
import { Student, Seat, AppSettings } from '../types';
import SeatingMap from './SeatingMap';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { toast } from 'sonner';
import { db } from '../firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Info, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentViewProps {
  student: Student;
  students: Student[];
  seats: Seat[];
  settings: AppSettings | null;
}

export default function StudentView({ student, students, seats, settings }: StudentViewProps) {
  const [isNearsighted, setIsNearsighted] = useState(student?.isNearsighted || false);
  const [picking, setPicking] = useState(false);
  const [tempSeatId, setTempSeatId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!student) return null;

  const hasSeat = !!student?.seatId;

  const handleRandomPick = async () => {
    if (hasSeat) {
      toast.error("Bạn đã có chỗ ngồi rồi!");
      return;
    }
    setPicking(true);
    
    // Simulate picking animation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const occupiedSeatIds = seats.filter(s => s.studentId).map(s => s.id);
    const availableSeats = Array.from({ length: 34 }, (_, i) => (i + 1).toString())
      .filter(id => !occupiedSeatIds.includes(id));

    let filteredSeats = availableSeats;
    if (isNearsighted) {
      filteredSeats = availableSeats.filter(id => parseInt(id) <= 16);
    }

    if (filteredSeats.length === 0) {
      if (isNearsighted) {
        toast.error("Hết chỗ cho học sinh cận thị, vui lòng liên hệ GV");
      } else {
        toast.error("Lớp đã hết chỗ ngồi!");
      }
      setPicking(false);
      return;
    }

    const randomIndex = Math.floor(Math.random() * filteredSeats.length);
    const pickedId = filteredSeats[randomIndex];
    setTempSeatId(pickedId);
    setPicking(false);
    toast.success("Đã chọn được vị trí bí mật! Vui lòng nhấn xác nhận để xem.");
  };

  const handleConfirm = async () => {
    if (!tempSeatId || hasSeat) return;
    setConfirming(true);

    try {
      await runTransaction(db, async (transaction) => {
        const seatRef = doc(db, 'seats', tempSeatId);
        const studentRef = doc(db, 'students', student.id);
        
        const seatDoc = await transaction.get(seatRef);
        const studentDoc = await transaction.get(studentRef);

        if (seatDoc.exists() && seatDoc.data().studentId) {
          throw new Error("Ghế này vừa có người chọn mất rồi!");
        }

        if (studentDoc.data()?.seatId) {
          throw new Error("Bạn đã có chỗ ngồi rồi!");
        }

        transaction.set(seatRef, { studentId: student.id }, { merge: true });
        transaction.update(studentRef, { 
          seatId: tempSeatId,
          isNearsighted: isNearsighted 
        });
      });

      toast.success("Xác nhận chỗ ngồi thành công!");
      setTempSeatId(null);
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra khi xác nhận");
      setTempSeatId(null);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-teal-100 shadow-sm">
            <CardHeader className="bg-teal-50/50">
              <CardTitle className="text-teal-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                Trạng thái của bạn
              </CardTitle>
              <CardDescription>Thông tin vị trí ngồi hiện tại</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {hasSeat ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-3xl font-bold text-teal-700">{student.seatId}</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900">Bạn đang ngồi ở ghế số {student.seatId}</p>
                  <p className="text-sm text-gray-500 italic">Vị trí đã được xác nhận realtime</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <Checkbox 
                      id="nearsighted" 
                      checked={isNearsighted} 
                      onCheckedChange={(checked) => setIsNearsighted(!!checked)}
                      disabled={!!tempSeatId}
                    />
                    <Label htmlFor="nearsighted" className="text-sm font-medium text-yellow-800 cursor-pointer">
                      Em bị cận thị (Ưu tiên hàng 1-2)
                    </Label>
                  </div>

                  <AnimatePresence mode="wait">
                    {!tempSeatId ? (
                      <Button 
                        onClick={handleRandomPick} 
                        disabled={picking || settings?.mode !== 'student-random'}
                        className="w-full h-14 text-lg font-bold bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-200"
                      >
                        {picking ? (
                          <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="w-6 h-6 mr-2" />
                        )}
                        {settings?.mode !== 'student-random' ? "Chưa đến lúc chọn chỗ" : "Nhận vị trí ngẫu nhiên"}
                      </Button>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="space-y-4"
                      >
                        <div className="p-6 border-2 border-dashed border-teal-300 rounded-xl text-center bg-teal-50">
                          <p className="text-sm text-teal-600 font-medium mb-2">Vị trí đã được chọn bí mật:</p>
                          <div className="flex justify-center items-center h-16">
                            <div className="w-12 h-12 bg-teal-200 rounded-lg flex items-center justify-center animate-pulse">
                              <Key className="w-6 h-6 text-teal-600" />
                            </div>
                          </div>
                          <p className="text-xs text-teal-500 mt-2">Nhấn xác nhận để xem vị trí của bạn</p>
                        </div>
                        <div className="flex gap-3">
                          <Button 
                            onClick={handleConfirm}
                            className="w-full h-12 bg-teal-600 hover:bg-teal-700 font-bold text-lg"
                            disabled={confirming}
                          >
                            {confirming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                            Xác nhận nhận chỗ
                          </Button>
                        </div>
                        <p className="text-[10px] text-red-500 text-center font-medium">
                          * Lưu ý: Bạn sẽ biết vị trí chính xác sau khi nhấn Xác nhận.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 text-white border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-teal-400 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Hướng dẫn
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-300 space-y-3">
              <p>1. Tick vào ô "Cận thị" nếu bạn cần ngồi gần bảng (Hàng 1-2).</p>
              <p>2. Bấm "Nhận vị trí ngẫu nhiên" để hệ thống chọn ghế trống cho bạn.</p>
              <p>3. Bấm "Xác nhận" để lưu vị trí. Lưu ý: Chỉ được xác nhận 1 lần duy nhất.</p>
              <p>4. Nếu có sai sót, vui lòng liên hệ Giáo viên để điều chỉnh.</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold text-gray-900">Sơ đồ lớp học</h2>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-teal-500 rounded-sm" />
                <span>Đã có người</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-white border border-gray-300 rounded-sm" />
                <span>Còn trống</span>
              </div>
              {tempSeatId && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-yellow-400 rounded-sm" />
                  <span>Vị trí đang chọn</span>
                </div>
              )}
            </div>
          </div>
          <SeatingMap 
            students={students} 
            seats={seats} 
            highlightedSeatId={hasSeat ? student.seatId : null}
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
}
