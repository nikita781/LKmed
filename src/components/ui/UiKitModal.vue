<script setup>
import { onBeforeUnmount, watch } from "vue";
import UiKitIcon from "./UiKitIcon.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  ariaLabel: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "close"]);

function closeModal() {
  emit("update:modelValue", false);
  emit("close");
}

function handleKeydown(event) {
  if (event.key === "Escape" && props.modelValue) {
    closeModal();
  }
}

function lockPageScroll(isLocked) {
  document.body.classList.toggle("ui-kit-modal-open", isLocked);
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeydown);
      lockPageScroll(true);
      return;
    }

    document.removeEventListener("keydown", handleKeydown);
    lockPageScroll(false);
  },
);

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
  lockPageScroll(false);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="ui-kit-modal" role="presentation">
      <div
        class="ui-kit-modal__dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="ariaLabel || title"
      >
        <header class="ui-kit-modal__header">
          <h2 class="ui-kit-modal__title">{{ title }}</h2>

          <button class="ui-kit-modal__close" type="button" aria-label="Закрыть" @click="closeModal">
            <UiKitIcon name="close" :size="24" />
          </button>
        </header>

        <div class="ui-kit-modal__body">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
.ui-kit-modal-open {
  overflow: hidden;
}
</style>

<style scoped>
.ui-kit-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(27, 37, 48, 0.4);
}

.ui-kit-modal__dialog {
  display: flex;
  flex-direction: column;
  width: min(100%, 1022px);
  height: min(914px, calc(100dvh - 40px));
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.ui-kit-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  width: 100%;
  padding: 30px 26px 20px;
  border-bottom: 1px solid var(--color-border);
}

.ui-kit-modal__title {
  margin: 0;
  color: #121212;
  font-family: var(--font-family-base);
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.ui-kit-modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 8px;
  border: 0;
  border-radius: 100px;
  background: var(--color-secondary);
  color: var(--color-primary);
  cursor: pointer;
  transition: filter 0.15s ease;
}

.ui-kit-modal__close:hover {
  filter: brightness(0.93);
}

.ui-kit-modal__body {
  flex: 1;
  min-height: 0;
}

@media (max-width: 767px) {
  .ui-kit-modal {
    align-items: stretch;
    padding: 12px;
  }

  .ui-kit-modal__dialog {
    height: calc(100dvh - 24px);
    border-radius: 16px;
  }

  .ui-kit-modal__header {
    padding: 22px 18px 16px;
  }

  .ui-kit-modal__title {
    font-size: 18px;
    letter-spacing: 0.36px;
  }
}
</style>
