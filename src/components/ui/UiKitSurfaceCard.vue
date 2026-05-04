<script setup>
import { computed } from "vue";

const props = defineProps({
  padding: {
    type: String,
    default: "24px",
  },
  radius: {
    type: [String, Number],
    default: 20,
  },
  shadow: {
    type: String,
    default: "soft",
  },
});

const styleVars = computed(() => ({
  "--card-padding": props.padding,
  "--card-radius": typeof props.radius === "number" ? `${props.radius}px` : props.radius,
}));
</script>

<template>
  <section
    class="ui-kit-surface-card"
    :class="`ui-kit-surface-card--${shadow}`"
    :style="styleVars"
  >
    <slot />
  </section>
</template>

<style scoped>
.ui-kit-surface-card {
  padding: var(--card-padding);
  background: var(--color-surface);
  border-radius: var(--card-radius);
}

.ui-kit-surface-card--soft {
  box-shadow: var(--surface-shadow);
}

.ui-kit-surface-card--none {
  box-shadow: none;
}

@media (max-width: 639px) {
  .ui-kit-surface-card {
    padding: 20px;
    border-radius: 18px;
  }
}
</style>
