/**
 * Receipt Generator Bubble Adapter — Production-Ready Post-Payment Receipt for Bubble.io
 * @version 3.0.0
 * Zero-config handshake: pdf_url state + pdf_is_ready event.
 * Security: is_payment_confirmed required. Auto-calc from line_items_json.
 * Bubble Bridge: Base64 → uploadContent → pdf_url + pdf_is_ready.
 */

//==============================================================================
// ELEMENT: Receipt Generator — initialize
//==============================================================================

function initialize(instance, context) {
    if (typeof window.ReceiptGeneratorCore === 'undefined') {
        instance.publishState('last_error', 'ReceiptGeneratorCore not loaded. Check Shared HTML Header.');
        return;
    }
    instance.data.receiptCore = new window.ReceiptGeneratorCore();
    instance.publishState('last_pdf_filename', '');
    instance.publishState('pdf_url', '');
    instance.publishState('last_error', '');
}

//==============================================================================
// ELEMENT: Receipt Generator — update
//==============================================================================

function update(instance, context) {
    // Defaults read at action time
}

//==============================================================================
// ELEMENT: Receipt Generator — reset
//==============================================================================

function reset(instance, context) {
    instance.data.receiptCore = null;
}

//==============================================================================
// Helper: build opts from element defaults + action properties
//==============================================================================

function buildReceiptOpts(def, p) {
    var sellerInfo = { name: def.company_name, address: def.company_address };
    if (p.seller_name) sellerInfo.name = p.seller_name;
    if (p.seller_address) sellerInfo.address = p.seller_address;
    var buyerInfo = { name: p.buyer_name, address: p.buyer_address };
    return {
        debug_mode: !!p.debug_mode,
        is_payment_confirmed: !!p.is_payment_confirmed,
        transaction_id: p.transaction_id || '',
        payment_method: p.payment_method || '',
        paid_date: p.paid_date != null ? String(p.paid_date) : new Date().toISOString().slice(0, 10),
        seller_info: sellerInfo,
        buyer_info: buyerInfo,
        line_items_json: p.line_items_json || p.line_items,
        subtotal: p.subtotal,
        tax: p.tax,
        tax_amount: p.tax_amount,
        tax_rate: p.tax_rate,
        total: p.total,
        grand_total: p.grand_total,
        currency_code: (p.currency_code || p.currency || def.currency || 'USD').trim(),
        brand_color: (p.brand_color || def.brand_color || '#0d6efd').trim(),
        is_mobile: !!p.is_mobile,
        notes: p.notes || '',
        filename: (p.filename && String(p.filename).trim()) ? String(p.filename) : null
    };
}

//==============================================================================
// ACTION: Generate Receipt PDF (download to browser)
//==============================================================================

function action_generate_receipt_pdf(instance, properties, context) {
    var core = instance && instance.data && instance.data.receiptCore;
    if (!core) {
        return { success: false, error: 'Receipt Generator not initialized.' };
    }
    var def = instance.properties || instance.data || {};
    var p = properties || {};
    var opts = buildReceiptOpts(def, p);
    opts.invoice_number = p.invoice_number || p.transaction_id || 'RCP-001';
    opts.invoice_date = p.invoice_date || opts.paid_date;
    if (!opts.filename) opts.filename = 'receipt-' + (opts.transaction_id || opts.invoice_number).replace(/[^a-zA-Z0-9\-_]/g, '_') + '.pdf';
    try {
        core.generate(opts, {
            onSuccess: function(data) {
                instance.publishState('last_pdf_filename', data.filename);
                instance.publishState('last_error', '');
                instance.triggerEvent('pdf_generated');
                if (data.data_url && data.filename && typeof document !== 'undefined') {
                    try {
                        var a = document.createElement('a');
                        a.href = data.data_url;
                        a.download = data.filename;
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    } catch (dlErr) {
                        console.warn('[ReceiptGenerator] Download trigger failed:', dlErr);
                    }
                }
            },
            onError: function(data) {
                instance.publishState('last_error', data.message || 'Unknown error');
                instance.triggerEvent('pdf_error');
            }
        });
        return { success: true, filename: opts.filename };
    } catch (err) {
        var msg = err && err.message ? err.message : String(err);
        instance.publishState('last_error', msg);
        instance.triggerEvent('pdf_error');
        return { success: false, error: msg };
    }
}

//==============================================================================
// ACTION: Generate & Upload Receipt (Base64 → Bubble S3 → file_url for email)
// Uses context.uploadContent to upload PDF to Bubble storage.
// Workflow: After Stripe success → this action → pdf_is_ready → Send Email.
// Security: Pass transaction_id and total from Stripe/payment provider, not user input.
//==============================================================================

function action_generate_and_upload_receipt(instance, properties, context, callback) {
    var core = instance && instance.data && instance.data.receiptCore;
    if (!core) {
        var err = 'Receipt Generator not initialized.';
        instance.publishState('last_error', err);
        instance.triggerEvent('pdf_error');
        if (typeof callback === 'function') callback({ success: false, error: err });
        return;
    }
    var def = instance.properties || instance.data || {};
    var p = properties || {};
    var opts = buildReceiptOpts(def, p);
    opts.invoice_number = p.invoice_number || p.transaction_id || 'RCP-001';
    opts.invoice_date = p.invoice_date || opts.paid_date;
    opts.return_base64 = true;
    if (!opts.filename) opts.filename = 'receipt-' + (opts.transaction_id || opts.invoice_number).replace(/[^a-zA-Z0-9\-_]/g, '_') + '.pdf';

    try {
        core.generate(opts, {
            returnBase64: true,
            onSuccess: function(data) {
                var base64Data = data.base64 || data.file_base64;
                if (!base64Data) {
                    instance.publishState('last_error', 'No base64 generated');
                    instance.triggerEvent('pdf_error');
                    if (typeof callback === 'function') callback({ success: false, error: 'No base64 generated' });
                    return;
                }
                if (typeof context.uploadContent !== 'function') {
                    var fallbackMsg = 'uploadContent not available. Add plugin to app file storage or use Base64 File Uploader.';
                    instance.publishState('last_error', fallbackMsg);
                    instance.triggerEvent('pdf_error');
                    if (typeof callback === 'function') callback({ success: false, error: fallbackMsg, file_base64: base64Data, filename: data.filename });
                    return;
                }
                context.uploadContent(opts.filename, base64Data, function(err, url) {
                    if (err) {
                        var errMsg = 'Upload failed: ' + (err.message || err);
                        instance.publishState('last_error', errMsg);
                        instance.triggerEvent('pdf_error');
                        console.error('[ReceiptGenerator] Upload failed:', err);
                        if (typeof context.reportDebugger === 'function') {
                            context.reportDebugger(errMsg, err);
                        }
                        if (typeof callback === 'function') callback({ success: false, error: errMsg });
                        return;
                    }
                    instance.publishState('pdf_url', url || '');
                    instance.publishState('last_error', '');
                    instance.triggerEvent('pdf_is_ready');
                    if (typeof callback === 'function') callback({ success: true, file_url: url, filename: data.filename });
                });
            },
            onError: function(data) {
                instance.publishState('last_error', data.message || 'Unknown error');
                instance.triggerEvent('pdf_error');
                if (typeof callback === 'function') callback({ success: false, error: data.message });
            }
        });
    } catch (err) {
        var msg = err && err.message ? err.message : String(err);
        instance.publishState('last_error', msg);
        instance.triggerEvent('pdf_error');
        if (typeof callback === 'function') callback({ success: false, error: msg });
        else return { success: false, error: msg };
    }
}
