#!/usr/bin/env node
// scripts/test-payment-system.mjs

import { createClient } from '@supabase/supabase-js';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const walletSecret = process.env.TEST_WALLET_SECRET; // Base58 private key - KEEP THIS SECURE!
const testPaymentAmount = 0.1; // SOL amount to send in test transaction

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and key are required');
  process.exit(1);
}

if (!walletSecret) {
  console.error('Error: Test wallet secret is required. Add TEST_WALLET_SECRET to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPaymentSystem() {
  try {
    console.log('Starting payment system test...');
    
    // Get payment settings from the database
    console.log('Fetching payment settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('payment_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (settingsError) {
      throw new Error(`Error fetching payment settings: ${settingsError.message}`);
    }
    
    if (!settings || settings.length === 0) {
      console.log('No payment settings found. Creating test payment settings...');
      
      // Create test payment settings
      const { data: newSettings, error: createError } = await supabase
        .from('payment_settings')
        .insert({
          organization_id: null, // This would be your organization ID in production
          payment_method: 'solana',
          wallet_address: 'GJQUFnCu7ZJHbxvKZKMsnaYoi9goieCtkqZ5HXDqZxST', // Default testing address
          enabled: true,
          mainnet_enabled: false,
          minimum_confirmations: 1
        })
        .select()
        .single();
        
      if (createError) {
        throw new Error(`Error creating payment settings: ${createError.message}`);
      }
      
      console.log('Test payment settings created:', newSettings);
    } else {
      console.log('Found payment settings:', settings[0]);
    }
    
    // Get destination wallet address
    const destinationWallet = settings?.[0]?.wallet_address || 'GJQUFnCu7ZJHbxvKZKMsnaYoi9goieCtkqZ5HXDqZxST';
    console.log(`Destination wallet: ${destinationWallet}`);
    
    // Connect to Solana devnet
    console.log('Connecting to Solana devnet...');
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Create a test wallet from secret key
    const secretKeyArray = Buffer.from(walletSecret, 'base58');
    const fromWallet = Keypair.fromSecretKey(secretKeyArray);
    console.log(`From wallet: ${fromWallet.publicKey.toBase58()}`);
    
    // Check balance
    const balance = await connection.getBalance(fromWallet.publicKey);
    console.log(`Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    if (balance < testPaymentAmount * LAMPORTS_PER_SOL) {
      console.log('Insufficient funds. Requesting airdrop...');
      const signature = await connection.requestAirdrop(
        fromWallet.publicKey,
        2 * LAMPORTS_PER_SOL // Request 2 SOL
      );
      await connection.confirmTransaction(signature);
      console.log('Airdrop successful');
    }
    
    // Create and send transaction
    console.log(`Sending ${testPaymentAmount} SOL to ${destinationWallet}...`);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: new PublicKey(destinationWallet),
        lamports: testPaymentAmount * LAMPORTS_PER_SOL
      })
    );
    
    const signature = await connection.sendTransaction(transaction, [fromWallet]);
    console.log('Transaction sent! Signature:', signature);
    console.log('Transaction details: https://explorer.solana.com/tx/' + signature + '?cluster=devnet');
    
    // Record the transaction in the database
    const { data: txData, error: txError } = await supabase
      .from('payment_transaction')
      .insert({
        user_id: 'test-user', // This would be a real user ID in production
        transaction_hash: signature,
        status: 'pending',
        amount: testPaymentAmount,
        currency: 'SOL',
        from_wallet: fromWallet.publicKey.toBase58(),
        to_wallet: destinationWallet
      })
      .select()
      .single();
      
    if (txError) {
      console.error('Error recording transaction:', txError);
    } else {
      console.log('Transaction recorded in database:', txData);
    }
    
    console.log('\nTest complete! Use the payment page to verify this transaction.');
    console.log(`Transaction hash: ${signature}`);
    console.log(`Sender wallet: ${fromWallet.publicKey.toBase58()}`);
    console.log(`Amount: ${testPaymentAmount} SOL`);
    
  } catch (error) {
    console.error('Error testing payment system:', error);
  }
}

testPaymentSystem();