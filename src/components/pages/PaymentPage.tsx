import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { paymentService, PaymentSettings } from '../../lib/services/paymentService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PaymentPage: React.FC = () => {
  const { config } = useConfiguration();
  const { user, supabase } = useSupabaseAuth();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();

  // Get URL parameters for assignment ID and amount
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const assignmentId = searchParams.get('assignmentId');
  const amount = searchParams.get('amount') || '0.5';

  // State
  const [network, setNetwork] = useState<'mainnet' | 'devnet' | 'testnet'>('devnet');
  const [transactionHash, setTransactionHash] = useState('');
  const [senderWallet, setSenderWallet] = useState('');
  const [verifyingTransaction, setVerifyingTransaction] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [assignmentTitle, setAssignmentTitle] = useState('Premium Assignment');
  const [loading, setLoading] = useState(true);

  // Solana network endpoints
  const networkEndpoints = {
    mainnet: import.meta.env.VITE_SOLANA_MAINNET_URL || 'https://api.mainnet-beta.solana.com',
    devnet: import.meta.env.VITE_SOLANA_DEVNET_URL || 'https://api.devnet.solana.com',
    testnet: import.meta.env.VITE_SOLANA_TESTNET_URL || 'https://api.testnet.solana.com'
  };

  // Load payment settings and assignment details
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load payment settings
        if (currentOrganization) {
          const settings = await paymentService.getOrganizationPaymentSettings(currentOrganization.id);
          setPaymentSettings(settings);
          if (settings?.walletAddress) {
            setWalletAddress(settings.walletAddress);
          } else {
            setWalletAddress(import.meta.env.VITE_SOLANA_WALLET_ADDRESS || 'GJQUFnCu7ZJHbxvKZKMsnaYoi9goieCtkqZ5HXDqZxST');
          }
        } else {
          setWalletAddress(import.meta.env.VITE_SOLANA_WALLET_ADDRESS || 'GJQUFnCu7ZJHbxvKZKMsnaYoi9goieCtkqZ5HXDqZxST');
        }

        // Load assignment details
        if (assignmentId && supabase) {
          try {
            const { data: assignmentData, error: assignmentError } = await supabase
              .from('interactive_assignment')
              .select('title')
              .eq('id', assignmentId)
              .single();

            if (!assignmentError && assignmentData) {
              setAssignmentTitle(assignmentData.title);
            }
          } catch (err) {
            console.error('Error loading assignment details:', err);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load payment information');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentOrganization, assignmentId, supabase]);

  // Verify Solana transaction
  const verifyTransaction = async () => {
    if (!transactionHash || !senderWallet) {
      toast.error('Please enter both transaction hash and sender wallet address');
      return;
    }

    if (!walletAddress) {
      toast.error('Recipient wallet address not available');
      return;
    }

    // Validate inputs
    if (transactionHash.length < 64 || transactionHash.length > 88) {
      toast.error('Invalid transaction hash format');
      return;
    }

    try {
      new PublicKey(senderWallet);
      new PublicKey(walletAddress);
    } catch (error) {
      toast.error('Invalid wallet address format');
      return;
    }

    setVerifyingTransaction(true);

    try {
      const minimumConfirmations = paymentSettings?.minimumConfirmations || 1;
      const expectedAmount = parseFloat(amount);

      const { verified, details } = await paymentService.verifyTransaction(
        network,
        transactionHash,
        expectedAmount,
        walletAddress,
        minimumConfirmations,
        user?.id, // Pass user ID for security checks
        assignmentId || undefined // Pass assignment ID for security checks
      );

      if (!verified) {
        toast.error(details.reason || 'Transaction verification failed');
        return;
      }

      toast.success('Payment verified successfully!');

      // Record payment if user is logged in
      if (user && details.fromWallet && details.amount) {
        try {
          await paymentService.recordPaymentTransaction({
            userId: user.id,
            assignmentId: assignmentId || undefined,
            organizationId: currentOrganization?.id,
            transactionHash,
            amount: details.amount,
            fromWallet: details.fromWallet,
            toWallet: walletAddress,
            status: 'confirmed',
            slot: details.slot,
            blockTime: details.blockTime,
            confirmations: details.confirmations
          });

          if (assignmentId) {
            toast.success('You now have access to the premium assignment!', { duration: 5000 });
            setTimeout(() => {
              navigate(`/play/assignment/${assignmentId}`);
            }, 2000);
          }
        } catch (error) {
          console.error('Error recording payment:', error);
        }
      }
    } catch (error) {
      console.error('Error verifying transaction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify transaction');
    } finally {
      setVerifyingTransaction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Mobile-first container */}
      <div className="max-w-md mx-auto px-4 py-6 sm:max-w-lg md:max-w-2xl lg:max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-full">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-medium text-green-700 dark:text-green-300">Secure Payment</span>
            </div>
          </div>

          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Payment
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Secure payment powered by Solana blockchain
            </p>
          </div>

          {/* Assignment Card */}
          {assignmentId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 relative overflow-hidden"
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full -translate-y-16 translate-x-16"></div>

              <div className="relative">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Premium Assignment
                      </h2>
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                        Premium
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-base mb-4 font-medium">
                      {assignmentTitle}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          One-time payment
                        </span>
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {amount} SOL
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ≈ ${(parseFloat(amount) * 100).toFixed(2)} USD
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-3xl p-8 backdrop-blur-sm"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
                  How to Complete Payment
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
                    <p className="text-blue-800 dark:text-blue-200">Send exactly <span className="font-bold text-blue-900 dark:text-blue-100">{amount} SOL</span> to the wallet address below</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
                    <p className="text-blue-800 dark:text-blue-200">Copy your transaction hash from your wallet</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
                    <p className="text-blue-800 dark:text-blue-200">Enter the transaction details in the form below</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">4</span>
                    <p className="text-blue-800 dark:text-blue-200">Click "Verify Payment" to confirm and get access</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Payment Verification
              </h3>
            </div>

            {/* Network Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Solana Network
              </label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value as 'mainnet' | 'devnet' | 'testnet')}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base"
              >
                <option value="mainnet">Mainnet (Production)</option>
                <option value="devnet">Devnet (Recommended for testing)</option>
                <option value="testnet">Testnet</option>
              </select>
            </div>

            {/* Recipient Wallet */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Send Payment To This Address
              </label>
              <div className="relative">
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <span className="flex-1 text-sm font-mono text-gray-900 dark:text-white break-all">
                    {walletAddress}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(walletAddress);
                      toast.success('Wallet address copied!', { icon: '📋' });
                    }}
                    className="flex-shrink-0 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    title="Copy wallet address"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction Hash Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Transaction Hash
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  placeholder="Paste your transaction hash here"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base font-mono"
                />
              </div>
            </div>

            {/* Sender Wallet Input */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Your Wallet Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={senderWallet}
                  onChange={(e) => setSenderWallet(e.target.value)}
                  placeholder="Enter your wallet address"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base font-mono"
                />
              </div>
            </div>

            {/* Verify Button */}
            <button
              onClick={verifyTransaction}
              disabled={verifyingTransaction || !transactionHash || !senderWallet}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-[1.02] disabled:transform-none text-lg"
            >
              {verifyingTransaction ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying Payment...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verify Payment
                </>
              )}
            </button>
          </motion.div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-6 border border-green-200/50 dark:border-green-800/50"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-green-900 dark:text-green-100 mb-2">
                  🔒 Secure Blockchain Payment
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                  This payment is processed on the Solana blockchain with military-grade security.
                  Ensure you're connected to the correct network and have sufficient SOL in your wallet.
                  All transactions are verified on-chain for maximum security and transparency.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentPage;
