<template>
  <a :href="href" target="_blank" class="transform hover:scale-105 transition duration-300">
    <img
      :src="artwork"
      :alt="`Artwork for ${name}`"
      class="w-full bg-black bg-opacity-25 rounded-lg"
    >
    <div class="px-1 py-4">
      <h3 class="text-lg font-bold">
        {{ name }}
      </h3>
      <p class="text-sm text-gray-700">
        <span v-for="(artist, index) in artists" :key="index">
          <a :href="artist.href" target="_blank" class="hover:underline">
            {{ artist.name }}</a><span v-if="index < artists.length - 1">, </span>
        </span>
      </p>
    </div>
  </a>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'AlbumTile',
  props: {
    name: {
      type: String,
      required: true,
    },
    artwork: {
      type: String,
      required: true,
    },
    artists: {
      type: Array,
      required: true,
      validator: (val: any[]) => val.every((artist: any) => 'name' in artist && 'href' in artist),
    },
    href: {
      type: String,
      required: true,
    },
  },
});
</script>
