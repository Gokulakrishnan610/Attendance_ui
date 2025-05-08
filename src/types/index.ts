export interface Student {
  id: string; // Unique student ID
  name: string;
  imageUrl?: string; // URL to student's photo
  registeredAt?: string; // ISO date string, now optional
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface AttendanceRecord {
  id: string; // Unique record ID
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface AppSettings {
  notifications: {
    email: boolean;
    push: boolean;
  };
  dataPrivacy: {
    shareAnalytics: boolean;
  };
  scheduledReports: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
}

export interface DailyAttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
}

export interface AttendanceTrendItem {
  date: string; // YYYY-MM-DD
  present: number;
  absent: number;
  late: number;
}

