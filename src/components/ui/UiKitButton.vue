<script setup>
import { computed } from "vue";
import UiKitIcon from "./UiKitIcon.vue";

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
  iconPosition: {
    type: String,
    default: "start",
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
});

const buttonClasses = computed(() => ({
  "ui-kit-button--primary": props.variant === "primary",
  "ui-kit-button--secondary": props.variant === "secondary",
  "ui-kit-button--with-icon": Boolean(props.icon),
  "ui-kit-button--full-width": props.fullWidth,
}));
</script>

<template>
  <button class="ui-kit-button" :class="buttonClasses" :type="type" :disabled="disabled">
    <UiKitIcon
      v-if="icon && iconPosition === 'start'"
      class="ui-kit-button__icon"
      :name="icon"
      :size="15"
    />
    <span class="ui-kit-button__label">
      <slot />
    </span>
    <UiKitIcon
      v-if="icon && iconPosition === 'end'"
      class="ui-kit-button__icon"
      :name="icon"
      :size="15"
    />
  </button>
</template>

<style scoped>
.ui-kit-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  width: 220px;
  min-height: 45px;
  padding: 15px 45px;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  font-family: var(--font-family-base);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.24px;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.ui-kit-button__label,
.ui-kit-button__icon {
  flex: none;
}

.ui-kit-button__icon {
  display: block;
}

.ui-kit-button--with-icon {
  gap: 4px;
}

.ui-kit-button--full-width {
  width: 100%;
}

.ui-kit-button--primary {
  background: var(--color-primary);
  color: var(--color-surface);
}

.ui-kit-button--primary:hover:not(:disabled) {
  background: var(--color-primary-200);
}

.ui-kit-button--secondary {
  background: var(--color-surface);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.ui-kit-button--secondary:hover:not(:disabled) {
  background: var(--color-secondary);
  border-color: var(--color-primary-200);
  color: var(--color-primary-200);
}

.ui-kit-button--primary:disabled {
  background: var(--color-secondary);
  border-color: var(--color-secondary);
  color: var(--color-surface);
}

.ui-kit-button--secondary:disabled {
  background: var(--color-surface);
  border-color: var(--color-secondary);
  color: var(--color-secondary);
}

.ui-kit-button:disabled {
  cursor: not-allowed;
}
</style>
