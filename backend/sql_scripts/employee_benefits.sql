-- Employee Benefits Table
-- Stores benefit enrollment and coverage information for employees

DROP TABLE IF EXISTS employee_benefits;

CREATE TABLE employee_benefits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  
  -- Health Insurance
  health_insurance_plan VARCHAR(100) COMMENT 'Health insurance plan name',
  health_insurance_provider VARCHAR(100),
  health_insurance_coverage_level ENUM('employee_only', 'employee_spouse', 'employee_children', 'family'),
  health_insurance_premium DECIMAL(10,2) COMMENT 'Monthly premium amount',
  health_insurance_deductible DECIMAL(10,2),
  health_insurance_effective_date DATE,
  
  -- Dental Insurance
  dental_insurance_plan VARCHAR(100),
  dental_insurance_provider VARCHAR(100),
  dental_insurance_coverage_level ENUM('employee_only', 'employee_spouse', 'employee_children', 'family'),
  dental_insurance_premium DECIMAL(10,2),
  dental_insurance_effective_date DATE,
  
  -- Vision Insurance
  vision_insurance_plan VARCHAR(100),
  vision_insurance_provider VARCHAR(100),
  vision_insurance_coverage_level ENUM('employee_only', 'employee_spouse', 'employee_children', 'family'),
  vision_insurance_premium DECIMAL(10,2),
  vision_insurance_effective_date DATE,
  
  -- Life Insurance
  life_insurance_plan VARCHAR(100),
  life_insurance_coverage_amount DECIMAL(12,2) COMMENT 'Coverage amount in dollars',
  life_insurance_beneficiary VARCHAR(255),
  life_insurance_premium DECIMAL(10,2),
  
  -- Retirement Plans
  retirement_plan_type VARCHAR(100) COMMENT 'e.g., 401k, 403b, Pension',
  retirement_contribution_percentage DECIMAL(5,2) COMMENT 'Employee contribution percentage',
  retirement_employer_match DECIMAL(5,2) COMMENT 'Employer match percentage',
  retirement_vested BOOLEAN DEFAULT FALSE,
  retirement_vesting_date DATE,
  
  -- Leave Benefits
  annual_leave_days INT DEFAULT 0 COMMENT 'Annual vacation days',
  sick_leave_days INT DEFAULT 0,
  personal_days INT DEFAULT 0,
  paid_holidays INT DEFAULT 0,
  
  -- Other Benefits
  tuition_reimbursement BOOLEAN DEFAULT FALSE,
  tuition_reimbursement_amount DECIMAL(10,2) COMMENT 'Annual maximum',
  professional_development_budget DECIMAL(10,2) COMMENT 'Annual budget for prof dev',
  gym_membership BOOLEAN DEFAULT FALSE,
  parking_benefit BOOLEAN DEFAULT FALSE,
  commuter_benefit BOOLEAN DEFAULT FALSE,
  
  -- Flexible Spending Accounts
  fsa_health_enrolled BOOLEAN DEFAULT FALSE,
  fsa_health_contribution DECIMAL(10,2) COMMENT 'Annual contribution',
  fsa_dependent_care_enrolled BOOLEAN DEFAULT FALSE,
  fsa_dependent_care_contribution DECIMAL(10,2),
  
  -- Additional Information
  benefits_package_tier VARCHAR(50) COMMENT 'e.g., Standard, Premium, Executive',
  open_enrollment_date DATE COMMENT 'Next open enrollment date',
  notes TEXT COMMENT 'Additional benefit notes',
  
  -- Timestamps
  created_at DATETIME DEFAULT NULL,
  updated_at DATETIME DEFAULT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_user_benefits (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data
INSERT INTO employee_benefits (
  user_id,
  health_insurance_plan, health_insurance_provider, health_insurance_coverage_level, 
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
  benefits_package_tier, open_enrollment_date
) VALUES
(1, 
 'PPO Plus', 'Blue Cross Blue Shield', 'family', 
 350.00, 2000.00, '2024-01-01',
 'Standard Dental', 'Delta Dental', 'family',
 75.00, '2024-01-01',
 'Vision Care Plus', 'VSP', 'family',
 25.00, '2024-01-01',
 'Term Life - 3x Salary', 300000.00, 'Spouse', 15.00,
 '403(b)', 6.00, 6.00,
 TRUE, '2022-01-01',
 22, 12, 3, 15,
 TRUE, 5000.00, 2000.00,
 TRUE, TRUE, FALSE,
 TRUE, 2750.00,
 'Premium', '2025-11-01');
