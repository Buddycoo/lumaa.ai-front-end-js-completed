import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Settings, Save } from 'lucide-react';

const BotSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Bot Settings
          </h1>
          <p className="text-gray-400">
            Configure your AI assistant's behavior and responses
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <Card className="lg:col-span-2 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#00FFD1]" />
              AI Configuration
            </CardTitle>
            <CardDescription className="text-gray-400">
              Customize your AI assistant's personality and responses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-300">Opening Message</Label>
              <Textarea
                placeholder="Hello! I'm your AI assistant from Lumaa AI. How can I help you today?"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
                defaultValue="Hello! I'm your AI assistant from Lumaa AI. How can I help you today?"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">AI Model</Label>
                <select className="w-full h-10 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white">
                  <option value="gpt-4.1">GPT-4.1</option>
                  <option value="lumaa-sales">Lumaa-Sales-LLM</option>
                  <option value="gpt-3.5">GPT-3.5-Turbo</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Category</Label>
                <select className="w-full h-10 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white">
                  <option value="sales">Sales</option>
                  <option value="support">Customer Support</option>
                  <option value="appointment">Appointment Booking</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Temperature (0-1)</Label>
                <Input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.7"
                  className="bg-gray-800 border-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Conservative</span>
                  <span>Creative</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Response Length</Label>
                <Input
                  type="number"
                  placeholder="150"
                  defaultValue="150"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            
            <Button className="w-full bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </CardContent>
        </Card>
        
        {/* Quick Settings */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Bot Status</span>
                <span className="px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs">
                  Active
                </span>
              </div>
              
              <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">
                Test Bot Response
              </Button>
              
              <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">
                Reset to Default
              </Button>
              
              <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">
                Export Settings
              </Button>
            </div>
            
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-white font-medium mb-2">Performance Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Response Time</span>
                  <span className="text-white">1.2s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate</span>
                  <span className="text-green-400">94%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Interactions</span>
                  <span className="text-white">1,247</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BotSettings;