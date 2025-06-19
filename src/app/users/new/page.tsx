"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from '@/lib/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

export default function NewUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
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
        description: "You don't have permission to create users.",
        variant: "destructive",
      });
      router.push('/');
      return;
    }
  }, [router]);

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
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        // Redirect to login if unauthorized
        router.push('/auth');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        router.push("/users");
      } else {
        setError(data.error || 'အသုံးပြုသူ ထည့်သွင်းရာတွင် အမှားရှိနေသည်');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message || 'အသုံးပြုသူ ထည့်သွင်းရာတွင် အမှားရှိနေသည်');
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-3xl font-bold">အသုံးပြုသူ အသစ်ထည့်ရန်</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>အသုံးပြုသူ အချက်အလက်များ</CardTitle>
          <CardDescription>
            အသုံးပြုသူ အသစ်အတွက် အချက်အလက်များ ထည့်သွင်းပါ
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">စကားဝှက်</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="စကားဝှက်ကို ထည့်သွင်းပါ"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">အခန်းကဏ္ဍ</Label>
              <Select value={formData.role} onValueChange={handleRoleChange} required>
                <SelectTrigger disabled={loading}>
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
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'ထည့်သွင်းနေသည်...' : 'အသုံးပြုသူ ထည့်ရန်'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/users")}
                className="flex-1"
                disabled={loading}
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