type PercentEnum = 1 | 100 | 1000;

type FmtObject = {
  suffix: string;
  prefix: string;
  percent: PercentEnum;
  thousandSeparate: number;
  withSign: boolean;
  maxScale?: number;
  minScale?: number;
  length?: number;
  radixPoint?: boolean;
  scientificChar?: string;
  exponentSign?: boolean;
};
type FmtCacheType = {
  [k: string]: FmtObject;
};

export const RoundingMode = {
  get Up() {
    return 0 as const;
  },
  get Down() {
    return 1 as const;
  },
  get Ceiling() {
    return 2 as const;
  },
  get Floor() {
    return 3 as const;
  },
  get HalfUp() {
    return 4 as const;
  },
  get HalfDown() {
    return 5 as const;
  },
  get HalfEven() {
    return 6 as const;
  },
  get Unnecessary() {
    return 7 as const;
  },
};
type RoundingModeType = (typeof RoundingMode)[keyof typeof RoundingMode];

const formatCache: FmtCacheType = {};
const signifcandReg = /[0#.,]/;
const signReg = /[+-]/;
const resolveFormat = (pattern: string): FmtObject => {
  if (formatCache[pattern]) {
    return formatCache[pattern];
  }

  const prefix: string[] = [];
  const suffix: string[] = [];
  let exponentSign = false;
  let scientificChar = '';
  let withSign = false;
  let percent: PercentEnum = 1; // Do you need to convert percentile or millennium into 100 and 1000?
  const significand: string[] = [];
  const exponent: string[] = [];
  let ch = '';
  const states = {
    PREFIX: 'PREFIX',
    SIGNIFICAND: 'SIGNIFICAND',
    EXPONENT: 'EXPONENT',
    SUFFIX: 'SUFFIX',
  };
  let state = states.PREFIX;
  let shouldEscape = false;

  let temp: string[] = [];
  function append(c: string, i: number) {
    if (state === states.PREFIX) {
      temp = prefix;
    } else if (state === states.SIGNIFICAND) {
      temp = significand;
    } else if (state === states.EXPONENT) {
      temp = exponent;
    } else {
      temp = suffix;
    }
    temp.push(c);
    if (shouldEscape) {
      return;
    }

    const nextChar = pattern[i + 1];
    if (state === states.PREFIX && signReg.test(c) && (signifcandReg.test(nextChar) || /e/i.test(nextChar))) {
      temp.pop();
      withSign = true;
    }

    if (state === states.EXPONENT && signReg.test(c)) {
      exponentSign = true;
    }

    if (suffix.length === 1) {
      if (suffix[0] === '%') {
        percent = 100;
      } else if (suffix[0] === '‰') {
        percent = 1000;
      }
    }
  }

  function setState(c: string) {
    if (state === states.PREFIX) {
      if (signifcandReg.test(c)) {
        state = states.SIGNIFICAND;
      } else if (/e/i.test(c)) {
        scientificChar = c;
        state = states.EXPONENT;
      }
    } else if (state === states.SIGNIFICAND) {
      if (/e/i.test(c)) {
        scientificChar = c;
        state = states.EXPONENT;
      } else if (!signifcandReg.test(c)) {
        state = states.SUFFIX;
      }
    } else if (state === states.EXPONENT) {
      if (!signReg.test(c) || exponent.length > 1) {
        state = states.SUFFIX;
      }
    }
  }
  for (let i = 0; i < pattern.length; i++) {
    ch = pattern[i];
    if (shouldEscape) {
      append(ch, i);
      shouldEscape = false;
      continue;
    }

    setState(ch);

    if (ch === '\\') {
      shouldEscape = true;
    } else {
      append(ch, i);
    }
  }

  const prefixStr = prefix.join('');
  const significandStr = significand.join('');
  const suffixStr = suffix.join('');

  if (!significandStr) {
    formatCache[pattern] = {
      suffix: suffixStr,
      prefix: prefixStr,
      percent,
      thousandSeparate: 3,
      withSign,
      scientificChar,
      exponentSign,
    };
    return formatCache[pattern];
  }

  if (/\..*\./.test(significandStr)) {
    throw Error(`Multiple decimal separators in pattern "${pattern}"`);
  }

  const [intFmt, decimalFmt = ''] = significandStr.split('.');
  if (/[^0#]/.test(decimalFmt)) {
    throw Error(`Malformed pattern "${pattern}"`);
  }
  if (decimalFmt.includes('#0')) {
    throw Error(`Unexpected '0' in pattern "${pattern}"`);
  }
  if (intFmt.endsWith(',')) {
    throw Error(`Malformed pattern "${pattern}"`);
  }
  /* fmt can only appear #0., four symbols, multiple. The situation has been ruled out earlier, and this if is not needed here.
  if (/[^0#,]/.test(intFmt)) {
    throw Error(`Malformed pattern "${pattern}"`);
  }
  */
  if (/0.*#/.test(intFmt)) {
    throw Error(`Unexpected '0' in pattern "${pattern}"`);
  }

  let thousandSeparate = 0;
  const lastIndexOfSeperator = intFmt.lastIndexOf(',');
  if (lastIndexOfSeperator !== -1) {
    thousandSeparate = intFmt.length - lastIndexOfSeperator - 1;
  }
  const trailingZeros = intFmt.replace(/,/g, '').match(/0*$/)?.[0];

  if (trailingZeros === undefined) {
    throw Error(`Malformed pattern "${pattern}"`);
  }

  const { length } = trailingZeros;
  const maxScale = decimalFmt.length;
  const minScale = decimalFmt.match(/^0*/)?.[0].length;
  const radixPoint = significandStr.endsWith('.');

  const config: FmtObject = {
    prefix: prefixStr,
    suffix: suffixStr,
    percent,
    thousandSeparate,
    maxScale,
    minScale,
    length,
    radixPoint,
    withSign,
    scientificChar,
    exponentSign,
  };
  formatCache[pattern] = config;
  return config;
};

// Supports numbers like 0.0000005 that can be converted into scientific notation like 5e-7
function convertToString(n: number): string {
  const nStr = `${n}`;
  if (nStr.includes('e')) {
    const nArr = nStr.split('e');
    return enlarge(+nArr[0], +nArr[1]);
  }
  return nStr;
}
// Decimal point left
function shrink(n: number, multi: number) {
  if (multi < 0) {
    return enlarge(n, -multi);
  }
  const nStr = convertToString(n);
  if (!multi) {
    return nStr;
  }
  return `${nStr}`.replace(/^-?/, `$&${'0'.repeat(multi)}`).replace(new RegExp(`(\\d{${multi}})(\\.|$)`), '.$1');
}
// Shift right decimal point
function enlarge(n: number, multi: number): string {
  if (multi < 0) {
    return shrink(n, -multi);
  }
  const nStr = convertToString(n);
  if (!multi) {
    return nStr;
  }
  const num = `${nStr}${'0'.repeat(multi)}`;
  return num.replace(new RegExp(`\\.(\\d{${multi}})`), '$1.');
}

// Prevent the problem of 1.005.toFixed(2) === 1.00
function adjust(n: number, scale: number) {
  const num = convertToString(n);
  if (num.includes('.')) {
    const arr = num.split('.');
    arr[1] = `${arr[1].padEnd(scale, '0')}1`;
    return +arr.join('.');
  }
  return n;
}

function round(n: number, scale: number, roundingMode: RoundingModeType): string {
  let [int, decimal] = convertToString(n).split('.');
  const sign = n > 0 ? '' : '-';
  if (!decimal) {
    return n.toFixed(scale);
  }

  decimal = decimal.padEnd(scale + 1, '0');

  switch (roundingMode) {
    case RoundingMode.Ceiling: {
      return shrink(Math.ceil(+enlarge(n, scale)), scale);
    }

    case RoundingMode.Floor: {
      return shrink(Math.floor(+enlarge(n, scale)), scale);
    }

    case RoundingMode.Up: {
      return `${sign}${shrink(Math.ceil(+enlarge(Math.abs(n), scale)), scale)}`;
    }

    case RoundingMode.Down: {
      return `${sign}${shrink(Math.floor(+enlarge(Math.abs(n), scale)), scale)}`;
    }

    case RoundingMode.HalfUp: {
      return (+adjust(n, scale)).toFixed(scale);
    }

    case RoundingMode.HalfDown: {
      const decimalArr = decimal.split('');
      if (/^50*$/.test(decimalArr.slice(scale).join(''))) {
        decimalArr[scale] = '1';
      }
      return (+[int, decimalArr.join('')].join('.')).toFixed(scale);
    }

    case RoundingMode.HalfEven: {
      const decimalArr = decimal.split('');
      if (/^50*$/.test(decimalArr.slice(scale).join(''))) {
        const lastNum = decimalArr[scale - 1] || int.slice(-1);
        if (+lastNum % 2 === 0) {
          decimalArr.splice(scale);
        } else {
          decimalArr[scale] = '9';
        }
      }
      return (+[int, decimalArr.join('')].join('.')).toFixed(scale);
    }

    case RoundingMode.Unnecessary: {
      if (+shrink(Math.ceil(+enlarge(n, scale)), scale) === n) {
        return String(n);
      }
      throw Error('ArithmeticException: Rounding needed with the rounding mode being set to RoundingMode.UNNECESSARY');
    }

    default: {
      const exhaustiveCheck: never = roundingMode;
      throw Error(`Unhandled RoundingMode: ${exhaustiveCheck}`);
    }
  }
}

export default class DecimalFormat {
  private config: FmtObject;

  private roundingMode: RoundingModeType;

  constructor(format = '', roundingMode: RoundingModeType = RoundingMode.HalfUp) {
    this.config = { ...resolveFormat(format) };
    this.roundingMode = roundingMode;
  }

  setRoundingMode(roundingMode: RoundingModeType) {
    this.roundingMode = roundingMode;
  }

  format(n: number | string): string {
    const {
      maxScale,
      minScale,
      percent,
      length,
      thousandSeparate,
      prefix,
      suffix,
      radixPoint,
      withSign,
      scientificChar,
      exponentSign,
    } = this.config;
    let num: number | string = +n;

    if (Number.isNaN(num)) {
      throw Error('not a valid number');
    }

    let percentExponent = Math.log10(percent);
    let exponent = 0;
    if (scientificChar) {
      exponent = Math.floor(Math.log10(Math.abs(num)));
      num = num / 10 ** exponent;
      exponent += percentExponent;
      percentExponent = 0;
    }

    // If there are thousandths, if there are hundredths, first expand the corresponding multiple.
    num = enlarge(num, percentExponent);
    
    if (maxScale !== undefined) {
      num = (+round(+num, maxScale, this.roundingMode)).toFixed(maxScale);
    }
    let [int, decimal] = num.split('.');
    if (length) {
      const intMatch = int.match(/([+-]?)(\d*)/);
      if (intMatch) {
        int = intMatch[1] + intMatch[2].padStart(length, '0');
      }
    } else if (int === '0') {
      int = '';
    }
    if (thousandSeparate && thousandSeparate < int.length) {
      // If the integer part needs to be formatted
      int = int.replace(new RegExp(`(\\d{1,${thousandSeparate}})(?=(?:\\d{${thousandSeparate}})+$)`, 'g'), '$1,');
    }

    if (decimal) {
      decimal = decimal.replace(/0+$/, '');
      if (minScale) {
        decimal = decimal.padEnd(minScale, '0');
      }
    }

    num = [int, decimal].join('.');
    if (!radixPoint) {
      num = num.replace(/\.$/, '');
    }
    if (withSign && !num.startsWith('-')) {
      num = `+${num}`;
    }
    if (num === '') {
      num = '0';
    }

    let exp = '';
    if (scientificChar) {
      if (+int >= 10) {
        exponent += 1;
        num = num.replace('0', '');
      }
      if (exponent) {
        exp = `${scientificChar}${exponentSign && exponent > 0 ? '+' : ''}${exponent}`;
      }
    }

    return `${prefix}${num}${exp}${suffix}`;
  }
}
