import React, { useState } from 'react';
import type { InvoiceItem, InvoiceLineItem, InvoiceStatus, LeadItem } from './types';
import { apiCreateInvoice, apiUpdateInvoiceStatus, API_BASE } from './api';

interface InvoicingViewProps {
  invoices: InvoiceItem[];
  leads?: LeadItem[];
  preselectedLead?: LeadItem | null;
  onInvoicesUpdated: (invoices: InvoiceItem[]) => void;
  onClosePreselectedLead?: () => void;
}

export const InvoicingView: React.FC<InvoicingViewProps> = ({
  invoices,
  leads = [],
  preselectedLead,
  onInvoicesUpdated,
  onClosePreselectedLead,
}) => {
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(Boolean(preselectedLead));
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceItem | null>(null);

  // Form State for Invoice Creation
  const [clientName, setClientName] = useState(preselectedLead?.name || '');
  const [clientEmail, setClientEmail] = useState(preselectedLead?.email || '');
  const [clientCompany, setClientCompany] = useState(preselectedLead?.company || '');
  const [clientAddress, setClientAddress] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Payment due within specified due date. Wire instructions attached.');
  const [taxPercentage, setTaxPercentage] = useState<number>(8.5);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      description: 'ARRI Alexa 35 Camera Package & Cinema Optics',
      quantity: 1,
      unitPrice: 5000,
      amount: 5000,
    },
  ]);

  // Real-time Automated Calculations
  const calculatedSubtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const calculatedDiscountAmount = Number(((calculatedSubtotal * discountPercentage) / 100).toFixed(2));
  const taxableBase = Math.max(0, calculatedSubtotal - calculatedDiscountAmount);
  const calculatedTaxAmount = Number(((taxableBase * taxPercentage) / 100).toFixed(2));
  const calculatedTotalAmount = Number((taxableBase + calculatedTaxAmount).toFixed(2));

  // KPI Overview calculations
  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalPaid = invoices.filter((i) => i.status === 'Paid').reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalOutstanding = invoices
    .filter((i) => i.status === 'Sent' || i.status === 'Draft' || i.status === 'Overdue')
    .reduce((acc, i) => acc + (i.totalAmount || 0), 0);

  // Filters
  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = activeStatusFilter === 'All' || inv.status === activeStatusFilter;
    const matchesSearch =
      !searchQuery ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.clientCompany && inv.clientCompany.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        description: 'Soundstage / Grip Equipment Package',
        quantity: 1,
        unitPrice: 2000,
        amount: 2000,
      },
    ]);
  };

  const handleUpdateLineItem = (index: number, field: keyof InvoiceLineItem, val: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: val };
    item.amount = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
    updated[index] = item;
    setLineItems(updated);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail) return;

    const res = await apiCreateInvoice({
      clientName,
      clientEmail,
      clientCompany,
      clientAddress,
      currency,
      dueDate,
      notes,
      items: lineItems,
      taxPercentage,
      discountPercentage,
      leadId: preselectedLead?._id,
      status: 'Sent',
    });

    onInvoicesUpdated([res.invoice, ...invoices]);
    setShowCreateModal(false);
    if (onClosePreselectedLead) onClosePreselectedLead();
    setPreviewInvoice(res.invoice);
  };

  const handleStatusUpdate = async (invoiceId: string, newStatus: InvoiceStatus) => {
    await apiUpdateInvoiceStatus(invoiceId, newStatus);
    const updated = invoices.map((i) => (i._id === invoiceId ? { ...i, status: newStatus } : i));
    onInvoicesUpdated(updated);
    if (previewInvoice && previewInvoice._id === invoiceId) {
      setPreviewInvoice({ ...previewInvoice, status: newStatus });
    }
  };

  return (
    <div className="adm-view-container">
      {/* Header */}
      <div className="adm-view-header">
        <div className="adm-view-title">
          <h1>Automated Billing & Invoicing Engine</h1>
          <p>Generate professional client invoices, calculate multi-tier tax and discounts, and export PDF deliverables.</p>
        </div>
        <button
          className="adm-btn adm-btn-primary"
          onClick={() => {
            setShowCreateModal(true);
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          + Create Custom Invoice
        </button>
      </div>

      {/* Overview Cards */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-glow" />
          <div className="adm-kpi-label">Total Invoiced Volume</div>
          <div className="adm-kpi-value">${totalInvoiced.toLocaleString()}</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-glow" style={{ background: 'linear-gradient(90deg, #10b981, #055dff)' }} />
          <div className="adm-kpi-label">Paid & Settled Revenue</div>
          <div className="adm-kpi-value" style={{ color: '#34d399' }}>${totalPaid.toLocaleString()}</div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-glow" style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
          <div className="adm-kpi-label">Active Outstanding Balance</div>
          <div className="adm-kpi-value" style={{ color: '#fbbf24' }}>${totalOutstanding.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div className="adm-tabs" style={{ marginBottom: 0 }}>
          {['All', 'Sent', 'Paid', 'Draft', 'Overdue'].map((st) => (
            <button
              key={st}
              className={`adm-tab-btn ${activeStatusFilter === st ? 'active' : ''}`}
              onClick={() => setActiveStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '260px', flex: 1, maxWidth: '340px' }}>
          <input
            type="text"
            className="adm-input"
            placeholder="Search by invoice #, client, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client / Entity</th>
                <th>Issued</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#ff5121', fontFamily: 'monospace', fontSize: '13.5px' }}>
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{inv.clientName}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{inv.clientCompany || inv.clientEmail}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{inv.issueDate}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{inv.dueDate}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#fff' }}>
                        {inv.currency} {inv.totalAmount.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <select
                        className="adm-select"
                        style={{
                          width: 'auto',
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '6px',
                        }}
                        value={inv.status}
                        onChange={(e) => handleStatusUpdate(inv._id, e.target.value as InvoiceStatus)}
                      >
                        {['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'].map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="adm-btn adm-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setPreviewInvoice(inv)}
                      >
                        Preview & PDF →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Invoice Generator */}
      {showCreateModal && (
        <div className="adm-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="adm-modal-panel" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>New Cinematic Production Invoice</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: '#8f9099', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit}>
              <div className="adm-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Client Information */}
                {leads.length > 0 && (
                  <div className="adm-form-group">
                    <label className="adm-form-label">Auto-Fill from CRM Lead Pipeline</label>
                    <select
                      className="adm-select"
                      onChange={(e) => {
                        const l = leads.find((item) => item._id === e.target.value);
                        if (l) {
                          setClientName(l.name);
                          setClientEmail(l.email);
                          setClientCompany(l.company || '');
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Select an existing CRM client (optional)...</option>
                      {leads.map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.name} — {l.company || l.email} ({l.projectType})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Client / Producer Name</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Client Email</label>
                    <input
                      type="email"
                      className="adm-input"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Production Company</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="e.g. Apex Pictures"
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px' }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Billing Address</label>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Studio or accounting street address"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Currency</label>
                    <select className="adm-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Due Date</label>
                    <input
                      type="date"
                      className="adm-input"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Line Items Editor */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <label className="adm-form-label" style={{ marginBottom: 0 }}>Line Items & Deliverables</label>
                    <button
                      type="button"
                      className="adm-btn adm-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={handleAddLineItem}
                    >
                      + Add Item
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {lineItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '3fr 80px 110px 100px 36px',
                          gap: '10px',
                          alignItems: 'center',
                          background: 'var(--adm-surface-light)',
                          padding: '10px 12px',
                          borderRadius: '8px',
                        }}
                      >
                        <input
                          type="text"
                          className="adm-input"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                          required
                        />
                        <input
                          type="number"
                          min="1"
                          className="adm-input"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleUpdateLineItem(idx, 'quantity', e.target.value)}
                          required
                        />
                        <input
                          type="number"
                          min="0"
                          className="adm-input"
                          placeholder="Unit Price"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateLineItem(idx, 'unitPrice', e.target.value)}
                          required
                        />
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', textAlign: 'right' }}>
                          ${(item.quantity * item.unitPrice).toLocaleString()}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '14px',
                            opacity: lineItems.length === 1 ? 0.3 : 1,
                          }}
                          disabled={lineItems.length === 1}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tax, Discounts & Automated Totals */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'var(--adm-surface-light)', padding: '18px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="adm-form-group" style={{ marginBottom: 0 }}>
                      <label className="adm-form-label">Tax / VAT Percentage (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="adm-input"
                        value={taxPercentage}
                        onChange={(e) => setTaxPercentage(Number(e.target.value))}
                      />
                    </div>
                    <div className="adm-form-group" style={{ marginBottom: 0 }}>
                      <label className="adm-form-label">Client Discount Percentage (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="adm-input"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', borderLeft: '1px solid var(--adm-border)', paddingLeft: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8' }}>
                      <span>Subtotal:</span>
                      <span style={{ fontWeight: 600, color: '#fff' }}>${calculatedSubtotal.toFixed(2)}</span>
                    </div>
                    {calculatedDiscountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8' }}>
                        <span>Discount ({discountPercentage}%):</span>
                        <span style={{ color: '#34d399' }}>-${calculatedDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {calculatedTaxAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8' }}>
                        <span>Estimated Tax ({taxPercentage}%):</span>
                        <span style={{ color: '#e2e8f0' }}>+${calculatedTaxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#ff5121',
                        borderTop: '1px solid var(--adm-border)',
                        paddingTop: '8px',
                        marginTop: '4px',
                      }}
                    >
                      <span>Grand Total:</span>
                      <span>{currency} ${calculatedTotalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">Payment Instructions & Notes</label>
                  <textarea
                    rows={2}
                    className="adm-textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn adm-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  Generate & Send Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Preview & Export PDF */}
      {previewInvoice && (
        <div className="adm-modal-backdrop" onClick={() => setPreviewInvoice(null)}>
          <div className="adm-modal-panel" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Invoice Document: #{previewInvoice.invoiceNumber}</h2>
              <button
                onClick={() => setPreviewInvoice(null)}
                style={{ background: 'none', border: 'none', color: '#8f9099', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <div className="adm-modal-body" style={{ background: '#fff', color: '#111', borderRadius: '8px', margin: '20px', padding: '30px' }}>
              {/* Printable Invoice Sheet */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ff5121', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#111', letterSpacing: '0.5px' }}>
                    CINECRAFT MEDIA
                  </h1>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#666' }}>
                    742 Evergreen Studio Complex, Los Angeles, CA 90028
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>
                    billing@cinecraftmedia.com • +1 (555) 019-2834
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#ff5121' }}>INVOICE</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#333' }}>#{previewInvoice.invoiceNumber}</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Status: {previewInvoice.status.toUpperCase()}</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>Due: {previewInvoice.dueDate}</div>
                </div>
              </div>

              {/* Billed To */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#ff5121', fontWeight: 700 }}>
                  Billed To:
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>{previewInvoice.clientName}</div>
                {previewInvoice.clientCompany && (
                  <div style={{ fontSize: '12px', color: '#555' }}>{previewInvoice.clientCompany}</div>
                )}
                <div style={{ fontSize: '12px', color: '#555' }}>{previewInvoice.clientEmail}</div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#111', color: '#fff' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewInvoice.items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{it.description}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>${it.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                        ${it.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                    <span>Subtotal:</span>
                    <span>${previewInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {previewInvoice.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                      <span>Discount:</span>
                      <span>-${previewInvoice.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {previewInvoice.taxAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                      <span>Tax / VAT:</span>
                      <span>+${previewInvoice.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#111',
                      borderTop: '2px solid #111',
                      paddingTop: '6px',
                    }}
                  >
                    <span>Total Due:</span>
                    <span>{previewInvoice.currency} ${previewInvoice.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              {previewInvoice.notes && (
                <div style={{ fontSize: '11px', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                  <strong>Notes:</strong> {previewInvoice.notes}
                </div>
              )}
            </div>

            <div className="adm-modal-footer">
              <button
                className="adm-btn adm-btn-secondary"
                onClick={() => {
                  window.print();
                }}
              >
                🖨️ Print / Save as PDF
              </button>
              <button
                className="adm-btn adm-btn-primary"
                onClick={() => {
                  window.open(`${API_BASE}/admin/invoices/${previewInvoice._id}/pdf`, '_blank');
                }}
              >
                Download PDF Deliverable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
