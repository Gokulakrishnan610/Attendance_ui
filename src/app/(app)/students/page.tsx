"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Users, Search, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAppStore } from '@/store';
import type { Student } from '@/types';
import { PageHeader } from '@/components/page-header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { summarizeVideo, type SummarizeVideoInput } from '@/ai/flows/video-summary'; // Assuming this is where face processing would go

export default function StudentsPage() {
  const { students, addStudent } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students);
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state for adding new student
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentImageFile, setNewStudentImageFile] = useState<File | null>(null);
  const [newStudentImagePreview, setNewStudentImagePreview] = useState<string | null>(null);

  useEffect(() => {
    setFilteredStudents(
      students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, students]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setNewStudentImageFile(file);
      setNewStudentImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName || !newStudentId || !newStudentImageFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and upload an image.",
        variant: "destructive",
      });
      return;
    }

    // Simulate image upload and processing. In a real app, this would involve backend calls.
    // For AI-Powered Face Recognition, this is where you'd use the summarizeVideo or similar GenAI flow
    // by converting the image to a data URI.
    // This example focuses on the UI and state management part.
    
    // For demonstration, let's pretend we're using the video summary flow for an image.
    // This is NOT how it would actually work for face recognition, but shows AI flow integration.
    // A real face recognition flow would be needed.
    if (newStudentImageFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const imageDataUri = reader.result as string;
            // This is a placeholder. summarizeVideo is for videos, not face registration.
            // A proper face registration AI flow is needed.
            try {
                // const summaryResult = await summarizeVideo({ videoDataUri: imageDataUri });
                // console.log("AI 'processing' result (placeholder):", summaryResult);
                // Proceed with adding student if AI processing (simulated) is successful
                 addStudent({ name: newStudentName, studentId: newStudentId, imageUrl: newStudentImagePreview || undefined });
                toast({
                    title: "Student Added",
                    description: `${newStudentName} has been registered. (AI processing simulated)`,
                });
            } catch (error) {
                console.error("AI processing error (placeholder):", error);
                 toast({
                    title: "AI Error",
                    description: "Simulated AI processing failed. Student not added.",
                    variant: "destructive",
                });
                return; // Stop if AI part fails
            }

            setNewStudentName('');
            setNewStudentId('');
            setNewStudentImageFile(null);
            setNewStudentImagePreview(null);
            setIsAddStudentDialogOpen(false);
        };
        reader.readAsDataURL(newStudentImageFile);
    }


  };


  return (
    <>
      <PageHeader 
        title="Students" 
        description="Manage student registrations and view student details."
        actions={
          <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Fill in the details to register a new student. Face image is required for attendance.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} className="col-span-3" placeholder="e.g. John Doe" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="studentId" className="text-right">Student ID</Label>
                  <Input id="studentId" value={newStudentId} onChange={(e) => setNewStudentId(e.target.value)} className="col-span-3" placeholder="e.g. S12345" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="picture" className="text-right">Face Image</Label>
                  <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} className="col-span-3" />
                </div>
                {newStudentImagePreview && (
                  <div className="col-span-4 flex justify-center">
                    <Image src={newStudentImagePreview} alt="Preview" width={100} height={100} className="rounded-md object-cover" data-ai-hint="person student"/>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddStudentDialogOpen(false)}>Cancel</Button>
                <Button type="submit" onClick={handleAddStudent}>Add Student</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground"/>
                Find Students
            </CardTitle>
            <CardDescription>Search for students by name or ID.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>

        {filteredStudents.length > 0 ? (
          <ScrollArea className="h-[calc(100vh-20rem)]"> {/* Adjust height as needed */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="flex flex-col">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="relative h-16 w-16">
                       <Image 
                        src={student.imageUrl || `https://picsum.photos/seed/${student.id}/100/100`} 
                        alt={student.name} 
                        width={64}
                        height={64}
                        className="rounded-full object-cover aspect-square"
                        data-ai-hint="person student"
                      />
                    </div>
                    <div>
                      <CardTitle>{student.name}</CardTitle>
                      <CardDescription>ID: {student.id}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">
                      Registered on: {new Date(student.registeredAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter>
                    {/* <Button variant="outline" size="sm">View Details</Button> */}
                     <p className="text-xs text-muted-foreground">More actions coming soon.</p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <Card>
            <CardContent className="py-10 flex flex-col items-center justify-center text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">No Students Found</h3>
              <p className="text-muted-foreground">
                {students.length === 0 ? "No students registered yet. Click 'Add Student' to begin." : "Your search did not match any students."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
