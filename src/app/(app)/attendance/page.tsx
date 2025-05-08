// src/app/(app)/attendance/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { CalendarIcon, CheckCircle, XCircle, Clock, Edit3, UploadCloud, Video } from "lucide-react";
import { useAppStore } from '@/store';
import type { AttendanceRecord, Student, AttendanceStatus } from '@/types';
import { PageHeader } from '@/components/page-header';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { getAttendanceApi, recognizeFacesApi, updateAttendanceApi, getAllStudentsApi } from '@/services/api'; 

export default function AttendancePage() {
  const { students, setStudents } = useAppStore(); 
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyRecords, setDailyRecords] = useState<AttendanceRecord[]>([]); 
  
  const [isManualUpdateDialogOpen, setIsManualUpdateDialogOpen] = useState(false);
  const [selectedRecordForUpdate, setSelectedRecordForUpdate] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('Present');
  
  const [isVideoUploadDialogOpen, setIsVideoUploadDialogOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const { toast } = useToast();

  const formattedDate = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  const fetchStudentList = async () => {
    setIsLoadingStudents(true);
    try {
      const apiStudents = await getAllStudentsApi();
      setStudents(apiStudents);
    } catch (error) {
      console.error("Error fetching student list:", error);
      toast({ title: "Error", description: "Could not fetch student list.", variant: "destructive" });
    } finally {
      setIsLoadingStudents(false);
    }
  };
  
  const fetchAttendanceForDate = async (dateStr: string) => {
    if (students.length === 0 && !isLoadingStudents) { 
      console.warn("Student list not loaded, cannot accurately determine full attendance yet.");
    }
    setIsLoadingAttendance(true);
    try {
      const apiRecords = await getAttendanceApi(dateStr); 
      
      const studentMap = new Map(students.map(s => [s.id, s]));
      const recordsMap = new Map(apiRecords.map(r => [r.studentId, r]));
      
      const enrichedRecords: AttendanceRecord[] = students.map(student => {
        const existingApiRecord = recordsMap.get(student.id);
        if (existingApiRecord) {
          return { ...existingApiRecord, studentName: student.name }; 
        } else {
          return {
            id: `new-${student.id}-${dateStr}`, 
            studentId: student.id,
            studentName: student.name,
            date: dateStr,
            status: 'Absent',
          };
        }
      }).sort((a,b) => a.studentName.localeCompare(b.studentName));
      
      setDailyRecords(enrichedRecords);

    } catch (error: any) {
      console.error(`Error fetching attendance for ${dateStr}:`, error);
      toast({ title: "Error", description: error.message || `Could not fetch attendance for ${format(parseISO(dateStr), "PPP")}.`, variant: "destructive" });
       if (students.length > 0) {
        const fallbackRecords = students.map(student => ({
            id: `fallback-${student.id}-${dateStr}`,
            studentId: student.id,
            studentName: student.name,
            date: dateStr,
            status: 'Absent' as AttendanceStatus,
        })).sort((a,b) => a.studentName.localeCompare(b.studentName));
        setDailyRecords(fallbackRecords);
       } else {
        setDailyRecords([]);
       }
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  useEffect(() => {
    fetchStudentList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (!isLoadingStudents) { 
        fetchAttendanceForDate(formattedDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, formattedDate, isLoadingStudents, students]); 

  const handleDateChange = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const openManualUpdateDialog = (record: AttendanceRecord) => {
    setSelectedRecordForUpdate(record);
    setNewStatus(record.status);
    setIsManualUpdateDialogOpen(true);
  };

  const handleManualUpdate = async () => {
    if (selectedRecordForUpdate) {
      try {
        // Backend's /update_attendance uses today's date, not the provided one.
        // For UI consistency, we pass selectedRecordForUpdate.date
        // but the actual update might be for current day based on backend logic.
        const response = await updateAttendanceApi(selectedRecordForUpdate.studentId, newStatus, selectedRecordForUpdate.date);
        if (response.error) throw new Error(response.error);
        toast({ title: "Attendance Updated", description: response.message || `${selectedRecordForUpdate.studentName}'s status set to ${newStatus}.` });
        fetchAttendanceForDate(formattedDate); 
      } catch (error: any) {
        console.error("Error updating attendance:", error);
        toast({ title: "Update Error", description: error.message || "Could not update attendance.", variant: "destructive" });
      } finally {
        setIsManualUpdateDialogOpen(false);
        setSelectedRecordForUpdate(null);
      }
    }
  };
  
  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setVideoFile(event.target.files[0]);
    }
  };

  const handleVideoUpload = async () => {
    if (!videoFile) {
      toast({ title: "No Video Selected", description: "Please select a video file to upload.", variant: "destructive" });
      return;
    }
    setIsProcessingVideo(true);
    toast({ title: "Processing Video", description: "This may take a few moments..." });

    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      const response = await recognizeFacesApi(formData);
      if (response.error) throw new Error(response.error);
      
      toast({ 
        title: "Video Processed", 
        description: response.message || `Attendance marked. Present: ${response.present_count ?? 0}, Absent: ${response.absent_count ?? 0}. Records refreshed.` 
      });
      // Video processing always marks for today. If selectedDate is not today, the user might be confused.
      // It's better to set selectedDate to today after successful video processing.
      const today = new Date();
      setSelectedDate(today); // This will trigger re-fetch for today's date.
      // If fetchAttendanceForDate is not automatically triggered by selectedDate change (due to memoization or other logic), call it explicitly:
      // fetchAttendanceForDate(format(today, 'yyyy-MM-dd')); 
      setVideoFile(null);
      setIsVideoUploadDialogOpen(false);
    } catch (error: any) {
      console.error("Error processing video:", error);
      toast({ title: "Processing Error", description: error.message || "Could not process the video.", variant: "destructive" });
    } finally {
      setIsProcessingVideo(false);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present': return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Present</Badge>;
      case 'Absent': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Absent</Badge>;
      case 'Late': return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500"><Clock className="mr-1 h-3 w-3" />Late</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <PageHeader 
        title="Attendance Records" 
        description="View and manage student attendance. Select a date to see records."
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={handleDateChange} initialFocus />
              </PopoverContent>
            </Popover>
             <Dialog open={isVideoUploadDialogOpen} onOpenChange={setIsVideoUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <UploadCloud className="mr-2 h-4 w-4" /> Upload Video
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Video /> Process Attendance Video</DialogTitle>
                  <DialogDescription>
                    Upload a class video. The system will attempt to recognize students and mark attendance for <strong>today</strong>.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Label htmlFor="videoFile">Video File</Label>
                    <Input id="videoFile" type="file" accept="video/*" onChange={handleVideoFileChange} />
                    {videoFile && <p className="text-sm text-muted-foreground">Selected: {videoFile.name}</p>}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsVideoUploadDialogOpen(false)} disabled={isProcessingVideo}>Cancel</Button>
                  <Button onClick={handleVideoUpload} disabled={!videoFile || isProcessingVideo}>
                    {isProcessingVideo ? "Processing..." : "Upload & Process"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Attendance for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
            <CardDescription>
              {isLoadingAttendance || isLoadingStudents
                ? "Loading records..."
                : dailyRecords.length > 0 
                  ? `Showing ${dailyRecords.length} student records for this day.`
                  : students.length === 0 
                    ? "No students registered in the system yet. Please add students first."
                    : "No attendance data for this day, or all students are marked absent."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAttendance || isLoadingStudents ? (
                <p className="text-muted-foreground text-center py-8">Loading data...</p>
            ) : students.length === 0 ? (
                 <p className="text-muted-foreground text-center py-8">No students registered in the system yet. Please add students first.</p>
            ) : dailyRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyRecords.map((record) => (
                    <TableRow key={record.studentId + record.date}>
                      <TableCell className="font-medium">{record.studentName}</TableCell>
                      <TableCell>{record.studentId}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openManualUpdateDialog(record)}>
                          <Edit3 className="mr-2 h-4 w-4" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                All registered students are currently marked as absent for this day, or no data available. You can manually update their status or upload a video for today's attendance.
              </p>
            )}
          </CardContent>
        </Card>

        <Dialog open={isManualUpdateDialogOpen} onOpenChange={setIsManualUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Attendance for {selectedRecordForUpdate?.studentName}</DialogTitle>
              <DialogDescription>
                Date: {selectedRecordForUpdate ? format(parseISO(selectedRecordForUpdate.date), "PPP") : ""}. 
                Note: The backend might save this update for the current date ({format(new Date(), "PPP")}) regardless of the date shown here.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as AttendanceStatus)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsManualUpdateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleManualUpdate}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
