import Decimal from 'decimal.js';

export const D = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
});

export type DecimalInstance = InstanceType<typeof D>;
export type DecimalInput = Decimal.Value;

export const toDecimal = (value: DecimalInput): DecimalInstance => new D(value);

export const add = (left: DecimalInput, right: DecimalInput): DecimalInstance =>
  toDecimal(left).plus(right);

export const subtract = (
  left: DecimalInput,
  right: DecimalInput,
): DecimalInstance => toDecimal(left).minus(right);

export const multiply = (
  left: DecimalInput,
  right: DecimalInput,
): DecimalInstance => toDecimal(left).times(right);

export const divide = (
  left: DecimalInput,
  right: DecimalInput,
): DecimalInstance => toDecimal(left).dividedBy(right);

export const compare = (left: DecimalInput, right: DecimalInput): -1 | 0 | 1 =>
  toDecimal(left).cmp(right) as -1 | 0 | 1;

// Display only; do not use this formatted value for arithmetic.
export const formatMoney = (value: DecimalInput, currency: string): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(toDecimal(value).toNumber());
