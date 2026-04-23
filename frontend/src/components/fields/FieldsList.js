import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { StatusBadge, StageBadge, ProgressBar, Loader, EmptyState, PageHeader, Modal } from '../shared/Shared';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import FieldForm from './FieldForm';
import './Fields.css';

const CROP_TYPES = ['Maize','Wheat','Rice','Soybean','Sugarcane','Tomato','Potato','Cassava','Beans','Sorghum','Other'];

export default function FieldsList() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStage, setFilterStage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCrop, setFilterCrop] = useState('all');
  const [search, setSearch] = useState('');

  async function fetchFields() {
    try {
      const r = await api.get('/fields');
      setFields(r.data.fields);
    } catch (err) {
      toast.error('Failed to load fields');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchFields(); }, []);

  const filtered = fields.filter(f => {
    if (filterStage !== 'all' && f.stage !== filterStage) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    if (filterCrop !== 'all' && f.crop_type !== filterCrop) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.crop_type.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const uniqueCrops = [...new Set(fields.map(f => f.crop_type))];

  if (loading) return <Loader />;

  return (
    <div className="page fields-page">
      <PageHeader
        title={isAdmin ? 'All Fields' : 'My Fields'}
        subtitle={`${filtered.length} field${filtered.length !== 1 ? 's' : ''} ${filterStage !== 'all' || filterStatus !== 'all' ? '(filtered)' : 'this season'}`}
        action={
          isAdmin && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <PlusIcon /> New Field
            </button>
          )
        }
      />

      {/* Filters */}
      <div className="filters-bar">
        <input
          className="form-input filter-search"
          placeholder="Search fields..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-input form-select filter-select" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="all">All Stages</option>
          <option value="Planted">Planted</option>
          <option value="Growing">Growing</option>
          <option value="Ready">Ready</option>
          <option value="Harvested">Harvested</option>
        </select>
        <select className="form-input form-select filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="At Risk">At Risk</option>
          <option value="Completed">Completed</option>
        </select>
        <select className="form-input form-select filter-select" value={filterCrop} onChange={e => setFilterCrop(e.target.value)}>
          <option value="all">All Crops</option>
          {uniqueCrops.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FieldIcon />}
          title="No fields found"
          sub={fields.length === 0 ? "Create your first field to get started." : "Try adjusting filters."}
          action={isAdmin && fields.length === 0 && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}><PlusIcon /> New Field</button>
          )}
        />
      ) : (
        <div className="fields-grid">
          {filtered.map(field => (
            <FieldCard key={field.id} field={field} onClick={() => navigate(`/fields/${field.id}`)} />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Field">
        <FieldForm
          onSuccess={field => {
            setFields(prev => [field, ...prev]);
            setShowCreate(false);
            toast.success('Field created!');
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}

function FieldCard({ field, onClick }) {
  const progressColor = field.status === 'At Risk' ? 'var(--accent-amber)' :
    field.status === 'Completed' ? 'var(--accent-completed)' : 'var(--accent-primary)';

  return (
    <div className="field-card" onClick={onClick}>
      <div className="field-card-top">
        <div className="field-card-badges">
          <StatusBadge status={field.status} />
          <StageBadge stage={field.stage} />
        </div>
        <ChevronIcon />
      </div>

      <h3 className="field-card-name">{field.name}</h3>

      <div className="field-card-meta">
        <span className="meta-item">
          <CropIcon />
          {field.crop_type}
        </span>
        {field.assigned_agent && (
          <span className="meta-item">
            <AgentIcon />
            {field.assigned_agent.name}
          </span>
        )}
        {field.size_hectares && (
          <span className="meta-item">
            <SizeIcon />
            {field.size_hectares} ha
          </span>
        )}
      </div>

      <div className="field-card-progress">
        <div className="progress-labels">
          <span>Day {field.days_in_field} of ~{field.expected_days}</span>
          <span>{field.progress}%</span>
        </div>
        <ProgressBar value={field.progress} color={progressColor} />
      </div>

      {field.last_update && (
        <p className="field-card-update">
          Updated {formatDistanceToNow(new Date(field.last_update), { addSuffix: true })}
        </p>
      )}
    </div>
  );
}

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const FieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const CropIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 22V12"/>
    <path d="M17 7a5 5 0 0 1-10 0C7 4.7 9.2 3 12 3s5 1.7 5 4z"/>
  </svg>
);

const AgentIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const SizeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
  </svg>
);
