
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
  let index = num.indexOf('.');
  if (~index) {
    const arr = num.split('');
    arr.splice(index, 1);
    arr.splice(index + multi, 0, '.');
    return +arr.join('');
  } else {
    return +num;
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

class DecimalFormat {
  static cache = {}

  constructor(format = '', config) {
    this.config = { ...resolveFormat(format), ...config };
  }

  format = (n) => {
    const { maxScale, minScale, percent, length, thousandSeparate, prefix, suffix } = this.config;
    let number = +n;
    if (isNaN(number)) {
      throw 'not a valid number';
    }
    const multi = percent == '%' ? 2 : percent === '‰' ? 3 : 0;
    number = enlarge(number, multi);
    if (maxScale) {
      number = adjust(number, maxScale).toFixed(maxScale);
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
