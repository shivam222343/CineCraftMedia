import React from 'react';
import type { DashboardAnalytics } from './types';

interface OverviewViewProps {
  analytics: DashboardAnalytics;
  onNavigateTab: (tab: string) => void;
  onOpenNewInvoice: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ analytics, onNavigateTab, onOpenNewInvoice }) => {
  const { metrics, charts, recentActivities } = analytics;

  // Max value for revenue bar chart scaling
  const maxRevenue = Math.max(...charts.monthlyRevenue.map((d) => d.revenue), 100000);

  return (
    <div className="adm-view-container">
      {/* View Header */}
      <div className="adm-view-header">
        <div className="adm-view-title">
          <h1>Executive Overview</h1>
          <p>Real-time analytics, revenue pipeline, and client inquiry lifecycle.</p>
        </div>
        <div className="adm-topbar-actions">
          <button className="adm-btn adm-btn-secondary" onClick={() => onNavigateTab('leads')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Review Leads
          </button>
          <button className="adm-btn adm-btn-primary" onClick={onOpenNewInvoice}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Generate Invoice
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-glow" />
          <div className="adm-kpi-label">
            <span>Total Paid Revenue</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </div>
          <div className="adm-kpi-value">${metrics.totalRevenue.toLocaleString()}</div>
          <div className="adm-kpi-delta">
            <span>+18.4% vs last cycle</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-glow" style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
          <div className="adm-kpi-label">
            <span>Outstanding Balance</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="adm-kpi-value">${metrics.totalOutstanding.toLocaleString()}</div>
          <div className="adm-kpi-delta" style={{ color: '#f59e0b' }}>
            <span>{metrics.activeInvoicesCount} invoices pending</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-glow" style={{ background: 'linear-gradient(90deg, #055dff, #ff5121)' }} />
          <div className="adm-kpi-label">
            <span>Total Client Inquiries</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#055dff" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="adm-kpi-value">{metrics.totalLeads}</div>
          <div className="adm-kpi-delta">
            <span>Active CRM Pipeline</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-glow" style={{ background: 'linear-gradient(90deg, #10b981, #055dff)' }} />
          <div className="adm-kpi-label">
            <span>Lead Conversion Rate</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="adm-kpi-value">{metrics.conversionRate}%</div>
          <div className="adm-kpi-delta">
            <span>Above industry benchmark</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '30px' }}>
        {/* Revenue Trend Chart */}
        <div className="adm-card">
          <div className="adm-card-header">
            <h3>Revenue Growth (USD)</h3>
            <span style={{ fontSize: '12px', color: '#8f9099' }}>Trailing 6 Months</span>
          </div>
          <div className="adm-chart-container">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '170px', paddingBottom: '10px' }}>
              {charts.monthlyRevenue.map((item, idx) => {
                const heightPercent = Math.max(12, Math.round((item.revenue / maxRevenue) * 100));
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span style={{ fontSize: '10.5px', color: '#ff5121', fontWeight: 600 }}>${Math.round(item.revenue / 1000)}k</span>
                    <div
                      style={{
                        width: '32px',
                        height: `${heightPercent}%`,
                        background: idx === charts.monthlyRevenue.length - 1 ? 'linear-gradient(180deg, #ff5121, #670b22)' : 'rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px 6px 2px 2px',
                        transition: 'height 0.4s ease',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lead Pipeline Distribution */}
        <div className="adm-card">
          <div className="adm-card-header">
            <h3>Lead Pipeline Statuses</h3>
            <button
              onClick={() => onNavigateTab('leads')}
              style={{ background: 'none', border: 'none', color: '#ff5121', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
            >
              Open CRM →
            </button>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(charts.leadsByStatus).map(([status, count]) => {
              const total = Math.max(1, metrics.totalLeads);
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{status}</span>
                    <span style={{ color: '#94a3b8' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background:
                          status === 'Converted'
                            ? '#10b981'
                            : status === 'Proposal Sent'
                            ? '#c084fc'
                            : status === 'In Contact'
                            ? '#fbbf24'
                            : '#60a5fa',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activities Log */}
      <div className="adm-card">
        <div className="adm-card-header">
          <h3>Recent Operations & Submissions</h3>
          <span style={{ fontSize: '12px', color: '#8f9099' }}>Live Redis & DB activity stream</span>
        </div>
        <div style={{ padding: '8px 24px' }}>
          {recentActivities.map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: act.type === 'invoice' ? 'rgba(255, 81, 33, 0.15)' : 'rgba(5, 93, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: act.type === 'invoice' ? '#ff5121' : '#60a5fa',
                  }}
                >
                  {act.type === 'invoice' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                      <line x1="2" y1="10" x2="22" y2="10"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>{act.title}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{act.subtitle}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="adm-badge adm-badge-new">{act.badge}</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
