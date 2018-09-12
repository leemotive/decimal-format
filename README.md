# DecimalFormat
    format number with the specified format

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