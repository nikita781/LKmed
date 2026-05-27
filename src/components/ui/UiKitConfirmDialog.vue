<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: "Подтверждение" },
  message: { type: String, default: "" },
  confirmLabel: { type: String, default: "Подтвердить" },
  cancelLabel: { type: String, default: "Отменить" },
  variant: {
    type: String,
    default: "primary",
    validator: (value) => value === "primary" || value === "danger",
  },
  isSubmitting: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

function closeDialog() {
  emit("update:modelValue", false);
}

function handleConfirm() {
  emit("confirm");
}
</script>

<template>
  <Teleport to="body">
    <Transition name="ui-kit-confirm-fade">
      <div v-if="modelValue" class="ui-kit-confirm" role="presentation" @click.self="closeDialog">
        <div class="ui-kit-confirm__dialog" role="dialog" aria-modal="true">
          <h2 class="ui-kit-confirm__title">{{ title }}</h2>
          <p v-if="message" class="ui-kit-confirm__message">{{ message }}</p>
          <div class="ui-kit-confirm__actions">
            <button
              class="ui-kit-confirm__cancel"
              type="button"
              :disabled="isSubmitting"
              @click="closeDialog"
            >
              {{ cancelLabel }}
            </button>
            <button
              class="ui-kit-confirm__confirm"
              :class="{ 'ui-kit-confirm__confirm--danger': variant === 'danger' }"
              type="button"
              :disabled="isSubmitting"
              @click="handleConfirm"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-kit-confirm {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgb(27 37 48 / 40%);
}

.ui-kit-confirm__dialog {
  display: flex;
  width: min(420px, 100%);
  flex-direction: column;
  gap: 20px;
  padding: 26px 24px 24px;
  border-radius: 20px;
  background: var(--color-surface);
}

.ui-kit-confirm__title {
  margin: 0;
  color: #071229;
  font-family: var(--font-family-base);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.36px;
  text-transform: uppercase;
}

.ui-kit-confirm__message {
  margin: 0;
  color: #071229;
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.ui-kit-confirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.ui-kit-confirm__cancel,
.ui-kit-confirm__confirm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 12px 24px;
  border-radius: var(--radius-pill);
  font-family: var(--font-family-base);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.24px;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
}

.ui-kit-confirm__cancel {
  border: 1px solid #0067ff;
  background: var(--color-surface);
  color: #0067ff;
}

.ui-kit-confirm__confirm {
  border: 0;
  background: #0067ff;
  color: var(--color-surface);
}

.ui-kit-confirm__confirm--danger {
  background: #bc5555;
}

.ui-kit-confirm__confirm:disabled,
.ui-kit-confirm__cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ui-kit-confirm-fade-enter-active,
.ui-kit-confirm-fade-leave-active {
  transition: opacity 0.15s ease;
}

.ui-kit-confirm-fade-enter-from,
.ui-kit-confirm-fade-leave-to {
  opacity: 0;
}
</style>
