<template>
  <div class="container text-center">
    <img src="~/assets/graphics/unlock.svg" alt="Unlock" class="h-48 md:h-64 mx-auto">
    <p class="text-xl md:text-2xl font-black py-6">
      Hold tight, we're logging you in...
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'LoginPage',
  middleware: ['auth'],
  auth: 'guest',
  mounted() {
    this.$nextTick(() => {
      this.$nuxt.$loading.start();
      setTimeout(() => this.$auth.login(), 1500);
    });
  },
});
</script>
