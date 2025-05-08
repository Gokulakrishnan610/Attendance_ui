"use client";

import { create } from 'zustand';
import type { Student, AttendanceRecord, DailyAttendanceStats, AttendanceTrendItem, UserProfile, AppSettings } from '@/types';
import { format } from 'date-fns';

interface AppState {
  // Students
  students: Student[];
  addStudent: (student: Omit<Student, 'id' | 'registeredAt'>) => void;
  getStudentById: (id: string) => Student | undefined;

  // Attendance
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  updateAttendanceRecord: (id: string, status: AttendanceRecord['status'], notes?: string) => void;
  getAttendanceForDate: (date: string) => AttendanceRecord[]; // date in YYYY-MM-DD
  getTodaysAttendanceStats: () => DailyAttendanceStats;
  getAttendanceTrend: (days?: number) => AttendanceTrendItem[];

  // User Profile & Settings
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => void;

  // Mock data initialization
  _initializeMockData: () => void;
}

const initialUserProfile: UserProfile = {
  name: 'Admin User',
  email: 'admin@faceattend.pro',
  avatarUrl: 'https://picsum.photos/seed/admin_profile/100/100',
};

const initialAppSettings: AppSettings = {
  notifications: { email: true, push: false },
  dataPrivacy: { shareAnalytics: true },
  scheduledReports: { enabled: false, frequency: 'weekly' },
};

export const useAppStore = create<AppState>((set, get) => ({
  students: [],
  attendanceRecords: [],
  userProfile: initialUserProfile,
  appSettings: initialAppSettings,

  addStudent: (studentData) => set((state) => ({
    students: [
      ...state.students,
      { 
        ...studentData, 
        id: `student-${Date.now()}-${Math.random().toString(16).slice(2)}`, 
        registeredAt: new Date().toISOString(),
        imageUrl: studentData.imageUrl || `https://picsum.photos/seed/${Math.random()}/100/100`
      }
    ]
  })),
  getStudentById: (id) => get().students.find(s => s.id === id),

  addAttendanceRecord: (recordData) => set((state) => ({
    attendanceRecords: [
      ...state.attendanceRecords,
      { ...recordData, id: `att-${Date.now()}-${Math.random().toString(16).slice(2)}` }
    ]
  })),
  updateAttendanceRecord: (id, status, notes) => set((state) => ({
    attendanceRecords: state.attendanceRecords.map(r => 
      r.id === id ? { ...r, status, notes: notes ?? r.notes } : r
    )
  })),
  getAttendanceForDate: (date) => get().attendanceRecords.filter(r => r.date === date),
  getTodaysAttendanceStats: () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaysRecords = get().attendanceRecords.filter(r => r.date === today);
    const stats: DailyAttendanceStats = { present: 0, absent: 0, late: 0, total: get().students.length };
    todaysRecords.forEach(record => {
      if (record.status === 'Present') stats.present++;
      else if (record.status === 'Absent') stats.absent++;
      else if (record.status === 'Late') stats.late++;
    });
     // If no records for today, assume all are absent unless explicitly marked
    if (todaysRecords.length === 0 && stats.total > 0) {
       stats.absent = stats.total;
    } else if (stats.total > (stats.present + stats.absent + stats.late)) {
       // account for students not yet marked
       stats.absent += stats.total - (stats.present + stats.absent + stats.late);
    }
    return stats;
  },
  getAttendanceTrend: (days = 7) => {
    const trend: AttendanceTrendItem[] = [];
    const allRecords = get().attendanceRecords;
    const allStudentsCount = get().students.length;

    for (let i = 0; i < days; i++) {
      const date = format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const dailyRecords = allRecords.filter(r => r.date === date);
      const item: AttendanceTrendItem = { date, present: 0, absent: 0, late: 0 };
      
      dailyRecords.forEach(record => {
        if (record.status === 'Present') item.present++;
        else if (record.status === 'Absent') item.absent++;
        else if (record.status === 'Late') item.late++;
      });
      
      // If no records for a day, assume all registered students were absent
      if (dailyRecords.length === 0 && allStudentsCount > 0) {
          item.absent = allStudentsCount;
      } else {
        // Calculate remaining as absent if not all students have a record for that day
        const markedStudents = item.present + item.absent + item.late;
        if (allStudentsCount > markedStudents) {
            item.absent += (allStudentsCount - markedStudents);
        }
      }
      trend.push(item);
    }
    return trend.reverse(); // oldest to newest
  },

  updateUserProfile: (profile) => set((state) => ({
    userProfile: { ...state.userProfile, ...profile }
  })),
  updateAppSettings: (settings) => set((state) => ({
    appSettings: { 
      ...state.appSettings, 
      ...settings,
      notifications: { ...state.appSettings.notifications, ...settings.notifications },
      dataPrivacy: { ...state.appSettings.dataPrivacy, ...settings.dataPrivacy },
      scheduledReports: { ...state.appSettings.scheduledReports, ...settings.scheduledReports },
    }
  })),

  _initializeMockData: () => {
    const mockStudents: Student[] = [
      { id: 's1', name: 'Alice Smith', imageUrl: 'https://picsum.photos/seed/alice/100/100', registeredAt: new Date(Date.now() - 5*24*60*60*1000).toISOString() },
      { id: 's2', name: 'Bob Johnson', imageUrl: 'https://picsum.photos/seed/bob/100/100', registeredAt: new Date(Date.now() - 10*24*60*60*1000).toISOString() },
      { id: 's3', name: 'Charlie Brown', imageUrl: 'https://picsum.photos/seed/charlie/100/100', registeredAt: new Date(Date.now() - 2*24*60*60*1000).toISOString() },
      { id: 's4', name: 'Diana Prince', imageUrl: 'https://picsum.photos/seed/diana/100/100', registeredAt: new Date(Date.now() - 15*24*60*60*1000).toISOString() },
      { id: 's5', name: 'Edward Norton', imageUrl: 'https://picsum.photos/seed/edward/100/100', registeredAt: new Date(Date.now() - 1*24*60*60*1000).toISOString() },
    ];
    set({ students: mockStudents });

    const mockAttendance: AttendanceRecord[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) { // Data for last 7 days
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      mockStudents.forEach(student => {
        const rand = Math.random();
        let status: AttendanceRecord['status'];
        if (rand < 0.7) status = 'Present';
        else if (rand < 0.9) status = 'Absent';
        else status = 'Late';
        mockAttendance.push({
          id: `att-${student.id}-${dateStr}`,
          studentId: student.id,
          studentName: student.name,
          date: dateStr,
          status: status,
        });
      });
    }
    set({ attendanceRecords: mockAttendance });
  }
}));

// Initialize mock data on first load (client-side only)
if (typeof window !== 'undefined') {
  useAppStore.getState()._initializeMockData();
}
