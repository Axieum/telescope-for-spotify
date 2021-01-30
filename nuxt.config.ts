import auth from './config/auth';

export default {
  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    title: 'Telescope for Spotify',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    ],
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [
  ],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [
  ],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    // https://go.nuxtjs.dev/tailwindcss
    '@nuxtjs/tailwindcss',
    // https://github.com/nuxt-community/svg-module
    '@nuxtjs/svg',
  ],

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',
    // https://auth.nuxtjs.org
    '@nuxtjs/auth-next',
  ],

  // Router configuration
  router: {
  },

  // Axios module configuration (https://go.nuxtjs.dev/config-axios)
  axios: {
  },

  // Auth module configuration (https://auth.nuxtjs.org)
  auth,

  // Build configuration (https://go.nuxtjs.dev/config-build)
  build: {
    // Enables Common CSS Extraction using Vue Server Renderer guidelines
    extractCSS: true,
  },

  // Public runtime configuration
  publicRuntimeConfig: {
    // Spotify (https://developer.spotify.com)
    spotifyRedirectUri: process.env.SPOTIFY_REDIRECT_URI,
  },

  // Private runtime configuration
  privateRuntimeConfig: {
    // Spotify (https://developer.spotify.com)
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
    spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  },
};
