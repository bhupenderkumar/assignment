import React from 'react';
import { useConfiguration } from '../../context/ConfigurationContext';

const AppearanceSettings: React.FC = () => {
  const { config, updateConfig } = useConfiguration();

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    updateConfig({ darkMode: !config.darkMode });
  };

  // Function to toggle animations
  const toggleAnimations = () => {
    updateConfig({ animationsEnabled: !config.animationsEnabled });
  };

  // Function to update color
  const updateColor = (colorType: 'primaryColor' | 'secondaryColor' | 'accentColor', color: string) => {
    updateConfig({ [colorType]: color });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Appearance Settings
      </h3>

      <div className="space-y-8">
        {/* Theme Mode */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
            Theme Mode
          </h4>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Dark Mode
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Switch between light and dark theme
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={config.darkMode} 
                onChange={toggleDarkMode} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Animations */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
            Animations
          </h4>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Enable Animations
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Toggle UI animations and transitions
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={config.animationsEnabled} 
                onChange={toggleAnimations} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Color Theme */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
            Color Theme
          </h4>
          
          {/* Primary Color */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Primary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => updateColor('primaryColor', e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={config.primaryColor}
                onChange={(e) => updateColor('primaryColor', e.target.value)}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-32"
              />
              <div 
                className="w-8 h-8 rounded-full ml-2"
                style={{ backgroundColor: config.primaryColor }}
              ></div>
            </div>
          </div>
          
          {/* Secondary Color */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={config.secondaryColor}
                onChange={(e) => updateColor('secondaryColor', e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={config.secondaryColor}
                onChange={(e) => updateColor('secondaryColor', e.target.value)}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-32"
              />
              <div 
                className="w-8 h-8 rounded-full ml-2"
                style={{ backgroundColor: config.secondaryColor }}
              ></div>
            </div>
          </div>
          
          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Accent Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => updateColor('accentColor', e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={config.accentColor}
                onChange={(e) => updateColor('accentColor', e.target.value)}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 w-32"
              />
              <div 
                className="w-8 h-8 rounded-full ml-2"
                style={{ backgroundColor: config.accentColor }}
              ></div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
            Theme Preview
          </h4>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-4">
                <button 
                  className="px-4 py-2 rounded-md text-white font-medium"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Primary Button
                </button>
                <button 
                  className="px-4 py-2 rounded-md text-white font-medium"
                  style={{ backgroundColor: config.secondaryColor }}
                >
                  Secondary Button
                </button>
                <button 
                  className="px-4 py-2 rounded-md text-white font-medium"
                  style={{ backgroundColor: config.accentColor }}
                >
                  Accent Button
                </button>
              </div>
              <div 
                className="p-4 rounded-md"
                style={{ 
                  background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  color: 'white'
                }}
              >
                <p className="font-medium">Gradient Background</p>
                <p className="text-sm opacity-80">This is how gradient elements will appear</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reset to Defaults */}
        <div className="pt-4">
          <button
            onClick={() => {
              updateConfig({
                primaryColor: '#0891b2', // cyan-600
                secondaryColor: '#7e22ce', // purple-700
                accentColor: '#06b6d4', // cyan-500
                darkMode: false,
                animationsEnabled: true
              });
            }}
            className="px-6 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
