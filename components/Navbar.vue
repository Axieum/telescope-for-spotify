<template>
  <nav class="fixed inset-x-0 bg-white bg-opacity-75 h-16 md:h-20 z-10">
    <div class="flex justify-between items-stretch container h-full">
      <!-- Left -->
      <div class="flex justify-start items-center">
        <!-- Brand -->
        <NuxtLink to="/" class="text-xl font-black">
          Telescope
        </NuxtLink>
      </div>
      <!-- Right -->
      <div class="flex justify-end items-center flex-shrink-0">
        <!-- Toggle -->
        <a
          class="flex items-center h-full px-4 -mr-4 md:px-6 md:-mr-6 cursor-pointer"
          @click="$emit('toggle')"
        >
          <img src="~/assets/icons/menu-open.svg" alt="Toggle director" class="h-8 w-8">
        </a>
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'Navbar',
});
</script>
