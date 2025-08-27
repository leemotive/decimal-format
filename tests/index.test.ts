import { describe, test } from 'vitest';
import DecimalFormat, { RoundingMode } from '../index';

describe('Normal Tests', () => {
  test('Basic test usage', ({ expect }) => {
    const df = new DecimalFormat('#,##0.00');

    expect(df.format(234)).toBe('234.00');
    expect(df.format(1234.1)).toBe('1,234.10');
    expect(df.format(1234567.156)).toBe('1,234,567.16');
  });

  test('No format, default 3-digit division', ({ expect }) => {
    const df = new DecimalFormat();
    expect(df.format(1234.1)).toBe('1,234.1');
  });

  test('Prefix', ({ expect }) => {
    const df = new DecimalFormat('￥#,##0');
    expect(df.format(1234.1)).toBe('￥1,234');
  });

  test('Prefix-escape', ({ expect }) => {
    const df = new DecimalFormat('\\##,##0');
    expect(df.format(1234.1)).toBe('#1,234');
  });

  test('Prefix - show plus and minus signs', ({ expect }) => {
    const df = new DecimalFormat('+#,##0');
    expect(df.format(1234.1)).toBe('+1,234');
  });

  test('Suffix', ({ expect }) => {
    const df = new DecimalFormat('#,##0.00元');
    expect(df.format(1456)).toBe('1,456.00元');
  });

  test('Suffix-percentage', ({ expect }) => {
    const df = new DecimalFormat('#,##0.#%');
    expect(df.format(0.1)).toBe('10%');
    expect(df.format(0.1456)).toBe('14.6%');
  });

  test('Suffix-thousands', ({ expect }) => {
    const df = new DecimalFormat('#,##0.#‰');
    expect(df.format(0.1)).toBe('100‰');
    expect(df.format(0.1456)).toBe('145.6‰');
  });

  test('suffix-escape', ({ expect }) => {
    const df1 = new DecimalFormat('#,##0.#\\‰');
    expect(df1.format(0.1)).toBe('0.1‰');

    const df2 = new DecimalFormat('#,##0.#\\%');
    expect(df2.format(0.1756)).toBe('0.2%');

    const df3 = new DecimalFormat('#,##0\\.00');
    expect(df3.format(1756.69)).toBe('1,757.00');
  });

  test('Integer at least 2 digits', ({ expect }) => {
    const df = new DecimalFormat('00');
    expect(df.format(11)).toBe('11');
    expect(df.format(1)).toBe('01');
    expect(df.format(3245)).toBe('3245');
  });

  test('If the integer is 0, the integer part will not be displayed.', ({ expect }) => {
    const df = new DecimalFormat('#.00');
    expect(df.format(0.34)).toBe('.34');

    const df1 = new DecimalFormat('#.#');
    expect(df1.format(0.34)).toBe('.3');
    expect(df1.format(0.04)).toBe('0');

    const df2 = new DecimalFormat('#.0');
    expect(df2.format(0.04)).toBe('.0');
  });

  test('The decimal part must be at least 2 and at most 4 digits', ({ expect }) => {
    const df = new DecimalFormat('#.00##');
    expect(df.format(11)).toBe('11.00');
    expect(df.format(13.12367)).toBe('13.1237');
    expect(df.format(13.19997)).toBe('13.20');
  });

  test('Will automatically convert to scientific notation', ({ expect }) => {
    const df = new DecimalFormat('0.00####');
    df.setRoundingMode(RoundingMode.Down);
    expect(df.format(0.0000005)).toBe('0.00');
    df.setRoundingMode(RoundingMode.HalfUp);
    expect(df.format(0.0000005)).toBe('0.000001');
  });

  test('RoundingMode.UP', ({ expect }) => {
    const df = new DecimalFormat('0.00##', RoundingMode.Up);
    expect(df.format(13.12361)).toBe('13.1237');
    expect(df.format(-13.12361)).toBe('-13.1237');
  });

  test('RoundingMode.DOWN', ({ expect }) => {
    const df = new DecimalFormat('0.00##', RoundingMode.Down);
    expect(df.format(13.13889)).toBe('13.1388');
    expect(df.format(-13.13889)).toBe('-13.1388');
  });

  test('RoundingMode.CEILING', ({ expect }) => {
    const df = new DecimalFormat('0.00', RoundingMode.Ceiling);
    expect(df.format(13.1301)).toBe('13.14');
    expect(df.format(-13.1301)).toBe('-13.13');
  });

  test('RoundingMode.FLOOR', ({ expect }) => {
    const df = new DecimalFormat('0.00', RoundingMode.Floor);
    expect(df.format(13.137)).toBe('13.13');
    expect(df.format(-13.1301)).toBe('-13.14');
  });

  test('RoundingMode.HALF_UP', ({ expect }) => {
    const df = new DecimalFormat('0.0', RoundingMode.HalfUp);
    expect(df.format(13.15)).toBe('13.2');
    expect(df.format(13)).toBe('13.0');
    expect(df.format(-13.15)).toBe('-13.2');
  });

  test('RoundingMode.HALF_DOWN', ({ expect }) => {
    const df = new DecimalFormat('0.0', RoundingMode.HalfDown);
    expect(df.format(13.157)).toBe('13.2');
    expect(df.format(13.15)).toBe('13.1');
    expect(df.format(-13.157)).toBe('-13.2');
    expect(df.format(-13.15)).toBe('-13.1');
  });

  test('RoundingMode.HALF_EVEN', ({ expect }) => {
    const df = new DecimalFormat('0.0', RoundingMode.HalfEven);
    expect(df.format(13.25)).toBe('13.2');
    expect(df.format(13.251)).toBe('13.3');
    expect(df.format(-13.25)).toBe('-13.2');
    expect(df.format(-13.251)).toBe('-13.3');

    const df1 = new DecimalFormat('0', RoundingMode.HalfEven);
    expect(df1.format(13.5)).toBe('14');
    expect(df1.format(13.51)).toBe('14');
    expect(df1.format(12.5)).toBe('12');
    expect(df1.format(12.51)).toBe('13');
  });

  test('RoundingMode.UNNECESSARY', ({ expect }) => {
    const df = new DecimalFormat('0.0', RoundingMode.Unnecessary);
    expect(df.format.bind(df, 1.45)).toThrow();
    expect(df.format(6.9)).toBe('6.9');
    expect(df.format(6)).toBe('6.0');
  });
});

describe('Scientific Tests', () => {
  test('no significand', ({ expect }) => {
    const df = new DecimalFormat('E');
    expect(df.format(1234)).toBe('1.234E3');
    expect(df.format(-1234)).toBe('-1.234E3');
    expect(df.format(0.01234)).toBe('1.234E-2');
    expect(df.format(-0.01234)).toBe('-1.234E-2');
  });

  test('exponent sign', ({ expect }) => {
    const df = new DecimalFormat('0.00#E+');
    expect(df.format(12345)).toBe('1.235E+4');
    expect(df.format(-12)).toBe('-1.20E+1');
  });

  test('no exponent', ({ expect }) => {
    const df = new DecimalFormat('0.00#E', RoundingMode.Ceiling);
    expect(df.format(1.2341)).toBe('1.235');
    expect(df.format(12341)).toBe('1.235E4');
    expect(df.format(9.9991)).toBe('1.00E1');
  });

  test('percent', ({ expect }) => {
    const df = new DecimalFormat('0.00#E%', RoundingMode.Floor);
    expect(df.format(0.12349)).toBe('1.234E1%');
  });

  test('prefix/suffix', ({ expect }) => {
    const df = new DecimalFormat('R0.00#E++', RoundingMode.Ceiling);
    expect(df.format(1.2341)).toBe('R1.235+');
    expect(df.format(12341)).toBe('R1.235E+4+');
  });
});

describe('Abnormal Tests', () => {
  test('multiple decimal points', ({ expect }) => {
    expect(() => new DecimalFormat('0..0')).toThrow(/^Multiple decimal separators in pattern/);
  });

  test('There is a comma in the decimal part', ({ expect }) => {
    expect(() => new DecimalFormat('0.,0')).toThrow(/^Malformed pattern/);
  });

  test('The decimal part appears # in front of 0', ({ expect }) => {
    expect(() => new DecimalFormat('0.#0')).toThrow(/^Unexpected '0' in pattern/);
  });

  test('The integer part ends with a comma', ({ expect }) => {
    expect(() => new DecimalFormat('0,.0')).toThrow(/^Malformed pattern/);
  });

  test('The integer part 0 is in front of #', ({ expect }) => {
    expect(() => new DecimalFormat('0#.0')).toThrow(/^Unexpected '0' in pattern/);
  });

  test('non-numeric formatting', ({ expect }) => {
    const df = new DecimalFormat('0.0');
    expect(() => {
      df.format('u78');
    }).toThrow('not a valid number');
  });
});
