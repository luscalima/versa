<script setup lang="ts">
import { AlertTriangleIcon } from "@lucide/vue";

useHead({
  title: "versa",
});

const clickMe = ref(false);
</script>

<template>
  <div class="flex h-screen w-full items-center justify-center">
    <div class="w-96">
      <h1 class="text-2xl font-bold text-center mb-4">versa</h1>
      <AppAlert variant="destructive">
        <AlertTriangleIcon />
        <AppAlertTitle>Under construction</AppAlertTitle>
        <AppAlertDescription>
          This application is currently under construction. Please check back
          later for updates.
        </AppAlertDescription>
      </AppAlert>
      <div class="text-center">
        <AppButton :disabled="clickMe" class="mt-4" @click="clickMe = true">
          Click me
        </AppButton>
        <div class="h-10 mt-4">
          <p v-if="clickMe">Thank's for clicking the button!</p>
        </div>
      </div>
    </div>
  </div>
</template>
