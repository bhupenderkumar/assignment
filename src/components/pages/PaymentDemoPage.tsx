import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useUserRole } from '../../hooks/useUserRole';
import { hexToRgba } from '../../utils/colorUtils';
import toast from 'react-hot-toast';

// Define types for Solana transaction
interface SolanaTransaction {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  amount: number;
  currency: string;
  status: 'confirmed' | 'pending' | 'failed';
  date: string;
  user: string;
  txHash: string;
  fromWallet: string;
  toWallet: string;
  blockTime?: number;
  slot?: number;
  confirmations?: number;
}

const PaymentDemoPage: React.FC = () => {
  const { config } = useConfiguration();
  const { isAuthenticated, user, supabase } = useSupabaseAuth();
  const { isAdmin } = useUserRole();

  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<SolanaTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [network, setNetwork] = useState<'mainnet' | 'devnet' | 'testnet'>('devnet');
  const [walletAddress, setWalletAddress] = useState(import.meta.env.VITE_SOLANA_WALLET_ADDRESS || 'GJQUFnCu7ZJHbxvKZKMsnaYoi9goieCtkqZ5HXDqZxST');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showCryptoForm, setShowCryptoForm] = useState(true); // Set to true by default now
  const [verifyingTransaction, setVerifyingTransaction] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [senderWallet, setSenderWallet] = useState('');
  const [amount, setAmount] = useState('0.5');

  // Solana network endpoints
  const networkEndpoints = {
    mainnet: import.meta.env.VITE_SOLANA_MAINNET_URL || 'https://api.mainnet-beta.solana.com',
    devnet: import.meta.env.VITE_SOLANA_DEVNET_URL || 'https://api.devnet.solana.com',
    testnet: import.meta.env.VITE_SOLANA_TESTNET_URL || 'https://api.testnet.solana.com'
  };

  // Load crypto payment history data
  useEffect(() => {
    // Simulate loading payment history from blockchain
    setIsLoading(true);

    // Generate mock Solana payment data
    setTimeout(() => {
      const mockSolanaPayments: SolanaTransaction[] = [
        {
          id: '1',
          assignmentId: 'assign-123',
          assignmentTitle: 'Advanced Mathematics Quiz',
          amount: 0.5,
          currency: 'SOL',
          status: 'confirmed' as const,
          date: '2023-12-15',
          user: 'john.doe@example.com',
          txHash: '4RPyPQSAqPiYKXMD7SJgLpqEYMz9s5RLx9yShT6Snxgu5NwuwuSQRne5cw3aWQi47JKw5G2h72HWMUtF6jZMyJq5',
          fromWallet: '8ZUczUAUZbSrHBpJdZw2HTGZjaCXQzGjTKbNULZ9x5g2',
          toWallet: walletAddress,
          blockTime: 1703116800,
          slot: 234567890,
          confirmations: 1000
        },
        {
          id: '2',
          assignmentId: 'assign-456',
          assignmentTitle: 'Science Fundamentals',
          amount: 0.25,
          currency: 'SOL',
          status: 'confirmed' as const,
          date: '2023-11-28',
          user: 'jane.smith@example.com',
          txHash: '2JDhTZ3EzNLBzKvC9YnYkNvNxD4BvJeGKpEMqQJqmMvSYWpzNMuqgBJXrZZdFDfYe5LXTQwjQQKFMYP8ZgJSQnbL',
          fromWallet: '5ZUczUAUZbSrHBpJdZw2HTGZjaCXQzGjTKbNULZ9x5g2',
          toWallet: walletAddress,
          blockTime: 1701388800,
          slot: 234567000,
          confirmations: 2000
        },
        {
          id: '3',
          assignmentId: 'assign-789',
          assignmentTitle: 'History of Ancient Civilizations',
          amount: 0.75,
          currency: 'SOL',
          status: 'pending' as const,
          date: '2023-12-20',
          user: 'robert.johnson@example.com',
          txHash: '3RPyPQSAqPiYKXMD7SJgLpqEYMz9s5RLx9yShT6Snxgu5NwuwuSQRne5cw3aWQi47JKw5G2h72HWMUtF6jZMyJq5',
          fromWallet: '9ZUczUAUZbSrHBpJdZw2HTGZjaCXQzGjTKbNULZ9x5g2',
          toWallet: walletAddress
        }
      ];

      setPaymentHistory(mockSolanaPayments);
      setIsLoading(false);
    }, 1000);
  }, [network, walletAddress]);

  // Verify Solana transaction
  const verifyTransaction = async () => {
    if (!transactionHash || !senderWallet) {
      toast.error('Please enter both transaction hash and sender wallet address');
      return;
    }

    setVerifyingTransaction(true);

    try {
      // Simulate blockchain API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock verification result
      const mockTransactionDetails: {
        slot: number;
        blockTime: number;
        confirmations: number;
        amount: number;
        fromWallet: string;
        toWallet: string;
        status: SolanaTransaction['status'];
      } = {
        slot: 234567890,
        blockTime: Math.floor(Date.now() / 1000),
        confirmations: 1000,
        amount: parseFloat(amount),
        fromWallet: senderWallet,
        toWallet: walletAddress,
        status: 'confirmed' as const
      };

      setTransactionDetails(mockTransactionDetails);
      toast.success('Transaction verified successfully!');

      // Add to payment history
      const newTransaction: SolanaTransaction = {
        id: Date.now().toString(),
        assignmentId: `assign-${Date.now()}`,
        assignmentTitle: 'New Assignment Payment',
        amount: parseFloat(amount),
        currency: 'SOL',
        status: 'confirmed' as const,
        date: new Date().toISOString().split('T')[0],
        user: user?.email || 'anonymous',
        txHash: transactionHash,
        fromWallet: senderWallet,
        toWallet: walletAddress,
        blockTime: mockTransactionDetails.blockTime,
        slot: mockTransactionDetails.slot,
        confirmations: mockTransactionDetails.confirmations
      };

      setPaymentHistory(prev => [newTransaction, ...prev]);
    } catch (error) {
      console.error('Error verifying transaction:', error);
      toast.error('Failed to verify transaction. Please try again.');
    } finally {
      setVerifyingTransaction(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <h1
          className="text-3xl font-bold mb-6"
          style={{ color: config.primaryColor }}
        >
          Solana Payment Demo
        </h1>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
          style={{
            borderTop: `4px solid ${config.primaryColor}`,
            boxShadow: `0 10px 25px ${hexToRgba(config.primaryColor, 0.1)}`
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold dark:text-white">Premium Assignment Access</h2>
            <span
              className="text-2xl font-bold"
              style={{ color: config.primaryColor }}
            >
              {amount} SOL
            </span>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Network</span>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value as 'mainnet' | 'devnet' | 'testnet')}
                className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1"
              >
                <option value="mainnet">Mainnet</option>
                <option value="devnet">Devnet</option>
                <option value="testnet">Testnet</option>
              </select>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Recipient Wallet</span>
              <span className="font-medium dark:text-white truncate ml-4" style={{ maxWidth: '200px' }}>
                {walletAddress}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Network URL</span>
              <span className="font-medium dark:text-white truncate ml-4" style={{ maxWidth: '200px' }}>
                {networkEndpoints[network]}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Transaction Hash
              </label>
              <input
                type="text"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                placeholder="Enter your transaction hash"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ '--tw-ring-color': config.primaryColor } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Sender Wallet Address
              </label>
              <input
                type="text"
                value={senderWallet}
                onChange={(e) => setSenderWallet(e.target.value)}
                placeholder="Enter your wallet address"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ '--tw-ring-color': config.primaryColor } as React.CSSProperties}
              />
            </div>

            <button
              onClick={verifyTransaction}
              disabled={verifyingTransaction}
              className="w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 relative overflow-hidden"
              style={{
                background: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                opacity: verifyingTransaction ? 0.8 : 1
              }}
            >
              {verifyingTransaction ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying Transaction...
                </div>
              ) : (
                'Verify Transaction'
              )}
            </button>
          </div>

          {transactionDetails && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 dark:text-white">Transaction Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className="font-medium dark:text-white">
                    {transactionDetails.status === 'confirmed' ? (
                      <span className="text-green-500">Confirmed</span>
                    ) : (
                      <span className="text-yellow-500">Pending</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Block</span>
                  <span className="font-medium dark:text-white">{transactionDetails.slot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Confirmations</span>
                  <span className="font-medium dark:text-white">{transactionDetails.confirmations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount</span>
                  <span className="font-medium dark:text-white">{transactionDetails.amount} SOL</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Transaction History</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentHistory.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium dark:text-white">{transaction.assignmentTitle}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {transaction.date} • {transaction.amount} SOL
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        transaction.status === 'confirmed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="truncate">From: {transaction.fromWallet}</p>
                    <p className="truncate">To: {transaction.toWallet}</p>
                    <p className="truncate">Tx: {transaction.txHash}</p>
                    {transaction.confirmations && (
                      <p>Confirmations: {transaction.confirmations}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Information Box */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                This is a demo payment page using Solana blockchain. No actual transactions are processed.
                For testing, you can use any valid-format Solana transaction hash and wallet address.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentDemoPage;
