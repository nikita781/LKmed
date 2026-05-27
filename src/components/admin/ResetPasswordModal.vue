<script setup>
import { computed, ref, watch } from "vue";
import UiKitIcon from "../ui/UiKitIcon.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  user: { type: Object, default: null },
  isSubmitting: { type: Boolean, default: false },
  submitError: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const password = ref("");
const validationAttempted = ref(false);

const shouldShowPasswordError = computed(
  () => validationAttempted.value && password.value.trim().length < 4,
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    password.value = "";
    validationAttempted.value = false;
  },
);

function closeModal() {
  if (props.isSubmitting) {
    return;
  }

  emit("update:modelValue", false);
}

function submitForm() {
  validationAttempted.value = true;

  if (password.value.trim().length < 4 || !props.user) {
    return;
  }

  emit("submit", { userId: props.user.id, password: password.value });
}
</script>

<template>
  <Teleport to="body">
    <Transition name="admin-modal-fade">
      <div v-if="modelValue" class="admin-modal" role="presentation" @click.self="closeModal">
        <form class="admin-modal__dialog" @submit.prevent="submitForm">
          <header class="admin-modal__header">
            <h2 class="admin-modal__title">Сброс пароля</h2>
            <button
              class="admin-modal__close"
              type="button"
              aria-label="Закрыть"
              @click="closeModal"
            >
              <UiKitIcon name="close" :size="24" />
            </button>
          </header>

          <div class="admin-modal__content">
            <p v-if="user" class="admin-modal__user">
              <span class="admin-modal__user-name">{{ user.fullName }}</span>
              <span class="admin-modal__user-meta">{{ user.employeeNumber }}</span>
            </p>

            <label class="admin-modal__field">
              <span class="admin-modal__label">
                Новый пароль <span aria-hidden="true">*</span>
              </span>
              <input
                v-model="password"
                class="admin-modal__input"
                :class="{ 'admin-modal__input--error': shouldShowPasswordError }"
                type="text"
                placeholder="Минимум 4 символа"
                autocomplete="new-password"
              />
            </label>

            <p class="admin-modal__hint">
              После сохранения сотрудник будет выкинут из всех сессий и сможет войти только с новым паролем.
            </p>

            <p v-if="submitError" class="admin-modal__error">{{ submitError }}</p>
          </div>

          <div class="admin-modal__actions">
            <button
              class="admin-modal__cancel"
              type="button"
              :disabled="isSubmitting"
              @click="closeModal"
            >
              Отменить
            </button>
            <button class="admin-modal__submit" type="submit" :disabled="isSubmitting">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@import "./admin-modal.css";
</style>
