<script setup>
import { ref, watch } from "vue";
import UiKitIcon from "../ui/UiKitIcon.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  user: { type: Object, default: null },
  roles: { type: Array, default: () => [] },
  isSubmitting: { type: Boolean, default: false },
  submitError: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const selectedRoleId = ref("");

watch(
  () => [props.modelValue, props.user?.id, props.roles.length],
  ([isOpen]) => {
    if (!isOpen) {
      return;
    }

    const currentByTitle = props.roles.find((roleItem) => roleItem.title === props.user?.roleTitle);
    selectedRoleId.value = currentByTitle?.id ?? props.roles[0]?.id ?? "";
  },
);

function closeModal() {
  if (props.isSubmitting) {
    return;
  }

  emit("update:modelValue", false);
}

function submitForm() {
  if (!selectedRoleId.value || !props.user) {
    return;
  }

  emit("submit", { userId: props.user.id, roleId: selectedRoleId.value });
}
</script>

<template>
  <Teleport to="body">
    <Transition name="admin-modal-fade">
      <div v-if="modelValue" class="admin-modal" role="presentation" @click.self="closeModal">
        <form class="admin-modal__dialog" @submit.prevent="submitForm">
          <header class="admin-modal__header">
            <h2 class="admin-modal__title">Назначение роли</h2>
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
              <span class="admin-modal__label">Роль</span>
              <span class="admin-modal__select-wrap">
                <select v-model="selectedRoleId" class="admin-modal__select">
                  <option v-for="roleItem in roles" :key="roleItem.id" :value="roleItem.id">
                    {{ roleItem.title }}
                  </option>
                </select>
                <UiKitIcon name="chevron-down" :size="20" />
              </span>
            </label>

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
