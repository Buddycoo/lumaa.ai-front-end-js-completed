import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  Upload, FileText, Users, 
  AlertTriangle, Shield, Download,
  Search, Filter, CheckCircle2
} from 'lucide-react';
import axios from 'axios';

const UserLeads = () => {
  const { user } = useAuthStore();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [uploadResults, setUploadResults] = useState(null);

  const leadStatuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'converted', label: 'Converted' }
  ];

  // Check if user has access to lead upload
  const hasLeadAccess = user?.category === 'sales';

  useEffect(() => {
    if (hasLeadAccess) {
      fetchLeads();
    } else {
      setLoading(false);
    }
  }, [hasLeadAccess]);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter]);

  const fetchLeads = async () => {
    try {
      const response = await axios.get('/user/leads');
      setLeads(response.data);
    } catch (error) {
      toast.error('Failed to load leads');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    setFilteredLeads(filtered);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast.error('Please select a valid CSV file');
      event.target.value = '';
    }
  };

  const startUpload = () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file first');
      return;
    }
    setPinModal(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    // Verify PIN first
    try {
      await axios.post('/auth/verify-pin', { pin });
      
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await axios.post('/user/upload-leads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadResults(response.data);
      toast.success(`Successfully imported ${response.data.leads_imported} leads`);
      
      setPinModal(false);
      setPin('');
      setSelectedFile(null);
      document.getElementById('file-upload').value = '';
      
      fetchLeads(); // Refresh leads list
      
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Invalid PIN. Please try again.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to upload leads');
      }
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "name,phone,email,company,notes\nJohn Doe,+1234567890,john@example.com,Acme Corp,Interested in premium package\nJane Smith,+0987654321,jane@example.com,Tech Inc,Follow up next week";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'bg-yellow-500',
      contacted: 'bg-blue-500',
      qualified: 'bg-purple-500',
      converted: 'bg-green-500'
    };
    return (
      <Badge className={`${variants[status]} text-white`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (!hasLeadAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="bg-gray-900 border-gray-800 max-w-md">
          <CardContent className="text-center p-8">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-gray-400 mb-4">
              Lead upload is only available for Sales category users.
            </p>
            <p className="text-sm text-gray-500">
              Your current category: {user?.category?.replace('_', ' ')?.toUpperCase()}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lead Management</h1>
          <p className="text-gray-400">Upload and manage your sales leads</p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#00FFD1]" />
            Upload Leads
          </CardTitle>
          <p className="text-gray-400">Upload a CSV file with your leads (PIN required)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
            <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-white font-medium">Select CSV file to upload</p>
              <p className="text-gray-400 text-sm">
                Required columns: name, phone. Optional: email, company, notes
              </p>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="bg-gray-800 border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00FFD1] file:text-black hover:file:bg-[#00FFD1]/90"
              />
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                onClick={startUpload}
                className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
                disabled={uploading}
              >
                <Shield className="h-4 w-4 mr-2" />
                Upload with PIN
              </Button>
            </div>
          )}

          {uploadResults && (
            <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <p className="text-green-400 font-medium">Upload Complete!</p>
              </div>
              <p className="text-green-300 text-sm">
                Successfully imported {uploadResults.leads_imported} leads
              </p>
              {uploadResults.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-yellow-400 text-sm">Warnings:</p>
                  <ul className="text-yellow-300 text-xs list-disc list-inside">
                    {uploadResults.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {uploadResults.errors.length > 5 && (
                      <li>... and {uploadResults.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
                  placeholder="Search leads by name, phone, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-700 text-white rounded-md"
              >
                {leadStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Your Leads</CardTitle>
            <p className="text-gray-400">
              {filteredLeads.length} of {leads.length} leads
            </p>
          </div>
          <Badge variant="outline" className="border-[#00FFD1] text-[#00FFD1]">
            <Users className="h-4 w-4 mr-1" />
            {leads.length} Total
          </Badge>
        </CardHeader>
        <CardContent>
          {filteredLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Contact</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Company</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">{lead.name}</div>
                        {lead.notes && (
                          <div className="text-gray-400 text-sm truncate max-w-xs">
                            {lead.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white">{lead.phone}</div>
                        {lead.email && (
                          <div className="text-gray-400 text-sm">{lead.email}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white">
                        {lead.company || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {formatDate(lead.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No leads found</p>
              <p className="text-sm">
                {leads.length === 0 
                  ? "Upload a CSV file to get started" 
                  : "Try adjusting your filters"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PIN Modal */}
      <Dialog open={pinModal} onOpenChange={setPinModal}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#00FFD1]" />
              PIN Verification Required
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <p className="text-gray-400 mb-3">
                Enter your PIN to upload leads from <strong>{selectedFile?.name}</strong>
              </p>
              <Input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                maxLength={6}
                required
              />
            </div>
            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={uploading}
                className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </div>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Leads
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPinModal(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserLeads;