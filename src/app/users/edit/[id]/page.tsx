"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCurrentUser } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check user role first
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Redirect staff users
    if (user && user.role === 'Staff') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit users.",
        variant: "destructive",
      });
      router.push('/');
      return;
    }

    fetchUser();
  }, [userId, router]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/v1/users/${userId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const user = data.data;
        setFormData({
          name: user.name,
          email: user.email,
          password: "", // Don't populate password field
          role: user.role,
        });
      } else {
        setError(data.error || 'အသုံးပြုသူကို ရယူရာတွင် အမှားရှိနေသည်');
      }
    } catch (error: any) {
      console.error('Error fetching user:', error);
      setError(error.message || 'အသုံးပြုသူကို ရယူရာတွင် အမှားရှိနေသည်');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Only include fields that have values
      const updateData: any = {};
      if (formData.name) updateData.name = formData.name;
      if (formData.email) updateData.email = formData.email;
      if (formData.password) updateData.password = formData.password;
      if (formData.role) updateData.role = formData.role;

      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      
      if (data.success) {
        router.push("/users");
      } else {
        setError(data.error || 'အသုံးပြုသူ ပြင်ဆင်ရာတွင် အမှားရှိနေသည်');
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'အသုံးပြုသူ ပြင်ဆင်ရာတွင် အမှားရှိနေသည်');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">ဖွင့်နေသည်...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          ပြန်သွားရန်
        </Button>
        <h1 className="text-3xl font-bold">အသုံးပြုသူ ပြင်ဆင်ရန်</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>အသုံးပြုသူ အချက်အလက်များ ပြင်ဆင်ရန်</CardTitle>
          <CardDescription>
            အသုံးပြုသူ၏ အချက်အလက်များကို ပြင်ဆင်ပါ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">အမည်</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="အသုံးပြုသူ၏ အမည်ကို ထည့်သွင်းပါ"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">အီးမေးလ်</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="အီးမေးလ် လိပ်စာကို ထည့်သွင်းပါ"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">စကားဝှက် (ပြင်ဆင်လိုပါက ထည့်သွင်းပါ)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="စကားဝှက်ကို ထည့်သွင်းပါ"
                value={formData.password}
                onChange={handleInputChange}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">အခန်းကဏ္ဍ</Label>
              <Select value={formData.role} onValueChange={handleRoleChange} required>
                <SelectTrigger disabled={saving}>
                  <SelectValue placeholder="အခန်းကဏ္ဍ ရွေးချယ်ပါ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? 'သိမ်းဆည်းနေသည်...' : 'ပြင်ဆင်မှုများ သိမ်းရန်'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/users")}
                className="flex-1"
                disabled={saving}
              >
                ပယ်ဖျက်ရန်
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 