<template>
  <Teleport to="body">
    <Transition name="create-document-modal-fade">
      <div
        v-if="modelValue"
        class="create-document-modal"
        role="presentation"
        @click.self="closeModal"
      >
        <form
          class="create-document-modal__dialog"
          aria-labelledby="create-document-title"
          @submit.prevent="submitForm"
        >
          <header class="create-document-modal__header">
            <h2 id="create-document-title" class="create-document-modal__title">
              Добавление документа
            </h2>
            <button
              class="create-document-modal__close"
              type="button"
              aria-label="Закрыть"
              @click="closeModal"
            >
              <UiKitIcon name="close" :size="24" />
            </button>
          </header>

          <div class="create-document-modal__content">
            <fieldset class="create-document-modal__field">
              <legend class="create-document-modal__label">Выбор документа</legend>
              <div class="create-document-modal__radio-group">
                <label class="create-document-modal__radio">
                  <input v-model="documentMode" type="radio" value="base" />
                  <span class="create-document-modal__radio-control" />
                  <span class="create-document-modal__radio-text">Из базы</span>
                </label>
                <label class="create-document-modal__radio">
                  <input v-model="documentMode" type="radio" value="upload" />
                  <span class="create-document-modal__radio-control" />
                  <span class="create-document-modal__radio-text">Загрузка нового</span>
                </label>
              </div>
            </fieldset>

            <label class="create-document-modal__field">
              <span class="create-document-modal__label">
                Название документа <span aria-hidden="true">*</span>
              </span>
              <input
                v-model.trim="form.title"
                class="create-document-modal__input"
                :class="{ 'create-document-modal__input--error': shouldShowTitleError }"
                type="text"
                placeholder="Введите название"
                autocomplete="off"
              />
            </label>

            <label class="create-document-modal__field">
              <span class="create-document-modal__label">Категория</span>
              <span class="create-document-modal__select-wrap">
                <select v-model="form.category" class="create-document-modal__select">
                  <option
                    v-for="category in categoryOptions"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.label }}
                  </option>
                </select>
                <UiKitIcon name="chevron-down" :size="20" />
              </span>
            </label>

            <div class="create-document-modal__field create-document-modal__field--relative">
              <span class="create-document-modal__label">Целевая группа</span>
              <button
                class="create-document-modal__target-control"
                type="button"
                @click="isGroupMenuOpen = !isGroupMenuOpen"
              >
                <span class="create-document-modal__chips">
                  <span
                    v-for="group in selectedGroupItems"
                    :key="group.id"
                    class="create-document-modal__chip"
                  >
                    {{ group.label }}
                    <span
                      class="create-document-modal__chip-remove"
                      role="button"
                      tabindex="0"
                      :aria-label="`Убрать ${group.label}`"
                      @click.stop="removeGroup(group.id)"
                      @keydown.enter.stop.prevent="removeGroup(group.id)"
                      @keydown.space.stop.prevent="removeGroup(group.id)"
                    >
                      <UiKitIcon name="close" :size="15" />
                    </span>
                  </span>
                </span>
                <UiKitIcon name="chevron-down" :size="20" />
              </button>
              <div v-if="isGroupMenuOpen" class="create-document-modal__target-menu">
                <label
                  v-for="group in groupOptions"
                  :key="group.id"
                  class="create-document-modal__target-option"
                >
                  <input
                    v-model="form.groups"
                    type="checkbox"
                    :value="group.id"
                    :disabled="form.groups.length === 1 && form.groups.includes(group.id)"
                  />
                  <span>{{ group.label }}</span>
                </label>
              </div>
            </div>

            <label class="create-document-modal__field">
              <span class="create-document-modal__label">
                Срок ознакомления <span aria-hidden="true">*</span>
              </span>
              <span
                class="create-document-modal__date-wrap"
                :class="{ 'create-document-modal__date-wrap--error': shouldShowDateError }"
              >
                <input
                  v-model="form.readUntil"
                  class="create-document-modal__date-input"
                  type="date"
                />
              </span>
            </label>

            <label v-if="isBaseMode" class="create-document-modal__field">
              <span class="create-document-modal__label">Выберите документ</span>
              <span
                class="create-document-modal__select-wrap"
                :class="{ 'create-document-modal__select-wrap--error': shouldShowBaseError }"
              >
                <select v-model="form.baseDocumentId" class="create-document-modal__select">
                  <option
                    v-for="document in baseDocumentOptions"
                    :key="document.id"
                    :value="document.id"
                  >
                    {{ document.label }}
                  </option>
                </select>
                <UiKitIcon name="chevron-down" :size="20" />
              </span>
            </label>

            <div v-else class="create-document-modal__field">
              <span class="create-document-modal__label">Файл документа</span>
              <button
                class="create-document-modal__upload"
                :class="{ 'create-document-modal__upload--error': shouldShowFileError }"
                type="button"
                @click="openFilePicker"
                @dragover.prevent
                @drop.prevent="handleDrop"
              >
                <span class="create-document-modal__upload-text">
                  {{ selectedFileName || "Выберите файл или перетащите файл в указанную область" }}
                </span>
              </button>
              <input
                ref="fileInputRef"
                class="create-document-modal__file-input"
                type="file"
                accept=".pdf,.doc,.jpg"
                @change="handleFileInput"
              />
              <p v-if="fileError" class="create-document-modal__error">
                {{ fileError }}
              </p>
              <div class="create-document-modal__info">
                <span class="create-document-modal__info-icon">
                  <UiKitIcon name="info" :size="24" />
                </span>
                <p>
                  Максимальный размер вложений не должен превышать 15 МБ. Разрешенные типы
                  файлов: .pdf, .doc, .jpg.
                </p>
              </div>
            </div>

            <p v-if="formError" class="create-document-modal__error">
              {{ formError }}
            </p>
          </div>

          <UiKitButton class="create-document-modal__submit" type="submit">
            Готово
          </UiKitButton>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import UiKitButton from "../ui/UiKitButton.vue";
import UiKitIcon from "../ui/UiKitIcon.vue";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".jpg"];

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "create"]);

const categoryOptions = [
  { id: "medicine", label: "Медицина" },
  { id: "safety", label: "Охрана труда" },
  { id: "quality", label: "Контроль качества" },
];

const groupOptions = [
  { id: "surgeon", label: "Хирург" },
  { id: "therapist", label: "Терапевт" },
  { id: "cardiologist", label: "Кардиолог" },
  { id: "nurse", label: "Медсестра" },
];

const baseDocumentOptions = [
  { id: "health-order", label: "Приказ Минздрава РФ" },
  { id: "clinic-regulation", label: "Регламент клиники" },
  { id: "sanitary-rules", label: "Санитарные правила" },
];

const documentMode = ref("upload");
const isGroupMenuOpen = ref(false);
const validationAttempted = ref(false);
const selectedFile = ref(null);
const fileInputRef = ref(null);
const fileError = ref("");
const formError = ref("");

const form = reactive({
  title: "",
  category: "medicine",
  groups: ["surgeon", "therapist"],
  readUntil: "",
  baseDocumentId: "health-order",
});

const isBaseMode = computed(() => documentMode.value === "base");
const selectedFileName = computed(() => selectedFile.value?.name ?? "");
const selectedGroupItems = computed(() =>
  groupOptions.filter((group) => form.groups.includes(group.id)),
);
const selectedCategory = computed(
  () => categoryOptions.find((category) => category.id === form.category) ?? categoryOptions[0],
);
const selectedBaseDocument = computed(
  () =>
    baseDocumentOptions.find((document) => document.id === form.baseDocumentId) ??
    baseDocumentOptions[0],
);

const shouldShowTitleError = computed(() => validationAttempted.value && !form.title.trim());
const shouldShowDateError = computed(() => validationAttempted.value && !form.readUntil.trim());
const shouldShowFileError = computed(
  () => validationAttempted.value && !isBaseMode.value && !selectedFile.value,
);
const shouldShowBaseError = computed(
  () => validationAttempted.value && isBaseMode.value && !form.baseDocumentId,
);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetForm();
      document.body.classList.add("create-document-modal-open");
      return;
    }

    document.body.classList.remove("create-document-modal-open");
  },
);

watch(documentMode, () => {
  formError.value = "";
  fileError.value = "";
});

onBeforeUnmount(() => {
  document.body.classList.remove("create-document-modal-open");
});

function resetForm() {
  documentMode.value = "upload";
  isGroupMenuOpen.value = false;
  validationAttempted.value = false;
  selectedFile.value = null;
  fileError.value = "";
  formError.value = "";
  form.title = "";
  form.category = "medicine";
  form.groups = ["surgeon", "therapist"];
  form.readUntil = "";
  form.baseDocumentId = "health-order";

  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
}

function closeModal() {
  emit("update:modelValue", false);
}

function removeGroup(groupId) {
  if (form.groups.length === 1) {
    return;
  }

  form.groups = form.groups.filter((id) => id !== groupId);
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

  const fileName = file.name.toLowerCase();
  const isAcceptedType = ACCEPTED_EXTENSIONS.some((extension) => fileName.endsWith(extension));

  if (!isAcceptedType) {
    selectedFile.value = null;
    fileError.value = "Выберите файл в формате .pdf, .doc или .jpg.";
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    selectedFile.value = null;
    fileError.value = "Размер файла не должен превышать 15 МБ.";
    return;
  }

  selectedFile.value = file;
}

function submitForm() {
  validationAttempted.value = true;
  formError.value = "";

  if (!form.title.trim() || !form.readUntil.trim()) {
    formError.value = "Заполните обязательные поля.";
    return;
  }

  if (isBaseMode.value && !form.baseDocumentId) {
    formError.value = "Выберите документ из базы.";
    return;
  }

  if (!isBaseMode.value && !selectedFile.value) {
    formError.value = "Добавьте файл документа.";
    return;
  }

  emit("create", {
    mode: documentMode.value,
    title: form.title.trim(),
    category: selectedCategory.value.label,
    groups: selectedGroupItems.value.map((group) => group.label),
    readUntil: form.readUntil.trim(),
    fileName: isBaseMode.value ? selectedBaseDocument.value.label : selectedFile.value.name,
  });

  closeModal();
}
</script>

<style>
body.create-document-modal-open {
  overflow: hidden;
}
</style>

<style scoped>
.create-document-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgb(27 37 48 / 40%);
}

.create-document-modal__dialog {
  display: flex;
  width: min(758px, 100%);
  max-height: calc(100vh - 48px);
  flex-direction: column;
  gap: 30px;
  overflow: auto;
  padding: 30px 26px;
  border: 0;
  border-radius: 20px;
  background: var(--color-surface);
  box-shadow: none;
}

.create-document-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.create-document-modal__title {
  margin: 0;
  color: #071229;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.create-document-modal__close {
  display: inline-flex;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: #d8eaf6;
  color: #0067ff;
  cursor: pointer;
}

.create-document-modal__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.create-document-modal__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  border: 0;
}

.create-document-modal__field--relative {
  position: relative;
}

.create-document-modal__label {
  color: #071229;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.create-document-modal__field > legend.create-document-modal__label {
  display: block;
  margin-bottom: 10px;
}

.create-document-modal__label [aria-hidden="true"] {
  color: #bc5555;
}

.create-document-modal__radio-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: 40px;
  gap: 20px;
  align-items: center;
  padding: 10px 15px;
  border: 1px solid #c0c3c9;
  border-radius: 12px;
}

.create-document-modal__radio {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #212121;
  cursor: pointer;
}

.create-document-modal__radio input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.create-document-modal__radio-control {
  position: relative;
  display: inline-flex;
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  border: 1px solid #767d8a;
  border-radius: 50%;
  background: var(--color-surface);
}

.create-document-modal__radio input:checked + .create-document-modal__radio-control {
  border-color: #0067ff;
}

.create-document-modal__radio input:checked + .create-document-modal__radio-control::after {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: #0067ff;
  content: "";
}

.create-document-modal__radio-text {
  color: #000000;
  font-family: "Roboto", var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

.create-document-modal__input,
.create-document-modal__select,
.create-document-modal__date-input,
.create-document-modal__target-control {
  width: 100%;
  min-width: 0;
  min-height: 40px;
  border: 1px solid #c0c3c9;
  border-radius: 12px;
  background: var(--color-surface);
  color: #071229;
  font: inherit;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.28px;
  outline: none;
}

.create-document-modal__input {
  padding: 10px 15px;
}

.create-document-modal__input::placeholder,
.create-document-modal__date-input::placeholder {
  color: #626977;
}

.create-document-modal__select-wrap,
.create-document-modal__date-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.create-document-modal__select-wrap svg {
  position: absolute;
  flex: 0 0 auto;
  color: #767d8a;
  pointer-events: none;
}

.create-document-modal__select-wrap svg {
  right: 15px;
}

.create-document-modal__select {
  appearance: none;
  padding: 10px 45px 10px 15px;
}

.create-document-modal__date-input {
  padding: 10px 15px;
  color-scheme: light;
}

.create-document-modal__date-wrap .create-document-modal__date-input {
  border-color: #c0c3c9;
}

.create-document-modal__target-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 15px;
  cursor: pointer;
}

.create-document-modal__chips {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 5px;
}

.create-document-modal__chip {
  display: inline-flex;
  max-width: 100%;
  min-height: 27px;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #c0c3c9;
  border-radius: 12px;
  background: var(--color-surface);
  color: #212121;
  font-size: 14px;
  font-weight: 400;
  line-height: 15px;
}

.create-document-modal__chip-remove {
  display: inline-flex;
  color: #c0c3c9;
  cursor: pointer;
}

.create-document-modal__target-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 2;
  display: grid;
  width: 100%;
  gap: 4px;
  padding: 8px;
  border: 1px solid #c0c3c9;
  border-radius: 12px;
  background: var(--color-surface);
  box-shadow: 0 12px 30px rgb(10 31 68 / 14%);
}

.create-document-modal__target-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  padding: 6px 8px;
  border-radius: 8px;
  color: #212121;
  font-size: 16px;
  cursor: pointer;
}

.create-document-modal__target-option:hover {
  background: #d8eaf6;
}

.create-document-modal__upload {
  display: flex;
  min-height: 130px;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 1px dashed #0067ff;
  border-radius: 12px;
  background: #d8eaf6;
  color: #0067ff;
  cursor: pointer;
  text-align: center;
}

.create-document-modal__upload-text {
  max-width: 450px;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
  overflow-wrap: anywhere;
}

.create-document-modal__file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.create-document-modal__info {
  display: flex;
  min-height: 60px;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 12px;
  background: #d8eaf6;
  color: #626977;
}

.create-document-modal__info p {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.create-document-modal__info-icon {
  display: inline-flex;
  flex: 0 0 auto;
  color: #626977;
}

.create-document-modal__error {
  margin: 0;
  color: #e63f3f;
  font-size: 14px;
  line-height: 1.3;
}

.create-document-modal__input--error,
.create-document-modal__date-wrap--error .create-document-modal__date-input,
.create-document-modal__select-wrap--error .create-document-modal__select,
.create-document-modal__upload--error {
  border-color: #e63f3f;
}

.create-document-modal__submit {
  width: 220px;
  align-self: flex-end;
}

.create-document-modal-fade-enter-active,
.create-document-modal-fade-leave-active {
  transition: opacity 0.18s ease;
}

.create-document-modal-fade-enter-from,
.create-document-modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 760px) {
  .create-document-modal {
    padding: 12px;
  }

  .create-document-modal__dialog {
    max-height: calc(100vh - 24px);
    gap: 22px;
    padding: 22px 18px;
    border-radius: 18px;
  }

  .create-document-modal__title {
    font-size: 18px;
  }

  .create-document-modal__radio-group {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .create-document-modal__submit {
    width: 100%;
  }
}
</style>
