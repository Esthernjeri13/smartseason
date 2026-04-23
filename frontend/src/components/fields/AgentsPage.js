import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Loader, EmptyState, PageHeader } from '../shared/Shared';
import './Fields.css';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/agents').then(r => setAgents(r.data.agents)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="page">
      <PageHeader
        title="Field Agents"
        subtitle={`${agents.length} active agent${agents.length !== 1 ? 's' : ''} this season`}
      />

      {agents.length === 0 ? (
        <EmptyState icon={<TeamIcon />} title="No agents yet" sub="Agents will appear here once they register." />
      ) : (
        <div className="agents-grid">
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentCard({ agent }) {
  const initials = agent.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="agent-card-full">
      <div className="agent-card-header">
        <div className="agent-avatar-lg">{initials}</div>
        <div>
          <div className="agent-card-name">{agent.name}</div>
          <div className="agent-card-email">{agent.email}</div>
        </div>
      </div>

      <div className="agent-stats-row">
        <div className="agent-stat">
          <span className="agent-stat-val">{agent.field_count}</span>
          <span className="agent-stat-label">Fields</span>
        </div>
        <div className="agent-stat">
          <span className="agent-stat-val" style={{ color: 'var(--accent-primary)' }}>—</span>
          <span className="agent-stat-label">Active</span>
        </div>
        <div className="agent-stat">
          <span className="agent-stat-val" style={{ color: 'var(--accent-completed)' }}>—</span>
          <span className="agent-stat-label">Done</span>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        Joined {new Date(agent.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </div>
    </div>
  );
}

const TeamIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
