// Auth module configuration (https://auth.nuxtjs.org)
export default {
  strategies: {
    // Spotify (https://developer.spotify.com)
    spotify: {
      scheme: 'oauth2',
      endpoints: {
        authorization: 'https://accounts.spotify.com/authorize',
        userInfo: 'https://api.spotify.com/v1/me',
      },
      logoutRedirectUri: '/',
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      scope: [
        'user-read-recently-played', // read access to a user’s recently played tracks
        'user-top-read', // read access to a user's top artists and tracks
        'user-read-currently-playing', // read access to a user’s currently playing content
        'user-follow-read', // read access to the list of artists and other users that the user follows
        'user-read-email', // read access to user’s email address
        'playlist-modify-private', // write access to a user's private playlists
      ],
    },
  },
};
