<script setup>
import { computed, ref, watch } from "vue";
import UiKitIcon from "../ui/UiKitIcon.vue";

const ACCEPTED_EXTENSIONS = [".xls", ".xlsx"];

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  isSubmitting: { type: Boolean, default: false },
  submitError: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const fileInputRef = ref(null);
const selectedFile = ref(null);
const fileError = ref("");
const validationAttempted = ref(false);

const selectedFileName = computed(() => selectedFile.value?.name ?? "");
const shouldShowFileError = computed(
  () => validationAttempted.value && !selectedFile.value,
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    selectedFile.value = null;
    fileError.value = "";
    validationAttempted.value = false;

    if (fileInputRef.value) {
      fileInputRef.value.value = "";
    }
  },
);

function closeModal() {
  if (props.isSubmitting) {
    return;
  }

  emit("update:modelValue", false);
}

function openFilePicker() {
  fileInputRef.value?.click();
}

function handleFileInput(event) {
  const [file] = Array.from(event.target.files ?? []);

  setSelectedFile(file);
}

function handleDrop(event) {
  const [file] = Array.from(event.dataTransfer?.files ?? []);

  setSelectedFile(file);
}

function setSelectedFile(file) {
  fileError.value = "";

  if (!file) {
    selectedFile.value = null;
    return;
  }

  const lowerName = file.name.toLowerCase();
  const isAccepted = ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));

  if (!isAccepted) {
    selectedFile.value = null;
    fileError.value = "Выберите файл в формате .xls или .xlsx.";
    return;
  }

  selectedFile.value = file;
}

function submitForm() {
  validationAttempted.value = true;

  if (!selectedFile.value) {
    return;
  }

  emit("submit", selectedFile.value);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="admin-modal-fade">
      <div v-if="modelValue" class="admin-modal" role="presentation" @click.self="closeModal">
        <form class="admin-modal__dialog" @submit.prevent="submitForm">
          <header class="admin-modal__header">
            <h2 class="admin-modal__title">Импорт пользователей</h2>
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
            <p class="admin-modal__hint">
              Загрузите Excel-файл с сотрудниками. В ответ придёт файл со сгенерированными паролями — он скачается автоматически.
            </p>

            <div class="admin-modal__field">
              <span class="admin-modal__label">Файл</span>
              <button
                class="admin-modal__upload"
                :class="{ 'admin-modal__upload--error': shouldShowFileError }"
                type="button"
                @click="openFilePicker"
                @dragover.prevent
                @drop.prevent="handleDrop"
              >
                <UiKitIcon class="admin-modal__upload-icon" name="upload" :size="24" />
                <span class="admin-modal__upload-text">
                  {{ selectedFileName || "Выберите .xlsx или перетащите файл в эту область" }}
                </span>
              </button>
              <input
                ref="fileInputRef"
                class="admin-modal__file-input"
                type="file"
                accept=".xls,.xlsx"
                @change="handleFileInput"
              />
              <p v-if="fileError" class="admin-modal__error">{{ fileError }}</p>
            </div>

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
              Загрузить
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
