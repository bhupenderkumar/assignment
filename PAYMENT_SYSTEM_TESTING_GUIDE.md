# 🧪 Payment System Testing Guide

## 🎯 **Issue Fixed**

The payment check wasn't working because:
1. **Import Error**: `PlayAssignment.tsx` was importing from deleted `PaymentDemoPage.tsx`
2. **Function Call**: Using old `checkAssignmentPaymentAccess` instead of `paymentService.getAssignmentPaymentStatus`

### **✅ Fixes Applied**
1. **Updated Import**: Changed to import `paymentService` directly
2. **Fixed Function Call**: Using `paymentService.getAssignmentPaymentStatus()`
3. **Added Debugging**: Comprehensive console logging
4. **Global Access**: Added `paymentService` to `window` object for testing

## 🧪 **How to Test**

### **Step 1: Run Test Script**
1. Open browser console
2. Copy and paste the contents of `test-payment-check.js`
3. The script will automatically run tests and show results

### **Step 2: Test Assignment Access**
1. Go to: `http://localhost:5174/play/assignment/30a1ba75-da37-4a64-b761-7c6bcbcb035d`
2. **Expected Behavior**: Should redirect to payment page
3. **Check Console**: Look for payment check logs

### **Step 3: Manual Testing**
Run these commands in browser console:
```javascript
// Test payment service directly
window.paymentTest.simulatePaymentCheck()

// Clear cache and test again
window.paymentTest.clearPaymentCache()

// Run all tests
window.paymentTest.runPaymentTests()
```

## 🔍 **Expected Console Logs**

When accessing the assignment, you should see:
```
💳 Payment check effect triggered: {hasAssignment: true, hasUser: true, ...}
💳 Starting payment check for assignment: 30a1ba75-da37-4a64-b761-7c6bcbcb035d
💳 Payment status received: {requiresPayment: true, hasPaid: false, paymentAmount: 0.5}
🔒 Payment required for assignment: {...}
```

## 🚨 **If Payment Check Still Not Working**

### **Troubleshooting Steps**

1. **Check User Authentication**
   ```javascript
   // In console
   console.log('User:', window.supabase?.auth?.getUser());
   ```

2. **Check Assignment Data**
   ```javascript
   // In console
   window.supabase.from('interactive_assignment')
     .select('*')
     .eq('id', '30a1ba75-da37-4a64-b761-7c6bcbcb035d')
     .single()
     .then(result => console.log('Assignment:', result));
   ```

3. **Check Payment Service**
   ```javascript
   // In console
   window.paymentService.getAssignmentPaymentStatus(
     '30a1ba75-da37-4a64-b761-7c6bcbcb035d',
     'your-user-id'
   ).then(status => console.log('Payment Status:', status));
   ```

4. **Force Payment Check**
   ```javascript
   // Clear cache and refresh
   window.paymentTest.clearPaymentCache();
   location.reload();
   ```

## 🔧 **Manual Payment Flow Test**

### **Step 1: Access Assignment**
- URL: `http://localhost:5174/play/assignment/30a1ba75-da37-4a64-b761-7c6bcbcb035d`
- Should redirect to payment page

### **Step 2: Payment Page**
- URL: `http://localhost:5174/payment-demo?assignmentId=30a1ba75-da37-4a64-b761-7c6bcbcb035d&amount=0.5`
- Should show clean, mobile-friendly payment interface

### **Step 3: Complete Payment**
- Enter transaction details
- Verify payment
- Should redirect back to assignment

## 📊 **Database Verification**

Check if assignment has payment enabled:
```sql
SELECT id, title, requires_payment, payment_amount 
FROM interactive_assignment 
WHERE id = '30a1ba75-da37-4a64-b761-7c6bcbcb035d';
```

Expected result:
```
id: 30a1ba75-da37-4a64-b761-7c6bcbcb035d
title: Count 1 to 10
requires_payment: true
payment_amount: 0.5
```

## 🎯 **Success Criteria**

### **✅ Payment Check Working**
- Console shows payment check logs
- Assignment redirects to payment page
- Payment page loads correctly

### **✅ Payment Flow Working**
- Payment page shows assignment details
- Form accepts transaction details
- Verification works (or shows appropriate errors)
- Success redirects to assignment

### **✅ Access Control Working**
- Unpaid users cannot access assignment
- Paid users can access assignment
- Free assignments work normally

## 🚀 **Next Steps After Testing**

1. **If Working**: Remove debug logs and enable cache
2. **If Not Working**: Check specific error messages
3. **Production**: Test with real Solana transactions

## 🔍 **Debug Commands**

```javascript
// Check current user
window.supabase.auth.getUser().then(u => console.log('User:', u))

// Check assignment payment status
window.paymentService.getAssignmentPaymentStatus('30a1ba75-da37-4a64-b761-7c6bcbcb035d', 'user-id')

// Check if payment service is available
console.log('Payment Service:', window.paymentService)

// Clear payment cache
window.paymentTest.clearPaymentCache()

// Simulate payment check
window.paymentTest.simulatePaymentCheck()
```

## 📱 **Mobile Testing**

1. **Open on Mobile Device**
2. **Test Payment Page**: Should be mobile-optimized
3. **Test Form Inputs**: Should work with mobile keyboards
4. **Test Copy Button**: Should copy wallet address
5. **Test Navigation**: Back button should work

---

## 🎉 **Expected Result**

After these fixes, when you visit:
`http://localhost:5174/play/assignment/30a1ba75-da37-4a64-b761-7c6bcbcb035d`

You should:
1. **See payment check logs** in console
2. **Be redirected** to payment page automatically
3. **See clean payment interface** with assignment details
4. **Be able to complete** payment flow

The payment system should now work end-to-end! 🚀
