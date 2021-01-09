<template>
  <div>
    <Navbar @toggle="$refs.director.toggle()" />
    <Director ref="director" />
    <main class="h-full min-h-screen bg-light pb-12 pt-24 md:pt-32">
      <Nuxt />
    </main>
  </div>
</template>

<script lang="ts">
import Director from '~/components/Director.vue';
import Navbar from '~/components/Navbar.vue';

export default {
  components: {
    Director,
    Navbar,
  },
};
</script>
