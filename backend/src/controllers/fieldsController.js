const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/db');
const { computeFieldStatus, getDaysInField, getExpectedDays, getProgressPercent } = require('../models/fieldStatus');

function enrichField(field, db) {
  const lastUpdate = db.prepare(
    'SELECT created_at FROM field_updates WHERE field_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(field.id);

  const agent = field.assigned_agent_id
    ? db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(field.assigned_agent_id)
    : null;

  const status = computeFieldStatus(field, lastUpdate?.created_at || null);
  const progress = getProgressPercent(field);
  const daysInField = getDaysInField(field.planting_date);
  const expectedDays = getExpectedDays(field.crop_type);

  return {
    ...field,
    status,
    progress,
    days_in_field: daysInField,
    expected_days: expectedDays,
    assigned_agent: agent,
    last_update: lastUpdate?.created_at || null,
  };
}

function getAllFields(req, res) {
  try {
    const db = getDb();
    const fields = db.prepare('SELECT * FROM fields ORDER BY created_at DESC').all();
    const enriched = fields.map(f => enrichField(f, db));
    res.json({ fields: enriched });
  } catch (err) {
    console.error('Get fields error:', err);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
}

function getMyFields(req, res) {
  try {
    const db = getDb();
    const fields = db.prepare(
      'SELECT * FROM fields WHERE assigned_agent_id = ? ORDER BY created_at DESC'
    ).all(req.user.id);
    const enriched = fields.map(f => enrichField(f, db));
    res.json({ fields: enriched });
  } catch (err) {
    console.error('Get my fields error:', err);
    res.status(500).json({ error: 'Failed to fetch your fields' });
  }
}

function getField(req, res) {
  try {
    const db = getDb();
    const field = db.prepare('SELECT * FROM fields WHERE id = ?').get(req.params.id);

    if (!field) return res.status(404).json({ error: 'Field not found' });

    // Agents can only view their assigned fields
    if (req.user.role === 'agent' && field.assigned_agent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = db.prepare(`
      SELECT fu.*, u.name as agent_name
      FROM field_updates fu
      LEFT JOIN users u ON fu.agent_id = u.id
      WHERE fu.field_id = ?
      ORDER BY fu.created_at DESC
    `).all(field.id);

    const enriched = enrichField(field, db);
    res.json({ field: { ...enriched, updates } });
  } catch (err) {
    console.error('Get field error:', err);
    res.status(500).json({ error: 'Failed to fetch field' });
  }
}

function createField(req, res) {
  const { name, crop_type, planting_date, stage, size_hectares, location, assigned_agent_id } = req.body;

  if (!name || !crop_type || !planting_date) {
    return res.status(400).json({ error: 'Name, crop type, and planting date are required' });
  }

  try {
    const db = getDb();

    if (assigned_agent_id) {
      const agent = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'agent'").get(assigned_agent_id);
      if (!agent) return res.status(400).json({ error: 'Invalid agent ID' });
    }

    const id = uuidv4();
    const fieldStage = stage || 'Planted';

    db.prepare(`
      INSERT INTO fields (id, name, crop_type, planting_date, stage, size_hectares, location, assigned_agent_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, crop_type, planting_date, fieldStage, size_hectares || null, location || null, assigned_agent_id || null, req.user.id);

    const field = db.prepare('SELECT * FROM fields WHERE id = ?').get(id);
    res.status(201).json({ field: enrichField(field, db) });
  } catch (err) {
    console.error('Create field error:', err);
    res.status(500).json({ error: 'Failed to create field' });
  }
}

function updateField(req, res) {
  const { name, crop_type, planting_date, stage, size_hectares, location, assigned_agent_id } = req.body;

  try {
    const db = getDb();
    const field = db.prepare('SELECT * FROM fields WHERE id = ?').get(req.params.id);
    if (!field) return res.status(404).json({ error: 'Field not found' });

    if (assigned_agent_id !== undefined && assigned_agent_id !== null) {
      const agent = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'agent'").get(assigned_agent_id);
      if (!agent) return res.status(400).json({ error: 'Invalid agent ID' });
    }

    db.prepare(`
      UPDATE fields SET
        name = COALESCE(?, name),
        crop_type = COALESCE(?, crop_type),
        planting_date = COALESCE(?, planting_date),
        stage = COALESCE(?, stage),
        size_hectares = COALESCE(?, size_hectares),
        location = COALESCE(?, location),
        assigned_agent_id = CASE WHEN ? IS NOT NULL THEN ? ELSE assigned_agent_id END
      WHERE id = ?
    `).run(name, crop_type, planting_date, stage, size_hectares, location, assigned_agent_id, assigned_agent_id, req.params.id);

    const updated = db.prepare('SELECT * FROM fields WHERE id = ?').get(req.params.id);
    res.json({ field: enrichField(updated, db) });
  } catch (err) {
    console.error('Update field error:', err);
    res.status(500).json({ error: 'Failed to update field' });
  }
}

function deleteField(req, res) {
  try {
    const db = getDb();
    const field = db.prepare('SELECT id FROM fields WHERE id = ?').get(req.params.id);
    if (!field) return res.status(404).json({ error: 'Field not found' });

    db.prepare('DELETE FROM fields WHERE id = ?').run(req.params.id);
    res.json({ message: 'Field deleted successfully' });
  } catch (err) {
    console.error('Delete field error:', err);
    res.status(500).json({ error: 'Failed to delete field' });
  }
}

function addFieldUpdate(req, res) {
  const { new_stage, notes, observations, weather_condition } = req.body;

  try {
    const db = getDb();
    const field = db.prepare('SELECT * FROM fields WHERE id = ?').get(req.params.id);
    if (!field) return res.status(404).json({ error: 'Field not found' });

    // Agent can only update assigned fields
    if (req.user.role === 'agent' && field.assigned_agent_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not assigned to this field' });
    }

    const id = uuidv4();
    const previousStage = field.stage;
    const stageToSet = new_stage || field.stage;

    // Create the update record
    db.prepare(`
      INSERT INTO field_updates (id, field_id, agent_id, previous_stage, new_stage, notes, observations, weather_condition)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, field.id, req.user.id, previousStage, stageToSet, notes || null, observations || null, weather_condition || null);

    // Update field stage if changed
    if (new_stage && new_stage !== previousStage) {
      db.prepare('UPDATE fields SET stage = ? WHERE id = ?').run(new_stage, field.id);
    }

    const update = db.prepare(`
      SELECT fu.*, u.name as agent_name
      FROM field_updates fu
      LEFT JOIN users u ON fu.agent_id = u.id
      WHERE fu.id = ?
    `).get(id);

    const updatedField = db.prepare('SELECT * FROM fields WHERE id = ?').get(field.id);

    res.status(201).json({
      update,
      field: enrichField(updatedField, db),
    });
  } catch (err) {
    console.error('Add field update error:', err);
    res.status(500).json({ error: 'Failed to add update' });
  }
}

module.exports = { getAllFields, getMyFields, getField, createField, updateField, deleteField, addFieldUpdate };
