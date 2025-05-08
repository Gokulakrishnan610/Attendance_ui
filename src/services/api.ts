// src/services/api.ts
import type { Student, AttendanceRecord, AttendanceStatus, DailyAttendanceStats, AttendanceTrendItem } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.error(
    "CRITICAL ERROR: NEXT_PUBLIC_API_URL is not defined. " +
    "Please ensure it is set in your .env file (e.g., .env.local) " +
    "and the Next.js development server has been restarted."
  );
  // This early check helps identify configuration issues before fetch attempts.
}


interface ApiResponse {
  message?: string;
  error?: string;
}

interface StudentsApiResponse extends ApiResponse {
  data?: Student[]; 
}

interface AttendanceApiResponse extends ApiResponse {
  data?: AttendanceRecord[]; 
}

interface AttendanceStatsApiResponseBackend { // Renamed to avoid conflict with frontend type
  today: { Present: number; Absent: number; Late: number; }; // Direct match to backend keys
  trend: Array<{ date: string; Present: number; Absent: number; Late: number; }>; // Direct match
}

interface RecognizeResponse extends ApiResponse {
  present_count?: number;
  absent_count?: number;
}

interface TrainModelResponse extends ApiResponse {
  student_count?: number;
}


// Helper function for API requests
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    // This is a fallback, the initial check should ideally catch this.
    throw new Error("API URL is not configured. Cannot make API calls. Check NEXT_PUBLIC_API_URL.");
  }
  const fullUrl = `${API_URL}${endpoint}`;
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If response is not JSON, use status text or a generic message
        errorData = { error: response.statusText || `HTTP error! status: ${response.status}` };
      }
      throw new Error(errorData?.error || `HTTP error! status: ${response.status} when fetching ${fullUrl}`);
    }
    return response.json() as Promise<T>;
  } catch (error: any) {
    // Catch network errors (e.g., server down, DNS issues) or errors from the !response.ok block
    console.error(`API call failed for ${fullUrl}:`, error);
    throw new Error(error.message || `Failed to fetch from ${fullUrl}. Ensure the backend server is running and accessible.`);
  }
}


export const addStudentApi = async (formData: FormData): Promise<ApiResponse> => {
  return fetchApi<ApiResponse>('/add_student', {
    method: 'POST',
    body: formData,
  });
};

export const recognizeFacesApi = async (formData: FormData): Promise<RecognizeResponse> => {
  return fetchApi<RecognizeResponse>('/recognize', {
    method: 'POST',
    body: formData,
  });
};

export const getAttendanceApi = async (date: string): Promise<AttendanceRecord[]> => {
  // Backend /attendance always returns today's date based on its code.
  // The `date` parameter from frontend is currently ignored by this specific backend endpoint.
  // If the backend were to support date filtering via query param, it would be like:
  // const endpoint = `/attendance?date=${date}`;
  // For now, it will always fetch current day's attendance from backend.
  const endpoint = '/attendance'; 
  
  const records = await fetchApi<any[]>(endpoint); 
  return records.map(r => ({
    id: `${r.student_id}-${r.date}`, 
    studentId: r.student_id,
    studentName: r.name,
    date: r.date, // Date is already YYYY-MM-DD string from backend
    status: r.status as AttendanceStatus,
  }));
};


export const getAllStudentsApi = async (): Promise<Student[]> => {
  const studentsData = await fetchApi<Array<{ student_id: string; name: string; created_at?: string }>>('/students');
  return studentsData.map(s => ({
    id: s.student_id,
    name: s.name,
    imageUrl: `https://picsum.photos/seed/${s.student_id}/100/100`, 
    // Use created_at from backend if available, otherwise fallback
    registeredAt: s.created_at ? new Date(s.created_at).toISOString() : new Date().toISOString(), 
  }));
};

export const updateAttendanceApi = async (studentId: string, status: AttendanceStatus, date: string): Promise<ApiResponse> => {
  // Backend /update_attendance uses today's date implicitly.
  // The `date` parameter from frontend is not used by this specific backend endpoint for determining the date.
  return fetchApi<ApiResponse>('/update_attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, status: status }), 
  });
};

export const getAttendanceStatsApi = async (): Promise<{
  today: DailyAttendanceStats;
  attendanceTrend: AttendanceTrendItem[];
}> => {
  const response = await fetchApi<AttendanceStatsApiResponseBackend>('/attendance_stats');
  const backendToday = response.today;
  const backendTrend = response.trend;

  const totalToday = (backendToday.Present || 0) + (backendToday.Absent || 0) + (backendToday.Late || 0);

  return {
    today: {
      present: backendToday.Present || 0,
      absent: backendToday.Absent || 0,
      late: backendToday.Late || 0,
      total: totalToday, 
    },
    attendanceTrend: backendTrend.map(t => ({
      date: t.date, // Date is string from backend
      present: t.Present || 0,
      absent: t.Absent || 0,
      late: t.Late || 0,
    })),
  };
};


export const trainModelApi = async (): Promise<TrainModelResponse> => {
    return fetchApi<TrainModelResponse>('/train_model', {
        method: 'POST',
    });
};

export const exportCsvApiUrl = `${API_URL}/export_csv`;
