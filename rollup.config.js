import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: './index.ts',
    output: [
      {
        file: './es/index.mjs',
        format: 'es',
      },
      {
        file: './lib/index.js',
        format: 'cjs',
      },
    ],
    plugins: [typescript({ exclude: ['test'] })],
  },
  {
    input: './index.ts',
    output: [
      {
        file: './dist/decimalFormat.js',
        format: 'umd',
        exports: 'named',
        name: 'DecimalFormat',
      },
    ],
    plugins: [typescript({ exclude: ['test'], compilerOptions: { target: 'es6' } })],
  },
  {
    input: './index.ts',
    output: {
      file: './typings/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
