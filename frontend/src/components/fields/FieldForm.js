import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CROP_TYPES = ['Maize','Wheat','Rice','Soybean','Sugarcane','Tomato','Potato','Cassava','Beans','Sorghum','Other'];
const STAGES = ['Planted','Growing','Ready','Harvested'];

export default function FieldForm({ field, onSuccess, onCancel }) {
  const isEdit = !!field;
  const [form, setForm] = useState({
    name: field?.name || '',
    crop_type: field?.crop_type || 'Maize',
    planting_date: field?.planting_date || new Date().toISOString().split('T')[0],
    stage: field?.stage || 'Planted',
    size_hectares: field?.size_hectares || '',
    location: field?.location || '',
    assigned_agent_id: field?.assigned_agent_id || '',
  });
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/users/agents').then(r => setAgents(r.data.agents)).catch(() => {});
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, size_hectares: form.size_hectares ? parseFloat(form.size_hectares) : null };
      let r;
      if (isEdit) {
        r = await api.put(`/fields/${field.id}`, payload);
      } else {
        r = await api.post('/fields', payload);
      }
      onSuccess(r.data.field);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save field');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-group">
        <label className="form-label">Field Name *</label>
        <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="e.g. North Valley Block A" required />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Crop Type *</label>
          <select className="form-input form-select" name="crop_type" value={form.crop_type} onChange={handleChange}>
            {CROP_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Stage *</label>
          <select className="form-input form-select" name="stage" value={form.stage} onChange={handleChange}>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Planting Date *</label>
          <input className="form-input" type="date" name="planting_date" value={form.planting_date} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Size (hectares)</label>
          <input className="form-input" type="number" step="0.1" min="0" name="size_hectares" value={form.size_hectares} onChange={handleChange} placeholder="e.g. 5.2" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Location</label>
        <input className="form-input" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Rift Valley, Kenya" />
      </div>

      <div className="form-group">
        <label className="form-label">Assign Agent</label>
        <select className="form-input form-select" name="assigned_agent_id" value={form.assigned_agent_id} onChange={handleChange}>
          <option value="">Unassigned</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.field_count} fields)</option>)}
        </select>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : isEdit ? 'Save Changes' : 'Create Field'}
        </button>
      </div>
    </form>
  );
}
