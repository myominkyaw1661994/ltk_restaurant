'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthHeaders, getCurrentUser, isAuthenticated } from '@/lib/auth';

export default function PlaygroundPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testJWT = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/test', {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Test error:', error);
      setTestResult({ error: 'Test failed' });
    } finally {
      setLoading(false);
    }
  };

  const currentUser = getCurrentUser();
  const authenticated = isAuthenticated();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">JWT Authentication Test</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Current authentication state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Authenticated:</strong> {authenticated ? 'Yes' : 'No'}</p>
            {currentUser && (
              <>
                <p><strong>User ID:</strong> {currentUser.id}</p>
                <p><strong>Name:</strong> {currentUser.name}</p>
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Role:</strong> {currentUser.role}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>JWT Test</CardTitle>
            <CardDescription>Test JWT authentication with API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testJWT} disabled={loading}>
              {loading ? 'Testing...' : 'Test JWT Authentication'}
            </Button>
            
            {testResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-semibold mb-2">Test Result:</h4>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 