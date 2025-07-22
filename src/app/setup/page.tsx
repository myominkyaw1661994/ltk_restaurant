"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<any>(null);

  const checkSetup = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/setup");
      const data = await response.json();
      
      if (data.success) {
        setSetupStatus(data.data);
        if (data.data.defaultAdminExists) {
          toast.success("Default admin user exists!");
        } else {
          toast.info("Default admin user does not exist");
        }
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to check setup status");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultAdmin = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSetupStatus(data.data);
        toast.success("Default admin user created successfully!");
        console.log("Default admin credentials:", data.data);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to create default admin user");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">System Setup</h1>
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Default Admin User Setup</CardTitle>
            <CardDescription>
              Create a default admin user for initial system access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Default Credentials:</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <div><strong>Username:</strong> admin</div>
                <div><strong>Password:</strong> admin123</div>
                <div><strong>Email:</strong> admin@restaurant.com</div>
                <div><strong>Role:</strong> Admin</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={checkSetup} 
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? "Checking..." : "Check Status"}
              </Button>
              <Button 
                onClick={createDefaultAdmin} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Admin"}
              </Button>
            </div>

            {setupStatus && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <h4 className="font-semibold mb-2">Setup Status:</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Admin Exists:</strong> {setupStatus.defaultAdminExists ? "Yes" : "No"}</div>
                  {setupStatus.message && (
                    <div><strong>Message:</strong> {setupStatus.message}</div>
                  )}
                  {setupStatus.id && (
                    <div><strong>User ID:</strong> {setupStatus.id}</div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-yellow-50 rounded text-sm">
              <h4 className="font-semibold mb-2">Instructions:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click "Check Status" to see if admin user exists</li>
                <li>If admin doesn't exist, click "Create Admin"</li>
                <li>Use the default credentials to login</li>
                <li>Change the password after first login for security</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 