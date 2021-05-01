module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    '@nuxtjs/eslint-config-typescript',
    'plugin:nuxt/recommended',
    '@vue/airbnb',
  ],
  plugins: [
  ],
  rules: {
  },
  settings: {
    // disable errors for intentional transitive dependencies, e.g. 'vue' through 'nuxt'
    'import/core-modules': ['vue', 'axios', 'axios-retry'],
    // resolve import aliases, e.g. @/components
    'import/resolver': {
      alias: {
        map: [['~', '.'], ['@', '.']],
        extensions: ['.js', '.ts', '.vue'],
      },
    },
  },
};
