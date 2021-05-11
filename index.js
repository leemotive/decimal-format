const formatCache = {};
const fmtReg = /[0#.,]/;
const resolveFormat = pattern => {
  if (formatCache[pattern]) {
    return formatCache[pattern];
  }

  let prefix = [];
  let suffix = [];
  let withSign = false;
  let percent = 1; // 是否需要转化百分化或者千分化, 百分化为100, 千分化为1000
  let fmt = [];
  let ch = '';
  let state = 'PREFIX';
  let escape = false;

  let temp;
  function append(c) {
    if ('PREFIX' === state) {
      temp = prefix;
    } else if ('FMT' === state) {
      temp = fmt;
    } else {
      temp = suffix;
    }
    temp.push(c);
    if (escape) {
      return;
    }

    if ('PREFIX' === state && ['+', '-'].includes(c) && fmtReg.test(pattern[i + 1])) {
      temp.pop();
      withSign = true;
    }

    if (suffix.length === 1) {
      if (suffix[0] === '%') {
        percent = 100;
      } else if (suffix[0] === '‰') {
        percent = 1000;
      }
    }
  }

  function setState(c) {
    if (state === 'PREFIX' && fmtReg.test(c)) {
      state = 'FMT';
    } else if (state === 'FMT' && !fmtReg.test(c)) {
      state = 'SUFFIX';
    }
  }
  let i = 0;
  for (; i < pattern.length; i++) {
    ch = pattern[i];
    if (escape) {
      append(ch);
      escape = false;
      continue;
    }

    setState(ch);

    if (ch === '\\') {
      escape = true;
    } else {
      append(ch);
    }
  }

  prefix = prefix.join('');
  fmt = fmt.join('');
  suffix = suffix.join('');

  if (!fmt) {
    return (formatCache[pattern] = {
      suffix,
      prefix,
      percent,
      thousandSeparate: 3,
      withSign,
    });
  }

  if (/\..*\./.test(fmt)) {
    throw Error(`Multiple decimal separators in pattern "${pattern}"`);
  }

  const [intFmt, decimalFmt = ''] = fmt.split('.');
  if (/[^0#]/.test(decimalFmt)) {
    throw Error(`Malformed pattern "${pattern}"`);
  }
  if (decimalFmt.includes('#0')) {
    throw Error(`Unexpected '0' in pattern "${pattern}"`);
  }
  if (intFmt.endsWith(',')) {
    throw Error(`Malformed pattern "${pattern}"`);
  }
  /* fmt只可能出现 #0., 四种符号,多个.的情况已经在前面排除，这里不需要这个if了
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

  const length = intFmt.replace(/,/g, '').match(/0*$/)[0].length;
  const maxScale = decimalFmt.length;
  const minScale = decimalFmt.match(/^0*/)[0].length;
  const radixPoint = fmt.endsWith('.');

  let config = {
    prefix,
    suffix,
    percent,
    thousandSeparate,
    maxScale,
    minScale,
    length,
    radixPoint,
    withSign,
  };
  formatCache[pattern] = config;
  return config;
};
// 小数点右移
function enlarge(n, multi) {
  if (multi < 0) {
    return shrink(n, -multi);
  }
  const nStr = toString(n);
  if (!multi) {
    return nStr;
  }
  let num = `${nStr}${'0'.repeat(multi)}`;
  return num.replace(new RegExp(`\\.(\\d{${multi}})`), '$1.');
}
// 小数点左移
function shrink(n, multi) {
  if (multi < 0) {
    return enlarge(n, -multi);
  }
  const nStr = toString(n);
  if (!multi) {
    return nStr;
  }
  return `${nStr}`.replace(/^-?/, `$&${'0'.repeat(multi)}`).replace(new RegExp(`(\\d{${multi}})(\\.|$)`), '.$1');
}
// 防止1.005.toFixed(2) === 1.00 的问题出现
function adjust(n, scale) {
  let num = `${toString(n)}`;
  if (num.includes('.')) {
    const arr = num.split('.');
    arr[1] = `${arr[1].padEnd(scale, 0)}1`;
    return +arr.join('.');
  } else {
    return n;
  }
}

function round(n, scale, roundingMode) {
  let [int, decimal] = `${toString(n)}`.split('.');
  const sign = n > 0 ? '' : '-';
  if (!decimal) {
    return n.toFixed(scale);
  } else {
    decimal = decimal.padEnd(scale + 1, 0);
    if (roundingMode === RoundingMode.CEILING) {
      return shrink(Math.ceil(+enlarge(n, scale)), scale);
    } else if (roundingMode === RoundingMode.FLOOR) {
      return shrink(Math.floor(+enlarge(n, scale)), scale);
    } else if (roundingMode === RoundingMode.UP) {
      return `${sign}${shrink(Math.ceil(+enlarge(Math.abs(n), scale)), scale)}`;
    } else if (roundingMode === RoundingMode.DOWN) {
      return `${sign}${shrink(Math.floor(+enlarge(Math.abs(n), scale)), scale)}`;
    } else if (roundingMode === RoundingMode.HALF_UP) {
      return (+adjust(n, scale)).toFixed(scale);
    } else if (roundingMode === RoundingMode.HALF_DOWN) {
      const decimalArr = decimal.split('');
      if (decimalArr[scale] == 5) {
        decimalArr[scale] = 1;
      }
      return (+[int, decimalArr.join('')].join('.')).toFixed(scale);
    } else if (roundingMode === RoundingMode.HALF_EVEN) {
      const decimalArr = decimal.split('');
      if (decimalArr[scale] == 5) {
        let lastNum = decimalArr[scale - 1] || int.slice(-1)[0];
        if (+lastNum % 2 === 0) {
          decimalArr.splice(scale);
        } else {
          decimalArr[scale] = 9;
        }
      }
      return (+[int, decimalArr.join('')].join('.')).toFixed(scale);
    } else if (roundingMode === RoundingMode.UNNECESSARY) {
      if (+shrink(Math.ceil(+enlarge(n, scale)), scale) === n) {
        return n;
      } else {
        throw Error(
          'ArithmeticException: Rounding needed with the rounding mode being set to RoundingMode.UNNECESSARY',
        );
      }
    }
  }
}

// 支持0.0000005这种会转成5e-7这种科学记数法的数字
function toString(n) {
  const nStr = `${n}`;
  if (nStr.includes('e')) {
    const nArr = nStr.split('e');
    return enlarge(+nArr[0], +nArr[1]);
  }
  return nStr;
}

class DecimalFormat {
  constructor(format = '', roundingMode = RoundingMode.HALF_UP) {
    this.config = { ...resolveFormat(format) };
    this.roundingMode = roundingMode;
  }
  setRoundingMode(roundingMode) {
    this.roundingMode = roundingMode;
  }

  format(n) {
    const { maxScale, minScale, percent, length, thousandSeparate, prefix, suffix, radixPoint, withSign } = this.config;
    let number = +n;
    if (isNaN(number)) {
      throw Error('not a valid number');
    }
    // 有千分位，百分位的先扩大对应倍数
    number = enlarge(number, Math.log10(percent));

    if (maxScale !== void 0) {
      number = (+round(+number, maxScale, this.roundingMode)).toFixed(maxScale);
    }
    let [int, decimal] = number.split('.');
    if (length) {
      const intMatch = int.match(/([+-]?)(\d*)/);
      int = intMatch[1] + intMatch[2].padStart(length, 0);
    } else if (int === '0') {
      int = '';
    }
    if (thousandSeparate && thousandSeparate < int.length) {
      // 整数部分如果需要格式化
      int = int.replace(new RegExp(`(\\d{1,${thousandSeparate}})(?=(?:\\d{${thousandSeparate}})+$)`, 'g'), '$1,');
    }

    if (decimal) {
      decimal = decimal.replace(/0+$/, '').padEnd(minScale, 0);
    }

    number = [int, decimal].join('.');
    if (!radixPoint) {
      number = number.replace(/\.$/, '');
    }
    if (withSign && !number.startsWith('-')) {
      number = `+${number}`;
    }
    if (number === '') {
      number = 0;
    }
    return `${prefix}${number}${suffix}`;
  }
}

export default DecimalFormat;

export const RoundingMode = {
  UP: 0,
  DOWN: 1,
  CEILING: 2,
  FLOOR: 3,
  HALF_UP: 4,
  HALF_DOWN: 5,
  HALF_EVEN: 6,
  UNNECESSARY: 7,
};
