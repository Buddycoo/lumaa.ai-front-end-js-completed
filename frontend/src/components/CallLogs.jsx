import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Phone, Clock, DollarSign, Eye } from 'lucide-react';

const CallLogs = () => {
  // Mock call log data - LEAD DETAILS ONLY (no revenue/niche)
  const callLogs = [
    {
      id: 1,
      leadName: 'Ahmed Al-Mansouri',
      leadPhone: '+971-50-123-4567',
      callOutcome: 'Interested',
      duration: '2:34',
      timestamp: '2024-01-05 14:30'
    },
    {
      id: 2,
      leadName: 'Sarah Johnson',
      leadPhone: '+971-50-234-5678',
      callOutcome: 'Callback Requested',
      duration: '3:12',
      timestamp: '2024-01-05 13:45'
    },
    {
      id: 3,
      leadName: 'Mohammad Hassan',
      leadPhone: '+971-50-345-6789',
      callOutcome: 'Not Interested',
      duration: '1:45',
      timestamp: '2024-01-05 12:20'
    },
    {
      id: 4,
      leadName: 'Emily Rodriguez',
      leadPhone: '+971-50-456-7890',
      callOutcome: 'Voicemail',
      duration: '4:22',
      timestamp: '2024-01-05 11:15'
    },
    {
      id: 5,
      leadName: 'David Kim',
      leadPhone: '+971-50-567-8901',
      callOutcome: 'No Answer',
      duration: '0:45',
      status: 'BUSY',
      timestamp: '2024-01-05 10:30'
    }
  ];
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-900 text-green-300';
      case 'FAILED':
        return 'bg-red-900 text-red-300';
      case 'BUSY':
        return 'bg-yellow-900 text-yellow-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  };
  
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
      
      {/* Summary Cards - NO COST/REVENUE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Calls</p>
                <p className="text-2xl font-bold text-white">156</p>
              </div>
              <Phone className="h-8 w-8 text-[#00FFD1]" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-white">89%</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-900 flex items-center justify-center">
                <span className="text-green-300 text-sm font-bold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Duration</p>
                <p className="text-2xl font-bold text-white">12h 34m</p>
              </div>
              <Clock className="h-8 w-8 text-[#00FFD1]" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Duration</p>
                <p className="text-2xl font-bold text-white">2:45</p>
              </div>
              <Clock className="h-8 w-8 text-[#00FFD1]" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Call Logs Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Calls</CardTitle>
          <CardDescription className="text-gray-400">
            Your latest AI calling activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {callLogs.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#00FFD1]/10 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-[#00FFD1]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{call.leadName}</p>
                    <p className="text-sm text-gray-400">{call.leadPhone}</p>
                    <p className="text-xs text-gray-500">{call.timestamp}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-300">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{call.duration}</span>
                    </div>
                    <p className="text-xs text-gray-500">Duration</p>
                  </div>
                  
                  <div className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(call.callOutcome)}`}>
                      {call.callOutcome}
                    </span>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing 5 of 156 calls
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
                Previous
              </Button>
              <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallLogs;