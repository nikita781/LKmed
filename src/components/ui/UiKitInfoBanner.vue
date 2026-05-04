<script setup>
import UiKitIcon from "./UiKitIcon.vue";

defineProps({
  message: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <section class="ui-kit-info-banner" role="status">
    <UiKitIcon class="ui-kit-info-banner__icon" name="info" :size="24" />
    <p class="ui-kit-info-banner__text">{{ message }}</p>
  </section>
</template>

<style scoped>
.ui-kit-info-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 60px;
  padding: 10px 15px;
  border-radius: var(--radius-sm);
  background: var(--color-secondary);
}

.ui-kit-info-banner__icon {
  color: var(--color-text-muted);
  flex: none;
}

.ui-kit-info-banner__text {
  flex: 1 1 auto;
  margin: 0;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}
</style>
