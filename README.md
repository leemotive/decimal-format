# DecimalFormat
format decimal numbers with a specific pattern

## Install

```
$ npm install decimal-format --save
```
or use pnpm
```
$ pnpm add decimal-format --save
```

## Usage
```javascript
import DecimalFormat from 'decimal-format';

const df = new DecimalFormat('#,##0.0#');
df.format(1234.995);  // 1,235.0
df.format(1234.956);  // 1,234.96

const df1 = new DecimalFormat('#,##0.0#%');
df1.format(0.34995); // 35.0%

const df2 = new DecimalFormat('#,##0.0#‰');
df2.format(0.034993); // 34.99‰

const df3 = new DecimalFormat('￥#,##0.00元');
df3.format(1234.995); // ￥1,235.00元
```

RoundingMode defines the rounding modes of the formatting
```javascript
import DecimalFormat, { RoundingMode } from 'decimal-format';

const df = new DecimalFormat('#,##0.0#');
df.setRoundingMode(RoundingMode.UP);    // round away from zero
df.format(2.1)      // 3.0
df.format(-2.1)     // -3.0

df.setRoundingMode(RoundingMode.UNNECESSARY) // assert that no rounding is necessary
df.format(2.11)     // 2.11
df.format(2.123)    // throw exception
```

RoundingMode

| Enum        | Description                                                  |
| ----------- | ------------------------------------------------------------ |
| UP          | round away from zero                                         |
| DOWN        | round towards zero                                           |
| CEILING     | round towards positive infinity                              |
| FLOOR       | round towards negative infinity                              |
| HALF_UP     | round towards "nearest neighbor" unless both neighbors are equidistant, in which case round up |
| HALF_DOWN   | round towards "nearest neighbor" unless both neighbors are equidistant, in which case round down |
| HALF_EVEN   | round towards the "nearest neighbor" unless both neighbors are equidistant, in which case round toward the even neighbor |
| UNNECESSARY | assert that the requested operation has an exact result, hence no rounding is necessary |



