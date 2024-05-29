import typescript from 'rollup-plugin-typescript2';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve'; //将外部引入的js打包进来
import babel from 'rollup-plugin-babel';
import del from 'rollup-plugin-delete'; //
import commonjs from '@rollup/plugin-commonjs'; //将CommonJS模块转换为ES6, 方便rollup直接调用
import livereload from 'rollup-plugin-livereload';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: './src/index.ts',
  output: [
    {
      format: 'es',
      file: 'dist/index.esm.js',
      globals:{
        "crypto":"crypto"
      }
    },
  ],
  plugins: [
    del({
      targets: ['dist'],
    }),
    nodeResolve(),
    commonjs({
      include: 'node_modules/**',
    }),
    isProduction && terser(),
    babel({
      exclude: 'node_modules/**',
    }),
    // 热更新
    !isProduction && livereload(),
    typescript({
      exclude: 'node_modules/**',
      useTsconfigDeclarationDir: true,
      extensions: ['.js', '.ts', '.tsx'],
    }),
    sourceMaps(),
  ],
  external:["crypto"]
};
