import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Bell, Shield, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    notifications: {
      emailAlerts: true,
      overdueReminders: true,
      payoutNotifications: true,
    },
    system: {
      autoBackup: true,
      dataRetention: "6", // months
      timezone: "UTC",
    }
  });

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Data export",
      description: "Your data export will be ready shortly. You'll receive an email when it's complete.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Manage your account preferences and security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Default Timezone</Label>
              <Input
                id="timezone"
                value={settings.system.timezone}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  system: { ...prev.system, timezone: e.target.value }
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive alerts and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Receive important system notifications via email
                </p>
              </div>
              <Switch
                checked={settings.notifications.emailAlerts}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, emailAlerts: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Overdue Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about overdue deliverables
                </p>
              </div>
              <Switch
                checked={settings.notifications.overdueReminders}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, overdueReminders: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Payout Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Alerts for processed payments
                </p>
              </div>
              <Switch
                checked={settings.notifications.payoutNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, payoutNotifications: checked }
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="shadow-card md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data Management
            </CardTitle>
            <CardDescription>
              Backup and export your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically backup your data daily
                </p>
              </div>
              <Switch
                checked={settings.system.autoBackup}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  system: { ...prev.system, autoBackup: checked }
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">Data Retention (months)</Label>
              <Input
                id="retention"
                type="number"
                min="1"
                max="24"
                value={settings.system.dataRetention}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  system: { ...prev.system, dataRetention: e.target.value }
                }))}
                className="w-32"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleExportData} variant="outline">
                Export All Data
              </Button>
              <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-primary to-primary-glow">
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}