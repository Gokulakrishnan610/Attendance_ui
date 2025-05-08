// src/store/index.ts
"use client";

import { create } from 'zustand';
import type { Student, AttendanceRecord, DailyAttendanceStats, AttendanceTrendItem, UserProfile, AppSettings, AttendanceStatus } from '@/types';
import { format } from 'date-fns';
// API service functions will be called directly in components or within async thunks if using a more complex state manager.
// For this setup, store actions might become simpler or focus on UI state.

interface AppState {
  // Students - This will act more like a cache if populated, but primary source is API.
  students: Student[];
  setStudents: (students: Student[]) => void; // Allow components to update the store after fetching
  // addStudent will now primarily be a UI trigger, actual add is via API in component.

  // Attendance - Similar to students, primarily from API.
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: (records: AttendanceRecord[]) => void; // Allow components to update store
  // updateAttendanceRecord will be a UI trigger.

  // User Profile & Settings
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
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

  setStudents: (students) => set({ students }),
  setAttendanceRecords: (records) => set({ attendanceRecords: records }),

  // Example of how addStudent might look if store needs to be updated post-API call
  // However, typically the component would re-fetch the list or handle optimistic updates.
  // For simplicity, direct API calls in components are preferred for this integration.
  // So, addStudent, addAttendanceRecord, updateAttendanceRecord etc. from the original store
  // that directly manipulated the arrays are removed. Components will call API and then
  // potentially use setStudents or setAttendanceRecords if they want to update the global cache.

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
}));

// No mock data initialization, data comes from backend.
