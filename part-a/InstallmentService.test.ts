import { describe, it, expect } from 'vitest';
import { InstallmentService } from './InstallmentService';

describe('InstallmentService', () => {
  const svc = new InstallmentService();

  it('generates installments that sum exactly to the invoice total', () => {
    // Client complaint: "the installments sometimes do not add up to the invoice total"
    const installments = svc.generate(1000, 3, '2026-01-31');
    const sum = installments.reduce((acc, i) => acc + i.amount, 0);
    expect(Math.round(sum * 100) / 100).toBe(1000);
  });

  it('generates due dates without month-end overflow', () => {
    // Client complaint: "some installment due dates land on strange days"
    const installments = svc.generate(1000, 3, '2026-01-31');
    expect(installments.map((i) => i.due_date)).toEqual([
      '2026-01-31',
      '2026-02-28', // clamped, not rolled into March
      '2026-03-31',
    ]);
  });

  it('marks a fully paid invoice as settled', () => {
    // Client complaint: "some invoices are never marked as settled even after the customer paid everything"
    const installments = svc.generate(1000, 3, '2026-01-31');
    const paid = svc.applyPayment(installments, 1000);
    expect(svc.isSettled(paid, 1000)).toBe(true);
  });

  it('does not mark a partially paid invoice as settled', () => {
    const installments = svc.generate(1000, 3, '2026-01-31');
    const paid = svc.applyPayment(installments, 400);
    expect(svc.isSettled(paid, 1000)).toBe(false);
  });

  it('handles an odd total that does not divide evenly across installments', () => {
    // Regression guard for the cents-distribution fix
    const installments = svc.generate(100, 3, '2026-03-01'); // 33.33 / 33.33 / 33.34
    const sum = installments.reduce((acc, i) => acc + i.amount, 0);
    expect(Math.round(sum * 100) / 100).toBe(100);
    expect(installments.map((i) => i.amount)).toEqual([33.34, 33.33, 33.33]);
  });
});