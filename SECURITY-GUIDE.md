# Receipt Generator Plugin - Security Best Practices

## Protecting Transaction IDs from Hackers

### 🛡️ **Client-Side Security Limitations**

**Important**: This is a client-side plugin running in the user's browser. While we implement robust security measures, **transaction IDs will always be visible to the end user** during PDF generation in their browser.

### 🔒 **How to Protect Your Users' Transaction IDs**

#### 1. **Server-Side Validation (Recommended)**
```javascript
// Generate security hash on your server before sending to client
const securityHash = generateSecurityHash({
    transaction_id: stripeCharge.id,
    grand_total: amount,
    currency_code: 'USD',
    line_items: lineItems,
    timestamp: Date.now()
}, process.env.SECRET_KEY);
```

#### 2. **Use Opaque Reference IDs**
- Generate temporary reference IDs on your server
- Map to real transaction IDs in your database
- Only pass reference IDs to the client

#### 3. **Security Hash Implementation**
```javascript
// Always use the security hash feature
const receiptData = {
    transaction_id: 'ref_abc123', // Use reference ID, not real Stripe ID
    data_hash: securityHash,
    validation_secret: process.env.SECRET_KEY,
    timestamp: Date.now()
};
```

### 🚨 **Critical Security Practices**

#### **DO:**
- ✅ Use server-side webhooks to validate payments
- ✅ Generate security hashes on your backend
- ✅ Use HTTPS in production
- ✅ Store secrets in encrypted storage
- ✅ Monitor security validation failures
- ✅ Rotate validation secrets regularly

#### **DON'T:**
- ❌ Expose raw Stripe/payment provider IDs in client code
- ❌ Trust client-side data without validation
- ❌ Use predictable transaction ID patterns
- ❌ Store secrets in client-side code

### 🛡️ **Built-in Security Features**

This plugin includes:
- **HMAC-SHA256 Data Validation** - Cryptographic receipt verification
- **Constant-Time Comparison** - Prevents timing attacks
- **Timestamp Validation** - Prevents replay attacks (5-minute window)
- **Transaction ID Sanitization** - Prevents injection attacks
- **PDF Metadata Obfuscation** - Hides sensitive data in PDF properties

### 🔍 **Monitoring & Detection**

Set up monitoring for:
- Security validation failures
- Multiple failed receipt generation attempts
- Unexpected transaction ID patterns
- Timestamp validation failures

### 🚀 **Enterprise Security Architecture**

For maximum security, implement:

1. **Backend API Proxy**
   - Client → Your API → Receipt Generator
   - Hide all sensitive data from client

2. **Server-Side PDF Generation**
   - Generate PDFs on your server
   - Never expose transaction IDs to client

3. **JWT Token Authentication**
   - Issue short-lived tokens for receipt access
   - Validate tokens server-side

### 📊 **Security Incident Response**

If you suspect transaction ID compromise:
1. Immediately rotate validation secrets
2. Review security validation logs
3. Check for unusual receipt generation patterns
4. Contact your payment processor for guidance

### 🔗 **Additional Resources**

- [Stripe Security Best Practices](https://stripe.com/docs/security)
- [OWASP Client-Side Security Guide](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Bubble Data Protection](https://bubble.io/data-protection)

---

**Remember**: Client-side security has inherent limitations. For truly sensitive transaction data, always process receipts server-side and use this plugin for non-sensitive or already-public transaction information.