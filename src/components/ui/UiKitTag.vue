<script setup>
import { computed } from "vue";

const props = defineProps({
  variant: {
    type: String,
    default: "success",
  },
  label: {
    type: String,
    default: "",
  },
});

const fallbackLabels = {
  success: "Принят",
  new: "Новый",
  error: "Просрочен",
};

const tagLabel = computed(() => props.label || fallbackLabels[props.variant] || fallbackLabels.success);
</script>

<template>
  <span class="ui-kit-tag" :class="`ui-kit-tag--${variant}`">
    {{ tagLabel }}
  </span>
</template>

<style scoped>
.ui-kit-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 22px;
  font-family: var(--font-family-base);
  font-size: 12px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.24px;
}

.ui-kit-tag--success {
  background: var(--color-accent-success-bg);
  color: var(--color-accent-success);
}

.ui-kit-tag--new {
  background: var(--color-secondary);
  color: var(--color-primary);
}

.ui-kit-tag--error {
  background: var(--color-accent-error-bg);
  color: var(--color-accent);
}
</style>
