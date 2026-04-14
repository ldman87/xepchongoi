import React from 'react';
import { motion } from 'motion/react';
import { Student, Seat } from '../types';
import { SEATING_LAYOUT, THEME_COLOR } from '../constants';
import { cn } from '../lib/utils';
import { User, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface SeatingMapProps {
  students: Student[];
  seats: Seat[];
  onSeatClick?: (seatId: string) => void;
  highlightedSeatId?: string | null;
  readOnly?: boolean;
}

export default function SeatingMap({ 
  students, 
  seats, 
  onSeatClick, 
  highlightedSeatId,
  readOnly = false 
}: SeatingMapProps) {
  const getStudentAtSeat = (seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat || !seat.studentId) return null;
    return students.find(s => s.id === seat.studentId);
  };

  return (
    <div className="w-full overflow-auto p-4 bg-white rounded-xl shadow-inner border border-gray-100">
      <div className="min-w-[800px] flex flex-col items-center space-y-12 py-8">
        {/* Teacher's Desk / Board */}
        <div className="w-1/2 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg relative">
          <div className="absolute -top-8 text-gray-400 text-sm font-medium uppercase tracking-widest">BẢNG</div>
          BÀN GIÁO VIÊN
        </div>

        {/* Seating Grid */}
        <div className="grid grid-cols-4 gap-x-12 gap-y-8 w-full max-w-5xl">
          {SEATING_LAYOUT.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {/* Each row has 4 pairs of seats (except last row) */}
              {Array.from({ length: 4 }).map((_, colIndex) => {
                const seat1Index = colIndex * 2;
                const seat2Index = colIndex * 2 + 1;
                const seat1Id = row[seat1Index]?.toString();
                const seat2Id = row[seat2Index]?.toString();

                return (
                  <div key={colIndex} className="flex space-x-2 justify-center">
                    {seat1Id && (
                      <SeatItem 
                        id={seat1Id}
                        student={getStudentAtSeat(seat1Id)}
                        isHighlighted={highlightedSeatId === seat1Id}
                        onClick={() => !readOnly && onSeatClick?.(seat1Id)}
                        readOnly={readOnly}
                      />
                    )}
                    {seat2Id && (
                      <SeatItem 
                        id={seat2Id}
                        student={getStudentAtSeat(seat2Id)}
                        isHighlighted={highlightedSeatId === seat2Id}
                        onClick={() => !readOnly && onSeatClick?.(seat2Id)}
                        readOnly={readOnly}
                      />
                    )}
                    {!seat1Id && !seat2Id && <div className="w-32 h-20" />}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SeatItemProps {
  id: string;
  student: Student | null | undefined;
  isHighlighted: boolean;
  onClick: () => void;
  readOnly: boolean;
}

function SeatItem({ id, student, isHighlighted, onClick, readOnly }: SeatItemProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <motion.div
            whileHover={!readOnly ? { scale: 1.05 } : {}}
            whileTap={!readOnly ? { scale: 0.95 } : {}}
            onClick={onClick}
            className={cn(
              "w-16 h-20 sm:w-20 sm:h-24 rounded-lg border-2 flex flex-col items-center justify-center p-1 transition-all cursor-pointer relative overflow-hidden",
              student 
                ? "bg-teal-50 border-teal-500 text-teal-900" 
                : "bg-white border-gray-200 text-gray-400 hover:border-teal-300",
              isHighlighted && "ring-4 ring-yellow-400 border-yellow-500 z-10",
              readOnly && "cursor-default"
            )}
          >
            <span className="absolute top-1 left-1 text-[10px] font-bold opacity-50">{id}</span>
            {student ? (
              <>
                <User className="w-6 h-6 mb-1 text-teal-600" />
                <span className="text-[10px] font-bold text-center leading-tight uppercase line-clamp-2">
                  {student.name.split(' ').pop()}
                </span>
                {student.isNearsighted && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" title="Cận thị" />
                )}
              </>
            ) : (
              <span className="text-xs font-medium">Trống</span>
            )}
          </motion.div>
        </TooltipTrigger>
        {student && (
          <TooltipContent className="p-3 bg-white border border-gray-200 shadow-xl rounded-lg">
            <div className="space-y-1">
              <p className="font-bold text-teal-900">{student.name}</p>
              <p className="text-xs text-gray-500">STT: {student.stt} | Tổ: {student.group}</p>
              <p className="text-xs text-gray-500">Email: {student.email}</p>
              {student.isNearsighted && <p className="text-xs text-red-500 font-medium">⚠️ Cận thị</p>}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
