import React, { useState } from 'react';
import type { LeadItem, LeadStatus } from './types';
import { apiUpdateLeadStatus, apiAddLeadNote } from './api';

interface LeadsCrmViewProps {
  leads: LeadItem[];
  onLeadsUpdated: (leads: LeadItem[]) => void;
  onCreateInvoiceForLead: (lead: LeadItem) => void;
}

const LIFECYCLE_STAGES: LeadStatus[] = ['New', 'In Contact', 'Proposal Sent', 'Converted', 'Closed'];

export const LeadsCrmView: React.FC<LeadsCrmViewProps> = ({ leads, onLeadsUpdated, onCreateInvoiceForLead }) => {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Filtering
  const filteredLeads = leads.filter((lead) => {
    const matchesFilter = activeFilter === 'All' || lead.status === activeFilter;
    const matchesSearch =
      !searchQuery ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.projectType && lead.projectType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      lead.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    await apiUpdateLeadStatus(leadId, newStatus);
    const updated = leads.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l));
    onLeadsUpdated(updated);
    if (selectedLead && selectedLead._id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus });
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNoteText.trim()) return;

    await apiAddLeadNote(selectedLead._id, newNoteText.trim());
    const newNote = {
      author: 'Admin',
      text: newNoteText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [...(selectedLead.notes || []), newNote];
    const updatedLead = { ...selectedLead, notes: updatedNotes };
    setSelectedLead(updatedLead);

    const updatedList = leads.map((l) => (l._id === selectedLead._id ? updatedLead : l));
    onLeadsUpdated(updatedList);
    setNewNoteText('');
  };

  return (
    <div className="adm-view-container">
      {/* Header */}
      <div className="adm-view-header">
        <div className="adm-view-title">
          <h1>Client Lead Pipeline & CRM</h1>
          <p>Track production inquiries, manage lifecycle stages, and convert clients into billing invoices.</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div className="adm-tabs" style={{ marginBottom: 0 }}>
          <button
            className={`adm-tab-btn ${activeFilter === 'All' ? 'active' : ''}`}
            onClick={() => setActiveFilter('All')}
          >
            All ({leads.length})
          </button>
          {LIFECYCLE_STAGES.map((stage) => {
            const count = leads.filter((l) => l.status === stage).length;
            return (
              <button
                key={stage}
                className={`adm-tab-btn ${activeFilter === stage ? 'active' : ''}`}
                onClick={() => setActiveFilter(stage)}
              >
                {stage} ({count})
              </button>
            );
          })}
        </div>

        <div style={{ minWidth: '260px', flex: 1, maxWidth: '340px' }}>
          <input
            type="text"
            className="adm-input"
            placeholder="Search leads by name, email, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Client / Production Entity</th>
                <th>Project Scope</th>
                <th>Budget Allocation</th>
                <th>Received</th>
                <th>Lifecycle Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No client inquiries found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{lead.name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {lead.company ? `${lead.company} • ` : ''}
                        {lead.email}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>{lead.projectType}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#ff5121', fontWeight: 600 }}>{lead.budget || 'Undisclosed'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(lead.createdAt).toLocaleDateString()}
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
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead._id, e.target.value as LeadStatus)}
                      >
                        {LIFECYCLE_STAGES.map((st) => (
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
                        onClick={() => setSelectedLead(lead)}
                      >
                        Client Dossier →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Profile Modal / Dossier */}
      {selectedLead && (
        <div className="adm-modal-backdrop" onClick={() => setSelectedLead(null)}>
          <div className="adm-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Client Dossier: {selectedLead.name}</h2>
              <button
                onClick={() => setSelectedLead(null)}
                style={{ background: 'none', border: 'none', color: '#8f9099', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <div className="adm-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Contact meta grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: 'var(--adm-surface-light)', padding: '16px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#8f9099', textTransform: 'uppercase' }}>Company / Brand</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>{selectedLead.company || 'Independent'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#8f9099', textTransform: 'uppercase' }}>Email</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#ff5121' }}>{selectedLead.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#8f9099', textTransform: 'uppercase' }}>Phone</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>{selectedLead.phone || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#8f9099', textTransform: 'uppercase' }}>Estimated Budget</div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#10b981' }}>{selectedLead.budget || 'Undisclosed'}</div>
                </div>
              </div>

              {/* Inquiry message */}
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: '#8f9099', textTransform: 'uppercase' }}>Inquiry Message</h4>
                <div
                  style={{
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--adm-border)',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    lineHeight: '1.6',
                    color: '#e2e8f0',
                  }}
                >
                  {selectedLead.message}
                </div>
              </div>

              {/* Notes Timeline */}
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#8f9099', textTransform: 'uppercase' }}>
                  Internal Notes & Communication Thread
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', marginBottom: '12px' }}>
                  {!selectedLead.notes || selectedLead.notes.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>No notes logged yet.</div>
                  ) : (
                    selectedLead.notes.map((note, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 14px',
                          background: 'var(--adm-surface-light)',
                          borderRadius: '8px',
                          borderLeft: '3px solid #ff5121',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8f9099', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{note.author}</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{note.text}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="adm-input"
                    placeholder="Log a call note or status update..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                  />
                  <button type="submit" className="adm-btn adm-btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                    + Add Note
                  </button>
                </form>
              </div>

              {/* Linked Invoices */}
              {selectedLead.invoices && selectedLead.invoices.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: '#8f9099', textTransform: 'uppercase' }}>
                    Associated Invoices
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedLead.invoices.map((inv) => (
                      <div
                        key={inv._id}
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(255, 81, 33, 0.08)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 81, 33, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: '#fff' }}>#{inv.invoiceNumber}</span>
                          <span style={{ marginLeft: '12px', color: '#ff5121', fontWeight: 600 }}>
                            ${inv.totalAmount.toLocaleString()}
                          </span>
                        </div>
                        <span className="adm-badge adm-badge-sent">{inv.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-secondary" onClick={() => setSelectedLead(null)}>
                Close
              </button>
              <button
                className="adm-btn adm-btn-primary"
                onClick={() => {
                  const leadToConvert = selectedLead;
                  setSelectedLead(null);
                  onCreateInvoiceForLead(leadToConvert);
                }}
              >
                + Generate Invoice for this Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
