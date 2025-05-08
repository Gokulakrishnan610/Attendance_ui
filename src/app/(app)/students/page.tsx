// src/app/(app)/students/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Users, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAppStore } from '@/store';
import type { Student } from '@/types';
import { PageHeader } from '@/components/page-header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getAllStudentsApi, addStudentApi } from '@/services/api'; 

export default function StudentsPage() {
  const { students, setStudents } = useAppStore(); 
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState(''); 
  const [newStudentImageFile, setNewStudentImageFile] = useState<File | null>(null);
  const [newStudentImagePreview, setNewStudentImagePreview] = useState<string | null>(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const apiStudents = await getAllStudentsApi();
      setStudents(apiStudents); 
      setFilteredStudents(apiStudents);
    } catch (error: any) {
      console.error("Error fetching students:", error);
      toast({ title: "Error", description: error.message || "Could not fetch students.", variant: "destructive" });
      setFilteredStudents([]); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

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

    const formData = new FormData();
    formData.append('name', newStudentName);
    formData.append('student_id', newStudentId);
    formData.append('image', newStudentImageFile);

    try {
      const response = await addStudentApi(formData);
      if (response.error) {
        throw new Error(response.error);
      }
      toast({
        title: "Student Added",
        description: response.message || `${newStudentName} has been registered.`,
      });
      setNewStudentName('');
      setNewStudentId('');
      setNewStudentImageFile(null);
      setNewStudentImagePreview(null);
      setIsAddStudentDialogOpen(false);
      fetchStudents(); 
    } catch (error: any) {
      console.error("Error adding student:", error);
      toast({
        title: "Error Adding Student",
        description: error.message || "Could not add student.",
        variant: "destructive",
      });
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
            <DialogContent className="sm:max-w-[480px]"> {/* Increased width slightly for better form layout */}
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Fill in the details to register a new student. Face image is required for attendance.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="name" className="sm:text-right sm:col-span-1">Name</Label>
                  <Input id="name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} className="sm:col-span-3" placeholder="e.g. John Doe" />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
                  <Label htmlFor="studentId" className="sm:text-right sm:col-span-1">Student ID</Label>
                  <Input id="studentId" value={newStudentId} onChange={(e) => setNewStudentId(e.target.value)} className="sm:col-span-3" placeholder="e.g. S12345" />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-start sm:gap-4"> {/* items-start for picture label */}
                  <Label htmlFor="picture" className="sm:text-right sm:col-span-1 sm:pt-2">Face Image</Label>
                  <div className="sm:col-span-3 space-y-2">
                    <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} />
                    {newStudentImagePreview && (
                      <div className="flex justify-center sm:justify-start">
                        <Image src={newStudentImagePreview} alt="Preview" width={100} height={100} className="rounded-md object-cover" data-ai-hint="person student"/>
                      </div>
                    )}
                  </div>
                </div>
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
              className="w-full sm:max-w-sm"
            />
          </CardContent>
        </Card>

        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading students...</p>
        ) : filteredStudents.length > 0 ? (
          <ScrollArea className="h-[calc(100vh-24rem)] sm:h-[calc(100vh-20rem)]"> {/* Adjust height for search bar */}
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="flex flex-col h-full"> {/* Added h-full for uniform height */}
                  <CardHeader className="flex flex-row items-center gap-4 p-4">
                    <div className="relative h-16 w-16 shrink-0">
                       <Image
                        src={student.imageUrl || `https://picsum.photos/seed/${student.id}/100/100`}
                        alt={student.name}
                        width={64}
                        height={64}
                        className="rounded-full object-cover aspect-square"
                        data-ai-hint="person student"
                      />
                    </div>
                    <div className="min-w-0"> {/* Added for text truncation if needed */}
                      <CardTitle className="truncate">{student.name}</CardTitle>
                      <CardDescription>ID: {student.id}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow px-4 pb-2 pt-0">
                    {student.registeredAt ? (
                      <p className="text-sm text-muted-foreground">
                        Registered on: {new Date(student.registeredAt).toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Registration date not available.
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="px-4 pb-4 pt-2 mt-auto"> {/* Added mt-auto to push footer to bottom */}
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

