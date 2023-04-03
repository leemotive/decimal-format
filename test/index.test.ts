/* global describe, test, expect */

import DecimalFormat, { RoundingMode } from '../index';

test('基本测试使用', () => {
  const df = new DecimalFormat('#,##0.00');

  expect(df.format(234)).toBe('234.00');
  expect(df.format(1234.1)).toBe('1,234.10');
  expect(df.format(1234567.156)).toBe('1,234,567.16');
});

test('无格式，默认3位分割', () => {
  const df = new DecimalFormat();
  expect(df.format(1234.1)).toBe('1,234.1');
});

test('前缀', () => {
  const df = new DecimalFormat('￥#,##0');
  expect(df.format(1234.1)).toBe('￥1,234');
});

test('前缀-转义', () => {
  const df = new DecimalFormat('\\##,##0');
  expect(df.format(1234.1)).toBe('#1,234');
});

test('前缀-显示正负号', () => {
  const df = new DecimalFormat('+#,##0');
  expect(df.format(1234.1)).toBe('+1,234');
});

test('后缀', () => {
  const df = new DecimalFormat('#,##0.00元');
  expect(df.format(1456)).toBe('1,456.00元');
});

test('后缀-百分数', () => {
  const df = new DecimalFormat('#,##0.#%');
  expect(df.format(0.1)).toBe('10%');
  expect(df.format(0.1456)).toBe('14.6%');
});

test('后缀-千分数', () => {
  const df = new DecimalFormat('#,##0.#‰');
  expect(df.format(0.1)).toBe('100‰');
  expect(df.format(0.1456)).toBe('145.6‰');
});

test('后缀-转义', () => {
  const df1 = new DecimalFormat('#,##0.#\\‰');
  expect(df1.format(0.1)).toBe('0.1‰');

  const df2 = new DecimalFormat('#,##0.#\\%');
  expect(df2.format(0.1756)).toBe('0.2%');

  const df3 = new DecimalFormat('#,##0\\.00');
  expect(df3.format(1756.69)).toBe('1,757.00');
});

test('整数至少2位', () => {
  const df = new DecimalFormat('00');
  expect(df.format(11)).toBe('11');
  expect(df.format(1)).toBe('01');
  expect(df.format(3245)).toBe('3245');
});

test('整数为0不显示整数部分', () => {
  const df = new DecimalFormat('#.00');
  expect(df.format(0.34)).toBe('.34');

  const df1 = new DecimalFormat('#.#');
  expect(df1.format(0.34)).toBe('.3');
  expect(df1.format(0.04)).toBe('0');

  const df2 = new DecimalFormat('#.0');
  expect(df2.format(0.04)).toBe('.0');
});

test('小数部分至少2位至多4位', () => {
  const df = new DecimalFormat('#.00##');
  expect(df.format(11)).toBe('11.00');
  expect(df.format(13.12367)).toBe('13.1237');
  expect(df.format(13.19997)).toBe('13.20');
});

test('会自动转科学记数法形式的', () => {
  const df = new DecimalFormat('0.00####');
  df.setRoundingMode(RoundingMode.DOWN);
  expect(df.format(0.0000005)).toBe('0.00');
  df.setRoundingMode(RoundingMode.HALF_UP);
  expect(df.format(0.0000005)).toBe('0.000001');
});

test('RoundingMode.UP', () => {
  const df = new DecimalFormat('0.00##', RoundingMode.UP);
  expect(df.format(13.12361)).toBe('13.1237');
  expect(df.format(-13.12361)).toBe('-13.1237');
});

test('RoundingMode.DOWN', () => {
  const df = new DecimalFormat('0.00##', RoundingMode.DOWN);
  expect(df.format(13.13889)).toBe('13.1388');
  expect(df.format(-13.13889)).toBe('-13.1388');
});

test('RoundingMode.CEILING', () => {
  const df = new DecimalFormat('0.00', RoundingMode.CEILING);
  expect(df.format(13.1301)).toBe('13.14');
  expect(df.format(-13.1301)).toBe('-13.13');
});

test('RoundingMode.FLOOR', () => {
  const df = new DecimalFormat('0.00', RoundingMode.FLOOR);
  expect(df.format(13.137)).toBe('13.13');
  expect(df.format(-13.1301)).toBe('-13.14');
});

test('RoundingMode.HALF_UP', () => {
  const df = new DecimalFormat('0.0', RoundingMode.HALF_UP);
  expect(df.format(13.15)).toBe('13.2');
  expect(df.format(-13.15)).toBe('-13.2');
});

test('RoundingMode.HALF_DOWN', () => {
  const df = new DecimalFormat('0.0', RoundingMode.HALF_DOWN);
  expect(df.format(13.157)).toBe('13.2');
  expect(df.format(13.15)).toBe('13.1');
  expect(df.format(-13.157)).toBe('-13.2');
  expect(df.format(-13.15)).toBe('-13.1');
});

test('RoundingMode.HALF_EVEN', () => {
  const df = new DecimalFormat('0.0', RoundingMode.HALF_EVEN);
  expect(df.format(13.25)).toBe('13.2');
  expect(df.format(13.251)).toBe('13.3');
  expect(df.format(-13.25)).toBe('-13.2');
  expect(df.format(-13.251)).toBe('-13.3');

  const df1 = new DecimalFormat('0', RoundingMode.HALF_EVEN);
  expect(df1.format(12.5)).toBe('12');
  expect(df1.format(12.51)).toBe('13');
  expect(df1.format(12.5)).toBe('12');
  expect(df1.format(12.51)).toBe('13');
});

test('RoundingMode.UNNECESSARY', () => {
  const df = new DecimalFormat('0.0', RoundingMode.UNNECESSARY);
  expect(df.format.bind(df, 1.45)).toThrow();
  expect(df.format(6.9)).toBe('6.9');
  expect(df.format(6)).toBe('6.0');
});

describe('异常', () => {
  test('多个小数点', () => {
    expect(() => new DecimalFormat('0..0')).toThrow(/^Multiple decimal separators in pattern/);
  });
  test('小数部分有逗号', () => {
    expect(() => new DecimalFormat('0.,0')).toThrow(/^Malformed pattern/);
  });
  test('小数部分出现#在0前面', () => {
    expect(() => new DecimalFormat('0.#0')).toThrow(/^Unexpected '0' in pattern/);
  });
  test('整数部分逗号结尾', () => {
    expect(() => new DecimalFormat('0,.0')).toThrow(/^Malformed pattern/);
  });
  test('整数部分0在#前面', () => {
    expect(() => new DecimalFormat('0#.0')).toThrow(/^Unexpected '0' in pattern/);
  });
  test('非数字格式化', () => {
    const df = new DecimalFormat('0.0');
    expect(() => {
      df.format('u78');
    }).toThrow('not a valid number');
  });
});
