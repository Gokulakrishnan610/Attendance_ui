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
import { summarizeVideo, type SummarizeVideoInput } from '@/ai/flows/video-summary';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';

export default function AttendancePage() {
  const { students, attendanceRecords, addAttendanceRecord, updateAttendanceRecord } = useAppStore();
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

  useEffect(() => {
    const recordsForDate = attendanceRecords.filter(r => r.date === formattedDate);
    const studentMap = new Map(students.map(s => [s.id, s]));
    
    const enrichedRecords: AttendanceRecord[] = [];
    const recordedStudentIds = new Set(recordsForDate.map(r => r.studentId));

    // Add existing records
    recordsForDate.forEach(record => {
        enrichedRecords.push({
            ...record,
            studentName: studentMap.get(record.studentId)?.name || 'Unknown Student'
        });
    });

    // Add students who are not in recordsForDate as 'Absent' for the selected day
    students.forEach(student => {
        if (!recordedStudentIds.has(student.id)) {
            enrichedRecords.push({
                id: `new-${student.id}-${formattedDate}`, // Temporary ID for new records
                studentId: student.id,
                studentName: student.name,
                date: formattedDate,
                status: 'Absent', // Default to Absent if no record found
            });
        }
    });
    
    setDailyRecords(enrichedRecords.sort((a,b) => a.studentName.localeCompare(b.studentName)));
  }, [selectedDate, attendanceRecords, students, formattedDate]);

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

  const handleManualUpdate = () => {
    if (selectedRecordForUpdate) {
      // If it's a new record (ID starts with 'new-'), add it. Otherwise, update.
      if (selectedRecordForUpdate.id.startsWith('new-')) {
        addAttendanceRecord({
          studentId: selectedRecordForUpdate.studentId,
          studentName: selectedRecordForUpdate.studentName,
          date: selectedRecordForUpdate.date,
          status: newStatus,
        });
      } else {
        updateAttendanceRecord(selectedRecordForUpdate.id, newStatus);
      }
      toast({ title: "Attendance Updated", description: `${selectedRecordForUpdate.studentName}'s status set to ${newStatus}.` });
      setIsManualUpdateDialogOpen(false);
      setSelectedRecordForUpdate(null);
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

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const videoDataUri = reader.result as string;
        const input: SummarizeVideoInput = { videoDataUri };
        
        // The summarizeVideo flow is a placeholder for actual face recognition.
        // In a real app, this flow would identify students and update their attendance.
        const result = await summarizeVideo(input); 
        console.log("Video processing result (summary):", result.summary);

        // Simulate marking attendance based on AI (placeholder logic)
        // This is highly simplified. A real system would match faces to student IDs.
        students.slice(0, Math.floor(students.length / 2)).forEach(student => { // Mark ~half as present
            const existingRecord = dailyRecords.find(r => r.studentId === student.id && r.date === formattedDate);
            if (existingRecord?.id.startsWith('new-')) {
                 addAttendanceRecord({ studentId: student.id, studentName: student.name, date: formattedDate, status: 'Present' });
            } else if (existingRecord) {
                updateAttendanceRecord(existingRecord.id, 'Present');
            } else {
                 addAttendanceRecord({ studentId: student.id, studentName: student.name, date: formattedDate, status: 'Present' });
            }
        });
        
        toast({ title: "Video Processed", description: `Attendance potentially updated based on video analysis (summary: ${result.summary.substring(0,50)}...). Check records.` });
        setVideoFile(null);
        setIsVideoUploadDialogOpen(false);
      };
      reader.readAsDataURL(videoFile);

    } catch (error) {
      console.error("Error processing video:", error);
      toast({ title: "Processing Error", description: "Could not process the video.", variant: "destructive" });
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
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
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
                <Button>
                  <UploadCloud className="mr-2 h-4 w-4" /> Upload Video
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Video /> Process Attendance Video</DialogTitle>
                  <DialogDescription>
                    Upload a class video. The AI will attempt to recognize students and mark attendance.
                    This is a feature demonstration using a video summarization AI as a placeholder for actual face recognition.
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
          </>
        }
      />
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Attendance for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
            <CardDescription>
              {dailyRecords.length > 0 
                ? `Showing ${dailyRecords.length} student records for this day.`
                : `No attendance records found for this day, or no students registered.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
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
                    <TableRow key={record.studentId + record.date}> {/* Use composite key */}
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
              <p className="text-muted-foreground text-center py-8">All registered students are currently marked as absent for this day. You can manually update their status or upload a video.</p>
            )}
          </CardContent>
        </Card>

        <Dialog open={isManualUpdateDialogOpen} onOpenChange={setIsManualUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Attendance for {selectedRecordForUpdate?.studentName}</DialogTitle>
              <DialogDescription>Date: {selectedRecordForUpdate ? format(parseISO(selectedRecordForUpdate.date), "PPP") : ""}</DialogDescription>
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
