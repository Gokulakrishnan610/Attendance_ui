// src/services/api.ts
import type { Student, AttendanceRecord, AttendanceStatus, DailyAttendanceStats, AttendanceTrendItem } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiResponse {
  message?: string;
  error?: string;
}

interface StudentsApiResponse extends ApiResponse {
  data?: Student[]; // Assuming backend /students returns a list of students
}

interface AttendanceApiResponse extends ApiResponse {
  data?: AttendanceRecord[]; // Assuming backend /attendance returns a list of records
}

interface AttendanceStatsApiResponse extends ApiResponse {
  today: { Present: number; Absent: number; Late: number; };
  trend: Array<{ date: string; Present: number; Absent: number; Late: number; }>;
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
  const response = await fetch(`${API_URL}${endpoint}`, {
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
      errorData = { error: `HTTP error! status: ${response.status}` };
    }
    throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
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
  // The backend's /attendance endpoint gets today's date by default.
  // To fetch for a specific date, the backend would need to support a query param, e.g., /attendance?date=YYYY-MM-DD
  // For now, assuming it's adapted or we adjust based on its current behavior (only today's)
  // The Flask backend `/attendance` returns an array directly, not wrapped in a `data` field.
  let endpoint = '/attendance';
  // This is a hypothetical adaptation. The provided Flask code only uses today's date for /attendance.
  // If your Flask app is modified to accept a date query param, uncomment below:
  // if (date !== format(new Date(), 'yyyy-MM-dd')) { // if not today
  //   endpoint = `/attendance?date=${date}`;
  // }
  // The current backend returns a list directly, not an object like { data: [] }
  const records = await fetchApi<any[]>(endpoint); 
  return records.map(r => ({
    id: `${r.student_id}-${r.date}`, // Create a unique ID for frontend use
    studentId: r.student_id,
    studentName: r.name,
    date: r.date, // Assuming date is already YYYY-MM-DD string
    status: r.status as AttendanceStatus,
  }));
};


export const getAllStudentsApi = async (): Promise<Student[]> => {
  // The Flask backend /students returns an array directly.
  const studentsData = await fetchApi<Array<{ student_id: string; name: string }>>('/students');
  return studentsData.map(s => ({
    id: s.student_id, // Use student_id as id
    name: s.name,
    // imageUrl and registeredAt are not provided by this backend endpoint
    // We can use placeholders or derive them if needed.
    imageUrl: `https://picsum.photos/seed/${s.student_id}/100/100`, 
    registeredAt: new Date().toISOString(), // Placeholder, ideally from backend
  }));
};

export const updateAttendanceApi = async (studentId: string, status: AttendanceStatus, date: string): Promise<ApiResponse> => {
  // The backend /update_attendance uses today's date implicitly.
  // If we need to update for a specific date, the backend needs to support it.
  return fetchApi<ApiResponse>('/update_attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, status: status }), // date is implicit in backend
  });
};

export const getAttendanceStatsApi = async (): Promise<{
  today: DailyAttendanceStats;
  attendanceTrend: AttendanceTrendItem[];
}> => {
  const response = await fetchApi<AttendanceStatsApiResponse>('/attendance_stats');
  const backendToday = response.today;
  const backendTrend = response.trend;

  // Calculate total for today's stats based on students (if possible or needed)
  // For simplicity, we'll rely on the backend's counts for present, absent, late.
  // Total could be sum of these, or if backend provides total students, use that.
  // The backend doesn't directly provide total students in this stats endpoint.
  const totalToday = backendToday.Present + backendToday.Absent + backendToday.Late;

  return {
    today: {
      present: backendToday.Present,
      absent: backendToday.Absent,
      late: backendToday.Late,
      total: totalToday, // This might not be total registered students, but total with status for the day
    },
    attendanceTrend: backendTrend.map(t => ({
      date: t.date,
      present: t.Present,
      absent: t.Absent,
      late: t.Late,
    })),
  };
};


export const trainModelApi = async (): Promise<TrainModelResponse> => {
    return fetchApi<TrainModelResponse>('/train_model', {
        method: 'POST',
    });
};

export const exportCsvApiUrl = `${API_URL}/export_csv`; // For direct link/button
