"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Save, Camera } from "lucide-react";
import { useAppStore } from '@/store';
import type { UserProfile } from '@/types';
import { PageHeader } from '@/components/page-header';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { userProfile, updateUserProfile } = useAppStore();
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(userProfile.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setName(userProfile.name);
    setEmail(userProfile.email);
    setAvatarPreview(userProfile.avatarUrl);
  }, [userProfile]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = () => {
    // In a real app, if avatarFile exists, upload it and get URL
    // For now, we just update with the preview URL or existing URL
    const newAvatarUrl = avatarFile ? avatarPreview : userProfile.avatarUrl;
    
    updateUserProfile({ name, email, avatarUrl: newAvatarUrl });
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved.",
    });
    setAvatarFile(null); // Reset file input after "saving"
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  return (
    <>
      <PageHeader title="User Profile" description="Manage your personal information and profile picture." />
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Profile Details</CardTitle>
            <CardDescription>Update your name, email, and profile picture.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={avatarPreview} alt={name} data-ai-hint="person user" />
                <AvatarFallback className="text-4xl">{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="relative">
                <Button variant="outline" size="sm" asChild>
                  <Label htmlFor="avatarUpload" className="cursor-pointer">
                    <Camera className="mr-2 h-4 w-4" /> Change Picture
                  </Label>
                </Button>
                <Input 
                  id="avatarUpload" 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleAvatarChange} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name"><User className="inline mr-2 h-4 w-4 text-muted-foreground" />Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email"><Mail className="inline mr-2 h-4 w-4 text-muted-foreground" />Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="your@email.com"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveChanges} className="w-full md:w-auto ml-auto">
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
