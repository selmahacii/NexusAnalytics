"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Save,
  Globe,
  Bell,
  Lock,
  Database,
  User,
  Shield,
  Palette,
  Mail,
  Smartphone,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function SettingsView() {
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved", { description: "Your changes have been applied successfully." });
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage platform configuration for Nexus Analytics.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full sm:w-auto overflow-x-auto justify-start flex-nowrap mb-6">
          <TabsTrigger value="general" className="gap-2"><Globe className="w-4 h-4" /> General</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2"><Palette className="w-4 h-4" /> Appearance</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Lock className="w-4 h-4" /> Security</TabsTrigger>
          <TabsTrigger value="database" className="gap-2"><Database className="w-4 h-4" /> Data</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 animate-slide-up">
          <Card className="glass-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Company Information</CardTitle>
              <CardDescription>Details about the organization using this platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" defaultValue="Nexus Enterprise Algeria" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" defaultValue="E-commerce & Retail" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Primary Currency</Label>
                  <Input id="currency" defaultValue="DZD (Algerian Dinar)" disabled className="rounded-xl bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" defaultValue="Africa/Algiers (UTC+1)" disabled className="rounded-xl bg-muted/50" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button className="rounded-xl gap-2 ml-auto" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4" /> Save
              </Button>
            </CardFooter>
          </Card>

          <Card className="glass-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Administrator Profile</CardTitle>
              <CardDescription>Manage your contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold flex-shrink-0">
                  SH
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminName">Full Name</Label>
                      <Input id="adminName" defaultValue="Selma Haci" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Email Address</Label>
                      <Input id="adminEmail" type="email" defaultValue="admin@nexus-algeria.dz" className="rounded-xl" />
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl">Update photo</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 animate-slide-up">
          <Card className="glass-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Application Theme</CardTitle>
              <CardDescription>Customize the appearance of Nexus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-xl bg-card/50">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">Dark / Light Mode</h4>
                  <p className="text-xs text-muted-foreground">Toggle between light and dark theme.</p>
                </div>
                <div className="flex gap-2 bg-muted p-1 rounded-lg">
                  <button 
                    onClick={() => setTheme("light")} 
                    className={cn("px-3 py-1 text-sm font-medium rounded-md transition-all", theme === "light" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    Light
                  </button>
                  <button 
                    onClick={() => setTheme("dark")} 
                    className={cn("px-3 py-1 text-sm font-medium rounded-md transition-all", theme === "dark" || theme === "system" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 animate-slide-up">
          <Card className="glass-card shadow-sm border-rose-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Shield className="w-5 h-5" /> Sécurité du compte
              </CardTitle>
              <CardDescription>Gérez votre mot de passe et l'authentification à double facteur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 p-4 border rounded-xl bg-rose-500/5 border-rose-500/20">
                <div>
                  <h4 className="font-medium text-sm">Change Password</h4>
                  <p className="text-xs text-muted-foreground">Active sessions on other devices will be logged out.</p>
                </div>
                <div className="grid gap-3">
                  <Input type="password" placeholder="Current password" className="rounded-xl" />
                  <Input type="password" placeholder="New password" className="rounded-xl" />
                  <Input type="password" placeholder="Confirm password" className="rounded-xl" />
                </div>
                <Button variant="outline" className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 mt-2">Update password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="animate-slide-up italic text-muted-foreground p-8 text-center border-2 border-dashed rounded-xl">
          Coming soon: Advanced notification management (Email, Push, SMS)
        </TabsContent>
        <TabsContent value="database" className="animate-slide-up italic text-muted-foreground p-8 text-center border-2 border-dashed rounded-xl">
          Coming soon: Automatic backups, bulk CSV export and data warehouse integration
        </TabsContent>

      </Tabs>
    </div>
  );
}
