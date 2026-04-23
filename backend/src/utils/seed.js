require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/db');

async function seed() {
  const db = getDb();
  console.log('🌱 Seeding database...');

  // Clear existing data
  db.exec('DELETE FROM field_updates; DELETE FROM fields; DELETE FROM users;');

  // Create users
  const adminId = uuidv4();
  const agent1Id = uuidv4();
  const agent2Id = uuidv4();
  const agent3Id = uuidv4();

  const adminHash = await bcrypt.hash('admin123', 12);
  const agentHash = await bcrypt.hash('agent123', 12);

  db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
    adminId, 'Sarah Coordinator', 'admin@smartseason.com', adminHash, 'admin'
  );
  db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
    agent1Id, 'James Mwangi', 'james@smartseason.com', agentHash, 'agent'
  );
  db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
    agent2Id, 'Aisha Omondi', 'aisha@smartseason.com', agentHash, 'agent'
  );
  db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
    agent3Id, 'Peter Kamau', 'peter@smartseason.com', agentHash, 'agent'
  );

  // Helper: date offset from today
  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }

  // Create fields
  const fields = [
    { name: 'Rift Valley North', crop: 'Maize', days: 90, stage: 'Growing', agent: agent1Id },
    { name: 'Nakuru East Plot', crop: 'Wheat', days: 45, stage: 'Growing', agent: agent1Id },
    { name: 'Eldoret Block A', crop: 'Soybean', days: 100, stage: 'Ready', agent: agent1Id },
    { name: 'Kisumu River Farm', crop: 'Rice', days: 120, stage: 'Harvested', agent: agent2Id },
    { name: 'Kakamega Block 1', crop: 'Maize', days: 15, stage: 'Planted', agent: agent2Id },
    { name: 'Bungoma South', crop: 'Beans', days: 50, stage: 'Growing', agent: agent2Id },
    { name: 'Meru Highland', crop: 'Potato', days: 85, stage: 'Ready', agent: agent3Id },
    { name: 'Embu Valley Farm', crop: 'Tomato', days: 60, stage: 'Growing', agent: agent3Id },
    { name: 'Thika East', crop: 'Maize', days: 130, stage: 'Growing', agent: agent3Id },
    { name: 'Nyeri Block 3', crop: 'Wheat', days: 5, stage: 'Planted', agent: agent1Id },
  ];

  const fieldIds = [];
  fields.forEach(f => {
    const id = uuidv4();
    fieldIds.push({ id, ...f });
    db.prepare(`
      INSERT INTO fields (id, name, crop_type, planting_date, stage, size_hectares, location, assigned_agent_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, f.name, f.crop, daysAgo(f.days), f.stage, (Math.random() * 10 + 1).toFixed(1), 'Kenya', f.agent, adminId);
  });

  // Create field updates
  const updateId1 = uuidv4();
  db.prepare(`
    INSERT INTO field_updates (id, field_id, agent_id, previous_stage, new_stage, notes, observations, weather_condition)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(updateId1, fieldIds[0].id, agent1Id, 'Planted', 'Growing', 'Strong germination observed', 'Plants are about 30cm tall, no pests detected', 'Sunny');

  const updateId2 = uuidv4();
  db.prepare(`
    INSERT INTO field_updates (id, field_id, agent_id, previous_stage, new_stage, notes, observations, weather_condition)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(updateId2, fieldIds[2].id, agent1Id, 'Growing', 'Ready', 'Crop ready for harvest', 'Golden color observed across the field', 'Clear');

  const updateId3 = uuidv4();
  db.prepare(`
    INSERT INTO field_updates (id, field_id, agent_id, previous_stage, new_stage, notes, observations, weather_condition)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(updateId3, fieldIds[3].id, agent2Id, 'Ready', 'Harvested', 'Harvest complete — excellent yield', 'Approximately 4.2 tonnes/hectare', 'Overcast');

  const updateId4 = uuidv4();
  db.prepare(`
    INSERT INTO field_updates (id, field_id, agent_id, previous_stage, new_stage, notes, observations, weather_condition)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(updateId4, fieldIds[6].id, agent3Id, 'Growing', 'Ready', 'Tubers are mature', 'Soil tested — ready to dig', 'Partly Cloudy');

  console.log('✅ Seed complete!\n');
  console.log('Demo credentials:');
  console.log('  Admin:  admin@smartseason.com / admin123');
  console.log('  Agent1: james@smartseason.com / agent123');
  console.log('  Agent2: aisha@smartseason.com / agent123');
  console.log('  Agent3: peter@smartseason.com / agent123');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
