<script setup>
import UiKitButton from "./ui/UiKitButton.vue";

const props = defineProps({
  type: {
    type: String,
    default: "button",
  },
  variant: {
    type: String,
    default: "primary",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <UiKitButton :type="props.type" :variant="props.variant" :disabled="props.disabled" :icon="props.icon">
    <slot />
  </UiKitButton>
</template>
