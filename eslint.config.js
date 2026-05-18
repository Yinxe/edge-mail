import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import prettierConfig from 'eslint-config-prettier'

export default [
  // 全局忽略
  {
    ignores: ['dist/', '.wrangler/', 'worker-configuration.d.ts'],
  },

  // JavaScript 推荐规则
  js.configs.recommended,

  // TypeScript 推荐规则（针对 .ts 和 .vue 的 <script>）
  ...tseslint.configs.recommended,

  // Vue 3 推荐规则（包含 .vue 文件的解析器设置）
  ...pluginVue.configs['flat/recommended'],

  // 为 .vue 文件的 <script> 块指定 TypeScript 解析器
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // src/ 目录使用浏览器环境全局变量（fetch, console 等）
  {
    files: ['src/**/*.{ts,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // server/ 目录使用 Cloudflare Worker 环境全局变量
  {
    files: ['server/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },

  // 项目自定义规则
  {
    rules: {
      // Vue + TS 项目中容许 some 类型（根据实际情况调整）
      '@typescript-eslint/no-explicit-any': 'warn',

      // 禁止出现空函数块（但允许 Vue 生命周期钩子中的空函数）
      'no-empty': ['error', { allowEmptyCatch: true }],

      // 禁止 var，强制使用 const/let
      'no-var': 'error',

      // 推荐使用 const（若变量未被重新赋值）
      'prefer-const': 'warn',

      // 允许 console（在 Worker 和服务端中常用）
      'no-console': 'off',
    },
  },

  // 必须放在最后：关闭与 Prettier 冲突的 ESLint 规则
  prettierConfig,
]
