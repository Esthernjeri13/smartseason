const { getDb } = require('../models/db');

function getAgents(req, res) {
  try {
    const db = getDb();
    const agents = db.prepare(
      "SELECT id, name, email, role, created_at FROM users WHERE role = 'agent' ORDER BY name"
    ).all();

    // Enrich with field counts
    const enriched = agents.map(agent => {
      const fieldCount = db.prepare(
        'SELECT COUNT(*) as count FROM fields WHERE assigned_agent_id = ?'
      ).get(agent.id);
      return { ...agent, field_count: fieldCount.count };
    });

    res.json({ agents: enriched });
  } catch (err) {
    console.error('Get agents error:', err);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
}

function getUsers(req, res) {
  try {
    const db = getDb();
    const users = db.prepare(
      'SELECT id, name, email, role, created_at FROM users ORDER BY name'
    ).all();
    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

function getDashboardStats(req, res) {
  try {
    const db = getDb();
    const { computeFieldStatus, getDaysInField } = require('../models/fieldStatus');

    let fields;
    if (req.user.role === 'admin') {
      fields = db.prepare('SELECT * FROM fields').all();
    } else {
      fields = db.prepare('SELECT * FROM fields WHERE assigned_agent_id = ?').all(req.user.id);
    }

    const enrichedFields = fields.map(field => {
      const lastUpdate = db.prepare(
        'SELECT created_at FROM field_updates WHERE field_id = ? ORDER BY created_at DESC LIMIT 1'
      ).get(field.id);
      return {
        ...field,
        status: computeFieldStatus(field, lastUpdate?.created_at || null),
        days_in_field: getDaysInField(field.planting_date),
      };
    });

    const statusBreakdown = {
      Active: enrichedFields.filter(f => f.status === 'Active').length,
      'At Risk': enrichedFields.filter(f => f.status === 'At Risk').length,
      Completed: enrichedFields.filter(f => f.status === 'Completed').length,
    };

    const stageBreakdown = {
      Planted: enrichedFields.filter(f => f.stage === 'Planted').length,
      Growing: enrichedFields.filter(f => f.stage === 'Growing').length,
      Ready: enrichedFields.filter(f => f.stage === 'Ready').length,
      Harvested: enrichedFields.filter(f => f.stage === 'Harvested').length,
    };

    const cropBreakdown = {};
    enrichedFields.forEach(f => {
      cropBreakdown[f.crop_type] = (cropBreakdown[f.crop_type] || 0) + 1;
    });

    // Recent activity (last 10 updates)
    let recentUpdates;
    if (req.user.role === 'admin') {
      recentUpdates = db.prepare(`
        SELECT fu.*, f.name as field_name, u.name as agent_name
        FROM field_updates fu
        LEFT JOIN fields f ON fu.field_id = f.id
        LEFT JOIN users u ON fu.agent_id = u.id
        ORDER BY fu.created_at DESC LIMIT 10
      `).all();
    } else {
      recentUpdates = db.prepare(`
        SELECT fu.*, f.name as field_name, u.name as agent_name
        FROM field_updates fu
        LEFT JOIN fields f ON fu.field_id = f.id
        LEFT JOIN users u ON fu.agent_id = u.id
        WHERE f.assigned_agent_id = ?
        ORDER BY fu.created_at DESC LIMIT 10
      `).all(req.user.id);
    }

    const atRiskFields = enrichedFields.filter(f => f.status === 'At Risk');

    let agentStats = null;
    if (req.user.role === 'admin') {
      const agents = db.prepare("SELECT id, name FROM users WHERE role = 'agent'").all();
      agentStats = agents.map(agent => {
        const agentFields = enrichedFields.filter(f => f.assigned_agent_id === agent.id);
        return {
          ...agent,
          total_fields: agentFields.length,
          at_risk: agentFields.filter(f => f.status === 'At Risk').length,
          completed: agentFields.filter(f => f.status === 'Completed').length,
        };
      });
    }

    res.json({
      total_fields: enrichedFields.length,
      status_breakdown: statusBreakdown,
      stage_breakdown: stageBreakdown,
      crop_breakdown: cropBreakdown,
      at_risk_fields: atRiskFields,
      recent_updates: recentUpdates,
      agent_stats: agentStats,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

module.exports = { getAgents, getUsers, getDashboardStats };
