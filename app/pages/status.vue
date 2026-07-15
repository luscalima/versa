<script setup lang="ts">
import { AlertTriangleIcon } from '@lucide/vue'

useHead({
  title: 'Status',
})

const { data: status, refresh: refreshStatus } = await useFetch('/api/v1/status', {
  key: 'status',
})

// This polling is not ideal, but it works for now
setInterval(async () => {
  await refreshStatus()
}, 3_000)
</script>

<template>
  <div class="p-4">
    <h1 class="font-semibold text-3xl">Status</h1>
    <div
      v-if="status"
      class="mt-4"
    >
      <p>
        <strong>Última atualização:</strong> {{ new Date(status?.updated_at).toLocaleString() }}
      </p>
      <strong class="uppercase">Database</strong>
      <div class="pl-4">
        <p><strong>Version:</strong> {{ status.database.version }}</p>
        <p><strong>Maximum number of connections:</strong> {{ status.database.max_connections }}</p>
        <p><strong>Open connections:</strong> {{ status.database.opened_connections }}</p>
      </div>
    </div>
    <div
      v-else
      class="mt-4"
    >
      <AppAlert variant="destructive">
        <AlertTriangleIcon />
        <AppAlertDescription> Data loading failed. </AppAlertDescription>
      </AppAlert>
    </div>
  </div>
</template>
