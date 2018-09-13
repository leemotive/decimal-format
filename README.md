# DecimalFormat
    format decimal number

## Install

```
    npm install decimal-format --save
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

设置RoundingMode来指定舍入策略
```javascript
    import DecimalFormat, { RoundingMode } from 'decimal-format';

    const df = new DecimalFormat('#,##0.0#');
    df.setRoundingMode(RoundingMode.UP);    // 向数轴无穷方向取邻近数
    df.format(2.1)      // 3.0
    df.format(-2.1)     // -3.0

    df.setRoundingMode(RoundingMode.UNNECESSARY) // 断言数字不用舍入
    df.format(2.11)     // 2.11
    df.format(2.123)    // throw exception
```

RoundingMode共有八种
```
    RoundingMode.UP           // 0  向数轴无穷方向取邻近数   2.1 -> 3, -2.1 -> -3
    RoundingMode.Down         // 1  向数轴0的方向取邻近数   2.9 -> 2, -2.9 -> -2
    RoundingMode.CEILING      // 2  向数轴正无穷方向取邻近数 2.1 -> 3, -2.9 -> -2
    RoundingMode.FLOOR        // 3  向数轴负无穷方向取邻近数 2.9 -> 2, -2.1 -> -3
    RoundingMode.HALF_UP      // 4  取邻近的数，遇到5时采用RoundingMode.UP策略
    RoundingMode.HALF_DOWN    // 5  取邻近的数，遇到5时采用RoundingMode.DOWN策略
    RoundingMode.HALF_EVEN    // 6  取邻近的数，遇到5时舍入后保证前一位为偶数  2.5 -> 2  3.5 -> 4
    RoundingMode.UNNECESSARY  // 7  断言数字不用舍入
```
