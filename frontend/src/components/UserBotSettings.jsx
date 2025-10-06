import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  Bot, Save, RotateCcw, 
  Thermometer, Cpu, Info 
} from 'lucide-react';
import axios from 'axios';

const UserBotSettings = () => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState({
    opening_message: '',
    prompt: '',
    model: '',
    temperature: 0.7
  });
  const [originalSettings, setOriginalSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const categories = {
    'real_estate': 'Real Estate',
    'hospitality': 'Hospitality', 
    'sales': 'Sales',
    'healthcare': 'Healthcare',
    'automotive': 'Automotive'
  };

  const models = {
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'claude-3': 'Claude 3'
  };

  useEffect(() => {
    fetchBotSettings();
  }, []);

  const fetchBotSettings = async () => {
    try {
      const response = await axios.get('/user/bot-settings');
      setSettings(response.data);
      setOriginalSettings(response.data);
    } catch (error) {
      toast.error('Failed to load bot settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/user/bot-settings', {
        opening_message: settings.opening_message,
        prompt: settings.prompt
      });
      toast.success('Bot settings saved successfully');
      setOriginalSettings(settings);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save bot settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    toast.info('Settings reset to last saved values');
  };

  const hasChanges = () => {
    return settings.opening_message !== originalSettings.opening_message ||
           settings.prompt !== originalSettings.prompt;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading bot settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bot Settings</h1>
          <p className="text-gray-400">Customize your AI assistant's behavior</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-[#00FFD1] text-[#00FFD1]">
            {categories[user?.category]}
          </Badge>
        </div>
      </div>

      {/* Current Configuration (Read-Only) */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Info className="h-5 w-5 text-[#00FFD1]" />
            Current Configuration
          </CardTitle>
          <p className="text-gray-400">These settings are managed by your admin</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
              <div className="flex items-center gap-3">
                <Cpu className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">Model</span>
              </div>
              <span className="text-white font-medium">
                {models[settings.model] || settings.model}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
              <div className="flex items-center gap-3">
                <Thermometer className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">Temperature</span>
              </div>
              <span className="text-white font-medium">{settings.temperature}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Settings */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Opening Message */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Opening Message</CardTitle>
            <p className="text-gray-400">The first message your AI sends to leads</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="opening" className="text-gray-300">
                Opening Message (Max 500 characters)
              </Label>
              <Textarea
                id="opening"
                value={settings.opening_message}
                onChange={(e) => setSettings({...settings, opening_message: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white min-h-20"
                maxLength={500}
                placeholder="Enter the first message your AI will send to leads..."
                required
              />
              <div className="text-xs text-gray-500 text-right">
                {settings.opening_message.length}/500 characters
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Prompt */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">System Prompt</CardTitle>
            <p className="text-gray-400">Instructions that define your AI's behavior and personality</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-gray-300">
                System Prompt (Max 2000 characters)
              </Label>
              <Textarea
                id="prompt"
                value={settings.prompt}
                onChange={(e) => setSettings({...settings, prompt: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white min-h-32"
                maxLength={2000}
                placeholder="Enter detailed instructions for your AI assistant's behavior, tone, and responses..."
                required
              />
              <div className="text-xs text-gray-500 text-right">
                {settings.prompt.length}/2000 characters
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges() || saving}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
              
              <Button
                type="submit"
                disabled={!hasChanges() || saving}
                className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90 min-w-32"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
            
            {hasChanges() && (
              <p className="text-yellow-400 text-sm mt-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                You have unsaved changes
              </p>
            )}
          </CardContent>
        </Card>
      </form>

      {/* Tips */}
      <Card className="bg-blue-900/20 border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Tips for Effective Bot Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-300 text-sm space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Keep your opening message friendly and professional</li>
            <li>Be specific in your system prompt about tone and responses</li>
            <li>Include your business context and key value propositions</li>
            <li>Test your settings with sample conversations</li>
            <li>Update prompts based on call performance and feedback</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserBotSettings;