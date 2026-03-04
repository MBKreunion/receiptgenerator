# Invoice Generator — Step-by-Step Bubble Plugin Setup

Follow these steps to create and publish the plugin in Bubble.

## 1. Create the Plugin

1. Go to [bubble.io/home/plugins](https://bubble.io/home/plugins)
2. Click **Create a New Plugin**
3. Name it **Invoice Generator**

## 2. Shared Tab — HTML Header

1. Open the **Shared** tab
2. In **HTML Header**, paste the **entire contents** of `plugin-html-header.html`
3. Save

## 3. Elements Tab — Add Invoice Generator Element

1. Click **Add a new element**
2. **Name**: Invoice Generator
3. **Type**: Visual
4. **Description**: Place this element on your page to enable invoice PDF generation. Configure default company details.
5. **Icon**: receipt_long (or description)

### Element Fields (Property Editor)

| Field ID | Caption | Editor type | Default | Optional |
|----------|---------|-------------|---------|----------|
| company_name | Default Company Name | text | — | Yes |
| company_address | Default Company Address | text | — | Yes |
| currency | Default Currency | text | USD | No |

### Element States

| State ID | Name | Type |
|----------|------|------|
| last_pdf_filename | Last PDF Filename | text |
| pdf_url | PDF URL | text |
| last_error | Last Error | text |

### Element Events

- pdf_generated
- pdf_error

### Element Code

Copy from `BUBBLE_PLUGIN_ES5_CODE.txt`:
- **initialize** → section 1
- **update** → section 2
- **reset** → section 3

## 4. Actions Tab — Add Generate Invoice PDF Action

1. Click **Add a new action**
2. **Name**: Generate Invoice PDF
3. **Description**: Generate and download a PDF invoice from invoice data.
4. **Type**: Client-side
5. **Expose as action of**: Invoice Generator (this element)

### Action Fields

| Field ID | Caption | Editor type | Optional |
|----------|---------|-------------|----------|
| invoice_number | Invoice Number | text | No |
| invoice_date | Invoice Date | text | Yes |
| seller_name | Seller/Company Name | text | Yes |
| seller_address | Seller Address | text | Yes |
| buyer_name | Bill To / Buyer Name | text | No |
| buyer_address | Buyer Address | text | Yes |
| line_items | Line Items (JSON) | text | No |
| subtotal | Subtotal | text | Yes |
| tax | Tax Amount | text | Yes |
| total | Total | text | No |
| currency | Currency | text | Yes (default USD) |
| filename | Filename | text | Yes |
| notes | Notes | text | Yes |

### Action Code

Copy from `BUBBLE_PLUGIN_ES5_CODE.txt` — section 4 (the full function).

## 5. General Tab

- **Name**: Invoice Generator
- **Description**: Convert your Bubble invoice data into professional PDF invoices. 100% client-side — no server, no external APIs.
- **Category**: Tools / Utilities
- **Icon**: receipt_long

## 6. Add Test App and Test

1. **Settings** or **General** → Add a test app
2. Click **Go to test app**
3. Add the **Invoice Generator** element to a page
4. Add a button; on click → Run **Invoice Generator's** action **Generate Invoice PDF**
5. Fill in the action fields with test data (or use dynamic expressions)
6. Run the app and click the button — PDF should download

## 7. Publish (when ready to sell)

1. **Settings** tab → Set license (Free / Paid)
2. Configure pricing tiers if paid
3. Click **Publish** to create version
4. Submit for Bubble Marketplace review (if public)
