// repositories/benefitsRepo.js
const pool = require('../db/mysql');

const benefitsRepo = {
  /**
   * Get benefits information for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Benefits information or null
   */
  getBenefitsByUserId: async (userId) => {
    const [rows] = await pool.query(
      'SELECT * FROM employee_benefits WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  },

  /**
   * Create benefits record for a user
   * @param {Object} benefitsData - Benefits data
   * @returns {Promise<Object>} Created benefits record
   */
  createBenefits: async (benefitsData) => {
    const query = `
      INSERT INTO employee_benefits (
        user_id, health_insurance_plan, health_insurance_provider, health_insurance_coverage_level,
        health_insurance_premium, health_insurance_deductible, health_insurance_effective_date,
        dental_insurance_plan, dental_insurance_provider, dental_insurance_coverage_level,
        dental_insurance_premium, dental_insurance_effective_date,
        vision_insurance_plan, vision_insurance_provider, vision_insurance_coverage_level,
        vision_insurance_premium, vision_insurance_effective_date,
        life_insurance_plan, life_insurance_coverage_amount, life_insurance_beneficiary, life_insurance_premium,
        retirement_plan_type, retirement_contribution_percentage, retirement_employer_match,
        retirement_vested, retirement_vesting_date,
        annual_leave_days, sick_leave_days, personal_days, paid_holidays,
        tuition_reimbursement, tuition_reimbursement_amount, professional_development_budget,
        gym_membership, parking_benefit, commuter_benefit,
        fsa_health_enrolled, fsa_health_contribution,
        fsa_dependent_care_enrolled, fsa_dependent_care_contribution,
        benefits_package_tier, open_enrollment_date, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const values = [
      benefitsData.user_id,
      benefitsData.health_insurance_plan || null,
      benefitsData.health_insurance_provider || null,
      benefitsData.health_insurance_coverage_level || null,
      benefitsData.health_insurance_premium || null,
      benefitsData.health_insurance_deductible || null,
      benefitsData.health_insurance_effective_date || null,
      benefitsData.dental_insurance_plan || null,
      benefitsData.dental_insurance_provider || null,
      benefitsData.dental_insurance_coverage_level || null,
      benefitsData.dental_insurance_premium || null,
      benefitsData.dental_insurance_effective_date || null,
      benefitsData.vision_insurance_plan || null,
      benefitsData.vision_insurance_provider || null,
      benefitsData.vision_insurance_coverage_level || null,
      benefitsData.vision_insurance_premium || null,
      benefitsData.vision_insurance_effective_date || null,
      benefitsData.life_insurance_plan || null,
      benefitsData.life_insurance_coverage_amount || null,
      benefitsData.life_insurance_beneficiary || null,
      benefitsData.life_insurance_premium || null,
      benefitsData.retirement_plan_type || null,
      benefitsData.retirement_contribution_percentage || null,
      benefitsData.retirement_employer_match || null,
      benefitsData.retirement_vested || false,
      benefitsData.retirement_vesting_date || null,
      benefitsData.annual_leave_days || 0,
      benefitsData.sick_leave_days || 0,
      benefitsData.personal_days || 0,
      benefitsData.paid_holidays || 0,
      benefitsData.tuition_reimbursement || false,
      benefitsData.tuition_reimbursement_amount || null,
      benefitsData.professional_development_budget || null,
      benefitsData.gym_membership || false,
      benefitsData.parking_benefit || false,
      benefitsData.commuter_benefit || false,
      benefitsData.fsa_health_enrolled || false,
      benefitsData.fsa_health_contribution || null,
      benefitsData.fsa_dependent_care_enrolled || false,
      benefitsData.fsa_dependent_care_contribution || null,
      benefitsData.benefits_package_tier || null,
      benefitsData.open_enrollment_date || null,
      benefitsData.notes || null
    ];
    
    const [result] = await pool.query(query, values);
    return benefitsRepo.getBenefitsByUserId(benefitsData.user_id);
  },

  /**
   * Update benefits information for a user
   * @param {number} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated benefits record
   */
  updateBenefits: async (userId, updates) => {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'user_id' && key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) {
      return benefitsRepo.getBenefitsByUserId(userId);
    }
    
    // Add updated_at timestamp
    fields.push('updated_at = NOW()');
    values.push(userId);
    
    const query = `
      UPDATE employee_benefits 
      SET ${fields.join(', ')}
      WHERE user_id = ?
    `;
    
    await pool.query(query, values);
    return benefitsRepo.getBenefitsByUserId(userId);
  },

  /**
   * Check if benefits exist for user
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if benefits exist
   */
  benefitsExist: async (userId) => {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM employee_benefits WHERE user_id = ?',
      [userId]
    );
    return rows[0].count > 0;
  }
};

module.exports = benefitsRepo;
