import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

// ESM 和 CJS 格式的构建配置
const esmAndCjsConfig = {
  input: './index.ts',
  output: [
    {
      file: './es/index.mjs',
      format: 'esm',
      sourcemap: false
    },
    {
      dir: './lib',
      format: 'cjs',
      sourcemap: false
    }
  ],
  plugins: [
    typescript() // 使用默认的 TypeScript 配置
  ]
};

// UMD 格式的构建配置
const umdConfig = {
  input: './index.ts',
  output: {
    file: './dist/decimalFormat.js',
    format: 'umd',
    sourcemap: false,
    name: 'DecimalFormat'
  },
  plugins: [
    typescript({
      target: 'ES6', // 仅在 UMD 输出时指定目标为 ES6
    })
  ]
};

// 类型声明文件构建配置
const dtsConfig = {
  input: './index.ts',
  output: {
    dir: './typings',
    format: 'es'
  },
  plugins: [dts()]
};

export default [esmAndCjsConfig, umdConfig, dtsConfig];