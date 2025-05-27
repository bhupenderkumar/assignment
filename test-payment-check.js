// Test Payment Check - Run this in browser console
// This script tests if the payment check is working correctly

console.log('🧪 Testing Payment Check System...');

// Test assignment ID that requires payment
const testAssignmentId = '30a1ba75-da37-4a64-b761-7c6bcbcb035d';

// Function to test payment service directly
async function testPaymentService() {
  console.log('\n💳 Testing Payment Service...');
  
  try {
    // Get current user (assuming you're logged in)
    const user = window.supabase?.auth?.getUser ? await window.supabase.auth.getUser() : null;
    
    if (!user?.data?.user) {
      console.log('❌ No user found. Please make sure you are logged in.');
      return false;
    }
    
    console.log('✅ User found:', user.data.user.id);
    
    // Test the payment service directly
    if (typeof window.paymentService !== 'undefined') {
      console.log('✅ Payment service is available');
      
      try {
        const paymentStatus = await window.paymentService.getAssignmentPaymentStatus(
          testAssignmentId, 
          user.data.user.id
        );
        
        console.log('✅ Payment status retrieved:', paymentStatus);
        
        if (paymentStatus.requiresPayment) {
          console.log('🔒 Assignment requires payment:', paymentStatus.paymentAmount, 'SOL');
          
          if (!paymentStatus.hasPaid) {
            console.log('💳 User has not paid yet - should redirect to payment page');
            return true;
          } else {
            console.log('✅ User has already paid - should allow access');
            return true;
          }
        } else {
          console.log('🆓 Assignment is free - no payment required');
          return true;
        }
      } catch (error) {
        console.error('❌ Error calling payment service:', error);
        return false;
      }
    } else {
      console.log('❌ Payment service not available on window object');
      return false;
    }
  } catch (error) {
    console.error('❌ Error in payment service test:', error);
    return false;
  }
}

// Function to test database query directly
async function testDatabaseQuery() {
  console.log('\n🗄️ Testing Database Query...');
  
  try {
    if (!window.supabase) {
      console.log('❌ Supabase client not available');
      return false;
    }
    
    const { data, error } = await window.supabase
      .from('interactive_assignment')
      .select('id, title, requires_payment, payment_amount')
      .eq('id', testAssignmentId)
      .single();
    
    if (error) {
      console.error('❌ Database query error:', error);
      return false;
    }
    
    console.log('✅ Assignment data from database:', data);
    
    if (data.requires_payment) {
      console.log('🔒 Database confirms assignment requires payment:', data.payment_amount);
      return true;
    } else {
      console.log('🆓 Database shows assignment is free');
      return true;
    }
  } catch (error) {
    console.error('❌ Error in database query:', error);
    return false;
  }
}

// Function to check if payment check effect is running
function checkPaymentEffectLogs() {
  console.log('\n🔍 Checking for Payment Effect Logs...');
  console.log('Look for these logs in the console:');
  console.log('- "💳 Payment check effect triggered"');
  console.log('- "💳 Starting payment check for assignment"');
  console.log('- "💳 Payment status received"');
  console.log('- "🔒 Payment required for assignment" (if payment required)');
  console.log('\nIf you don\'t see these logs, the payment check effect might not be running.');
}

// Function to clear payment cache
function clearPaymentCache() {
  console.log('\n🧹 Clearing Payment Cache...');
  if (window._checkedPayments) {
    window._checkedPayments = {};
    console.log('✅ Payment cache cleared');
  } else {
    console.log('ℹ️ No payment cache found');
  }
}

// Function to simulate payment check manually
async function simulatePaymentCheck() {
  console.log('\n🎭 Simulating Payment Check...');
  
  try {
    // Clear cache first
    clearPaymentCache();
    
    // Get current user
    const user = window.supabase?.auth?.getUser ? await window.supabase.auth.getUser() : null;
    
    if (!user?.data?.user) {
      console.log('❌ No user found for simulation');
      return;
    }
    
    console.log('👤 Simulating for user:', user.data.user.id);
    console.log('📝 Assignment ID:', testAssignmentId);
    
    // Try to access the payment service from the global scope
    if (window.paymentService) {
      const paymentStatus = await window.paymentService.getAssignmentPaymentStatus(
        testAssignmentId,
        user.data.user.id
      );
      
      console.log('💳 Payment Status:', paymentStatus);
      
      if (paymentStatus.requiresPayment && !paymentStatus.hasPaid) {
        console.log('🚨 SHOULD REDIRECT TO PAYMENT PAGE');
        console.log(`URL: /payment-demo?assignmentId=${testAssignmentId}&amount=${paymentStatus.paymentAmount || 0.5}`);
      } else if (paymentStatus.requiresPayment && paymentStatus.hasPaid) {
        console.log('✅ PAYMENT VERIFIED - ALLOW ACCESS');
      } else {
        console.log('🆓 FREE ASSIGNMENT - ALLOW ACCESS');
      }
    } else {
      console.log('❌ Payment service not accessible');
    }
  } catch (error) {
    console.error('❌ Error in simulation:', error);
  }
}

// Main test function
async function runPaymentTests() {
  console.log('🚀 Running Complete Payment System Test...\n');
  
  const results = {
    databaseQuery: await testDatabaseQuery(),
    paymentService: await testPaymentService(),
  };
  
  console.log('\n📊 Test Results:');
  console.log('================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Payment system should be working.');
    console.log('\n🔧 Next Steps:');
    console.log('1. Refresh the assignment page');
    console.log('2. Check console for payment effect logs');
    console.log('3. You should be redirected to payment page');
  } else {
    console.log('⚠️ Some tests failed. Check the issues above.');
  }
  
  checkPaymentEffectLogs();
  
  return results;
}

// Export functions for manual testing
window.paymentTest = {
  runPaymentTests,
  testPaymentService,
  testDatabaseQuery,
  simulatePaymentCheck,
  clearPaymentCache,
  checkPaymentEffectLogs
};

console.log('\n💡 Available test functions:');
console.log('window.paymentTest.runPaymentTests() - Run all tests');
console.log('window.paymentTest.simulatePaymentCheck() - Simulate payment check');
console.log('window.paymentTest.clearPaymentCache() - Clear payment cache');

// Auto-run tests
runPaymentTests();
