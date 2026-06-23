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
              {{ modalTitle }}
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
                :class="{ 'create-document-modal__target-control--error': shouldShowGroupError }"
                type="button"
                @click="isGroupMenuOpen = !isGroupMenuOpen"
              >
                <span class="create-document-modal__chips">
                  <span
                    v-if="!selectedGroupItems.length"
                    class="create-document-modal__target-placeholder"
                  >
                    Выберите целевую группу
                  </span>
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
                <button
                  type="button"
                  class="create-document-modal__target-select-all"
                  @click="toggleSelectAllGroups"
                >
                  <UiKitIcon :name="allGroupsSelected ? 'close' : 'check'" :size="18" />
                  <span>{{ allGroupsSelected ? "Снять выделение" : "Выбрать всех" }}</span>
                </button>
                <label
                  v-for="group in groupOptions"
                  :key="group.id"
                  class="create-document-modal__target-option"
                >
                  <input v-model="form.groups" type="checkbox" :value="group.id" />
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

            <div v-if="isBaseMode" class="create-document-modal__field">
              <label class="create-document-modal__field-label">
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
              <a
                v-if="selectedBaseDocumentUrl"
                class="create-document-modal__base-link"
                :href="selectedBaseDocumentUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <UiKitIcon name="eye" :size="20" />
                <span>Открыть в новой вкладке</span>
              </a>
            </div>

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
                <p>Разрешенные типы файлов: .pdf, .doc, .jpg.</p>
              </div>
            </div>

            <p v-if="visibleFormError" class="create-document-modal__error">
              {{ visibleFormError }}
            </p>
          </div>

          <UiKitButton
            class="create-document-modal__submit"
            type="submit"
            :disabled="props.isSubmitting"
          >
            Готово
          </UiKitButton>
        </form>

        <div v-if="props.isSubmitting" class="create-document-modal__overlay">
          <span class="create-document-modal__spinner" aria-hidden="true" />
          <span class="create-document-modal__overlay-text">Загрузка…</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import UiKitButton from "../ui/UiKitButton.vue";
import UiKitIcon from "../ui/UiKitIcon.vue";

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".jpg"];

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  groups: {
    type: Array,
    default: () => [],
  },
  baseDocuments: {
    type: Array,
    default: () => [],
  },
  mode: {
    type: String,
    default: "create",
  },
  document: {
    type: Object,
    default: null,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  submitError: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "create", "update"]);

const fallbackCategoryOptions = [
  { id: "medicine", label: "Медицина" },
  { id: "safety", label: "Охрана труда" },
  { id: "quality", label: "Контроль качества" },
];

const fallbackGroupOptions = [
  { id: "surgeon", label: "Хирург" },
  { id: "therapist", label: "Терапевт" },
  { id: "cardiologist", label: "Кардиолог" },
  { id: "nurse", label: "Медсестра" },
];

const fallbackBaseDocumentOptions = [
  { id: "health-order", label: "Приказ Минздрава РФ", filePath: "" },
  { id: "clinic-regulation", label: "Регламент клиники", filePath: "" },
  { id: "sanitary-rules", label: "Санитарные правила", filePath: "" },
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
  groups: [],
  readUntil: "",
  baseDocumentId: "health-order",
});

const categoryOptions = computed(() =>
  props.categories.length ? props.categories : fallbackCategoryOptions,
);
const groupOptions = computed(() => (props.groups.length ? props.groups : fallbackGroupOptions));
const baseDocumentOptions = computed(() => {
  const options = props.baseDocuments.length ? props.baseDocuments : fallbackBaseDocumentOptions;
  const currentDocumentOption = getCurrentDocumentOption();

  if (
    !currentDocumentOption ||
    options.some(
      (document) =>
        document.id === currentDocumentOption.id ||
        normalizeOptionText(document.label) === normalizeOptionText(currentDocumentOption.label),
    )
  ) {
    return options;
  }

  return [currentDocumentOption, ...options];
});

const isBaseMode = computed(() => documentMode.value === "base");
const isEditMode = computed(() => props.mode === "edit");
const modalTitle = computed(() =>
  isEditMode.value ? "Редактирование документа" : "Добавление документа",
);
const selectedFileName = computed(() => selectedFile.value?.name ?? "");
const hasApiBaseDocuments = computed(() => baseDocumentOptions.value.length > 0);
const selectedGroupItems = computed(() =>
  groupOptions.value.filter((group) => form.groups.includes(group.id)),
);
const selectedCategory = computed(
  () =>
    categoryOptions.value.find((category) => category.id === form.category) ??
    categoryOptions.value[0],
);
const selectedBaseDocument = computed(
  () =>
    baseDocumentOptions.value.find((document) => document.id === form.baseDocumentId) ??
    baseDocumentOptions.value[0],
);

const selectedBaseDocumentUrl = computed(() => selectedBaseDocument.value?.filePath || "");

const shouldShowTitleError = computed(() => validationAttempted.value && !form.title.trim());
const shouldShowDateError = computed(() => validationAttempted.value && !form.readUntil.trim());
const shouldShowGroupError = computed(() => validationAttempted.value && !form.groups.length);
const shouldShowFileError = computed(
  () => validationAttempted.value && !isBaseMode.value && !selectedFile.value,
);
const shouldShowBaseError = computed(
  () => validationAttempted.value && isBaseMode.value && !form.baseDocumentId,
);
const visibleFormError = computed(() => formError.value || props.submitError);

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

watch(
  () => props.document,
  () => {
    if (props.modelValue) {
      resetForm();
    }
  },
);

watch(baseDocumentOptions, () => {
  if (props.modelValue && isEditMode.value && props.document) {
    form.baseDocumentId = getBaseDocumentId(props.document);
  }
});

watch(documentMode, () => {
  formError.value = "";
  fileError.value = "";
});

onBeforeUnmount(() => {
  document.body.classList.remove("create-document-modal-open");
});

function resetForm() {
  const documentItem = props.document;
  const defaultGroups = getDefaultGroupIds(documentItem);

  documentMode.value = isEditMode.value ? "base" : "upload";
  isGroupMenuOpen.value = false;
  validationAttempted.value = false;
  selectedFile.value = null;
  fileError.value = "";
  formError.value = "";
  form.title = documentItem?.title ?? "";
  form.category = getCategoryId(documentItem);
  form.groups = defaultGroups.length ? defaultGroups : [];
  form.readUntil = toDateInputValue(documentItem?.readUntil);
  form.baseDocumentId = getBaseDocumentId(documentItem);

  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
}

function getDefaultGroupIds(documentItem) {
  if (!documentItem?.groups?.length) {
    return [];
  }

  return documentItem.groups
    .map((groupValue) => {
      const normalizedValue = groupValue?.toString() ?? "";
      const option = groupOptions.value.find(
        (group) => group.id === normalizedValue || group.label === normalizedValue,
      );

      return option?.id ?? "";
    })
    .filter(Boolean);
}

function getCategoryId(documentItem) {
  const fallbackCategoryId = categoryOptions.value[0]?.id ?? "";
  const categoryValue = documentItem?.category;

  if (!categoryValue) {
    return fallbackCategoryId;
  }

  if (typeof categoryValue === "object") {
    return categoryValue.id?.toString() ?? fallbackCategoryId;
  }

  return (
    categoryOptions.value.find(
      (category) => category.id === categoryValue || category.label === categoryValue,
    )?.id ?? fallbackCategoryId
  );
}

function getBaseDocumentId(documentItem) {
  const fallbackDocumentId = baseDocumentOptions.value[0]?.id ?? "";

  if (!documentItem) {
    return fallbackDocumentId;
  }

  return (
    documentItem.baseDocumentId ??
    documentItem.documentId ??
    baseDocumentOptions.value.find(
      (document) =>
        normalizeOptionText(document.label) === normalizeOptionText(documentItem.fileName),
    )?.id ??
    fallbackDocumentId
  );
}

function getCurrentDocumentOption() {
  if (!isEditMode.value || !props.document?.fileName) {
    return null;
  }

  return {
    id:
      props.document.documentId ||
      props.document.baseDocumentId ||
      `current-document-${normalizeOptionText(props.document.fileName)}`,
    label: props.document.fileName,
    filePath: props.document.filePath ?? "",
  };
}

function normalizeOptionText(value) {
  return value?.toString().normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase() ?? "";
}

function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const normalizedValue = value.toString();
  const isoMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const ruMatch = normalizedValue.match(/^(\d{2})\.(\d{2})\.(\d{4})/);

  if (ruMatch) {
    return `${ruMatch[3]}-${ruMatch[2]}-${ruMatch[1]}`;
  }

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function closeModal() {
  if (props.isSubmitting) {
    return;
  }

  emit("update:modelValue", false);
}

function removeGroup(groupId) {
  form.groups = form.groups.filter((id) => id !== groupId);
}

const allGroupsSelected = computed(
  () => groupOptions.value.length > 0 && form.groups.length === groupOptions.value.length,
);

function toggleSelectAllGroups() {
  form.groups = allGroupsSelected.value ? [] : groupOptions.value.map((group) => group.id);
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

  selectedFile.value = file;
}

function submitForm() {
  if (props.isSubmitting) {
    return;
  }

  validationAttempted.value = true;
  formError.value = "";

  if (!form.title.trim() || !form.readUntil.trim()) {
    formError.value = "Заполните обязательные поля.";
    return;
  }

  if (!form.groups.length) {
    formError.value = "Выберите целевую группу.";
    return;
  }

  if (isBaseMode.value && !form.baseDocumentId) {
    formError.value = "Выберите документ из базы.";
    return;
  }

  if (isBaseMode.value && !hasApiBaseDocuments.value) {
    formError.value = "В базе пока нет документов.";
    return;
  }

  if (isBaseMode.value && isSyntheticDocumentId(form.baseDocumentId)) {
    formError.value = "Не удалось определить файл документа. Выберите файл из списка.";
    return;
  }

  if (!isBaseMode.value && !selectedFile.value) {
    formError.value = "Добавьте файл документа.";
    return;
  }

  emit(isEditMode.value ? "update" : "create", {
    mode: documentMode.value,
    title: form.title.trim(),
    category: selectedCategory.value?.label ?? "",
    categoryId: props.categories.length ? form.category : "",
    groups: selectedGroupItems.value.map((group) => group.label),
    targetGroups: selectedGroupItems.value.map((group) => group.label),
    allGroups: allGroupsSelected.value,
    readUntil: form.readUntil.trim(),
    baseDocumentId: form.baseDocumentId,
    file: selectedFile.value,
    fileName: isBaseMode.value ? selectedBaseDocument.value?.label : selectedFile.value.name,
  });
}

function isSyntheticDocumentId(documentId) {
  return documentId?.toString().startsWith("current-document-");
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
  transition: filter 0.15s ease;
}

.create-document-modal__close:hover {
  filter: brightness(0.93);
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

.create-document-modal__field-label {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.create-document-modal__base-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-left: 5px;
  color: var(--color-primary);
  font-family: var(--font-family-base);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.26px;
  text-decoration: none;
}

.create-document-modal__base-link:hover {
  text-decoration: underline;
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
  transition: border-color 0.15s ease;
}

.create-document-modal__radio:hover .create-document-modal__radio-control {
  border-color: var(--color-primary);
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
  transition: border-color 0.15s ease;
}

.create-document-modal__input:focus,
.create-document-modal__select:focus,
.create-document-modal__date-input:focus,
.create-document-modal__target-control:focus {
  border-color: var(--color-primary);
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
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.create-document-modal__select:hover {
  border-color: var(--color-primary);
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

.create-document-modal__target-placeholder {
  display: inline-flex;
  align-items: center;
  min-height: 27px;
  color: #626977;
  font-size: 14px;
  line-height: 20px;
}

.create-document-modal__target-select-all {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 38px;
  margin-bottom: 4px;
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  background: var(--color-primary);
  color: var(--color-surface);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.28px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.create-document-modal__target-select-all:hover {
  background: #1f6fd6;
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
  transition: border-color 0.15s ease, color 0.15s ease;
}

.create-document-modal__upload:hover {
  border-color: var(--color-primary-200);
  color: var(--color-primary-200);
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
.create-document-modal__target-control--error,
.create-document-modal__upload--error {
  border-color: #e63f3f;
}

.create-document-modal__submit {
  width: 220px;
  align-self: flex-end;
}

.create-document-modal__overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgb(255 255 255 / 70%);
}

.create-document-modal__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-secondary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: create-document-modal-spin 0.8s linear infinite;
}

.create-document-modal__overlay-text {
  color: var(--color-primary);
  font-family: var(--font-family-base);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.32px;
}

@keyframes create-document-modal-spin {
  to {
    transform: rotate(360deg);
  }
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
