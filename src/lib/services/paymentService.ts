// src/lib/services/paymentService.ts
import { handleSupabaseError } from '../supabase';
import { Connection, PublicKey, LAMPORTS_PER_SOL, ConfirmedSignatureInfo } from '@solana/web3.js';
import { getSupabaseClient } from './supabaseService';

// Define types for payment settings and transactions
export interface PaymentSettings {
  id: string;
  organizationId: string;
  paymentMethod: 'solana';
  walletAddress: string;
  enabled: boolean;
  mainnetEnabled: boolean;
  minimumConfirmations: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  assignmentId?: string;
  organizationId?: string;
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  amount: number;
  currency: string;
  fromWallet: string;
  toWallet: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  slot?: number;
  blockTime?: number;
  confirmations?: number;
}

export interface SolanaNetworkConfig {
  network: 'mainnet' | 'devnet' | 'testnet';
  endpoint: string;
}

// Convert database row to PaymentSettings
const mapRowToPaymentSettings = (row: any): PaymentSettings => {
  return {
    id: row.id,
    organizationId: row.organization_id,
    paymentMethod: row.payment_method,
    walletAddress: row.wallet_address,
    enabled: row.enabled,
    mainnetEnabled: row.mainnet_enabled,
    minimumConfirmations: row.minimum_confirmations,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};

// Convert database row to PaymentTransaction
const mapRowToPaymentTransaction = (row: any): PaymentTransaction => {
  return {
    id: row.id,
    userId: row.user_id,
    assignmentId: row.assignment_id,
    organizationId: row.organization_id,
    transactionHash: row.transaction_hash,
    status: row.status,
    amount: row.amount,
    currency: row.currency,
    fromWallet: row.from_wallet,
    toWallet: row.to_wallet,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : undefined,
    slot: row.slot,
    blockTime: row.block_time,
    confirmations: row.confirmations,
  };
};

// Solana network endpoints
const getNetworkEndpoint = (network: 'mainnet' | 'devnet' | 'testnet'): string => {
  const endpoints = {
    mainnet: import.meta.env.VITE_SOLANA_MAINNET_URL || 'https://api.mainnet-beta.solana.com',
    devnet: import.meta.env.VITE_SOLANA_DEVNET_URL || 'https://api.devnet.solana.com',
    testnet: import.meta.env.VITE_SOLANA_TESTNET_URL || 'https://api.testnet.solana.com'
  };
  return endpoints[network];
};

// Initialize Solana connection
const getConnection = (network: 'mainnet' | 'devnet' | 'testnet'): Connection => {
  return new Connection(getNetworkEndpoint(network));
};

// Payment Service
export const paymentService = {
  // Get payment settings for an organization
  async getOrganizationPaymentSettings(organizationId: string): Promise<PaymentSettings | null> {
    try {
      const supabase = await getSupabaseClient(null);
      const { data, error } = await supabase
        .schema('public')
        .from('payment_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('payment_method', 'solana')
        .maybeSingle();

      if (error) throw error;
      return data ? mapRowToPaymentSettings(data) : null;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Create or update payment settings for an organization
  async saveOrganizationPaymentSettings(
    organizationId: string,
    settings: {
      walletAddress: string;
      enabled: boolean;
      mainnetEnabled: boolean;
      minimumConfirmations?: number;
    }
  ): Promise<PaymentSettings> {
    try {
      const supabase = await getSupabaseClient(null);

      // Check if settings already exist
      const { data: existingData } = await supabase
        .schema('public')
        .from('payment_settings')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('payment_method', 'solana')
        .maybeSingle();

      const payload = {
        organization_id: organizationId,
        payment_method: 'solana',
        wallet_address: settings.walletAddress,
        enabled: settings.enabled,
        mainnet_enabled: settings.mainnetEnabled,
        minimum_confirmations: settings.minimumConfirmations || 1,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (existingData) {
        // Update existing settings
        const { data, error } = await supabase
          .schema('public')
          .from('payment_settings')
          .update(payload)
          .eq('id', existingData.id)
          .select('*')
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .schema('public')
          .from('payment_settings')
          .insert(payload)
          .select('*')
          .single();

        if (error) throw error;
        result = data;
      }

      return mapRowToPaymentSettings(result);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Log payment verification attempt for security audit
  async logPaymentAudit(
    userId: string | undefined,
    assignmentId: string | undefined,
    transactionHash: string,
    verificationResult: any,
    securityChecks: any,
    isFraudAttempt: boolean = false,
    fraudReason?: string
  ): Promise<void> {
    try {
      const supabase = await getSupabaseClient(null);

      await supabase
        .schema('public')
        .from('payment_security_audit')
        .insert({
          user_id: userId,
          assignment_id: assignmentId,
          transaction_hash: transactionHash,
          verification_result: verificationResult,
          security_checks: securityChecks,
          is_fraud_attempt: isFraudAttempt,
          fraud_reason: fraudReason,
          ip_address: null, // Could be added from request context
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
        });
    } catch (error) {
      console.error('Failed to log payment audit:', error);
      // Don't throw error to avoid breaking payment flow
    }
  },

  // Check if transaction hash has been used before (SECURITY)
  async isTransactionHashUsed(transactionHash: string): Promise<{
    isUsed: boolean;
    existingTransaction?: PaymentTransaction;
    usedBy?: string;
    usedFor?: string;
  }> {
    try {
      const supabase = await getSupabaseClient(null);

      const { data, error } = await supabase
        .schema('public')
        .from('payment_transaction')
        .select('*, interactive_assignment(title)')
        .eq('transaction_hash', transactionHash)
        .eq('status', 'confirmed')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        return {
          isUsed: true,
          existingTransaction: mapRowToPaymentTransaction(data),
          usedBy: data.user_id,
          usedFor: data.assignment_id
        };
      }

      return { isUsed: false };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Record a new payment transaction with security checks
  async recordPaymentTransaction(
    transaction: {
      userId: string;
      assignmentId?: string;
      organizationId?: string;
      transactionHash: string;
      amount: number;
      fromWallet: string;
      toWallet: string;
      status: 'pending' | 'confirmed' | 'failed';
      slot?: number;
      blockTime?: number;
      confirmations?: number;
    }
  ): Promise<PaymentTransaction> {
    try {
      const supabase = await getSupabaseClient(null);

      // SECURITY CHECK: Verify transaction hash hasn't been used
      if (transaction.status === 'confirmed') {
        const { isUsed, usedBy, usedFor } = await this.isTransactionHashUsed(transaction.transactionHash);
        if (isUsed) {
          throw new Error(`Transaction hash already used by user ${usedBy} for assignment ${usedFor}`);
        }
      }

      const payload = {
        user_id: transaction.userId,
        assignment_id: transaction.assignmentId,
        organization_id: transaction.organizationId,
        transaction_hash: transaction.transactionHash,
        status: transaction.status,
        amount: transaction.amount,
        currency: 'SOL',
        from_wallet: transaction.fromWallet,
        to_wallet: transaction.toWallet,
        confirmed_at: transaction.status === 'confirmed' ? new Date().toISOString() : null,
        slot: transaction.slot,
        block_time: transaction.blockTime,
        confirmations: transaction.confirmations,
      };

      const { data, error } = await supabase
        .schema('public')
        .from('payment_transaction')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return mapRowToPaymentTransaction(data);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Enhanced transaction verification with comprehensive security checks
  async verifyTransaction(
    network: 'mainnet' | 'devnet' | 'testnet',
    transactionHash: string,
    expectedAmount: number,
    expectedDestination: string,
    minimumConfirmations: number = 1,
    userId?: string,
    assignmentId?: string
  ): Promise<{
    verified: boolean;
    transaction?: PaymentTransaction;
    details: {
      slot?: number;
      blockTime?: number;
      confirmations?: number;
      amount?: number;
      fromWallet?: string;
      toWallet?: string;
      status: 'pending' | 'confirmed' | 'failed';
      reason?: string;
      securityChecks?: {
        transactionExists: boolean;
        destinationMatches: boolean;
        amountMatches: boolean;
        confirmationsValid: boolean;
        transactionNotReused: boolean;
        transactionNotTooOld: boolean;
        amountWithinTolerance: boolean;
        userNotAlreadyPaid?: boolean;
      };
    };
  }> {
    try {
      // Initialize security checks tracking
      const securityChecks = {
        transactionExists: false,
        destinationMatches: false,
        amountMatches: false,
        confirmationsValid: false,
        transactionNotReused: false,
        transactionNotTooOld: false,
        amountWithinTolerance: false,
        userNotAlreadyPaid: false
      };

      // SECURITY CHECK 1: Check if transaction hash has been used before
      const { isUsed, usedBy, usedFor } = await this.isTransactionHashUsed(transactionHash);
      if (isUsed) {
        const fraudResult = {
          verified: false,
          details: {
            status: 'failed' as const,
            reason: `🚨 FRAUD ALERT: Transaction hash already used by user ${usedBy} for assignment ${usedFor}`,
            securityChecks: { ...securityChecks, transactionNotReused: false }
          }
        };

        // Log fraud attempt
        await this.logPaymentAudit(
          userId,
          assignmentId,
          transactionHash,
          fraudResult,
          securityChecks,
          true,
          `Transaction reuse: Previously used by ${usedBy} for ${usedFor}`
        );

        return fraudResult;
      }
      securityChecks.transactionNotReused = true;

      // SECURITY CHECK 2: Check if user has already paid for this assignment
      if (userId && assignmentId) {
        const { hasPaid } = await this.checkUserPaymentForAssignment(userId, assignmentId);
        if (hasPaid) {
          return {
            verified: false,
            details: {
              status: 'failed' as const,
              reason: '🚨 FRAUD ALERT: User has already paid for this assignment',
              securityChecks: { ...securityChecks, userNotAlreadyPaid: false }
            }
          };
        }
        securityChecks.userNotAlreadyPaid = true;
      }

      // BLOCKCHAIN VERIFICATION: Get transaction from Solana
      const connection = getConnection(network);
      const transaction = await connection.getTransaction(transactionHash, {
        maxSupportedTransactionVersion: 0
      });

      if (!transaction) {
        return {
          verified: false,
          details: {
            status: 'failed' as const,
            reason: 'Transaction not found on blockchain',
            securityChecks: { ...securityChecks, transactionExists: false }
          }
        };
      }
      securityChecks.transactionExists = true;

      // SECURITY CHECK 3: Verify transaction age (prevent old transaction reuse)
      const transactionAge = transaction.blockTime ? Date.now() / 1000 - transaction.blockTime : 0;
      const maxAgeHours = 24; // Maximum 24 hours old
      if (transactionAge > maxAgeHours * 3600) {
        return {
          verified: false,
          details: {
            status: 'failed' as const,
            reason: `🚨 SECURITY: Transaction is too old (${Math.round(transactionAge / 3600)} hours). Maximum age: ${maxAgeHours} hours`,
            securityChecks: { ...securityChecks, transactionNotTooOld: false }
          }
        };
      }
      securityChecks.transactionNotTooOld = true;

      // Calculate transaction amount with precision
      const solAmount = transaction.meta
        ? Math.abs((transaction.meta.preBalances[0] - transaction.meta.postBalances[0]) / LAMPORTS_PER_SOL)
        : 0;

      // Get sender wallet
      const fromWallet = transaction.transaction.message.getAccountKeys().get(0)?.toBase58() || '';

      // SECURITY CHECK 4: Verify destination wallet matches exactly
      let destinationMatched = false;
      const accounts = transaction.transaction.message.getAccountKeys();
      for (let i = 0; i < accounts.staticAccountKeys.length; i++) {
        const account = accounts.staticAccountKeys[i].toBase58();
        if (account.toLowerCase() === expectedDestination.toLowerCase()) {
          destinationMatched = true;
          break;
        }
      }

      if (!destinationMatched) {
        return {
          verified: false,
          details: {
            status: 'failed' as const,
            fromWallet,
            toWallet: expectedDestination,
            amount: solAmount,
            slot: transaction.slot,
            blockTime: transaction.blockTime || undefined,
            reason: '🚨 SECURITY: Destination wallet does not match expected address',
            securityChecks: { ...securityChecks, destinationMatches: false }
          }
        };
      }
      securityChecks.destinationMatches = true;

      // SECURITY CHECK 5: Verify amount with strict tolerance (reduced from 0.01 to 0.005)
      const tolerance = 0.005; // Reduced tolerance for better security
      const amountDifference = Math.abs(solAmount - expectedAmount);
      if (amountDifference > tolerance) {
        return {
          verified: false,
          details: {
            status: 'failed' as const,
            fromWallet,
            toWallet: expectedDestination,
            amount: solAmount,
            slot: transaction.slot,
            blockTime: transaction.blockTime || undefined,
            reason: `🚨 SECURITY: Amount mismatch. Expected: ${expectedAmount} SOL, Received: ${solAmount} SOL, Difference: ${amountDifference} SOL (Max allowed: ${tolerance} SOL)`,
            securityChecks: { ...securityChecks, amountMatches: false, amountWithinTolerance: false }
          }
        };
      }
      securityChecks.amountMatches = true;
      securityChecks.amountWithinTolerance = true;

      // SECURITY CHECK 6: Verify sufficient confirmations
      const currentBlockHeight = await connection.getBlockHeight();
      const confirmations = currentBlockHeight - transaction.slot;

      if (confirmations < minimumConfirmations) {
        return {
          verified: false,
          details: {
            status: 'pending' as const,
            fromWallet,
            toWallet: expectedDestination,
            amount: solAmount,
            slot: transaction.slot,
            blockTime: transaction.blockTime || undefined,
            confirmations,
            reason: `🔄 PENDING: Transaction needs ${minimumConfirmations} confirmations, currently has ${confirmations}`,
            securityChecks: { ...securityChecks, confirmationsValid: false }
          }
        };
      }
      securityChecks.confirmationsValid = true;

      // ALL SECURITY CHECKS PASSED ✅
      const successResult = {
        verified: true,
        details: {
          status: 'confirmed' as const,
          fromWallet,
          toWallet: expectedDestination,
          amount: solAmount,
          slot: transaction.slot,
          blockTime: transaction.blockTime || undefined,
          confirmations,
          securityChecks
        }
      };

      // Log successful verification
      await this.logPaymentAudit(
        userId,
        assignmentId,
        transactionHash,
        successResult,
        securityChecks,
        false
      );

      return successResult;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return {
        verified: false,
        details: {
          status: 'failed' as const,
          reason: `🚨 VERIFICATION ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      };
    }
  },

  // Check if a user has made a payment for an assignment
  async checkUserPaymentForAssignment(userId: string, assignmentId: string): Promise<{
    hasPaid: boolean;
    transaction?: PaymentTransaction;
  }> {
    try {
      const supabase = await getSupabaseClient(null);

      const { data, error } = await supabase
        .schema('public')
        .from('payment_transaction')
        .select('*')
        .eq('user_id', userId)
        .eq('assignment_id', assignmentId)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;

      return {
        hasPaid: !!data,
        transaction: data ? mapRowToPaymentTransaction(data) : undefined
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get payment history for a user
  async getUserPaymentHistory(userId: string): Promise<PaymentTransaction[]> {
    try {
      const supabase = await getSupabaseClient(null);

      const { data, error } = await supabase
        .schema('public')
        .from('payment_transaction')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapRowToPaymentTransaction);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get all payment transactions for an organization
  async getOrganizationPaymentHistory(organizationId: string): Promise<PaymentTransaction[]> {
    try {
      const supabase = await getSupabaseClient(null);

      const { data, error } = await supabase
        .schema('public')
        .from('payment_transaction')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapRowToPaymentTransaction);
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  // Check for new transactions for a wallet address
  async checkNewTransactions(
    network: 'mainnet' | 'devnet' | 'testnet',
    walletAddress: string,
    limit: number = 10
  ): Promise<{
    transactions: {
      signature: string;
      slot: number;
      blockTime?: number;
      confirmations: number;
      amount: number;
      fromWallet: string;
    }[];
  }> {
    try {
      const connection = getConnection(network);
      const pubKey = new PublicKey(walletAddress);
      const signatures = await connection.getSignaturesForAddress(pubKey, { limit });
      const currentBlockHeight = await connection.getBlockHeight();

      const transactionPromises = signatures.map(async (sig: ConfirmedSignatureInfo) => {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });

        if (!tx) return null;

        const amount = tx.meta?.postBalances[0]
          ? (tx.meta.preBalances[0] - tx.meta.postBalances[0]) / LAMPORTS_PER_SOL
          : 0;

        return {
          signature: sig.signature,
          slot: sig.slot,
          blockTime: sig.blockTime || undefined,
          confirmations: currentBlockHeight - sig.slot,
          amount: Math.abs(amount),
          fromWallet: tx.transaction.message.getAccountKeys().get(0)?.toBase58() || '',
        };
      });

      const transactions = await Promise.all(transactionPromises);
      return {
        transactions: transactions.filter((tx): tx is NonNullable<typeof tx> => tx !== null)
      };
    } catch (error) {
      console.error('Error checking new transactions:', error);
      return { transactions: [] };
    }
  },

  // Get the payment status for an assignment and user
  async getAssignmentPaymentStatus(assignmentId: string, userId: string): Promise<{
    requiresPayment: boolean;
    hasPaid: boolean;
    paymentAmount?: number;
    paymentSettings?: PaymentSettings;
  }> {
    try {
      const supabase = await getSupabaseClient(null);

      // First check if the assignment requires payment
      const { data: assignmentData, error: assignmentError } = await supabase
        .schema('public')
        .from('interactive_assignment')
        .select('requires_payment, payment_amount, organization_id')
        .eq('id', assignmentId)
        .single();

      if (assignmentError) throw assignmentError;

      // If the assignment doesn't require payment, return early
      if (!assignmentData.requires_payment) {
        return {
          requiresPayment: false,
          hasPaid: true
        };
      }

      // Check if the user has already paid
      const { hasPaid } = await this.checkUserPaymentForAssignment(userId, assignmentId);

      // Get the organization's payment settings
      const paymentSettings = await this.getOrganizationPaymentSettings(assignmentData.organization_id);

      return {
        requiresPayment: true,
        hasPaid,
        paymentAmount: assignmentData.payment_amount,
        paymentSettings: paymentSettings || undefined
      };
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  }
};