// src/services/api.ts
import type { Student, AttendanceRecord, AttendanceStatus, DailyAttendanceStats, AttendanceTrendItem } from '@/types';

const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL;
// Default to http://localhost:5000 (common for local Flask dev) if NEXT_PUBLIC_API_URL is not set.
const API_URL = ENV_API_URL || 'http://localhost:5000';

if (!ENV_API_URL) {
  // Log a warning if the environment variable is not set and we're using the default.
  // This is important for developers to know, especially for deployment.
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
  // API_URL is now guaranteed to be a string (either from env or default).
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
        // If response is not JSON, use statusText or generic message
        errorData = { error: response.statusText || `HTTP error! status: ${response.status}` };
      }
      // Use the error message from backend if available, otherwise a generic one.
      throw new Error(errorData?.error || `HTTP error! status: ${response.status} when fetching ${fullUrl}`);
    }
    return response.json() as Promise<T>;
  } catch (error: any) {
    // Log the original error object for more detailed debugging if needed
    console.error(`API call failed for ${fullUrl}:`, error); 
    
    let detailedErrorMessage = `Error communicating with the backend API at ${fullUrl}. `;

    if (error instanceof TypeError && error.message.toLowerCase() === 'failed to fetch') {
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
      // For other types of errors (e.g., JSON parsing errors if !response.ok but body is not JSON error, or backend-returned error messages)
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
  // The backend /attendance route returns records for today if no date is specified.
  // To fetch for a specific date, the backend would need modification or we filter client-side.
  // Assuming backend /attendance always gives "today" as per current Flask code structure
  // Or if it expects a query param, it would be like: `/attendance?date=${date}`
  // Current flask code for /attendance hardcodes today_date.
  // For now, let's assume the frontend request for a specific date implies we expect the backend to handle it or filter from a larger set.
  // The flask endpoint /attendance currently only returns today's attendance.
  // To support fetching by arbitrary date, backend must be updated.
  // For this iteration, we'll assume the backend is updated to accept a date query parameter.
  const endpoint = `/attendance?date=${date}`; 
  
  const records = await fetchApi<any[]>(endpoint); 
  return records.map(r => ({
    id: `${r.student_id}-${r.date}`, 
    studentId: r.student_id,
    studentName: r.name, // Assuming backend joins with students table to provide name
    date: r.date, 
    status: r.status as AttendanceStatus,
  }));
};


export const getAllStudentsApi = async (): Promise<Student[]> => {
  const studentsData = await fetchApi<Array<{ student_id: string; name: string; created_at?: string }>>('/students');
  return studentsData.map(s => ({
    id: s.student_id,
    name: s.name,
    // Using a placeholder image as backend doesn't provide imageUrl
    imageUrl: `https://picsum.photos/seed/${s.student_id}/100/100`, 
    // Backend provides created_at, ensure it's handled
    registeredAt: s.created_at ? new Date(s.created_at).toISOString() : new Date().toISOString(), 
  }));
};

// Backend update_attendance updates for today's date by default.
// If specific date update is needed, backend needs to accept 'date' in payload.
export const updateAttendanceApi = async (studentId: string, status: AttendanceStatus, date: string): Promise<ApiResponse> => {
  return fetchApi<ApiResponse>('/update_attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Sending date as part of the payload. Backend needs to use this.
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

  // Ensure total is calculated correctly even if some statuses are missing
  const totalToday = (backendToday.Present || 0) + (backendToday.Absent || 0) + (backendToday.Late || 0);

  return {
    today: {
      present: backendToday.Present || 0,
      absent: backendToday.Absent || 0,
      late: backendToday.Late || 0,
      total: totalToday, 
    },
    attendanceTrend: backendTrend.map(t => ({
      date: t.date, // Assuming t.date is already in YYYY-MM-DD string format
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

// This provides the full URL directly, useful for window.open or <a> tags for downloads
export const exportCsvApiUrl = `${API_URL}/export_csv`;