// src/services/api.ts
import type { Student, AttendanceRecord, AttendanceStatus, DailyAttendanceStats, AttendanceTrendItem } from '@/types';

const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_URL = ENV_API_URL || 'http://127.0.0.1:5000'; // Default to 127.0.0.1:5000

if (!ENV_API_URL && process.env.NODE_ENV !== 'test') { // Added a check for NODE_ENV to avoid console warnings during tests
  console.warn(
    `WARNING: NEXT_PUBLIC_API_URL is not defined in your environment. ` +
    `The application is falling back to the default API URL: '${API_URL}'. ` +
    `For production or specific local setups, please define NEXT_PUBLIC_API_URL in your .env file (e.g., .env.local or .env) ` +
    `and ensure the Next.js development server has been restarted if changes were made.`
  );
}


interface ApiResponse {
  message?: string;
  error?: string;
}

// interface StudentsApiResponse extends ApiResponse {
//   data?: Student[];
// }

// interface AttendanceApiResponse extends ApiResponse {
//   data?: AttendanceRecord[];
// }

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

    let detailedErrorMessage = `Error communicating with the backend API at ${fullUrl}. `;

    if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) { // .includes for broader matching
      detailedErrorMessage += `This often indicates a network issue, the backend server not running, or a CORS misconfiguration.
Please verify:
1. The backend server is running and accessible at: ${API_URL} (Current effective API base URL${!ENV_API_URL ? " - defaulted as NEXT_PUBLIC_API_URL was not set" : ""}).
2. If the frontend and backend are on different origins (e.g., ports), ensure CORS is enabled on the backend server (e.g., Flask) to accept requests from this application's origin.
   For Flask, you can use the 'flask-cors' library:
     - Install: pip install flask-cors
     - Usage in your Flask app:
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
  });
};

export const recognizeFacesApi = async (formData: FormData): Promise<RecognizeResponse> => {
  return fetchApi<RecognizeResponse>('/recognize', {
    method: 'POST',
    body: formData,
  });
};

export const getAttendanceApi = async (date: string): Promise<AttendanceRecord[]> => {
  const endpoint = `/attendance?date=${date}`;
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
  // Backend for /students currently returns: { student_id: string; name: string; }
  // It does not return created_at based on the provided Python code.
  const studentsData = await fetchApi<Array<{ student_id: string; name: string; created_at?: string }>>('/students');
  return studentsData.map(s => ({
    id: s.student_id,
    name: s.name,
    imageUrl: `https://picsum.photos/seed/${s.student_id}/100/100`,
    // If s.created_at is not provided by backend, registeredAt will be undefined.
    registeredAt: s.created_at ? new Date(s.created_at).toISOString() : undefined,
  }));
};

export const updateAttendanceApi = async (studentId: string, status: AttendanceStatus, date: string): Promise<ApiResponse> => {
  // Note: The provided backend's /update_attendance endpoint currently ignores the 'date' field in the payload
  // and always updates/inserts records for the current day (today_date).
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