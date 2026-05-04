<script setup>
import UiKitIcon from "../ui/UiKitIcon.vue";

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  employeeName: {
    type: String,
    default: "ФИО",
  },
  documentTitle: {
    type: String,
    default: "Название",
  },
  acknowledgedAt: {
    type: String,
    default: "текущие",
  },
});

const emit = defineEmits(["confirm", "update:modelValue", "close"]);

function closeModal() {
  emit("update:modelValue", false);
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="document-acknowledgement" role="presentation">
      <section
        class="document-acknowledgement__dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Подтверждение ознакомления"
      >
        <header class="document-acknowledgement__header">
          <h2 class="document-acknowledgement__title">Подтверждение</h2>

          <button class="document-acknowledgement__close" type="button" aria-label="Закрыть" @click="closeModal">
            <UiKitIcon name="close" :size="24" />
          </button>
        </header>

        <p class="document-acknowledgement__text">
          Я, {{ employeeName }}, ознакомлен(а) с документом '{{ documentTitle }}' в полном объеме,
          со всеми приложениями и обязуюсь соблюдать изложенные в нем требования. Дата и время:
          {{ acknowledgedAt }}.
        </p>

        <button class="document-acknowledgement__button" type="button" @click="emit('confirm')">
          Подтвердить ознакомление
        </button>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.document-acknowledgement {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(27, 37, 48, 0.4);
}

.document-acknowledgement__dialog {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
  width: min(100%, 758px);
  padding: 30px 26px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.document-acknowledgement__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.document-acknowledgement__title {
  margin: 0;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.4px;
  text-align: left;
  text-transform: uppercase;
}

.document-acknowledgement__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 40px;
  height: 40px;
  padding: 8px;
  border: 0;
  border-radius: 100px;
  background: var(--color-secondary);
  color: var(--color-primary);
  cursor: pointer;
}

.document-acknowledgement__text {
  width: 100%;
  margin: 0;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 16px;
  font-weight: 400;
  line-height: 22px;
  letter-spacing: 0.32px;
}

.document-acknowledgement__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 45px;
  padding: 15px 45px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: var(--color-surface);
  font-family: var(--font-family-base);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.24px;
  text-transform: uppercase;
  cursor: pointer;
}

@media (max-width: 767px) {
  .document-acknowledgement {
    padding: 18px;
  }

  .document-acknowledgement__dialog {
    gap: 24px;
  }

  .document-acknowledgement__button {
    width: 100%;
    padding-inline: 24px;
  }
}
</style>
