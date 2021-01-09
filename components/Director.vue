<template>
  <transition name="animate-director">
    <div
      v-show="isOpen"
      id="director"
      class="fixed inset-0 overflow-y-auto overflow-x-hidden bg-white z-30 pb-10 space-y-8"
    >
      <!-- Toggle -->
      <div class="flex justify-end container h-16 md:h-20">
        <a
          class="flex items-center h-full px-4 -mr-4 md:px-6 md:-mr-6 cursor-pointer"
          @click="toggle(false)"
        >
          <img src="~/assets/icons/menu-close.svg" alt="Close director" class="h-8 w-8">
        </a>
      </div>

      <!-- Header -->
      <slot name="header" />

      <!-- Destinations -->
      <slot name="destinations">
        <div class="flex flex-col justify-end container text-right space-y-2">
          <NuxtLink
            to="/"
            no-prefetch
            class="text-2xl md:text-3xl font-black hover:text-gray-800 transform
                   hover:-translate-x-1 transition-transform ease-in-out duration-200"
          >
            First
          </NuxtLink>
          <NuxtLink
            to="/second"
            no-prefetch
            class="text-2xl md:text-3xl font-black hover:text-gray-800 transform
                   hover:-translate-x-1 transition-transform ease-in-out duration-200"
          >
            Second
          </NuxtLink>
          <NuxtLink
            to="/"
            no-prefetch
            class="text-2xl md:text-3xl font-black hover:text-gray-800 transform
                   hover:-translate-x-1 transition-transform ease-in-out duration-200"
          >
            Third
          </NuxtLink>
        </div>
      </slot>

      <!-- Actions -->
      <slot name="actions">
        <div class="flex flex-col justify-end container text-right space-y-2">
          <!-- Login / Logout -->
          <a
            class="text-base cursor-pointer hover:text-gray-800 transform hover:-translate-x-1
                   transition-transform ease-in-out duration-200"
            @click="$auth.loggedIn ? $auth.logout() : $auth.login()"
          >
            {{ $auth.loggedIn ? 'Logout' : 'Login' }}
          </a>
        </div>
      </slot>

      <!-- Footer -->
      <slot name="footer">
        <!-- User -->
        <transition name="animate-user" mode="out-in">
          <div
            v-if="$auth.loggedIn"
            :key="$auth.user.id"
            class="flex justify-end items-center container text-right"
          >
            <p class="text-sm mr-4">
              {{ greeting }},<br>
              <strong class="text-base">{{ $auth.user.display_name }}</strong>
            </p>
            <img
              :src="$auth.user.images[0].url"
              :alt="`Avatar for ${$auth.user.display_name}`"
              class="h-12 w-12 rounded-full"
            >
          </div>
        </transition>
      </slot>
    </div>
  </transition>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'Director',
  data: () => ({
    isOpen: false,
  }),
  computed: {
    greeting(): string {
      const hour = (new Date()).getHours();
      if (hour < 12) return 'Good morning';
      return hour >= 17 ? 'Good evening' : 'Good afternoon';
    },
  },
  watch: {
    $route() {
      this.toggle(false);
    },
    isOpen(val: boolean) {
      if (val) document.addEventListener('keydown', this.onKeydown);
      else document.removeEventListener('keydown', this.onKeydown);
    },
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.onKeydown);
  },
  methods: {
    toggle(val?: boolean) {
      this.isOpen = typeof val === 'boolean' ? val : !this.isOpen;
      this.$emit('toggle', this.isOpen);
    },
    onKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') this.toggle(false);
    },
  },
});
</script>

<style lang="scss">
#director {
  --bg-opacity: .98;
  //backdrop-filter: blur(8px);

  .animate-user {
    &-enter {
      opacity: 0;
      transform: translateX(4rem);
    }

    &-leave-to {
      opacity: 0;
      transform: translateX(-4rem);
    }

    &-enter-active {
      transition: opacity .5s ease, transform .5s ease;
    }

    &-leave-active {
      transition: opacity .3s ease-in, transform .3s ease-in;
    }
  }
}

.animate-director {
  &-enter, &-leave-to {
    opacity: 0;
    transform: translateY(-6rem);
  }

  &-enter-active {
    transition: opacity .5s ease, transform .5s ease;
  }

  &-leave-active {
    transition: opacity .3s ease, transform .3s ease;
  }
}
</style>
