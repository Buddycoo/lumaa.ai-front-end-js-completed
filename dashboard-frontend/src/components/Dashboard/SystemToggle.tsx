import React, { useState } from 'react';
import { Switch } from '../ui/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SystemToggleProps {
  serviceName: string;
  label: string;
  description: string;
  enabled: boolean;
}

const SystemToggle: React.FC<SystemToggleProps> = ({
  serviceName,
  label,
  description,
  enabled
}) => {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/system/toggle`, {
        serviceName
      });
      return response.data;
    },
    onSuccess: (data) => {
      setIsEnabled(data.enabled);
      toast.success(`${label} ${data.enabled ? 'enabled' : 'disabled'}`);
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to toggle service');
      setIsEnabled(enabled); // Revert on error
    }
  });
  
  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState); // Optimistic update
    mutation.mutate();
  };
  
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
      <div className="flex-1">
        <h3 className="text-white font-medium">{label}</h3>
        <p className="text-sm text-gray-400">{description}</p>
        <div className="flex items-center mt-2 gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isEnabled ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span className={`text-xs ${
            isEnabled ? 'text-green-400' : 'text-red-400'
          }`}>
            {isEnabled ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {mutation.isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        )}
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={mutation.isPending}
        />
      </div>
    </div>
  );
};

export default SystemToggle;