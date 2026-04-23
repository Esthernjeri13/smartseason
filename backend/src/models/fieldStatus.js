/**
 * Field Status Logic
 * 
 * Status is computed based on:
 * - Stage: Harvested => Completed
 * - Days since planting vs expected duration per crop type
 * - Days since last update (stale = At Risk)
 * - Stage progression patterns
 *
 * Status values: 'Active', 'At Risk', 'Completed'
 */

const CROP_EXPECTED_DAYS = {
  'Maize': 120,
  'Wheat': 100,
  'Rice': 130,
  'Soybean': 100,
  'Sugarcane': 365,
  'Tomato': 80,
  'Potato': 90,
  'Cassava': 270,
  'Beans': 70,
  'Sorghum': 110,
  'Other': 120,
};

const STAGE_RISK_DAYS = {
  'Planted': 21,   // If still Planted after 21 days, At Risk
  'Growing': 60,   // If no update in 60 days while Growing
  'Ready': 14,     // If Ready but not harvested in 14 days
  'Harvested': null,
};

function computeFieldStatus(field, lastUpdate) {
  const { stage, planting_date, crop_type } = field;

  if (stage === 'Harvested') return 'Completed';

  const plantingDate = new Date(planting_date);
  const now = new Date();
  const daysSincePlanting = Math.floor((now - plantingDate) / (1000 * 60 * 60 * 24));
  const expectedDays = CROP_EXPECTED_DAYS[crop_type] || 120;

  // Overdue: past expected harvest date and not harvested
  if (daysSincePlanting > expectedDays) return 'At Risk';

  // Ready stage but sitting too long
  if (stage === 'Ready') {
    const staleLimit = STAGE_RISK_DAYS['Ready'];
    if (lastUpdate) {
      const daysSinceUpdate = Math.floor((now - new Date(lastUpdate)) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate > staleLimit) return 'At Risk';
    }
    return 'Active';
  }

  // Still Planted after 21 days
  if (stage === 'Planted' && daysSincePlanting > STAGE_RISK_DAYS['Planted']) {
    return 'At Risk';
  }

  // No updates for 30 days while active
  if (lastUpdate) {
    const daysSinceUpdate = Math.floor((now - new Date(lastUpdate)) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > 30) return 'At Risk';
  } else {
    // Never updated and planted more than 30 days ago
    if (daysSincePlanting > 30 && stage === 'Planted') return 'At Risk';
  }

  return 'Active';
}

function getDaysInField(planting_date) {
  const plantingDate = new Date(planting_date);
  const now = new Date();
  return Math.floor((now - plantingDate) / (1000 * 60 * 60 * 24));
}

function getExpectedDays(crop_type) {
  return CROP_EXPECTED_DAYS[crop_type] || 120;
}

function getProgressPercent(field) {
  const days = getDaysInField(field.planting_date);
  const expected = getExpectedDays(field.crop_type);
  return Math.min(100, Math.round((days / expected) * 100));
}

module.exports = { computeFieldStatus, getDaysInField, getExpectedDays, getProgressPercent, CROP_EXPECTED_DAYS };
