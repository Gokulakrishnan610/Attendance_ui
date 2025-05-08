// src/app/(app)/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CheckCircle, XCircle, Clock, TrendingUp, BarChart2, BrainCircuit } from "lucide-react";
import type { DailyAttendanceStats, AttendanceTrendItem } from '@/types';
import { PageHeader } from '@/components/page-header';
import { getAttendanceStatsApi, getAllStudentsApi, trainModelApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [todayStats, setTodayStats] = useState<DailyAttendanceStats | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsResponse, studentsResponse] = await Promise.all([
        getAttendanceStatsApi(),
        getAllStudentsApi()
      ]);
      
      setTodayStats(statsResponse.today);
      setAttendanceTrend(statsResponse.attendanceTrend);
      setTotalStudents(studentsResponse.length);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({ title: "Error", description: "Could not fetch dashboard data.", variant: "destructive" });
      setTodayStats({ present: 0, absent: 0, late: 0, total: 0 }); // Default on error
      setAttendanceTrend([]);
      setTotalStudents(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTrainModel = async () => {
    setIsTraining(true);
    toast({ title: "Training Model", description: "Updating face recognition model with latest student data..." });
    try {
        const response = await trainModelApi();
        if (response.error) throw new Error(response.error);
        toast({ title: "Model Trained", description: response.message || `Model updated with ${response.student_count} students.` });
    } catch (error: any) {
        toast({ title: "Training Failed", description: error.message || "Could not train the model.", variant: "destructive" });
    } finally {
        setIsTraining(false);
    }
  };

  if (isLoading) {
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
         <PageHeader 
            title="Dashboard" 
            description="Overview of attendance and student statistics."
            actions={<Button onClick={handleTrainModel} disabled={isTraining}><BrainCircuit className="mr-2 h-4 w-4"/> {isTraining ? "Training..." : "Train Model"}</Button>} 
          />
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
    );
  }

  if (!todayStats) {
     return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
         <PageHeader 
            title="Dashboard" 
            description="Overview of attendance and student statistics."
            actions={<Button onClick={handleTrainModel} disabled={isTraining}><BrainCircuit className="mr-2 h-4 w-4"/> {isTraining ? "Training..." : "Train Model"}</Button>}
          />
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Could not load dashboard data. Please try again.</p>
          </div>
        </div>
    );
  }

  const pieData = [
    { name: 'Present', value: todayStats.present },
    { name: 'Absent', value: todayStats.absent },
    { name: 'Late', value: todayStats.late },
  ].filter(item => item.value > 0);


  return (
    <>
      <PageHeader 
        title="Dashboard" 
        description="Overview of attendance and student statistics."
        actions={<Button onClick={handleTrainModel} disabled={isTraining}><BrainCircuit className="mr-2 h-4 w-4"/> {isTraining ? "Training..." : "Train Model"}</Button>}
      />
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Registered in system</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.present}</div>
              <p className="text-xs text-muted-foreground">
                {totalStudents > 0 ? `${Math.round((todayStats.present / totalStudents) * 100)}%` : 'N/A'} of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
              <XCircle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.absent}</div>
               <p className="text-xs text-muted-foreground">
                {totalStudents > 0 ? `${Math.round((todayStats.absent / totalStudents) * 100)}%` : 'N/A'} of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Today</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.late}</div>
              <p className="text-xs text-muted-foreground">
                 {totalStudents > 0 ? `${Math.round((todayStats.late / totalStudents) * 100)}%` : 'N/A'} of total
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Attendance Trend (Last 7 Days)
              </CardTitle>
              <CardDescription>Daily count of present, absent, and late students.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="present" fill="hsl(var(--chart-1))" name="Present" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="hsl(var(--chart-2))" name="Absent" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" fill="hsl(var(--chart-3))" name="Late" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                Today's Attendance Overview
              </CardTitle>
              <CardDescription>Distribution of student attendance status for today.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                   <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
