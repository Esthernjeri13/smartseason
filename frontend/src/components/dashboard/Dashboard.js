import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatCard, StatusBadge, StageBadge, ProgressBar, Loader, PageHeader, Card } from '../shared/Shared';
import api from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './Dashboard.css';

const STATUS_COLORS = {
  'Active': '#7ec44a',
  'At Risk': '#e8a23a',
  'Completed': '#55c4a8',
};

const STAGE_COLORS = {
  'Planted': '#5598e0',
  'Growing': '#7ec44a',
  'Ready': '#e8a23a',
  'Harvested': '#55c4a8',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label || payload[0]?.name}</p>
        <p className="chart-tooltip-value">{payload[0]?.value} fields</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!stats) return null;

  const statusData = Object.entries(stats.status_breakdown).map(([name, value]) => ({ name, value }));
  const stageData = Object.entries(stats.stage_breakdown).map(([name, value]) => ({ name, value }));
  const cropData = Object.entries(stats.crop_breakdown).map(([name, value]) => ({ name, value }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page dashboard-page">
      <PageHeader
        title={`${greeting}, ${user.name.split(' ')[0]}`}
        subtitle={`Season overview — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
      />

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          label="Total Fields"
          value={stats.total_fields}
          color="var(--accent-primary)"
          icon={<FieldIcon />}
        />
        <StatCard
          label="Active"
          value={stats.status_breakdown['Active']}
          color="var(--accent-primary)"
          sub="On track"
          icon={<ActiveIcon />}
        />
        <StatCard
          label="At Risk"
          value={stats.status_breakdown['At Risk']}
          color="var(--accent-amber)"
          sub="Need attention"
          icon={<RiskIcon />}
        />
        <StatCard
          label="Completed"
          value={stats.status_breakdown['Completed']}
          color="var(--accent-completed)"
          sub="Harvested"
          icon={<CheckIcon />}
        />
      </div>

      {/* At Risk Alert */}
      {stats.at_risk_fields.length > 0 && (
        <div className="alert-banner">
          <div className="alert-icon"><RiskIcon /></div>
          <div className="alert-content">
            <strong>{stats.at_risk_fields.length} field{stats.at_risk_fields.length > 1 ? 's' : ''} at risk</strong>
            <span>{stats.at_risk_fields.map(f => f.name).join(', ')}</span>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Status Pie */}
        <Card className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Field Status</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || '#555'} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {statusData.map(d => (
                <div key={d.name} className="legend-item">
                  <span className="legend-dot" style={{ background: STATUS_COLORS[d.name] }} />
                  <span className="legend-label">{d.name}</span>
                  <span className="legend-value">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Stage Bar Chart */}
        <Card className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Stage Breakdown</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stageData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(126,196,74,0.07)" />
                <XAxis dataKey="name" tick={{ fill: '#9aaa80', fontSize: 11, fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9aaa80', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {stageData.map((entry, i) => (
                    <Cell key={i} fill={STAGE_COLORS[entry.name] || '#5a6649'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Crop Breakdown */}
        <Card className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Crop Distribution</h3>
          </div>
          <div className="crop-list">
            {cropData.sort((a,b) => b.value - a.value).map(c => (
              <div key={c.name} className="crop-item">
                <span className="crop-name">{c.name}</span>
                <ProgressBar value={(c.value / stats.total_fields) * 100} />
                <span className="crop-count">{c.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Agent Stats (Admin only) */}
        {isAdmin && stats.agent_stats && (
          <Card className="chart-card agent-card">
            <div className="card-header">
              <h3 className="card-title">Agent Overview</h3>
            </div>
            <div className="agent-list">
              {stats.agent_stats.map(a => (
                <div key={a.id} className="agent-row">
                  <div className="agent-avatar">{a.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                  <div className="agent-info">
                    <span className="agent-name">{a.name}</span>
                    <span className="agent-meta">{a.total_fields} fields · {a.at_risk} at risk · {a.completed} done</span>
                  </div>
                  {a.at_risk > 0 && <StatusBadge status="At Risk" />}
                </div>
              ))}
              {stats.agent_stats.length === 0 && (
                <p className="empty-text">No agents yet.</p>
              )}
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className={`chart-card activity-card ${isAdmin && stats.agent_stats ? '' : 'span-2'}`}>
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <div className="activity-list">
            {stats.recent_updates.length === 0 && (
              <p className="empty-text">No activity yet.</p>
            )}
            {stats.recent_updates.map(u => (
              <div key={u.id} className="activity-item">
                <div className="activity-dot" />
                <div className="activity-content">
                  <span className="activity-field">{u.field_name}</span>
                  {u.previous_stage !== u.new_stage && (
                    <span className="activity-stage-change">
                      <StageBadge stage={u.previous_stage} /> → <StageBadge stage={u.new_stage} />
                    </span>
                  )}
                  {u.notes && <p className="activity-note">{u.notes}</p>}
                  <span className="activity-meta">
                    {u.agent_name} · {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const FieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const ActiveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const RiskIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
