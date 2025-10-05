import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Phone, Clock, DollarSign, Eye } from 'lucide-react';

const CallLogs: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Call Logs
          </h1>
          <p className="text-gray-400">
            View and analyze your AI call history
          </p>
        </div>
        <Button className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
          Export Data
        </Button>
      </div>
      
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Calls</CardTitle>
          <CardDescription className="text-gray-400">
            Your latest AI calling activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock call log entries */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#00FFD1]/10 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-[#00FFD1]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">+971-50-123-{4567 + i}</p>
                    <p className="text-sm text-gray-400">Real Estate Lead - Project Alpha</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-300">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{2 + i}:34</span>
                    </div>
                    <p className="text-xs text-gray-500">Duration</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-300">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">{(2.50 + i * 0.3).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500">Cost (AED)</p>
                  </div>
                  
                  <div className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      i % 3 === 0 ? 'bg-green-900 text-green-300' :
                      i % 3 === 1 ? 'bg-red-900 text-red-300' :
                      'bg-yellow-900 text-yellow-300'
                    }`}>
                      {i % 3 === 0 ? 'SUCCESS' : i % 3 === 1 ? 'FAILED' : 'BUSY'}
                    </span>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallLogs;