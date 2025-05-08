// src/services/api.ts
import type { Student, AttendanceRecord, AttendanceStatus, DailyAttendanceStats, AttendanceTrendItem } from '@/types';

const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL;
// Fallback to 127.0.0.1:5000 if NEXT_PUBLIC_API_URL is not set or is an empty string
const API_URL = (ENV_API_URL && ENV_API_URL.trim() !== '') ? ENV_API_URL.trim() : 'http://127.0.0.1:5000';


if (!ENV_API_URL || ENV_API_URL.trim() === '') {
  // Avoid console warnings during test environments or if intentionally not set for other reasons.
  if (process.env.NODE_ENV !== 'test' && typeof window !== 'undefined') { // Check for browser environment
    console.warn(
      `WARNING: NEXT_PUBLIC_API_URL is not defined or is empty in your environment. ` +
      `The application is falling back to the default API URL: '${API_URL}'. ` +
      `For production or specific local setups, please define NEXT_PUBLIC_API_URL in your .env file (e.g., .env.local or .env) ` +
      `and ensure the Next.js development server has been restarted if changes were made.`
    );
  }
}


interface ApiResponse {
  message?: string;
  error?: string;
}

interface RecognizeResponse extends ApiResponse {
  present_count?: number;
  absent_count?: number;
}

interface TrainModelResponse extends ApiResponse {
  student_count?: number;
}

// This interface matches the actual JSON keys from the Python backend
interface AttendanceStatsApiResponseBackend {
  today: { Present?: number; Absent?: number; Late?: number; };
  trend: Array<{ date: string; Present?: number; Absent?: number; Late?: number; }>;
}

// This interface matches the actual JSON keys from the Python backend for the /attendance endpoint
interface AttendanceRecordBackend {
    student_id: string;
    name: string;
    date: string; // Should be YYYY-MM-DD string
    status: string; // "Present", "Absent", "Late"
}


// Helper function for API requests
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
        // If response is not JSON or some other error during parsing
        errorData = { error: response.statusText || `HTTP error! status: ${response.status}` };
      }
      // Ensure errorData.error is a string
      const errorMessage = typeof errorData?.error === 'string' ? errorData.error : `HTTP error! status: ${response.status} when fetching ${fullUrl}`;
      throw new Error(errorMessage);
    }
    return response.json() as Promise<T>;
  } catch (error: any) {
    console.error(`API call failed for ${fullUrl}:`, error);

    let detailedErrorMessage = `Error communicating with the backend API at ${fullUrl}. `;

    if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
      detailedErrorMessage += `This often indicates a network issue, the backend server not running, or a CORS misconfiguration.
Please verify:
1. The backend server is running and accessible at: ${API_URL} (Current effective API base URL${(!ENV_API_URL || ENV_API_URL.trim() === '') ? " - defaulted as NEXT_PUBLIC_API_URL was not set/empty" : ""}).
2. If the frontend and backend are on different origins (e.g., http://localhost:9002 and http://127.0.0.1:5000), ensure CORS is enabled on the backend server (e.g., Flask) to accept requests from this application's origin.
   Your Python Flask backend should include (as it now does):
     from flask_cors import CORS
     app = Flask(__name__)
     CORS(app) # This enables CORS for all routes and origins.
Original error: ${error.message}`;
    } else {
      detailedErrorMessage += `Details: ${error.message}`;
    }
    throw new Error(detailedErrorMessage);
  }
}

export const addStudentApi = async (formData: FormData): Promise<ApiResponse> => {
  return fetchApi<ApiResponse>('/add_student', {
    method: 'POST',
    body: formData,
    // No 'Content-Type' header needed for FormData; browser sets it with boundary
  });
};

export const recognizeFacesApi = async (formData: FormData): Promise<RecognizeResponse> => {
  return fetchApi<RecognizeResponse>('/recognize', {
    method: 'POST',
    body: formData,
    // No 'Content-Type' header needed for FormData
  });
};

// Backend for /attendance currently returns today's data, ignoring 'date' query param.
// Frontend still sends date, and page logic handles merging with all students.
export const getAttendanceApi = async (date: string): Promise<AttendanceRecord[]> => {
  const endpoint = `/attendance?date=${date}`;
  const records = await fetchApi<AttendanceRecordBackend[]>(endpoint);
  return records.map(r => ({
    id: `${r.student_id}-${r.date}`, // Frontend specific ID
    studentId: r.student_id,
    studentName: r.name, // Backend provides 'name' directly in this endpoint
    date: r.date,
    status: r.status as AttendanceStatus,
  }));
};


export const getAllStudentsApi = async (): Promise<Student[]> => {
  // Backend for /students returns: { student_id: string; name: string; }[]
  // It does not return created_at based on the provided Python code.
  const studentsData = await fetchApi<Array<{ student_id: string; name: string; created_at?: string }>>('/students');
  return studentsData.map(s => ({
    id: s.student_id,
    name: s.name,
    imageUrl: `https://picsum.photos/seed/${s.student_id}/100/100`, // Placeholder image
    registeredAt: s.created_at ? new Date(s.created_at).toISOString() : undefined, // Will be undefined as backend doesn't send it
  }));
};

// Note: The backend's /update_attendance endpoint ignores 'date' in payload, uses current day.
// Frontend dialog in AttendancePage informs user about this.
export const updateAttendanceApi = async (studentId: string, status: AttendanceStatus, date: string): Promise<ApiResponse> => {
  return fetchApi<ApiResponse>('/update_attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, status: status, date: date }),
  });
};


export const getAttendanceStatsApi = async (): Promise<{
  today: DailyAttendanceStats;
  attendanceTrend: AttendanceTrendItem[];
}> => {
  const response = await fetchApi<AttendanceStatsApiResponseBackend>('/attendance_stats');
  const backendToday = response.today;
  const backendTrend = response.trend;

  // Ensure all properties exist, defaulting to 0 if not provided by backend
  const presentToday = backendToday.Present || 0;
  const absentToday = backendToday.Absent || 0;
  const lateToday = backendToday.Late || 0;
  const totalToday = presentToday + absentToday + lateToday;

  return {
    today: {
      present: presentToday,
      absent: absentToday,
      late: lateToday,
      total: totalToday,
    },
    attendanceTrend: backendTrend.map(t => ({
      date: t.date,
      present: t.Present || 0,
      absent: t.Absent || 0,
      late: t.Late || 0,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), // Ensure trend is sorted by date
  };
};

export const trainModelApi = async (): Promise<TrainModelResponse> => {
    return fetchApi<TrainModelResponse>('/train_model', {
        method: 'POST',
    });
};

export const exportCsvApiUrl = `${API_URL}/export_csv`;
