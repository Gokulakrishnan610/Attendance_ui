// src/app/(app)/settings/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Shield, FileText, Save, Download } from "lucide-react"; // Added Download
import { useAppStore } from '@/store';
import type { AppSettings } from '@/types';
import { PageHeader } from '@/components/page-header';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { exportCsvApiUrl } from '@/services/api'; // Import API for CSV export

export default function SettingsPage() {
  const { appSettings, updateAppSettings } = useAppStore();
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(appSettings);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentSettings(appSettings);
  }, [appSettings]);

  const handleSettingChange = (section: keyof AppSettings, key: any, value: any) => {
    setCurrentSettings(prev => {
      const updatedSection = { ...prev[section], [key]: value };
      return { ...prev, [section]: updatedSection };
    });
  };
  
  const handleSimpleChange = (key: keyof AppSettings, value: any) => {
     setCurrentSettings(prev => ({ ...prev, [key]: value }));
  };


  const handleSaveChanges = () => {
    updateAppSettings(currentSettings);
    toast({
      title: "Settings Saved",
      description: "Your application settings have been updated.",
    });
  };

  const handleExportCsv = () => {
    // Directly open the URL for download
    window.open(exportCsvApiUrl, '_blank');
    toast({
        title: "Exporting CSV",
        description: "Your CSV export should start downloading shortly.",
    });
  };

  return (
    <>
      <PageHeader title="Application Settings" description="Customize your app experience and preferences." />
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications from the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2 p-3 rounded-md border hover:bg-accent/50 transition-colors">
                <Label htmlFor="email-notifications" className="font-medium">
                  Email Notifications
                  <p className="text-xs text-muted-foreground">Receive important updates via email.</p>
                </Label>
                <Switch
                  id="email-notifications"
                  checked={currentSettings.notifications.email}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'email', checked)}
                  aria-label="Toggle email notifications"
                />
              </div>
              <div className="flex items-center justify-between space-x-2 p-3 rounded-md border hover:bg-accent/50 transition-colors">
                <Label htmlFor="push-notifications" className="font-medium">
                  Push Notifications
                  <p className="text-xs text-muted-foreground">Get real-time alerts on your device (if supported).</p>
                </Label>
                <Switch
                  id="push-notifications"
                  checked={currentSettings.notifications.push}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'push', checked)}
                  aria-label="Toggle push notifications"
                  disabled // Placeholder as this often requires specific setup
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Reports</CardTitle>
              <CardDescription>Manage attendance reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between space-x-2 p-3 rounded-md border hover:bg-accent/50 transition-colors">
                <Label htmlFor="export-csv" className="font-medium">
                  Export Attendance CSV
                  <p className="text-xs text-muted-foreground">Download a CSV file of all attendance records.</p>
                </Label>
                <Button onClick={handleExportCsv} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4"/> Export CSV
                </Button>
              </div>
              <div className="opacity-50 pointer-events-none"> {/* Disabled scheduled reports section */}
                  <div className="flex items-center justify-between space-x-2 p-3 rounded-md border">
                    <Label htmlFor="scheduled-reports-enabled" className="font-medium">
                      Enable Scheduled Reports (Coming Soon)
                      <p className="text-xs text-muted-foreground">Automatically generate and send attendance reports.</p>
                    </Label>
                    <Switch
                      id="scheduled-reports-enabled"
                      checked={currentSettings.scheduledReports.enabled}
                      onCheckedChange={(checked) => handleSettingChange('scheduledReports', 'enabled', checked)}
                      aria-label="Toggle scheduled reports"
                      disabled
                    />
                  </div>
                  {currentSettings.scheduledReports.enabled && (
                    <div className="space-y-2 p-3 rounded-md border mt-2">
                      <Label htmlFor="report-frequency">Report Frequency</Label>
                      <Select
                        value={currentSettings.scheduledReports.frequency}
                        onValueChange={(value) => handleSettingChange('scheduledReports', 'frequency', value as 'daily' | 'weekly' | 'monthly')}
                        disabled
                      >
                        <SelectTrigger id="report-frequency" aria-label="Select report frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Data & Privacy</CardTitle>
              <CardDescription>Control how your data is used within the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2 p-3 rounded-md border hover:bg-accent/50 transition-colors">
                <Label htmlFor="share-analytics" className="font-medium">
                  Share Anonymous Analytics
                  <p className="text-xs text-muted-foreground">Help us improve the app by sharing anonymous usage data.</p>
                </Label>
                <Switch
                  id="share-analytics"
                  checked={currentSettings.dataPrivacy.shareAnalytics}
                  onCheckedChange={(checked) => handleSettingChange('dataPrivacy', 'shareAnalytics', checked)}
                  aria-label="Toggle anonymous analytics sharing"
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSaveChanges}>
              <Save className="mr-2 h-4 w-4" /> Save All Settings
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

