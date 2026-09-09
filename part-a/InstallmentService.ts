// InstallmentService.ts
// Splits an invoice into monthly installments and tracks payment status.
// Fixed version — see PART-A-NOTES.md for what was wrong and why.
// Public method signatures unchanged: generate, applyPayment, isSettled.

export interface Installment {
  number: number;
  amount: number;
  due_date: string; // 'YYYY-MM-DD'
  paid: number;
  status: 'pending' | 'partial' | 'paid';
}

export class InstallmentService {
  generate(total: number, count: number, firstDueDate: string): Installment[] {
    const installments: Installment[] = [];

    // Work in integer cents so rounding can't lose or invent money.
    // Split the total into `count` whole cents, distributing the
    // leftover cents across the first installments one at a time
    // instead of always dumping them on the same slot.
    const totalCents = Math.round(total * 100);
    const baseCents = Math.floor(totalCents / count);
    const leftoverCents = totalCents - baseCents * count;

    for (let i = 0; i < count; i++) {
      const cents = baseCents + (i < leftoverCents ? 1 : 0);
      installments.push({
        number: i + 1,
        amount: cents / 100,
        due_date: this.addMonths(firstDueDate, i),
        paid: 0,
        status: 'pending',
      });
    }

    return installments;
  }

  applyPayment(installments: Installment[], paid: number): Installment[] {
    const result = [...installments];

    for (let i = 0; i < result.length; i++) {
      const inst = result[i];
      if (paid <= 0) {
        break;
      }
      const remaining = this.roundCents(inst.amount - inst.paid);
      if (paid >= remaining) {
        result[i] = { ...inst, paid: inst.amount, status: 'paid' };
        paid = this.roundCents(paid - remaining);
      } else {
        result[i] = { ...inst, paid: this.roundCents(inst.paid + paid), status: 'partial' };
        paid = 0;
      }
    }

    return result;
  }

  isSettled(installments: Installment[], total: number): boolean {
    let sum = 0;
    for (const inst of installments) {
      sum += inst.paid;
    }
    // Compare in cents, not raw floats: two decimal sums that are
    // "the same" (e.g. 999.9999999999999 vs 1000) can fail a strict
    // === check purely from binary floating-point representation.
    return Math.round(sum * 100) === Math.round(total * 100);
  }

  private roundCents(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private addMonths(firstDueDate: string, months: number): string {
    // Add months calendar-safe: clamp the day to the last valid day
    // of the target month instead of letting it overflow into the
    // month after (JS Date and PHP strtotime both do this by default
    // for e.g. Jan 31 + 1 month).
    const [year, month, day] = firstDueDate.split('-').map(Number);

    const targetMonthIndex = (month - 1) + months; // 0-based, may exceed 11
    const targetYear = year + Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12; // 0-based, normalized

    const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    const clampedDay = Math.min(day, daysInTargetMonth);

    const result = new Date(Date.UTC(targetYear, targetMonth, clampedDay));
    return result.toISOString().slice(0, 10);
  }
}