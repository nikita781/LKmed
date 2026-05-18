<script setup>
import { computed, onMounted, ref, watch } from "vue";
import UiKitIcon from "../components/ui/UiKitIcon.vue";
import UiKitTag from "../components/ui/UiKitTag.vue";
import DocumentPreviewModal from "../components/documents/DocumentPreviewModal.vue";
import AppLayout from "../layouts/AppLayout.vue";
import {
  fixationEmployeeDocumentStartView,
  getEmployeeDocument,
  getEmployeeDocuments,
  signEmployeeDocument,
} from "../services/employeeDocumentsApi";
import { getUserApiErrorMessage } from "../services/apiClient";
import { useAuth } from "../composables/useAuth";

const selectedStatus = ref("all");
const searchQuery = ref("");
const currentPage = ref(1);
const documents = ref([]);
const paginationMeta = ref({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
});
const selectedDocumentId = ref(null);
const selectedDocumentDetails = ref(null);
const isDocumentModalOpen = ref(false);
const acknowledgedDocumentIds = ref(new Set());
const isLoading = ref(false);
const loadError = ref("");
const actionError = ref("");
const { user } = useAuth();
const employeeName = computed(() => user.value?.fullName || "Медработник");
let loadRequestId = 0;
let searchTimer = null;

const statusOptions = [
  { value: "all", label: "Все статусы" },
  { value: "new", label: "Новый" },
  { value: "success", label: "Принят" },
];

const statusMeta = {
  new: {
    label: "Новый",
    variant: "new",
  },
  success: {
    label: "Принят",
    variant: "success",
  },
  error: {
    label: "Просрочен",
    variant: "error",
  },
};

const filteredDocuments = computed(() => {
  return documents.value.filter((documentItem) => {
    const matchesStatus =
      selectedStatus.value === "all" || documentItem.status === selectedStatus.value;

    return matchesStatus;
  });
});

const totalPages = computed(() => Math.max(1, Number(paginationMeta.value.last_page) || 1));

const visibleDocuments = computed(() => filteredDocuments.value);

const selectedDocument = computed(() => {
  const documentItem =
    selectedDocumentDetails.value ??
    documents.value.find((item) => item.id === selectedDocumentId.value);

  if (!documentItem) {
    return null;
  }

  const currentStatusMeta = getDocumentStatusMeta(documentItem);

  return {
    ...documentItem,
    statusLabel: currentStatusMeta.label,
    statusVariant: currentStatusMeta.variant,
  };
});

const paginationItems = computed(() => {
  const lastPage = totalPages.value;

  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => ({
      key: `page-${index + 1}`,
      type: "page",
      value: index + 1,
    }));
  }

  if (currentPage.value <= 4) {
    return [1, 2, 3, 4, 5].map((page) => ({
      key: `page-${page}`,
      type: "page",
      value: page,
    })).concat([
      { key: "ellipsis-right", type: "ellipsis" },
      { key: `page-${lastPage}`, type: "page", value: lastPage },
    ]);
  }

  if (currentPage.value >= lastPage - 3) {
    return [
      { key: "page-1", type: "page", value: 1 },
      { key: "ellipsis-left", type: "ellipsis" },
      ...Array.from({ length: 5 }, (_, index) => lastPage - 4 + index).map((page) => ({
        key: `page-${page}`,
        type: "page",
        value: page,
      })),
    ];
  }

  return [
    { key: "page-1", type: "page", value: 1 },
    { key: "ellipsis-left", type: "ellipsis" },
    { key: `page-${currentPage.value - 1}`, type: "page", value: currentPage.value - 1 },
    { key: `page-${currentPage.value}`, type: "page", value: currentPage.value },
    { key: `page-${currentPage.value + 1}`, type: "page", value: currentPage.value + 1 },
    { key: "ellipsis-right", type: "ellipsis" },
    { key: `page-${lastPage}`, type: "page", value: lastPage },
  ];
});

const tableEmptyMessage = computed(() => {
  if (isLoading.value) {
    return "Загружаем документы";
  }

  if (loadError.value) {
    return loadError.value;
  }

  return "По вашему запросу документы не найдены";
});

onMounted(() => {
  loadDocuments();
});

watch(selectedStatus, () => {
  currentPage.value = 1;
});

watch(searchQuery, () => {
  currentPage.value = 1;
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    loadDocuments();
  }, 300);
});

watch(currentPage, () => {
  loadDocuments();
});

watch(totalPages, (nextTotalPages) => {
  if (currentPage.value > nextTotalPages) {
    currentPage.value = nextTotalPages;
  }
});

function setPage(page) {
  if (!Number.isFinite(page) || page < 1 || page > totalPages.value) {
    return;
  }

  currentPage.value = page;
}

async function loadDocuments() {
  const requestId = ++loadRequestId;

  isLoading.value = true;
  loadError.value = "";

  try {
    const response = await getEmployeeDocuments({
      page: currentPage.value,
      search: searchQuery.value.trim(),
    });

    if (requestId !== loadRequestId) {
      return;
    }

    documents.value = response.data;
    paginationMeta.value = response.meta;
  } catch (error) {
    if (requestId !== loadRequestId) {
      return;
    }

    documents.value = [];
    paginationMeta.value = {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    };
    loadError.value = getUserApiErrorMessage(error, "Не удалось загрузить документы");
  } finally {
    if (requestId === loadRequestId) {
      isLoading.value = false;
    }
  }
}

async function previewDocument(documentId) {
  const documentItem = documents.value.find((item) => item.id === documentId) ?? null;

  selectedDocumentId.value = documentId;
  selectedDocumentDetails.value = documentItem;
  isDocumentModalOpen.value = true;
  actionError.value = "";

  try {
    const documentDetails = await getEmployeeDocument(documentId);

    selectedDocumentDetails.value = documentDetails;

    if (!documentDetails.viewingStartedAt) {
      await fixationEmployeeDocumentStartView(documentId);
    }
  } catch (error) {
    actionError.value = getUserApiErrorMessage(error, "Не удалось открыть документ");
  }
}

function isDocumentAcknowledged(documentItem) {
  const documentId = typeof documentItem === "object" ? documentItem.id : documentItem;
  const documentStatus = typeof documentItem === "object" ? documentItem.status : "";

  return acknowledgedDocumentIds.value.has(documentId) || documentStatus === "success";
}

function getDocumentStatusMeta(documentItem) {
  const status = isDocumentAcknowledged(documentItem) ? "success" : documentItem.status;

  return statusMeta[status] ?? statusMeta.new;
}

async function handleDocumentAcknowledge(documentItem) {
  actionError.value = "";

  try {
    await signEmployeeDocument(documentItem.id);

    documents.value = documents.value.map((item) =>
      item.id === documentItem.id ? { ...item, status: "success" } : item,
    );

    if (selectedDocumentDetails.value?.id === documentItem.id) {
      selectedDocumentDetails.value = {
        ...selectedDocumentDetails.value,
        status: "success",
      };
    }

    const nextAcknowledgedDocumentIds = new Set(acknowledgedDocumentIds.value);

    nextAcknowledgedDocumentIds.add(documentItem.id);
    acknowledgedDocumentIds.value = nextAcknowledgedDocumentIds;
    loadDocuments();
  } catch (error) {
    actionError.value = getUserApiErrorMessage(
      error,
      "Не удалось подтвердить ознакомление. Попробуйте позже.",
    );
  }
}

function deleteDocument() {
  actionError.value = "Удаление документов для медработника на беке пока не реализовано.";
}

watch(isDocumentModalOpen, (isOpen) => {
  if (isOpen) {
    return;
  }

  selectedDocumentDetails.value = null;
});
</script>

<template>
  <AppLayout>
    <section class="documents-screen">
      <h1 class="documents-screen__title">Документы</h1>

      <div class="documents-screen__filters">
        <div class="documents-screen__select-wrap">
          <select v-model="selectedStatus" class="documents-screen__select">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <UiKitIcon class="documents-screen__select-icon" name="chevron-down" :size="20" />
        </div>

        <div class="documents-screen__search">
          <input
            v-model="searchQuery"
            class="documents-screen__search-input"
            type="text"
            placeholder="Поиск по документам"
            autocomplete="off"
          />
          <UiKitIcon class="documents-screen__search-icon" name="search" :size="24" />
        </div>
      </div>

      <p v-if="actionError" class="documents-screen__message documents-screen__message--error">
        {{ actionError }}
      </p>

      <div class="documents-screen__table-wrap">
        <div class="documents-screen__table">
          <div class="documents-screen__head">
            <div class="documents-screen__head-cell documents-screen__head-cell--sortable documents-screen__head-cell--title">
              <span>Название документа</span>
              <svg
                class="documents-screen__sort-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M4.15132 7.33333H11.8493C12.424 7.33333 12.7293 6.65333 12.3473 6.22333L8.49865 1.89333C8.43622 1.82287 8.35955 1.76645 8.27371 1.72782C8.18786 1.68918 8.09479 1.6692 8.00065 1.6692C7.90651 1.6692 7.81344 1.68918 7.72759 1.72782C7.64175 1.76645 7.56508 1.82287 7.50265 1.89333L3.65265 6.22333C3.27065 6.65333 3.57598 7.33333 4.15132 7.33333ZM7.50198 14.106C7.56441 14.1765 7.64108 14.2329 7.72693 14.2715C7.81278 14.3101 7.90584 14.3301 7.99998 14.3301C8.09412 14.3301 8.18719 14.3101 8.27304 14.2715C8.35888 14.2329 8.43556 14.1765 8.49798 14.106L12.3467 9.776C12.7293 9.34666 12.424 8.66666 11.8486 8.66666H4.15132C3.57665 8.66666 3.27132 9.34666 3.65332 9.77666L7.50198 14.106Z" fill="#C0C3C9" />
              </svg>
            </div>

            <div class="documents-screen__head-cell documents-screen__head-cell--sortable documents-screen__head-cell--date">
              <span>Дата и время</span>
              <svg
                class="documents-screen__sort-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M4.15132 7.33333H11.8493C12.424 7.33333 12.7293 6.65333 12.3473 6.22333L8.49865 1.89333C8.43622 1.82287 8.35955 1.76645 8.27371 1.72782C8.18786 1.68918 8.09479 1.6692 8.00065 1.6692C7.90651 1.6692 7.81344 1.68918 7.72759 1.72782C7.64175 1.76645 7.56508 1.82287 7.50265 1.89333L3.65265 6.22333C3.27065 6.65333 3.57598 7.33333 4.15132 7.33333ZM7.50198 14.106C7.56441 14.1765 7.64108 14.2329 7.72693 14.2715C7.81278 14.3101 7.90584 14.3301 7.99998 14.3301C8.09412 14.3301 8.18719 14.3101 8.27304 14.2715C8.35888 14.2329 8.43556 14.1765 8.49798 14.106L12.3467 9.776C12.7293 9.34666 12.424 8.66666 11.8486 8.66666H4.15132C3.57665 8.66666 3.27132 9.34666 3.65332 9.77666L7.50198 14.106Z" fill="#C0C3C9" />
              </svg>
            </div>

            <div class="documents-screen__head-cell documents-screen__head-cell--file">
              Прикрепленный файл
            </div>

            <div class="documents-screen__head-cell documents-screen__head-cell--status">
              Статус
            </div>

            <div class="documents-screen__head-cell documents-screen__head-cell--actions">
              Действие
            </div>
          </div>

          <div
            v-for="(documentItem, index) in visibleDocuments"
            :key="documentItem.id"
            class="documents-screen__row"
            :class="{ 'documents-screen__row--last': index === visibleDocuments.length - 1 }"
          >
            <div
              class="documents-screen__cell documents-screen__cell--title"
              data-label="Название документа"
              :title="documentItem.title"
            >
              {{ documentItem.title }}
            </div>

            <div
              class="documents-screen__cell documents-screen__cell--date"
              data-label="Дата и время"
              :title="documentItem.createdAt"
            >
              {{ documentItem.createdAt }}
            </div>

            <div
              class="documents-screen__cell documents-screen__cell--file"
              data-label="Прикрепленный файл"
              :title="documentItem.fileName"
            >
              {{ documentItem.fileName }}
            </div>

            <div class="documents-screen__cell documents-screen__cell--status" data-label="Статус">
              <UiKitTag
                :variant="getDocumentStatusMeta(documentItem).variant"
                :label="getDocumentStatusMeta(documentItem).label"
              />
            </div>

            <div class="documents-screen__cell documents-screen__cell--actions" data-label="Действие">
              <div class="documents-screen__actions">
                <button
                  class="documents-screen__action"
                  type="button"
                  aria-label="Просмотреть документ"
                  @click="previewDocument(documentItem.id)"
                >
                  <UiKitIcon name="eye" :size="24" />
                </button>

                <button
                  class="documents-screen__action"
                  type="button"
                  aria-label="Удалить документ"
                  title="Удаление для медработника пока не реализовано на беке"
                  @click="deleteDocument(documentItem.id)"
                >
                  <UiKitIcon name="trash" :size="24" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="!visibleDocuments.length" class="documents-screen__empty">
            {{ tableEmptyMessage }}
          </div>
        </div>
      </div>

      <nav class="documents-screen__pagination" aria-label="Пагинация">
        <button
          class="documents-screen__page documents-screen__page--arrow"
          type="button"
          aria-label="Предыдущая страница"
          :disabled="currentPage === 1"
          @click="setPage(currentPage - 1)"
        >
          <UiKitIcon name="chevron-left" :size="24" />
        </button>

        <button
          v-for="item in paginationItems"
          :key="item.key"
          class="documents-screen__page"
          :class="{
            'documents-screen__page--active': item.value === currentPage,
            'documents-screen__page--ellipsis': item.type === 'ellipsis',
          }"
          type="button"
          :disabled="item.type === 'ellipsis'"
          @click="setPage(item.value)"
        >
          {{ item.type === "ellipsis" ? "..." : item.value }}
        </button>

        <button
          class="documents-screen__page documents-screen__page--arrow"
          type="button"
          aria-label="Следующая страница"
          :disabled="currentPage === totalPages"
          @click="setPage(currentPage + 1)"
        >
          <UiKitIcon name="chevron-right" :size="24" />
        </button>
      </nav>

      <DocumentPreviewModal
        v-model="isDocumentModalOpen"
        :document="selectedDocument"
        :employee-name="employeeName"
        @acknowledge="handleDocumentAcknowledge"
      />
    </section>
  </AppLayout>
</template>

<style>
.documents-screen {
  display: flex;
  flex-direction: column;
}

.documents-screen__title {
  margin: 0;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  margin-bottom: 42px;
}

.documents-screen__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

.documents-screen__select-wrap,
.documents-screen__search {
  position: relative;
  flex: none;
}

.documents-screen__select-wrap {
  width: 284px;
}

.documents-screen__search {
  width: 480px;
}

.documents-screen__select,
.documents-screen__search-input {
  display: block;
  width: 100%;
  height: 40px;
  padding: 10px 15px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
  outline: none;
}

.documents-screen__select {
  padding-right: 43px;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.documents-screen__search-input {
  padding-right: 47px;
}

.documents-screen__search-input::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.documents-screen__select-icon,
.documents-screen__search-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.documents-screen__select-icon {
  right: 15px;
  color: var(--color-text-strong);
}

.documents-screen__search-icon {
  right: 15px;
  color: var(--color-primary);
}

.documents-screen__message {
  margin: -16px 0 24px;
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.documents-screen__message--error {
  color: var(--color-accent);
}

.documents-screen__table-wrap {
  overflow-x: auto;
}

.documents-screen__table {
  min-width: 1109px;
  border-radius: var(--radius-sm);
}

.documents-screen__head {
  display: grid;
  grid-template-columns: 305px 209px 209px 100px 190px;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: var(--color-secondary);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.documents-screen__head-cell {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.24px;
  text-transform: uppercase;
}

.documents-screen__head-cell--sortable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.documents-screen__head-cell--status,
.documents-screen__head-cell--actions {
  text-align: center;
}

.documents-screen__sort-icon {
  display: block;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
}

.documents-screen__row {
  display: grid;
  grid-template-columns: 305px 209px 209px 100px 190px;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.documents-screen__row--last {
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}

.documents-screen__cell {
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
  min-width: 0;
  overflow: hidden;
}

.documents-screen__cell:not(.documents-screen__cell--status):not(.documents-screen__cell--actions) {
  display: block;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.documents-screen__cell--status,
.documents-screen__cell--actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.documents-screen__actions {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.documents-screen__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
}

.documents-screen__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: 24px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  color: var(--color-text-muted);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.documents-screen__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 30px;
}

.documents-screen__page {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 10px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-strong);
  font-family: var(--font-family-caption);
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.32px;
  cursor: pointer;
}

.documents-screen__page--active {
  background: var(--color-primary);
  color: var(--color-surface);
}

.documents-screen__page--arrow {
  color: var(--color-primary);
}

.documents-screen__page--ellipsis,
.documents-screen__page:disabled {
  cursor: default;
}

@media (max-width: 1199px) {
  .documents-screen__filters {
    flex-wrap: wrap;
  }

  .documents-screen__select-wrap,
  .documents-screen__search {
    width: min(100%, 480px);
  }
}

@media (max-width: 767px) {
  .documents-screen {
    gap: 20px;
  }

  .documents-screen__title {
    margin-bottom: 20px;
  }

  .documents-screen__filters {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    margin-bottom: 24px;
  }

  .documents-screen__message {
    margin: -8px 0 4px;
  }

  .documents-screen__select-wrap,
  .documents-screen__search {
    width: 100%;
  }

  .documents-screen__table {
    min-width: 0;
  }

  .documents-screen__head {
    display: none;
  }

  .documents-screen__row {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "title actions"
      "date actions"
      "file actions"
      "status actions";
    gap: 14px 16px;
    align-items: start;
    padding: 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    margin-bottom: 12px;
  }

  .documents-screen__row--last {
    border-radius: var(--radius-sm);
  }

  .documents-screen__cell {
    display: block;
    min-width: 0;
    overflow: hidden;
    flex-direction: column;
    gap: 4px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .documents-screen__cell--title {
    grid-area: title;
  }

  .documents-screen__cell--date {
    grid-area: date;
  }

  .documents-screen__cell--file {
    grid-area: file;
  }

  .documents-screen__cell--status {
    grid-area: status;
  }

  .documents-screen__cell::before {
    content: attr(data-label);
    display: block;
    margin-bottom: 4px;
    overflow: hidden;
    color: var(--color-text-strong);
    font-family: var(--font-family-base);
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.24px;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .documents-screen__cell--actions {
    grid-area: actions;
    align-items: flex-end;
    justify-content: flex-start;
    justify-self: end;
  }

  .documents-screen__cell--status {
    display: block;
  }

  .documents-screen__cell--actions::before {
    content: none;
  }

  .documents-screen__actions {
    gap: 8px;
  }

  .documents-screen__action {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--color-secondary);
  }

  .documents-screen__pagination {
    flex-wrap: wrap;
    margin-top: 0;
  }
}
</style>
