<template>
  <div class="container space-y-16">
    <!-- Loader -->
    <div v-if="$fetchState.pending">
      <div class="sk-grid mx-auto" style="--sk-color: currentColor">
        <div v-for="i in 9" :key="i" class="sk-grid-cube" />
      </div>
      <p class="text-base md:text-lg font-bold text-center mt-4">
        {{ progress || 'Loading...' }}
      </p>
    </div>
    <!-- Releases -->
    <section
      v-for="[date, section] in sections.entries()"
      v-else-if="!$fetchState.error"
      :key="date.valueOf()"
    >
      <!-- Title -->
      <div class="text-center mb-8">
        <h2 class="text-xl md:text-2xl font-bold">
          {{ $moment(date).calendar({ lastWeek: 'dddd', sameElse: 'dddd' }).split(' ')[0] }}
        </h2>
        <small class="uppercase opacity-75">
          {{ $moment(date).format('MMMM Do, YYYY') }}
        </small>
      </div>
      <!-- Tiles -->
      <transition-group
        tag="div"
        name="animate-tile"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        appear
      >
        <AlbumTile
          v-for="release in section"
          :key="release.id"
          :name="release.name"
          :artists="release.artists"
          :artwork="release.artwork"
          :href="release.href"
        />
      </transition-group>
    </section>
    <!-- Footer -->
    <div v-if="$fetchState.error">
      <img src="~/assets/graphics/access_denied.svg" alt="Error" class="h-48 md:h-64 mx-auto">
      <p class="text-center text-xl md:text-2xl font-black py-6">
        Something went wrong!
        <a class="text-sm text-red-600 hover:underline cursor-pointer" @click="$fetch()">Retry?</a>
      </p>
    </div>
    <div v-else-if="!$fetchState.pending" class="text-center opacity-50">
      <p>That's everything &mdash; you're up to date!</p>
      <a
        v-if="releases"
        class="inline-block hover:underline cursor-pointer mt-4"
        @click="createPlaylist()"
      >
        Add all to playlist?
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import AlbumTile from '@/components/tiles/AlbumTile.vue';

const DAYS: number = 30; // days a release is considered new

export default Vue.extend({
  name: 'Scout',
  middleware: ['auth'],

  components: {
    AlbumTile,
  },

  fetchOnServer: false, // a lot of requests, we don't want to overload the server!
  async fetch() {
    // First, we'll need to fetch all the followed artists
    this.progress = 'Fetching artists...';
    const artistIds: string[] = await this.fetchFollowedArtistIds();

    // Next, we'll fetch the latest releases for each followed artist
    this.progress = `Fetching releases from ${artistIds.length} artists...`;
    const artistReleases: any[][] = await Promise.all(
      artistIds.map((id: string) => this.fetchArtistNewReleases(id, this.since)),
    );

    // Now, we can filter and push each release into the list
    this.releases.push(...artistReleases
      // Flatten the releases - since they are grouped by their artist
      .flat(1)
      // Filter out any duplicates
      .filter((release: any, i: number, all: any[]) => (
        all.findIndex((other: any) => (
          release.id === other.id || release.key === other.key
        )) === i
      )));
  },

  data: () => ({
    releases: [] as any[],
    progress: null as string|null,
  }),

  computed: {
    /**
     * Derives the date from which releases are considered recent.
     *
     * @return moment.Moment a date at 12:00am in the past
     */
    since(): moment.Moment {
      return this.$moment().subtract(DAYS, 'days').startOf('day');
    },
    /**
     * Computes sections for which releases should be displayed under.
     *
     * @return Map<number, any[]> mapping of date to releases
     */
    sections(): Map<number, any[]> {
      return this.releases
        // mutate a copy
        .slice()
        // sort by release date - descending
        .sort((a: any, b: any) => (b.date.isAfter(a.date) ? 1 : -1))
        // group by release date
        .reduce((sections: Map<number, any[]>, release: any) => {
          const section: any[] | undefined = sections.get(release.date.valueOf());
          if (section) section.push(release);
          else sections.set(release.date.valueOf(), [release]);
          return sections;
        }, new Map<number, any[]>());
    },
  },

  methods: {
    /**
     * Fetches all artist ids the user is currently following.
     *
     * @return Promise<string[]> promise for list of artist ids
     */
    async fetchFollowedArtistIds(): Promise<string[]> {
      const artistIds: string[] = [];

      const handler = async ({ data: { artists } }: any): Promise<string[]> => {
        artistIds.push(...artists.items.map((artist: any) => artist.id));
        // We have to fetch the artists in a linear fashion, as instead of
        // pages, we have to provide the last artist ID we fetched!
        return artists.next ? this.$axios.get(artists.next).then(handler)
          : Promise.resolve(artistIds);
      };

      return this.$axios.get('https://api.spotify.com/v1/me/following', {
        params: { type: 'artist', limit: 50 },
      }).then(handler);
    },
    /**
     * Fetches recent releases for a given artist.
     *
     * @param artistId Spotify artist id
     * @param since filter releases after the given date
     * @param groups comma-separated list of include groups, null for all
     * @param limit maximum number releases to fetch - 1 through 50
     * @return Promise<any[]> promise for list of album objects, newest first
     */
    async fetchArtistNewReleases(
      artistId: string,
      since: moment.Moment,
      groups: string|null = 'single', // see note below about fetching albums
      limit: number = 5,
    ): Promise<any[]> {
      return this.$axios
        // Fetch singles and EPs from the artist - we can't include albums as
        // all albums appear first despite their release date!
        .get(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
          params: { include_groups: groups, limit },
        })
        .then(({ data: { items } }): any => items
          // Parse known data types
          .map((item: any) => ({
            ...item,
            date: this.$moment(item.release_date, 'YYYY-MM-DD'),
          }))
          // Filter release dates within scope
          .filter((item: any) => item.date.isAfter(since))
          // Map the attributes we'll be using - should save some memory
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            date: item.date, // computed above
            artwork: item.images[0].url,
            href: item.external_urls.spotify,
            artists: item.artists.map((artist: any) => ({
              id: artist.id,
              name: artist.name,
              href: artist.external_urls.spotify,
            })),
            // NB: We add a key with the primary artist and a normalised title
            // to help filter out *possible* duplicates later on
            key: `${item.artists[0].name.toLowerCase()} - ${this.normaliseReleaseTitle(item.name)}`,
          }))
          // Sort by release date - newest first
          .sort((a: any, b: any) => (b.date.isAfter(a.date) ? 1 : -1)));
    },
    /**
     * Creates a playlist containing all listed releases.
     *
     * @return Promise<any> promise of newly created playlist
     */
    async createPlaylist(): Promise<any> {
      // Update the fetch state
      this.progress = `Fetching tracks for ${this.releases.length} albums...`;
      this.$fetchState.error = null;
      this.$fetchState.pending = true;

      // Asynchronously create the playlist
      return Promise

        // Fetch all the tracks within each release album
        .all(
          // Request in chunks of albums - there is a limit per request
          this.chunkArray(this.releases, 20)
            .map((chunk: any[]) => this.$axios
              .get('https://api.spotify.com/v1/albums', {
                params: { ids: chunk.map((release: any) => release.id).join(',') },
              })
              // Extract all tracks from the returned albums
              .then(({ data: { albums } }): any[] => (
                albums.flatMap((album: any) => {
                  // Inherit the release date from the album, we'll use this to sort later; async
                  const date: moment.Moment = this.$moment(album.release_date, 'YYYY-MM-DD');
                  return album.tracks.items.map((track: any) => ({ ...track, date }));
                })
              ))),
        )
        // Flatten all chunks of tracks
        .then((chunks: any[][]) => chunks.flat(1))
        // Sort tracks by release date - descending
        .then((tracks: any[]) => tracks.sort((a: any, b: any) => (b.date.isAfter(a.date) ? 1 : -1)))

        // Create and populate the playlist
        .then((tracks: any[]) => {
          this.progress = 'Creating a new playlist...';
          return this.$axios
            // Create the playlist
            .post(`https://api.spotify.com/v1/users/${this.$auth.user?.id}/playlists`, {
              // Name of the new playlist; a user may have several playlists with the same name
              name: `Scout | ${this.since.format('DD/MM/YYYY')} - \
${this.$moment().format('DD/MM/YYYY')}`,
              // Playlist description as displayed in Spotify clients
              description: `Scouting new releases from ${this.since.format('Do, MMM. YYYY')} \
through ${this.$moment().format('Do, MMM. YYYY')} - ${window.location.host}${this.$route.path}`,
              // True if the playlist should be public, otherwise private
              public: false,
            })
            // Add tracks to the playlist
            .then(({ data }: any): Promise<any> => {
              this.progress = `Adding ${tracks.length} tracks to playlist...`;
              return this
                // Post in chunks - there is a limit per request
                .chunkArray(tracks, 50)
                // This needs to be synchronously, and in a linear fashion to retain ordering
                .reduce((promise: Promise<any>, items: any[]) => (
                  promise.then(() => this.$axios.post(data.tracks.href, {
                    uris: items.map((item: any) => item.uri),
                  }))
                ), Promise.resolve(null) as Promise<any>)
                // Resolve with the created playlist, i.e. discard the track post responses
                .then(() => data);
            });
        })

        // On success, navigate the user to the playlist
        .then((playlist: any) => {
          window.open(playlist.external_urls.spotify, '_blank');
          return playlist;
        })

        // Update the fetch state
        .catch((error) => { this.$fetchState.error = error; return error; })
        .finally(() => { this.$fetchState.pending = false; });
    },
    /**
     * Normalises a release title, i.e. attempts to remove common variations.
     *
     * @param title album/track title
     * @return normalised title
     */
    normaliseReleaseTitle(title: string): string {
      return title
        // Remove features, e.g. (feat. Jane Doe)
        .replaceAll(/[-(]\s?feat\.? .+?[)-]/ig, '')
        // Remove symbols, e.g. [John Doe Remix] vs. (John Doe Remix)
        .replaceAll(/[^\w\s]/g, '')
        // Remove whitespace
        .replaceAll(/\s+/g, ' ')
        .trim()
        // Transform all to lowercase
        .toLowerCase();
    },
    /**
     * Splits an array into chunks.
     *
     * @param array list of values to chunk
     * @param size maximum size of each chunk
     * @return list of chunks of the original array
     */
    chunkArray(array: any[], size: number): any[][] {
      return array.reduce((chunks: any[], item: any, i: number) => {
        const n = Math.floor(i / size);
        if (chunks[n]) chunks[n].push(item);
        // eslint-disable-next-line no-param-reassign
        else chunks[n] = [item];
        return chunks;
      }, []);
    },
  },

  head: {
    title: 'Scout - Telescope for Spotify',
  },
});
</script>
