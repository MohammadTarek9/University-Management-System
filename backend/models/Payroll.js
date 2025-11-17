class Payroll {
  constructor({
    id,
    user_id,
    base_salary,
    allowances,
    deductions,
    net_salary,
    currency,
    effective_from,
    last_updated_at,
    last_updated_by
  }) {
    this.id = id;
    this.userId = user_id;
    this.baseSalary = Number(base_salary);
    this.allowances = Number(allowances);
    this.deductions = Number(deductions);
    this.netSalary = Number(net_salary);
    this.currency = currency;
    this.effectiveFrom = effective_from;
    this.lastUpdatedAt = last_updated_at;
    this.lastUpdatedBy = last_updated_by;
  }
}

module.exports = Payroll;
