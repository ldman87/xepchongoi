export interface Student {
  id: string;
  stt: number;
  name: string;
  dob: string;
  gender: string;
  group: string;
  address: string;
  email: string;
  password?: string;
  seatId: string | null;
  isNearsighted: boolean;
  role: 'student' | 'admin';
}

export interface Seat {
  id: string; // "1" to "34"
  studentId: string | null;
}

export interface AppSettings {
  mode: 'student-random' | 'teacher-manual' | 'teacher-random';
  lastReset: any;
}

export type OperationType = 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}
