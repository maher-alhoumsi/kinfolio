import { z } from 'zod';

const positiveDecimal = (integerDigits: number, decimalPlaces: number) =>
  z
    .string()
    .trim()
    .regex(
      new RegExp(`^\\d{1,${integerDigits}}(?:\\.\\d{1,${decimalPlaces}})?$`),
      `Must have at most ${integerDigits} integer digits and ${decimalPlaces} decimal places`,
    )
    .refine((value) => /[1-9]/.test(value), {
      message: 'Must be greater than zero',
    });

export const decimalString = positiveDecimal(18, 10);
export const priceString = positiveDecimal(14, 6);
