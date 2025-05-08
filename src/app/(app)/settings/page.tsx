"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Shield, FileText, Save } from "lucide-react";
import { useAppStore } from '@/store';
import type { AppSettings } from '@/types';
import { PageHeader } from '@/components/page-header';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

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
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Scheduled Reports</CardTitle>
              <CardDescription>Configure automated attendance reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2 p-3 rounded-md border hover:bg-accent/50 transition-colors">
                <Label htmlFor="scheduled-reports-enabled" className="font-medium">
                  Enable Scheduled Reports
                  <p className="text-xs text-muted-foreground">Automatically generate and send attendance reports.</p>
                </Label>
                <Switch
                  id="scheduled-reports-enabled"
                  checked={currentSettings.scheduledReports.enabled}
                  onCheckedChange={(checked) => handleSettingChange('scheduledReports', 'enabled', checked)}
                  aria-label="Toggle scheduled reports"
                />
              </div>
              {currentSettings.scheduledReports.enabled && (
                <div className="space-y-2 p-3 rounded-md border">
                  <Label htmlFor="report-frequency">Report Frequency</Label>
                  <Select
                    value={currentSettings.scheduledReports.frequency}
                    onValueChange={(value) => handleSettingChange('scheduledReports', 'frequency', value as 'daily' | 'weekly' | 'monthly')}
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
