// src/services/api.ts
import type { Student, AttendanceRecord, AttendanceStatus, DailyAttendanceStats, AttendanceTrendItem } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  console.error(
    "CRITICAL ERROR: NEXT_PUBLIC_API_URL is not defined. " +
    "Please ensure it is set in your .env file (e.g., .env.local or .env) " +
    "and the Next.js development server has been restarted."
  );
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

interface AttendanceStatsApiResponseBackend { 
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
  if (!API_URL) {
    throw new Error("API URL (NEXT_PUBLIC_API_URL) is not configured. Cannot make API calls. Please set it in your .env file and restart the Next.js server.");
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
        errorData = { error: response.statusText || `HTTP error! status: ${response.status}` };
      }
      throw new Error(errorData?.error || `HTTP error! status: ${response.status} when fetching ${fullUrl}`);
    }
    return response.json() as Promise<T>;
  } catch (error: any) {
    console.error(`API call failed for ${fullUrl}:`, error);
    let detailedErrorMessage = `Failed to fetch from ${fullUrl}. Please ensure the backend server is running at this URL, is accessible, and that CORS is configured correctly if on a different origin. Original error: ${error.message}`;
    
    // Check if it's a generic "Failed to fetch" which often indicates network or CORS issues
    if (error instanceof TypeError && error.message.toLowerCase() === 'failed to fetch') {
        detailedErrorMessage = `Network error while trying to fetch from ${fullUrl}. Please check the following:
1. Is the backend server running at ${API_URL}? (Expected: Flask server, often on http://localhost:5000)
2. Is there a network connection from this application to the server?
3. If the frontend (Next.js, e.g., on port 9002) and backend (Flask, e.g., on port 5000) are on different origins, ensure CORS is enabled on the Flask backend server.
   (Original error: ${error.message})`;
    }
    throw new Error(detailedErrorMessage);
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
  const endpoint = '/attendance'; 
  
  const records = await fetchApi<any[]>(endpoint); 
  return records.map(r => ({
    id: `${r.student_id}-${r.date}`, 
    studentId: r.student_id,
    studentName: r.name,
    date: r.date, 
    status: r.status as AttendanceStatus,
  }));
};


export const getAllStudentsApi = async (): Promise<Student[]> => {
  const studentsData = await fetchApi<Array<{ student_id: string; name: string; created_at?: string }>>('/students');
  return studentsData.map(s => ({
    id: s.student_id,
    name: s.name,
    imageUrl: `https://picsum.photos/seed/${s.student_id}/100/100`, 
    registeredAt: s.created_at ? new Date(s.created_at).toISOString() : new Date().toISOString(), 
  }));
};

export const updateAttendanceApi = async (studentId: string, status: AttendanceStatus, date: string): Promise<ApiResponse> => {
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
      date: t.date, 
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

