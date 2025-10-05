import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { 
  Phone, Play, FileText, Search, 
  Filter, Clock, TrendingUp 
} from 'lucide-react';
import axios from 'axios';

const UserCallLogs = () => {
  const [callLogs, setCallLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transcriptModal, setTranscriptModal] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  const callOutcomes = [
    { value: 'all', label: 'All Outcomes' },
    { value: 'interested', label: 'Interested' },
    { value: 'not_interested', label: 'Not Interested' },
    { value: 'callback', label: 'Callback' },
    { value: 'voicemail', label: 'Voicemail' },
    { value: 'no_answer', label: 'No Answer' }
  ];

  useEffect(() => {
    fetchCallLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [callLogs, searchTerm, outcomeFilter]);

  const fetchCallLogs = async () => {
    try {
      const response = await axios.get('/user/call-logs?limit=100');
      setCallLogs(response.data);
    } catch (error) {
      toast.error('Failed to load call logs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = callLogs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.lead_phone.includes(searchTerm)
      );
    }

    // Outcome filter
    if (outcomeFilter !== 'all') {
      filtered = filtered.filter(log => log.call_outcome === outcomeFilter);
    }

    setFilteredLogs(filtered);
  };

  const getOutcomeBadge = (outcome) => {
    const variants = {
      interested: 'bg-green-500',
      not_interested: 'bg-red-500',
      callback: 'bg-blue-500',
      voicemail: 'bg-yellow-500',
      no_answer: 'bg-gray-500'
    };
    return (
      <Badge className={`${variants[outcome]} text-white`}>
        {outcome.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const openTranscript = (transcript) => {
    setSelectedTranscript(transcript || 'No transcript available');
    setTranscriptModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTotalMinutes = () => {
    return filteredLogs.reduce((total, log) => total + log.duration_minutes, 0);
  };

  const getSuccessRate = () => {
    if (filteredLogs.length === 0) return 0;
    const successful = filteredLogs.filter(log => 
      ['interested', 'callback'].includes(log.call_outcome)
    ).length;
    return Math.round((successful / filteredLogs.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading call logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Call Logs</h1>
          <p className="text-gray-400">Your call history and lead interactions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{filteredLogs.length}</div>
            <p className="text-xs text-gray-400">Filtered results</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Duration</CardTitle>
            <Clock className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{getTotalMinutes()}</div>
            <p className="text-xs text-gray-400">Minutes</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{getSuccessRate()}%</div>
            <p className="text-xs text-gray-400">Interest + Callbacks</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by lead name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {callOutcomes.map(outcome => (
                    <SelectItem key={outcome.value} value={outcome.value}>
                      {outcome.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Logs Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Call History</CardTitle>
          <p className="text-gray-400">Lead details and call outcomes</p>
        </CardHeader>
        <CardContent>
          {filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Lead</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Outcome</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Duration</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-white font-medium">{log.lead_name}</div>
                          <div className="text-gray-400 text-sm">{log.lead_phone}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getOutcomeBadge(log.call_outcome)}
                      </td>
                      <td className="py-3 px-4 text-white">
                        {log.duration_minutes} min
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {log.recording_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(log.recording_url, '_blank')}
                              className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openTranscript(log.transcript)}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No call logs found</p>
              <p className="text-sm">
                {callLogs.length === 0 
                  ? "Your call history will appear here" 
                  : "Try adjusting your filters"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript Modal */}
      <Dialog open={transcriptModal} onOpenChange={setTranscriptModal}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00FFD1]" />
              Call Transcript
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="p-4 bg-gray-800 rounded-lg">
              <pre className="text-gray-300 whitespace-pre-wrap text-sm">
                {selectedTranscript}
              </pre>
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={() => setTranscriptModal(false)}
              className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserCallLogs;