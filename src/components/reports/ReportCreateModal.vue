<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { getUserApiErrorMessage } from "../../services/apiClient";
import {
  getDocumentFilesPage,
  getDocumentStatuses,
  getUsers,
} from "../../services/moderatorDocumentsApi";
import { createReport } from "../../services/reportsApi";
import UiKitIcon from "../ui/UiKitIcon.vue";
import UiKitSearchSelect from "../ui/UiKitSearchSelect.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "created"]);

const formatOptions = [
  { id: "employee", label: "По сотруднику" },
  { id: "document", label: "По документу" },
];
const yearOptions = buildYearOptions();
const departmentOptions = [{ id: "all", label: "Все подразделения" }];

const employeeLabel = ref("");
const documentLabel = ref("");
const statusOptions = ref([]);

const form = reactive({
  title: "",
  format: "employee",
  employee: "",
  year: yearOptions[0].id,
  document: "",
  status: "",
  department: departmentOptions[0].id,
});

async function loadStatuses() {
  try {
    statusOptions.value = await getDocumentStatuses();

    if (!form.status) {
      form.status = statusOptions.value[0]?.id ?? "";
    }
  } catch {
    statusOptions.value = [];
  }
}

function fetchEmployees({ search, page }) {
  return getUsers({ search, page }).then((result) => ({
    items: result.items.map((user) => ({ id: user.id, label: user.fullName })),
    hasMore: result.hasMore,
  }));
}

function fetchDocuments({ search, page }) {
  return getDocumentFilesPage({ search, page }).then((result) => ({
    items: result.items.map((doc) => ({ id: doc.id, label: doc.label })),
    hasMore: result.hasMore,
  }));
}

const validationAttempted = ref(false);
const formError = ref("");
const isSubmitting = ref(false);

const isEmployeeFormat = computed(() => form.format === "employee");
const shouldShowTitleError = computed(() => validationAttempted.value && !form.title.trim());
const shouldShowEmployeeError = computed(
  () => validationAttempted.value && isEmployeeFormat.value && !form.employee,
);
const shouldShowDocumentError = computed(
  () => validationAttempted.value && !isEmployeeFormat.value && !form.document,
);
const shouldShowStatusError = computed(
  () => validationAttempted.value && !isEmployeeFormat.value && !form.status,
);
const isSubmitDisabled = computed(() => isSubmitting.value);

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetForm();
      loadStatuses();
      document.body.classList.add("report-create-modal-open");
      return;
    }

    document.body.classList.remove("report-create-modal-open");
  },
);

onBeforeUnmount(() => {
  document.body.classList.remove("report-create-modal-open");
});

function buildYearOptions() {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 5 }, (_, index) => {
    const year = (currentYear - index).toString();

    return { id: year, label: year };
  });
}

function resetForm() {
  validationAttempted.value = false;
  formError.value = "";
  form.title = "";
  form.format = "employee";
  form.year = yearOptions[0].id;
  form.department = departmentOptions[0].id;
  form.employee = "";
  employeeLabel.value = "";
  form.document = "";
  documentLabel.value = "";
  form.status = statusOptions.value[0]?.id ?? "";
}

function closeModal() {
  if (isSubmitting.value) {
    return;
  }

  emit("update:modelValue", false);
}

async function submitForm() {
  validationAttempted.value = true;
  formError.value = "";

  if (!form.title.trim()) {
    formError.value = "Введите название отчета.";
    return;
  }

  if (isEmployeeFormat.value && !form.employee) {
    formError.value = "Выберите сотрудника.";
    return;
  }

  if (!isEmployeeFormat.value && !form.document) {
    formError.value = "Выберите документ.";
    return;
  }

  if (!isEmployeeFormat.value && !form.status) {
    formError.value = "Выберите статус.";
    return;
  }

  isSubmitting.value = true;

  try {
    const created = await createReport({
      title: form.title.trim(),
      type: form.format,
      userId: isEmployeeFormat.value ? form.employee : null,
      year: isEmployeeFormat.value ? form.year : null,
      documentId: isEmployeeFormat.value ? null : form.document,
      statusId: isEmployeeFormat.value ? null : form.status,
      department: isEmployeeFormat.value ? null : form.department,
    });

    emit("created", created);
  } catch (error) {
    formError.value = getUserApiErrorMessage(error, "Не удалось создать отчёт");
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="report-create-modal-fade">
      <div
        v-if="modelValue"
        class="report-create-modal"
        role="presentation"
        @click.self="closeModal"
      >
        <form
          class="report-create-modal__dialog"
          aria-labelledby="report-create-modal-title"
          @submit.prevent="submitForm"
        >
          <header class="report-create-modal__header">
            <h2 id="report-create-modal-title" class="report-create-modal__title">
              Создание отчета
            </h2>
            <button
              class="report-create-modal__close"
              type="button"
              aria-label="Закрыть"
              :disabled="isSubmitting"
              @click="closeModal"
            >
              <UiKitIcon name="close" :size="24" />
            </button>
          </header>

          <div class="report-create-modal__content">
            <label class="report-create-modal__field">
              <span class="report-create-modal__label">
                Название <span aria-hidden="true">*</span>
              </span>
              <input
                v-model.trim="form.title"
                class="report-create-modal__input"
                :class="{ 'report-create-modal__input--error': shouldShowTitleError }"
                type="text"
                placeholder="Введите название"
                autocomplete="off"
              />
            </label>

            <div class="report-create-modal__field" role="radiogroup" aria-label="Формат">
              <span class="report-create-modal__label">Формат</span>
              <div class="report-create-modal__radio-group">
                <label
                  v-for="option in formatOptions"
                  :key="option.id"
                  class="report-create-modal__radio"
                >
                  <input v-model="form.format" type="radio" :value="option.id" />
                  <span class="report-create-modal__radio-control" aria-hidden="true" />
                  <span class="report-create-modal__radio-text">{{ option.label }}</span>
                </label>
              </div>
            </div>

            <template v-if="isEmployeeFormat">
              <div class="report-create-modal__field">
                <span class="report-create-modal__label">Выберите сотрудника</span>
                <UiKitSearchSelect
                  v-model="form.employee"
                  v-model:selected-label="employeeLabel"
                  :fetcher="fetchEmployees"
                  :has-error="shouldShowEmployeeError"
                  placeholder="Выберите сотрудника"
                  search-placeholder="Поиск сотрудника"
                  empty-text="Сотрудники не найдены"
                />
              </div>

              <label class="report-create-modal__field">
                <span class="report-create-modal__label">Выберите год</span>
                <span class="report-create-modal__select-wrap">
                  <select v-model="form.year" class="report-create-modal__select">
                    <option v-for="option in yearOptions" :key="option.id" :value="option.id">
                      {{ option.label }}
                    </option>
                  </select>
                  <UiKitIcon name="chevron-down" :size="20" />
                </span>
              </label>
            </template>

            <template v-else>
              <div class="report-create-modal__field">
                <span class="report-create-modal__label">Выберите документ</span>
                <UiKitSearchSelect
                  v-model="form.document"
                  v-model:selected-label="documentLabel"
                  :fetcher="fetchDocuments"
                  :has-error="shouldShowDocumentError"
                  placeholder="Выберите документ"
                  search-placeholder="Поиск документа"
                  empty-text="Документы не найдены"
                />
              </div>

              <label class="report-create-modal__field">
                <span class="report-create-modal__label">Выберите статус</span>
                <span class="report-create-modal__select-wrap">
                  <select
                    v-model="form.status"
                    class="report-create-modal__select"
                    :class="{ 'report-create-modal__select--error': shouldShowStatusError }"
                  >
                    <option v-for="option in statusOptions" :key="option.id" :value="option.id">
                      {{ option.label }}
                    </option>
                  </select>
                  <UiKitIcon name="chevron-down" :size="20" />
                </span>
              </label>

              <label class="report-create-modal__field">
                <span class="report-create-modal__label">Выберите структурное подразделение</span>
                <span class="report-create-modal__select-wrap">
                  <select v-model="form.department" class="report-create-modal__select">
                    <option
                      v-for="option in departmentOptions"
                      :key="option.id"
                      :value="option.id"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <UiKitIcon name="chevron-down" :size="20" />
                </span>
              </label>
            </template>

            <p v-if="formError" class="report-create-modal__error">{{ formError }}</p>
          </div>

          <div class="report-create-modal__actions">
            <button
              class="report-create-modal__cancel"
              type="button"
              :disabled="isSubmitting"
              @click="closeModal"
            >
              Отменить
            </button>
            <button
              class="report-create-modal__submit"
              type="submit"
              :disabled="isSubmitDisabled"
            >
              {{ isSubmitting ? "Создание..." : "Сформировать отчет" }}
            </button>
          </div>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
body.report-create-modal-open {
  overflow: hidden;
}
</style>

<style scoped>
.report-create-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgb(27 37 48 / 40%);
}

.report-create-modal__dialog {
  display: flex;
  width: min(758px, 100%);
  max-height: calc(100vh - 64px);
  flex-direction: column;
  gap: 30px;
  overflow: auto;
  padding: 30px 26px;
  border: 0;
  border-radius: 20px;
  background: var(--color-surface);
}

.report-create-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.report-create-modal__title {
  margin: 0;
  color: #071229;
  font-family: var(--font-family-base);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.report-create-modal__close {
  display: inline-flex;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 0;
  border-radius: 50%;
  background: #d8eaf6;
  color: #0067ff;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.report-create-modal__close:hover {
  filter: brightness(0.93);
}

.report-create-modal__close:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.report-create-modal__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.report-create-modal__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  border: 0;
}

.report-create-modal__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding-left: 5px;
  color: #071229;
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.report-create-modal__label [aria-hidden="true"] {
  color: #bc5555;
}

.report-create-modal__input,
.report-create-modal__select {
  width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: 10px 15px;
  border: 1px solid #c0c3c9;
  border-radius: 12px;
  background: var(--color-surface);
  color: #071229;
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
  outline: none;
  transition: border-color 0.15s ease;
}

.report-create-modal__input:focus,
.report-create-modal__select:focus {
  border-color: var(--color-primary);
}

.report-create-modal__input::placeholder {
  color: #626977;
}

.report-create-modal__input--error,
.report-create-modal__select--error {
  border-color: #bc5555;
}

.report-create-modal__select-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.report-create-modal__select-wrap svg {
  position: absolute;
  right: 15px;
  color: #767d8a;
  pointer-events: none;
}

.report-create-modal__select {
  padding: 10px 45px 10px 15px;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.report-create-modal__select:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.report-create-modal__select:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.report-create-modal__radio-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: 40px;
  gap: 20px;
  align-items: center;
  padding: 10px 15px;
  border: 1px solid #c0c3c9;
  border-radius: 12px;
}

.report-create-modal__radio {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #000000;
  font-family: "Roboto", var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  cursor: pointer;
}

.report-create-modal__radio input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.report-create-modal__radio-control {
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

.report-create-modal__radio:hover .report-create-modal__radio-control {
  border-color: var(--color-primary);
}

.report-create-modal__radio input:checked + .report-create-modal__radio-control {
  border-color: #0067ff;
}

.report-create-modal__radio input:checked + .report-create-modal__radio-control::after {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: #0067ff;
  content: "";
}

.report-create-modal__error {
  margin: 0;
  color: #e63f3f;
  font-family: var(--font-family-base);
  font-size: 14px;
  line-height: 1.3;
}

.report-create-modal__actions {
  display: flex;
  gap: 20px;
  align-self: flex-end;
}

.report-create-modal__cancel,
.report-create-modal__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 45px;
  padding: 15px 45px;
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

.report-create-modal__cancel,
.report-create-modal__submit {
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.report-create-modal__cancel {
  border: 1px solid #0067ff;
  background: var(--color-surface);
  color: #0067ff;
}

.report-create-modal__cancel:hover:not(:disabled) {
  background: var(--color-secondary);
  border-color: var(--color-primary-200);
  color: var(--color-primary-200);
}

.report-create-modal__submit {
  width: 220px;
  border: 0;
  background: #0067ff;
  color: var(--color-surface);
}

.report-create-modal__submit:hover:not(:disabled) {
  background: var(--color-primary-200);
}

.report-create-modal__cancel:disabled,
.report-create-modal__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.report-create-modal-fade-enter-active,
.report-create-modal-fade-leave-active {
  transition: opacity 0.18s ease;
}

.report-create-modal-fade-enter-from,
.report-create-modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 760px) {
  .report-create-modal {
    padding: 12px;
  }

  .report-create-modal__dialog {
    max-height: calc(100vh - 24px);
    gap: 22px;
    padding: 22px 18px;
    border-radius: 18px;
  }

  .report-create-modal__title {
    font-size: 18px;
  }

  .report-create-modal__radio-group {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .report-create-modal__actions {
    width: 100%;
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .report-create-modal__cancel,
  .report-create-modal__submit {
    width: 100%;
  }
}
</style>
