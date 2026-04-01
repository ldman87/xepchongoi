
export interface Student {
  id: string;
  name: string;
  birthday: string;
  gender: 'Nam' | 'Nữ';
  group: number; // Tổ 1, 2, 3, 4
  address: string;
  email: string;
  password: string;
  isNearsighted?: boolean;
}

export interface Seat {
  id: number;
  studentId: string | null; // ID of student assigned to this seat
  row: number;
  column: number;
}

export type UserRole = 'teacher' | 'student';

export interface AuthState {
  user: Student | { email: string; role: 'teacher' } | null;
  role: UserRole | null;
}
