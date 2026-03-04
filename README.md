# Receipt Generator — Post-Payment Receipt Plugin for Bubble.io

Secure, zero-config post-payment receipt PDF. Trigger after Stripe/online transaction. **Client-side PDF generation (0 WU)**. Returns Base64 or uploads to Bubble for email attachment.

## Security (Hybrid Approach)

- **Trigger** from server-side (e.g. Stripe Webhook) or post-payment redirect page
- **PDF generation** on client-side only after server confirms payment
- **Transaction ID** and **Total** must come from the payment provider (Stripe Current Session), not user input — prevents tampering

## Features

- Header: **PAYMENT RECEIPT** (not invoice)
- **PAID** watermark (green, low opacity, diagonal)
- Transaction ID and Paid Date displayed
- **Auto-calc**: If only `quantity` and `unit_price` provided → line_total, subtotal, tax, grand_total computed
- **Intl.NumberFormat**: Currency formatted by `currency_code` (USD → $, EUR → €)
- **Mobile layout**: `is_mobile: true` → single-column stacked list, 12pt+ fonts
- **Generate & Upload Receipt** → returns `file_url` for Send Email attachment

## Bubble Plugin Quick Checklist

For smooth operation as a Bubble plugin:

1. **Add plugin** to your app and enable it
2. **Paste** `plugin-html-header.html` into Plugin Editor → Shared tab → HTML Header (entire file)
3. **Place** Receipt Generator element on the Thank You page (post-payment)
4. **Configure** element defaults: company name, address, currency
5. **Ensure app file storage** is enabled (for uploadContent to work)

## Workflow

1. Stripe checkout success → redirect to Thank You page (or webhook triggers workflow)
2. Run **Generate & Upload Receipt** with `transaction_id` and `total` from Stripe/payment data
3. Event **pdf_is_ready** fires
4. State **pdf_url** contains Bubble file URL
5. Next step: **Send Email** with attachment = Receipt Generator’s **pdf_url**

## Line Items Format

```json
[{"description":"Service","quantity":2,"unit_price":50}]
```

`amount` is auto-calculated as `quantity * unit_price` if omitted.

## Files

| File | Purpose |
|------|---------|
| `plugin-html-header.html` | Paste into Shared tab → HTML Header |
| `src/plugin.json` | Reference manifest |
| `src/receipt-generator-core.js` | Core logic (for test page) |
| `src/bubble-adapter.js` | Adapter source |
| `BUBBLE_PLUGIN_ES5_CODE.txt` | Copy-paste for Plugin Editor |
| `test/simulator.html` | Local demo |

## Security Guardrail

- **is_payment_confirmed**: Mandatory. Pass Stripe Charge's `succeeded` (boolean) to this field. The code throws "Security Error: Payment not verified" if false.
- Run the workflow only on the page shown after successful Stripe checkout
- Pass `transaction_id` from **Stripe Current Session** (or payment provider API)
- Pass `total` from payment provider data
- Do not bind these to user-editable inputs
