import { User, Key, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import call, { ensureOk } from "@/api/client";

export default function Settings() {
  const { user, login, logout } = useAuth();
  const isDemoUser =
    Boolean(user?.isGuest) ||
    String(user?.email || "").toLowerCase() === "demo@devboard.local";
  const [quickActions, setQuickActions] = useState<string[]>(["note", "project"]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("quickActions");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setQuickActions(parsed.map((item) => String(item)));
      }
    } catch {
      // ignore bad local data
    }
  }, []);
  
  useEffect(() => {
    setName(String(user?.name || ""));
    setEmail(String(user?.email || ""));
  }, [user?.name, user?.email]);

  const toggleQuickAction = (key: string, checked: boolean) => {
    setQuickActions((prev) => {
      if (checked) {
        if (prev.includes(key)) return prev;
        return [...prev, key];
      }
      return prev.filter((item) => item !== key);
    });
  };

  const saveQuickActions = () => {
    localStorage.setItem("quickActions", JSON.stringify(quickActions));
    toast.success("Quick actions updated");
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const res = ensureOk<any>(
        await call("/api/auth/profile", {
          method: "PUT",
          body: JSON.stringify({ name: name.trim(), email: email.trim() }),
        })
      );
      if (res?.user) login(res.user);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      ensureOk(
        await call("/api/auth/password", {
          method: "PUT",
          body: JSON.stringify({ currentPassword, newPassword }),
        })
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const data = ensureOk<any>(await call("/api/auth/export"));
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `devboard-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Data exported");
    } catch (err: any) {
      toast.error(err?.message || "Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const triggerImportPicker = () => {
    importInputRef.current?.click();
  };

  const onImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = ensureOk<any>(
        await call("/api/auth/import", { method: "POST", body: JSON.stringify(parsed) })
      );
      const imported = res?.imported || {};
      toast.success(
        `Imported ${imported.projects || 0} projects, ${imported.snippets || 0} snippets, ${imported.notes || 0} notes`
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to import data");
    } finally {
      setImporting(false);
    }
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm("Delete your account and all data permanently?");
    if (!confirmed) return;
    setDeleting(true);
    try {
      ensureOk(
        await call("/api/auth/account", {
          method: "DELETE",
          body: JSON.stringify({ currentPassword: deletePassword }),
        })
      );
      toast.success("Account deleted");
      await logout();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Update your profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <Button onClick={saveProfile} disabled={profileSaving}>
              {profileSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Choose what appears in the sidebar quick actions section.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "snippet", label: "New Snippet" },
              { key: "note", label: "New Note" },
              { key: "project", label: "New Project" },
              { key: "tag", label: "New Tag" },
            ].map((item) => (
              <div key={item.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`quick-${item.key}`}
                  checked={quickActions.includes(item.key)}
                  onCheckedChange={(checked) => toggleQuickAction(item.key, checked === true)}
                />
                <Label htmlFor={`quick-${item.key}`}>{item.label}</Label>
              </div>
            ))}
            <Button onClick={saveQuickActions}>Save quick actions</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
            <Button onClick={updatePassword} disabled={passwordSaving || isDemoUser}>
              {passwordSaving ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Export or import your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-medium">Export Data</h4>
                <p className="text-sm text-muted-foreground">
                  Download all your snippets and notes
                </p>
              </div>
              <Button variant="outline" className="w-full sm:w-auto" onClick={exportData} disabled={exporting}>
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "Exporting..." : "Export"}
              </Button>
            </div>
            <Separator />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-medium">Import Data</h4>
                <p className="text-sm text-muted-foreground">
                  Import snippets from a JSON file
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={triggerImportPicker}
                disabled={importing}
              >
                <Upload className="mr-2 h-4 w-4" />
                {importing ? "Importing..." : "Import"}
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={onImportFileChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
                {!isDemoUser && (
                  <div className="mt-2">
                    <Input
                      type="password"
                      value={deletePassword}
                      onChange={(event) => setDeletePassword(event.target.value)}
                      placeholder="Confirm with current password"
                    />
                  </div>
                )}
              </div>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={isDemoUser || deleting}
                onClick={deleteAccount}
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
            {isDemoUser && (
              <p className="text-xs text-muted-foreground mt-2">
                Demo account deletion is disabled for safety.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
