import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useConfiguration } from '../../context/ConfigurationContext';
import { paymentService, PaymentSettings } from '../../lib/services/paymentService';
import toast from 'react-hot-toast';

interface OrganizationPaymentSettingsProps {
  organizationId: string;
}

const OrganizationPaymentSettings: React.FC<OrganizationPaymentSettingsProps> = ({ organizationId }) => {
  const { user } = useSupabaseAuth();
  const { config } = useConfiguration();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [mainnetEnabled, setMainnetEnabled] = useState(false);
  const [minimumConfirmations, setMinimumConfirmations] = useState(1);

  // Load payment settings on component mount
  useEffect(() => {
    const loadPaymentSettings = async () => {
      if (!organizationId) return;
      
      setIsLoading(true);
      try {
        const settings = await paymentService.getOrganizationPaymentSettings(organizationId);
        if (settings) {
          setSettings(settings);
          setWalletAddress(settings.walletAddress || '');
          setEnabled(settings.enabled);
          setMainnetEnabled(settings.mainnetEnabled);
          setMinimumConfirmations(settings.minimumConfirmations);
        }
      } catch (error) {
        console.error('Error loading payment settings:', error);
        toast.error('Failed to load payment settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentSettings();
  }, [organizationId]);

  // Save payment settings
  const saveSettings = async () => {
    if (!organizationId || !user) return;

    // Basic validation
    if (enabled && !walletAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }

    setIsSaving(true);
    try {
      const updatedSettings = await paymentService.saveOrganizationPaymentSettings(
        organizationId,
        {
          walletAddress,
          enabled,
          mainnetEnabled,
          minimumConfirmations
        }
      );

      setSettings(updatedSettings);
      toast.success('Payment settings saved successfully');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-6 dark:text-white">Payment Settings</h2>
      
      <div className="space-y-6">
        {/* Enable payments */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium dark:text-white">Enable Solana Payments</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Allow users to pay for premium assignments using Solana cryptocurrency
            </p>
          </div>
          <div className="relative inline-block w-12 mr-2 align-middle select-none">
            <input 
              type="checkbox" 
              name="toggle" 
              id="toggle-payment"
              checked={enabled}
              onChange={() => setEnabled(!enabled)}
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              style={{ right: enabled ? '0' : '', backgroundColor: enabled ? config.primaryColor : '' }}
            />
            <label 
              htmlFor="toggle-payment" 
              className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"
              style={{ backgroundColor: enabled ? `${config.primaryColor}40` : '' }}
            ></label>
          </div>
        </div>

        {/* Wallet Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Solana Wallet Address
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter organization wallet address"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={!enabled}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This is where payments for premium assignments will be sent
          </p>
        </div>

        {/* Network Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Allow Mainnet Transactions
          </label>
          <div className="flex items-center">
            <div className="relative inline-block w-12 mr-2 align-middle select-none">
              <input 
                type="checkbox" 
                name="toggle-mainnet" 
                id="toggle-mainnet"
                checked={mainnetEnabled}
                onChange={() => setMainnetEnabled(!mainnetEnabled)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                disabled={!enabled}
                style={{ right: mainnetEnabled ? '0' : '', backgroundColor: mainnetEnabled ? config.primaryColor : '' }}
              />
              <label 
                htmlFor="toggle-mainnet" 
                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-gray-600 cursor-pointer"
                style={{ backgroundColor: mainnetEnabled ? `${config.primaryColor}40` : '' }}
              ></label>
            </div>
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {mainnetEnabled ? 'Mainnet enabled' : 'Using devnet/testnet only'}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enable this to accept actual SOL payments on the Solana mainnet
          </p>
        </div>

        {/* Minimum Confirmations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Minimum Confirmations
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={minimumConfirmations}
            onChange={(e) => setMinimumConfirmations(parseInt(e.target.value) || 1)}
            className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={!enabled}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Number of blockchain confirmations required before accepting a payment
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: config.primaryColor }}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationPaymentSettings;