import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, Ban, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const BlockedUserModal = ({ reason }) => {
  const { logout } = useAuthStore();

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[9999]">
      <Card className="bg-gray-900 border-red-500 border-2 w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <Ban className="h-10 w-10 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-white text-2xl">Account Paused</CardTitle>
          <CardDescription className="text-gray-400">
            Your account has been temporarily paused by the administrator
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-300 mb-1">Reason for Pause:</p>
                <p className="text-sm text-gray-300">{reason || 'No reason provided'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-400">
            <p className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <span>You cannot access any features while your account is paused</span>
            </p>
            <p className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <span>All AI calling and bot services are currently disabled</span>
            </p>
            <p className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <span>Please contact your administrator for more information</span>
            </p>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <Button
              onClick={logout}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockedUserModal;