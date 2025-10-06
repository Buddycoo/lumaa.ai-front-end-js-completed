import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { Settings, Save, Bot, Cpu, Thermometer } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import axios from 'axios';

const BotSettings = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
  // User settings state
  const [userSettings, setUserSettings] = useState({
    opening_message: '',
    prompt: '',
    // Read-only for users
    model: '',
    temperature: 0.7
  });
  
  // Admin settings state (per category)
  const [adminSettings, setAdminSettings] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('real_estate');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const categories = [
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'sales', label: 'Sales' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'automotive', label: 'Automotive' }
  ];

  const models = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3', label: 'Claude 3' }
  ];

  useEffect(() => {
    if (isAdmin) {
      fetchAdminBotSettings();
    } else {
      fetchUserBotSettings();
    }
  }, [isAdmin]);

  const fetchUserBotSettings = async () => {
    try {
      const response = await axios.get('/user/bot-settings');
      setUserSettings(response.data);
    } catch (error) {
      toast.error('Failed to load bot settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminBotSettings = async () => {
    try {
      // Load settings for the first category
      const response = await axios.get(`/admin/bot-settings/${selectedCategory}`);
      setAdminSettings({
        ...adminSettings,
        [selectedCategory]: response.data
      });
    } catch (error) {
      // If no settings exist, set defaults
      setAdminSettings({
        ...adminSettings,
        [selectedCategory]: {
          model: 'gpt-4',
          temperature: 0.7,
          opening_message: `Hello! I'm an AI assistant specialized in ${selectedCategory.replace('_', ' ')}. How can I help you today?`,
          prompt: `You are a professional AI assistant for ${selectedCategory.replace('_', ' ')}. Be helpful, knowledgeable, and maintain a professional tone.`
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (category) => {
    setSelectedCategory(category);
    
    if (!adminSettings[category]) {
      try {
        const response = await axios.get(`/admin/bot-settings/${category}`);
        setAdminSettings({
          ...adminSettings,
          [category]: response.data
        });
      } catch (error) {
        // Set defaults if no settings exist
        setAdminSettings({
          ...adminSettings,
          [category]: {
            model: 'gpt-4',
            temperature: 0.7,
            opening_message: `Hello! I'm an AI assistant specialized in ${category.replace('_', ' ')}. How can I help you today?`,
            prompt: `You are a professional AI assistant for ${category.replace('_', ' ')}. Be helpful, knowledgeable, and maintain a professional tone.`
          }
        });
      }
    }
  };

  const handleSaveUserSettings = async () => {
    setSaving(true);
    try {
      await axios.put('/user/bot-settings', {
        opening_message: userSettings.opening_message,
        prompt: userSettings.prompt
      });
      toast.success('Bot settings saved successfully');
    } catch (error) {
      toast.error('Failed to save bot settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAdminSettings = async () => {
    setSaving(true);
    try {
      const currentSettings = adminSettings[selectedCategory];
      await axios.put(`/admin/bot-settings/${selectedCategory}`, {
        model: currentSettings.model,
        temperature: currentSettings.temperature
      });
      toast.success(`Bot settings saved for ${categories.find(c => c.value === selectedCategory)?.label}`);
    } catch (error) {
      toast.error('Failed to save bot settings');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
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
          <p className="text-gray-400">
            {isAdmin 
              ? 'Configure universal bot settings for each category' 
              : 'Customize your AI assistant\'s behavior'
            }
          </p>
        </div>
      </div>

      {isAdmin ? (
        /* ADMIN INTERFACE - Model & Temperature per Category */
        <div className="space-y-6">
          {/* Category Selection */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Select Category</CardTitle>
              <p className="text-gray-400">Choose category to configure bot settings</p>
            </CardHeader>
            <CardContent>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Category Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#00FFD1]" />
                {categories.find(c => c.value === selectedCategory)?.label} Settings
              </CardTitle>
              <p className="text-gray-400">Universal settings for all {categories.find(c => c.value === selectedCategory)?.label} users</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {adminSettings[selectedCategory] && (
                <>
                  {/* Model Selection */}
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      AI Model
                    </Label>
                    <Select 
                      value={adminSettings[selectedCategory].model} 
                      onValueChange={(value) => setAdminSettings({
                        ...adminSettings,
                        [selectedCategory]: {
                          ...adminSettings[selectedCategory],
                          model: value
                        }
                      })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {models.map(model => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Temperature Control */}
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Temperature: {adminSettings[selectedCategory].temperature}
                    </Label>
                    <p className="text-xs text-gray-500 mb-3">Controls creativity vs precision (0 = focused, 2 = creative)</p>
                    <Slider
                      value={[adminSettings[selectedCategory].temperature]}
                      onValueChange={([value]) => setAdminSettings({
                        ...adminSettings,
                        [selectedCategory]: {
                          ...adminSettings[selectedCategory],
                          temperature: value
                        }
                      })}
                      max={2}
                      min={0}
                      step={0.1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Precise</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button 
                    onClick={handleSaveAdminSettings}
                    disabled={saving}
                    className="w-full bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings for {categories.find(c => c.value === selectedCategory)?.label}
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-900/20 border-blue-800">
            <CardContent className="p-4">
              <p className="text-blue-300 text-sm">
                <strong>Note:</strong> These settings apply to all users in the selected category. 
                Users can customize their opening messages and prompts, but model and temperature 
                are controlled here.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* USER INTERFACE - Opening Message & Prompt Only */
        <div className="space-y-6">
          {/* Current Configuration (Read-Only) */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-[#00FFD1]" />
                Current Configuration
              </CardTitle>
              <p className="text-gray-400">Admin-controlled settings</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">Model</span>
                  </div>
                  <span className="text-white font-medium">{userSettings.model}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
                  <div className="flex items-center gap-3">
                    <Thermometer className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">Temperature</span>
                  </div>
                  <span className="text-white font-medium">{userSettings.temperature}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Editable Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Your Bot Customization</CardTitle>
              <p className="text-gray-400">Personalize your AI assistant's responses</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Opening Message */}
              <div>
                <Label htmlFor="opening" className="text-gray-300">Opening Message</Label>
                <p className="text-xs text-gray-500 mb-2">First message your AI sends (max 500 characters)</p>
                <Textarea
                  id="opening"
                  value={userSettings.opening_message}
                  onChange={(e) => setUserSettings({...userSettings, opening_message: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={3}
                  maxLength={500}
                  placeholder="Hello! I'm your AI assistant. How can I help you today?"
                />
                <div className="text-xs text-gray-500 text-right mt-1">
                  {userSettings.opening_message?.length || 0}/500 characters
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <Label htmlFor="prompt" className="text-gray-300">System Prompt</Label>
                <p className="text-xs text-gray-500 mb-2">Detailed instructions for AI behavior (max 2000 characters)</p>
                <Textarea
                  id="prompt"
                  value={userSettings.prompt}
                  onChange={(e) => setUserSettings({...userSettings, prompt: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={6}
                  maxLength={2000}
                  placeholder="You are a professional AI assistant. Be helpful, courteous, and provide accurate information..."
                />
                <div className="text-xs text-gray-500 text-right mt-1">
                  {userSettings.prompt?.length || 0}/2000 characters
                </div>
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSaveUserSettings}
                disabled={saving}
                className="w-full bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
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
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-blue-900/20 border-blue-800">
            <CardContent className="p-4">
              <h3 className="text-blue-400 font-medium mb-2">💡 Tips for Better Bot Performance</h3>
              <ul className="text-blue-300 text-sm space-y-1">
                <li>• Keep opening messages friendly and professional</li>
                <li>• Be specific in your system prompt about tone and style</li>
                <li>• Include context about your business in the prompt</li>
                <li>• Test your settings with sample conversations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BotSettings;