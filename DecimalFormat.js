
const resolveFormat = (format) => {
  if (DecimalFormat.cache[format]) {
    return DecimalFormat.cache[format];
  }

  let minScale = null,
    maxScale = null,
    length = 1,
    prefix = '',
    suffix = '',
    percent = null,
    thousandSeparate = true;

  if (format) {
    const match = format.match(/^([^#0%‰]*)([#,]*[0,]*)(\.0*#*)?([%‰]?)([^0#]*)$/);
    prefix = match[1];
    suffix = match[5];
    percent = match[4];
    let int = match[2];
    let decimal = match[3];
    if (!int && !decimal) {
      thousandSeparate = 3;
    } else {
      let lastIndex = int.lastIndexOf(',');
      thousandSeparate = int.length - lastIndex - 1;
      if (int.length === thousandSeparate) {
        thousandSeparate = 0;
      }
      length = int.replace(/,/g, '').match(/#*(0*)/)[1].length;
      if (decimal) {
        let index = decimal.indexOf('#');
        maxScale = decimal.length - 1;
        if (~index) {
          minScale = index - 1;
        } else {
          minScale = maxScale;
        }
      } else {
        minScale = maxScale = 0;
      }
    }
  }
  const config = {
    minScale,
    maxScale,
    length,
    prefix,
    suffix,
    percent,
    thousandSeparate,
  };
  DecimalFormat.cache[format] = config;
  return config;
}

function enlarge(n, multi) {
  if (!multi) {
    return n;
  }
  let num = `${n}${''.padEnd(multi, 0)}`;
  const index = num.indexOf('.');
  if (~index) {
    const arr = num.split('');
    arr.splice(index, 1);
    arr.splice(index + multi, 0, '.');
    return +arr.join('');
  } else {
    return +num;
  }
}
function shrink(n, multi) {
  if (!multi) {
    return n;
  };
  let sign = n > 0 ? '' : '-';

  let num = `${sign}${''.padStart(multi, 0)}${Math.abs(n)}`;
  const arr = num.split('');
  if (arr.length === 2) {
    const index = num.indexOf('.');
    arr.splice(index, 1);
    arr.splice(index - multi, 0, '.');
    return +arr.join('');
  } else {
    arr.splice(-multi, 0, '.');
    return +arr.join('');
  }
}

function adjust(n, scale) {
  let num = `${n}`;
  if (num.includes('.')) {
    const arr = num.split('.');
    arr[1] = `${arr[1].padEnd(scale, 0)}1`;
    return +arr.join('.');
  } else {
    return n;
  }
}

function round(n, scale, roundingMode) {
  let [int, decimal] = `${n}`.split('.');
  const sign = n > 0 ? '' : '-';
  if (!decimal) {
    return +n.toFixed(scale);
  } else {
    decimal = decimal.padEnd(scale + 1, 0);
    if (roundingMode === RoundingMode.CEILING) {
      return shrink(Math.ceil(enlarge(n, scale)), scale);
    } else if (roundingMode === RoundingMode.FLOOR) {
      return shrink(Math.floor(enlarge(n, scale)), scale);
    } else if (roundingMode === RoundingMode.UP) {
      return +`${sign}${shrink(Math.ceil(enlarge(Math.abs(n), scale)), scale)}`;
    } else if (roundingMode === RoundingMode.DOWN) {
      return +`${sign}${shrink(Math.floor(enlarge(Math.abs(n), scale)), scale)}`;
    } else if (roundingMode === RoundingMode.HALF_UP) {
      return +adjust(n, scale).toFixed(scale);
    } else if (roundingMode === RoundingMode.HALF_DOWN) {
      const decimalArr = decimal.split('');
      if (decimalArr[scale] == 5) {
        decimalArr[scale] = 1;
      }
      return +(+[int, decimalArr.join('')].join('.')).toFixed(scale);
    } else if (roundingMode === RoundingMode.HALF_EVEN) {
      const decimalArr = decimal.split('');
      if (decimalArr[scale] == 5) {
        let lastNum = decimalArr[scale - 1] || int.slice(-1);
        if (+lastNum % 2 === 0) {
          decimalArr.splice(scale);
        } else {
          decimalArr[scale] = 9;
        }
      }
      return +(+[int, decimalArr.join('')].join('.')).toFixed(scale);
    } else if (roundingMode === RoundingMode.UNNECESSARY) {
      if (shrink(Math.ceil(enlarge(n, scale)), scale) === n) {
        return n;
      } else {
        throw 'ArithmeticException: Rounding needed with the rounding mode being set to RoundingMode.UNNECESSARY';
      }
    }
  }
}

class DecimalFormat {
  static cache = {}

  constructor(format = '', config, roundingMode = RoundingMode.HALF_UP) {
    if (typeof config === 'number') {
      roundingMode = config;
      config = {};
    }
    this.config = { ...resolveFormat(format), ...config };
    this.roundingMode = roundingMode;
  }
  setRoundingMode(roundingMode) {
    this.roundingMode = roundingMode;
  }

  format = (n) => {
    const { maxScale, minScale, percent, length, thousandSeparate, prefix, suffix } = this.config;
    let number = +n;
    if (isNaN(number)) {
      throw 'not a valid number';
    }
    const multi = percent == '%' ? 2 : percent === '‰' ? 3 : 0;
    number = enlarge(number, multi);
    if (maxScale !== null) {
      number = round(number, maxScale, this.roundingMode).toFixed(maxScale);
    } else {
      number = `${number}`;
    }
    let [int, decimal] = number.split('.');
    if (length) {
      int = int.padStart(length, 0);
    }
    if (thousandSeparate < int.length) {
      int = int.replace(new RegExp(`(\\d{1,${thousandSeparate}})(?=(?:\\d{${thousandSeparate}})+$)`, 'g'), '$1,');
    }

    if (decimal) {
      decimal = decimal.replace(/0+$/, '').padEnd(minScale, 0);
    }
    return `${prefix}${[int, decimal].join('.').replace(/\.$/, '')}${percent}${suffix}`;
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
}
