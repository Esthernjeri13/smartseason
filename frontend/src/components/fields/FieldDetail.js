import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { StatusBadge, StageBadge, ProgressBar, Loader, Modal, PageHeader } from '../shared/Shared';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import FieldForm from './FieldForm';
import './Fields.css';

const STAGES = ['Planted', 'Growing', 'Ready', 'Harvested'];
const WEATHER = ['Sunny', 'Partly Cloudy', 'Overcast', 'Rainy', 'Stormy', 'Clear', 'Foggy'];

export default function FieldDetail() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateForm, setUpdateForm] = useState({ new_stage: '', notes: '', observations: '', weather_condition: '' });
  const [submitting, setSubmitting] = useState(false);

  async function fetchField() {
    try {
      const r = await api.get(`/fields/${id}`);
      setField(r.data.field);
      setUpdateForm(prev => ({ ...prev, new_stage: r.data.field.stage }));
    } catch (err) {
      toast.error('Field not found');
      navigate('/fields');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchField(); }, [id]);

  async function handleDelete() {
    if (!window.confirm(`Delete "${field.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/fields/${id}`);
      toast.success('Field deleted');
      navigate('/fields');
    } catch {
      toast.error('Failed to delete field');
    }
  }

  async function handleAddUpdate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await api.post(`/fields/${id}/updates`, updateForm);
      setField(prev => ({
        ...r.data.field,
        updates: [r.data.update, ...(prev.updates || [])],
      }));
      setShowUpdate(false);
      toast.success('Update added!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add update');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loader />;
  if (!field) return null;

  const progressColor = field.status === 'At Risk' ? 'var(--accent-amber)' :
    field.status === 'Completed' ? 'var(--accent-completed)' : 'var(--accent-primary)';

  const canUpdate = isAdmin || (field.assigned_agent_id === user.id);

  return (
    <div className="page field-detail-page">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/fields')}>
          <BackIcon /> Fields
        </button>
        <div className="detail-actions">
          {canUpdate && (
            <button className="btn-primary" onClick={() => setShowUpdate(true)}>
              <EditIcon /> Add Update
            </button>
          )}
          {isAdmin && (
            <>
              <button className="btn-secondary" onClick={() => setShowEdit(true)}>Edit</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </>
          )}
        </div>
      </div>

      <div className="detail-title-row">
        <div>
          <h1 className="page-title">{field.name}</h1>
          <div className="detail-badges">
            <StatusBadge status={field.status} />
            <StageBadge stage={field.stage} />
            {field.crop_type && <span className="crop-tag">{field.crop_type}</span>}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Overview card */}
        <div className="detail-card">
          <h3 className="detail-card-title">Field Overview</h3>
          <div className="detail-facts">
            <div className="fact">
              <span className="fact-label">Planting Date</span>
              <span className="fact-value">{format(new Date(field.planting_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="fact">
              <span className="fact-label">Days in Field</span>
              <span className="fact-value">{field.days_in_field} days</span>
            </div>
            <div className="fact">
              <span className="fact-label">Expected Duration</span>
              <span className="fact-value">~{field.expected_days} days</span>
            </div>
            {field.size_hectares && (
              <div className="fact">
                <span className="fact-label">Size</span>
                <span className="fact-value">{field.size_hectares} hectares</span>
              </div>
            )}
            {field.location && (
              <div className="fact">
                <span className="fact-label">Location</span>
                <span className="fact-value">{field.location}</span>
              </div>
            )}
            <div className="fact">
              <span className="fact-label">Assigned Agent</span>
              <span className="fact-value">{field.assigned_agent?.name || '—'}</span>
            </div>
          </div>

          <div className="detail-progress-section">
            <div className="progress-labels">
              <span className="progress-label-text">Season Progress</span>
              <span className="progress-pct">{field.progress}%</span>
            </div>
            <ProgressBar value={field.progress} color={progressColor} />
            <p className="progress-note">
              {field.status === 'At Risk' && field.progress >= 100
                ? '⚠️ Field is overdue for harvest'
                : field.status === 'At Risk'
                ? '⚠️ Field needs attention'
                : field.status === 'Completed'
                ? '✅ Season complete'
                : `Day ${field.days_in_field} of ~${field.expected_days}`}
            </p>
          </div>
        </div>

        {/* Stage journey */}
        <div className="detail-card">
          <h3 className="detail-card-title">Stage Journey</h3>
          <div className="stage-journey">
            {STAGES.map((s, i) => {
              const stageIndex = STAGES.indexOf(field.stage);
              const done = i < stageIndex;
              const current = i === stageIndex;
              return (
                <div key={s} className={`journey-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                  <div className="journey-dot">
                    {done ? <CheckSmall /> : current ? <span className="dot-pulse" /> : null}
                  </div>
                  <div className="journey-info">
                    <span className="journey-label">{s}</span>
                    {current && <span className="journey-current-tag">Current</span>}
                  </div>
                  {i < STAGES.length - 1 && <div className={`journey-line ${done ? 'line-done' : ''}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Updates history */}
      <div className="detail-card updates-card">
        <div className="updates-header">
          <h3 className="detail-card-title">Update History</h3>
          <span className="updates-count">{field.updates?.length || 0} entries</span>
        </div>

        {(!field.updates || field.updates.length === 0) && (
          <p className="empty-text" style={{padding:'24px 0'}}>No updates yet. Add the first update.</p>
        )}

        <div className="updates-timeline">
          {(field.updates || []).map(u => (
            <div key={u.id} className="update-entry">
              <div className="update-dot" />
              <div className="update-body">
                <div className="update-meta-row">
                  <span className="update-agent">{u.agent_name}</span>
                  {u.previous_stage !== u.new_stage && (
                    <span className="update-stage-change">
                      <StageBadge stage={u.previous_stage} /> → <StageBadge stage={u.new_stage} />
                    </span>
                  )}
                  {u.weather_condition && (
                    <span className="update-weather">☁ {u.weather_condition}</span>
                  )}
                </div>
                {u.notes && <p className="update-notes">{u.notes}</p>}
                {u.observations && <p className="update-observations"><em>Observations:</em> {u.observations}</p>}
                <span className="update-time">
                  {format(new Date(u.created_at), 'MMM d, yyyy · h:mm a')}
                  {' · '}
                  {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Update Modal */}
      <Modal open={showUpdate} onClose={() => setShowUpdate(false)} title="Add Field Update">
        <form onSubmit={handleAddUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label className="form-label">New Stage</label>
            <select className="form-input form-select" value={updateForm.new_stage} onChange={e => setUpdateForm(p => ({ ...p, new_stage: e.target.value }))}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={3} placeholder="Summary notes..." value={updateForm.notes} onChange={e => setUpdateForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Observations</label>
            <textarea className="form-input" rows={2} placeholder="Detailed observations..." value={updateForm.observations} onChange={e => setUpdateForm(p => ({ ...p, observations: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Weather Condition</label>
            <select className="form-input form-select" value={updateForm.weather_condition} onChange={e => setUpdateForm(p => ({ ...p, weather_condition: e.target.value }))}>
              <option value="">Select weather...</option>
              {WEATHER.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowUpdate(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Submit Update'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Field">
        <FieldForm
          field={field}
          onSuccess={updated => {
            setField(prev => ({ ...prev, ...updated, updates: prev.updates }));
            setShowEdit(false);
            toast.success('Field updated!');
          }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>
    </div>
  );
}

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const CheckSmall = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
