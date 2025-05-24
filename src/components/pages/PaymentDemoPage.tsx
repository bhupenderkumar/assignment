import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useConfiguration } from '../../context/ConfigurationContext';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { Connection, PublicKey, LAMPORTS_PER_SOL, ConfirmedSignatureInfo } from '@solana/web3.js';
import { paymentService, PaymentSettings } from '../../lib/services/paymentService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
  const { user, supabase } = useSupabaseAuth();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();

  // Get URL parameters for assignment ID and amount
  const [searchParams] = useState(new URLSearchParams(window.location.search));

  // Payment history state
  const [paymentHistory, setPaymentHistory] = useState<SolanaTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [network, setNetwork] = useState<'mainnet' | 'devnet' | 'testnet'>('devnet');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [verifyingTransaction, setVerifyingTransaction] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [assignmentId] = useState<string | null>(searchParams.get('assignmentId'));
  const [transactionDetails, setTransactionDetails] = useState<{
    slot: number;
    blockTime: number | undefined;
    confirmations: number;
    amount: number;
    fromWallet: string;
    toWallet: string;
    status: SolanaTransaction['status'];
  } | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [senderWallet, setSenderWallet] = useState('');
  const [amount] = useState(searchParams.get('amount') || '0.5');
  const [assignmentTitle, setAssignmentTitle] = useState('Premium Assignment');

  // Solana network endpoints
  const networkEndpoints = {
    mainnet: import.meta.env.VITE_SOLANA_MAINNET_URL || 'https://api.mainnet-beta.solana.com',
    devnet: import.meta.env.VITE_SOLANA_DEVNET_URL || 'https://api.devnet.solana.com',
    testnet: import.meta.env.VITE_SOLANA_TESTNET_URL || 'https://api.testnet.solana.com'
  };

  // Initialize Solana connection
  const getConnection = () => {
    return new Connection(networkEndpoints[network]);
  };

  // Load payment settings, assignment details, and transaction history
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load payment settings if we have an active organization
        if (currentOrganization) {
          const settings = await paymentService.getOrganizationPaymentSettings(currentOrganization.id);
          setPaymentSettings(settings);
          if (settings?.walletAddress) {
            setWalletAddress(settings.walletAddress);
          } else {
            // Use default wallet if no settings are configured
            setWalletAddress(import.meta.env.VITE_SOLANA_WALLET_ADDRESS || 'GJQUFnCu7ZJHbxvKZKMsnaYoi9goieCtkqZ5HXDqZxST');
          }
        } else {
          // Use default wallet if no organization
          setWalletAddress(import.meta.env.VITE_SOLANA_WALLET_ADDRESS || 'GJQUFnCu7ZJHbxvKZKMsnaYoi9goieCtkqZ5HXDqZxST');
        }

        // Load assignment details if we have an assignment ID
        if (assignmentId && supabase) {
          try {
            // Get assignment information to show the user what they're paying for
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

        // Load transaction history if we have a wallet address
        if (walletAddress) {
          const connection = getConnection();
          const pubKey = new PublicKey(walletAddress);
          const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 10 });

          const transactions = await Promise.all(
            signatures.map(async (sig: ConfirmedSignatureInfo) => {
              const tx = await connection.getTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0
              });
              if (!tx) return null;

              const amount = tx.meta?.postBalances[0]
                ? (tx.meta.preBalances[0] - tx.meta.postBalances[0]) / LAMPORTS_PER_SOL
                : 0;

              return {
                id: sig.signature,
                assignmentId: `assign-${sig.slot}`,
                assignmentTitle: 'Assignment Payment',
                amount: Math.abs(amount),
                currency: 'SOL',
                status: 'confirmed' as const,
                date: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                user: user?.email || 'anonymous',
                txHash: sig.signature,
                fromWallet: tx.transaction.message.getAccountKeys().get(0)?.toBase58() || '',
                toWallet: walletAddress,
                blockTime: sig.blockTime || undefined,
                slot: sig.slot,
                confirmations: await connection.getBlockHeight() - sig.slot
              };
            })
          );

          const validTransactions = transactions.filter((tx): tx is NonNullable<typeof tx> => tx !== null);
          setPaymentHistory(validTransactions);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    // even the edit assingment is not working correctly that couldbe the issue because audio is uploading but the next time i am opening the edit assingment again it is not working 

    loadData();
  }, [network, walletAddress, user?.email, currentOrganization, assignmentId]);

  // Verify Solana transaction and record it if valid
  const verifyTransaction = async () => {
    if (!transactionHash || !senderWallet) {
      toast.error('Please enter both transaction hash and sender wallet address');
      return;
    }

    if (!walletAddress) {
      toast.error('Recipient wallet address not available');
      return;
    }

    setVerifyingTransaction(true);

    try {
      // Use payment service to verify the transaction
      const minimumConfirmations = paymentSettings?.minimumConfirmations || 1;
      const expectedAmount = parseFloat(amount);

      const { verified, details } = await paymentService.verifyTransaction(
        network,
        transactionHash,
        expectedAmount,
        walletAddress,
        minimumConfirmations
      );

      // If transaction details are available, update the UI
      if (details) {
        const txDetails = {
          slot: details.slot || 0,
          blockTime: details.blockTime,
          confirmations: details.confirmations || 0,
          amount: details.amount || 0,
          fromWallet: details.fromWallet || senderWallet,
          toWallet: details.toWallet || walletAddress,
          status: details.status
        };

        setTransactionDetails(txDetails);
      }

      if (!verified) {
        // Show error message but still display details
        toast.error(details.reason || 'Transaction verification failed');
        return;
      }

      // Transaction verified successfully
      toast.success('Transaction verified successfully!');

      // Record the payment transaction in our database if user is logged in
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

          // Grant access to the assignment if this is for a specific assignment
          if (assignmentId) {
            toast.success('You now have access to the premium assignment!', { duration: 5000 });
            // Redirect to the assignment after a short delay
            setTimeout(() => {
              navigate(`/play/assignment/${assignmentId}`);
            }, 2000);
          }
        } catch (error) {
          console.error('Error recording payment transaction:', error);
          // Don't show error to user, as the verification was successful
        }
      }

      // Add to UI payment history
      if (details.fromWallet && details.amount && details.slot) {
        const newTransaction: SolanaTransaction = {
          id: transactionHash,
          assignmentId: assignmentId || `assign-${details.slot}`,
          assignmentTitle: assignmentId ? 'Premium Assignment Access' : 'New Payment',
          amount: details.amount,
          currency: 'SOL',
          status: 'confirmed',
          date: new Date().toISOString().split('T')[0],
          user: user?.email || 'anonymous',
          txHash: transactionHash,
          fromWallet: details.fromWallet,
          toWallet: walletAddress,
          blockTime: details.blockTime,
          slot: details.slot,
          confirmations: details.confirmations
        };

        setPaymentHistory(prev => [newTransaction, ...prev]);
      }
    } catch (error) {
      console.error('Error verifying transaction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify transaction');
    } finally {
      setVerifyingTransaction(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-b from-slate-900 to-slate-800 min-h-screen text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <h1
        className="text-3xl font-bold mb-2"
        style={{
          background: `linear-gradient(90deg, #00F5FF, #7B68EE)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 10px rgba(0,245,255,0.2)'
        }}
        >
        {assignmentId ? 'Premium Assignment Payment' : 'Solana Payment Demo'}
        </h1>
          {assignmentId && (
            <div className="text-lg mb-6">
              <p>Making payment for: <span className="font-semibold">{assignmentTitle}</span></p>
            </div>
          )}

        <div
          className="rounded-xl shadow-lg p-6 mb-8 backdrop-blur-lg relative overflow-hidden"
          style={{
            backgroundColor: 'rgba(13, 17, 23, 0.7)',
            boxShadow: `0 10px 25px rgba(0, 245, 255, 0.15), 0 5px 10px rgba(123, 104, 238, 0.1)`,
            borderImage: 'linear-gradient(90deg, #00F5FF, #7B68EE) 1',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-cyan-500 opacity-10 blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-purple-500 opacity-10 blur-3xl"></div>
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
                className="w-full px-4 py-2 rounded-lg border-0 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 backdrop-blur-sm"
                style={{ '--tw-ring-color': '#00F5FF' } as React.CSSProperties}
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
                className="w-full px-4 py-2 rounded-lg border-0 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 backdrop-blur-sm"
                style={{ '--tw-ring-color': '#00F5FF' } as React.CSSProperties}
              />
            </div>

            <button
              onClick={verifyTransaction}
              disabled={verifyingTransaction}
              className="w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-300 relative overflow-hidden group"
              style={{
                background: `linear-gradient(to right, #00F5FF, #7B68EE)`,
                opacity: verifyingTransaction ? 0.8 : 1,
                boxShadow: '0 4px 10px rgba(0,245,255,0.3)'
              }}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
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
        <div className="rounded-xl shadow-lg p-6 backdrop-blur-lg relative overflow-hidden"
          style={{
            backgroundColor: 'rgba(13, 17, 23, 0.7)',
            boxShadow: `0 10px 25px rgba(0, 245, 255, 0.15), 0 5px 10px rgba(123, 104, 238, 0.1)`,
            borderImage: 'linear-gradient(90deg, #00F5FF, #7B68EE) 1',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-20 -left-20 w-40 h-40 rounded-full bg-cyan-500 opacity-10 blur-3xl"></div>
          <div className="absolute -bottom-20 right-20 w-40 h-40 rounded-full bg-purple-500 opacity-10 blur-3xl"></div>
          <h2 className="text-xl font-semibold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Transaction History</span>
          </h2>

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
        <div className="mt-8 relative backdrop-blur-sm backdrop-filter p-1 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 animate-pulse"></div>
          <div className="relative bg-gray-900/80 p-4 rounded-lg border border-blue-500/20">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-300">
                  This payment page uses the Solana blockchain. Please ensure you're connected to the correct network
                  and have sufficient SOL in your wallet before making a transaction. The transaction will be verified
                  on-chain for security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentDemoPage;

// Utility function to check if the user can access a premium assignment
export const checkAssignmentPaymentAccess = async (assignmentId: string, userId?: string): Promise<{
  requiresPayment: boolean;
  hasPaid: boolean;
  paymentAmount?: number;
  paymentSettings?: PaymentSettings;
}> => {
  if (!userId) {
    return { requiresPayment: false, hasPaid: false };
  }

  try {
    return await paymentService.getAssignmentPaymentStatus(assignmentId, userId);
  } catch (error) {
    console.error('Error checking assignment payment status:', error);
    // Default to not requiring payment on error
    return { requiresPayment: false, hasPaid: false };
  }
};
