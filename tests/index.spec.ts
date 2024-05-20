import { test } from "@japa/runner";
import { DecimalFormat, RoundingMode } from "../lib/index.js";

test.group("Normal Tests", () => {
  test("Basic test usage", ({ expect }) => {
    const df = new DecimalFormat("#,##0.00");

    expect(df.format(234)).toBe("234.00");
    expect(df.format(1234.1)).toBe("1,234.10");
    expect(df.format(1234567.156)).toBe("1,234,567.16");
  });

  test("No format, default 3-digit division", ({ expect }) => {
    const df = new DecimalFormat();
    expect(df.format(1234.1)).toBe("1,234.1");
  });

  test("Prefix", ({ expect }) => {
    const df = new DecimalFormat("￥#,##0");
    expect(df.format(1234.1)).toBe("￥1,234");
  });

  test("Prefix-escape", ({ expect }) => {
    const df = new DecimalFormat("\\##,##0");
    expect(df.format(1234.1)).toBe("#1,234");
  });

  test("Prefix - show plus and minus signs", ({ expect }) => {
    const df = new DecimalFormat("+#,##0");
    expect(df.format(1234.1)).toBe("+1,234");
  });

  test("Suffix", ({ expect }) => {
    const df = new DecimalFormat("#,##0.00元");
    expect(df.format(1456)).toBe("1,456.00元");
  });

  test("Suffix-percentage", ({ expect }) => {
    const df = new DecimalFormat("#,##0.#%");
    expect(df.format(0.1)).toBe("10%");
    expect(df.format(0.1456)).toBe("14.6%");
  });

  test("Suffix-thousands", ({ expect }) => {
    const df = new DecimalFormat("#,##0.#‰");
    expect(df.format(0.1)).toBe("100‰");
    expect(df.format(0.1456)).toBe("145.6‰");
  });

  test("suffix-escape", ({ expect }) => {
    const df1 = new DecimalFormat("#,##0.#\\‰");
    expect(df1.format(0.1)).toBe("0.1‰");

    const df2 = new DecimalFormat("#,##0.#\\%");
    expect(df2.format(0.1756)).toBe("0.2%");

    const df3 = new DecimalFormat("#,##0\\.00");
    expect(df3.format(1756.69)).toBe("1,757.00");
  });

  test("Integer at least 2 digits", ({ expect }) => {
    const df = new DecimalFormat("00");
    expect(df.format(11)).toBe("11");
    expect(df.format(1)).toBe("01");
    expect(df.format(3245)).toBe("3245");
  });

  test("If the integer is 0, the integer part will not be displayed.", ({
    expect,
  }) => {
    const df = new DecimalFormat("#.00");
    expect(df.format(0.34)).toBe(".34");

    const df1 = new DecimalFormat("#.#");
    expect(df1.format(0.34)).toBe(".3");
    expect(df1.format(0.04)).toBe("0");

    const df2 = new DecimalFormat("#.0");
    expect(df2.format(0.04)).toBe(".0");
  });

  test("The decimal part must be at least 2 and at most 4 digits", ({
    expect,
  }) => {
    const df = new DecimalFormat("#.00##");
    expect(df.format(11)).toBe("11.00");
    expect(df.format(13.12367)).toBe("13.1237");
    expect(df.format(13.19997)).toBe("13.20");
  });

  test("Will automatically convert to scientific notation", ({ expect }) => {
    const df = new DecimalFormat("0.00####");
    df.setRoundingMode(RoundingMode.down);
    expect(df.format(0.0000005)).toBe("0.00");
    df.setRoundingMode(RoundingMode.halfUp);
    expect(df.format(0.0000005)).toBe("0.000001");
  });

  test("RoundingMode.UP", ({ expect }) => {
    const df = new DecimalFormat("0.00##", RoundingMode.up);
    expect(df.format(13.12361)).toBe("13.1237");
    expect(df.format(-13.12361)).toBe("-13.1237");
  });

  test("RoundingMode.DOWN", ({ expect }) => {
    const df = new DecimalFormat("0.00##", RoundingMode.down);
    expect(df.format(13.13889)).toBe("13.1388");
    expect(df.format(-13.13889)).toBe("-13.1388");
  });

  test("RoundingMode.CEILING", ({ expect }) => {
    const df = new DecimalFormat("0.00", RoundingMode.ceiling);
    expect(df.format(13.1301)).toBe("13.14");
    expect(df.format(-13.1301)).toBe("-13.13");
  });

  test("RoundingMode.FLOOR", ({ expect }) => {
    const df = new DecimalFormat("0.00", RoundingMode.floor);
    expect(df.format(13.137)).toBe("13.13");
    expect(df.format(-13.1301)).toBe("-13.14");
  });

  test("RoundingMode.HALF_UP", ({ expect }) => {
    const df = new DecimalFormat("0.0", RoundingMode.halfUp);
    expect(df.format(13.15)).toBe("13.2");
    expect(df.format(-13.15)).toBe("-13.2");
  });

  test("RoundingMode.HALF_DOWN", ({ expect }) => {
    const df = new DecimalFormat("0.0", RoundingMode.halfDown);
    expect(df.format(13.157)).toBe("13.2");
    expect(df.format(13.15)).toBe("13.1");
    expect(df.format(-13.157)).toBe("-13.2");
    expect(df.format(-13.15)).toBe("-13.1");
  });

  test("RoundingMode.HALF_EVEN", ({ expect }) => {
    const df = new DecimalFormat("0.0", RoundingMode.halfEven);
    expect(df.format(13.25)).toBe("13.2");
    expect(df.format(13.251)).toBe("13.3");
    expect(df.format(-13.25)).toBe("-13.2");
    expect(df.format(-13.251)).toBe("-13.3");

    const df1 = new DecimalFormat("0", RoundingMode.halfEven);
    expect(df1.format(12.5)).toBe("12");
    expect(df1.format(12.51)).toBe("13");
    expect(df1.format(12.5)).toBe("12");
    expect(df1.format(12.51)).toBe("13");
  });

  test("RoundingMode.UNNECESSARY", ({ expect }) => {
    const df = new DecimalFormat("0.0", RoundingMode.unnecessary);
    expect(df.format.bind(df, 1.45)).toThrow();
    expect(df.format(6.9)).toBe("6.9");
    expect(df.format(6)).toBe("6.0");
  });
});

test.group("Abnormal Tests", () => {
  test("multiple decimal points", ({ expect }) => {
    expect(() => new DecimalFormat("0..0")).toThrow(
      /^Multiple decimal separators in pattern/,
    );
  });

  test("There is a comma in the decimal part", ({ expect }) => {
    expect(() => new DecimalFormat("0.,0")).toThrow(/^Malformed pattern/);
  });

  test("The decimal part appears # in front of 0", ({ expect }) => {
    expect(() => new DecimalFormat("0.#0")).toThrow(
      /^Unexpected '0' in pattern/,
    );
  });

  test("The integer part ends with a comma", ({ expect }) => {
    expect(() => new DecimalFormat("0,.0")).toThrow(/^Malformed pattern/);
  });

  test("The integer part 0 is in front of #", ({ expect }) => {
    expect(() => new DecimalFormat("0#.0")).toThrow(
      /^Unexpected '0' in pattern/,
    );
  });

  test("non-numeric formatting", ({ expect }) => {
    const df = new DecimalFormat("0.0");
    expect(() => {
      df.format("u78");
    }).toThrow("not a valid number");
  });
});
