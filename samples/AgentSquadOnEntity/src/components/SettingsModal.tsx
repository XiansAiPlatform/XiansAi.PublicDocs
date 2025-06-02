import React, { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import { useSettings, SettingsData } from '../context/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState<SettingsData>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form data when settings change
  useEffect(() => {
    console.log('Settings context updated:', settings);
    setFormData(settings);
    setHasChanges(false);
  }, [settings]);

  // Reset form data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, loading current settings:', settings);
      setFormData(settings);
      setHasChanges(false);
    }
  }, [isOpen, settings]);

  // Check for changes
  useEffect(() => {
    console.log('START hasChanges effect. formData:', JSON.stringify(formData, null, 2), 'settings:', JSON.stringify(settings, null, 2));
    
    const formKeys = Object.keys(formData) as Array<keyof SettingsData>;
    const settingsKeys = Object.keys(settings) as Array<keyof SettingsData>;
    const allUniqueKeys = Array.from(new Set([...formKeys, ...settingsKeys]));

    const changed = allUniqueKeys.some(
      key => {
        const valFormData = formData[key];
        const valSettings = settings[key];
        if (valFormData !== valSettings) {
          console.log(`Field '${key}' differs: formData['${key}'] = '${valFormData}' (type: ${typeof valFormData}), settings['${key}'] = '${valSettings}' (type: ${typeof valSettings})`);
          return true;
        }
        return false;
      }
    );
    console.log('END hasChanges effect. Calculated hasChanges:', changed);
    setHasChanges(changed);
  }, [formData, settings]);

  const handleInputChange = (field: keyof SettingsData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('Saving settings:', formData);
    updateSettings(formData);
    onClose();
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
        setFormData(settings);
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Agent Settings</h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[calc(90vh-8rem)] overflow-y-auto">
          <div>
            <label htmlFor="websocketUrl" className="block text-sm font-medium text-neutral-700 mb-2">
              Agent Websocket URL
            </label>
            <input
              id="websocketUrl"
              type="text"
              value={formData.agentWebsocketUrl}
              onChange={(e) => handleInputChange('agentWebsocketUrl', e.target.value)}
              placeholder="wss://example.com/websocket"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-neutral-700 mb-2">
              Agent API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={formData.agentApiKey}
              onChange={(e) => handleInputChange('agentApiKey', e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="tenantId" className="block text-sm font-medium text-neutral-700 mb-2">
              Tenant ID
            </label>
            <input
              id="tenantId"
              type="text"
              value={formData.tenantId}
              onChange={(e) => handleInputChange('tenantId', e.target.value)}
              placeholder="Enter tenant ID"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="participantId" className="block text-sm font-medium text-neutral-700 mb-2">
              Participant ID
            </label>
            <input
              id="participantId"
              type="text"
              value={formData.participantId}
              onChange={(e) => handleInputChange('participantId', e.target.value)}
              placeholder="Enter participant ID"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="defaultMetadata" className="block text-sm font-medium text-neutral-700 mb-2">
              Default Metadata (JSON)
            </label>
            <textarea
              id="defaultMetadata"
              value={formData.defaultMetadata || ''}
              onChange={(e) => handleInputChange('defaultMetadata', e.target.value)}
              placeholder='{
  "key1": "value1",
  "key2": "value2"
}'
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors h-32 resize-none"
              rows={5}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <FiSave className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 