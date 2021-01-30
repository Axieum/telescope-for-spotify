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
    <section v-for="[date, section] in sections.entries()" v-else :key="date.valueOf()">
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
    <p v-else-if="!$fetchState.pending" class="text-center opacity-50">
      That's everything &mdash; you're up to date!
    </p>
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
  },

  head: {
    title: 'Scout - Telescope for Spotify',
  },
});
</script>
