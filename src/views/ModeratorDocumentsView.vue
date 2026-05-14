<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ModeratorDocumentCreateModal from "../components/documents/ModeratorDocumentCreateModal.vue";
import UiKitButton from "../components/ui/UiKitButton.vue";
import UiKitIcon from "../components/ui/UiKitIcon.vue";
import UiKitTag from "../components/ui/UiKitTag.vue";
import { getStatusMeta } from "../data/moderatorDocuments";
import AppLayout from "../layouts/AppLayout.vue";
import {
  createModeratorDocument,
  deleteModeratorDocument,
  getDocumentCategories,
  getDocumentFiles,
  getDocumentStatuses,
  getModeratorDocument,
  getModeratorDocuments,
  getUsers,
  getUsersPosts,
  updateModeratorDocument,
} from "../services/moderatorDocumentsApi";
import { getUserApiErrorMessage } from "../services/apiClient";

const pageSize = 10;
const route = useRoute();
const router = useRouter();
const selectedStatus = ref("all");
const selectedResponsible = ref(route.query.employee?.toString() ?? "all");
const searchQuery = ref("");
const currentPage = ref(1);
const lastEditedDocumentId = ref(null);
const isCreateModalOpen = ref(false);
const editingDocument = ref(null);
const documents = ref([]);
const paginationMeta = ref({
  current_page: 1,
  last_page: 1,
  per_page: pageSize,
  total: 0,
});
const isLoading = ref(false);
const loadError = ref("");
const createError = ref("");
const isCreatingDocument = ref(false);
const categoryOptions = ref([]);
const groupOptions = ref([]);
const baseDocumentOptions = ref([]);
const responsibleUsers = ref([]);

const fallbackStatusOptions = [
  { value: "all", label: "Все статусы" },
  { value: "new", label: "Новый" },
  { value: "success", label: "Принят" },
  { value: "error", label: "Просрочен" },
];
const apiStatusOptions = ref([]);

const statusOptions = computed(() => [
  fallbackStatusOptions[0],
  ...(apiStatusOptions.value.length ? apiStatusOptions.value : fallbackStatusOptions.slice(1)),
]);

const responsibleOptions = computed(() => [
  { value: "all", label: "Не выбран" },
  ...responsibleUsers.value.map((employee) => ({
    value: employee.id,
    label: employee.fullName,
  })),
]);

const isEmployeeMode = computed(() => selectedResponsible.value !== "all");

const filteredDocuments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return documents.value.filter((documentItem) => {
    const matchesStatus =
      selectedStatus.value === "all" || documentItem.status === selectedStatus.value;
    const matchesSearch =
      !query ||
      [documentItem.title, documentItem.createdAt, documentItem.fileName].some((value) =>
        value.toLowerCase().includes(query),
      );

    return matchesStatus && matchesSearch;
  });
});

const totalPages = computed(() => Math.max(1, Number(paginationMeta.value.last_page) || 1));
const visibleDocuments = computed(() => filteredDocuments.value);
const documentModalMode = computed(() => (editingDocument.value ? "edit" : "create"));
const emptyMessage = computed(() => {
  if (isLoading.value) {
    return "Загрузка документов...";
  }

  return loadError.value || "По вашему запросу документы не найдены";
});

function getApiErrorMessage(error, fallbackMessage) {
  return getUserApiErrorMessage(error, fallbackMessage);
}

function normalizeOptionText(value) {
  return value?.toString().normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase() ?? "";
}

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

watch(
  () => route.query.employee,
  (employeeId) => {
    selectedResponsible.value = employeeId?.toString() ?? "all";
  },
);

watch(selectedResponsible, (employeeId) => {
  const nextQuery = employeeId === "all" ? {} : { employee: employeeId };

  router.replace({
    name: "moderatorDocuments",
    query: nextQuery,
  });
});

watch([selectedStatus, selectedResponsible, searchQuery], () => {
  currentPage.value = 1;
});

watch([currentPage, selectedResponsible, searchQuery], () => {
  loadDocuments();
});

watch(isCreateModalOpen, (isOpen) => {
  if (!isOpen) {
    editingDocument.value = null;
    createError.value = "";
  }
});

watch(totalPages, (nextTotalPages) => {
  if (currentPage.value > nextTotalPages) {
    currentPage.value = nextTotalPages;
  }
});

onMounted(() => {
  loadDictionaries();
  loadDocuments();
});

async function loadDictionaries() {
  const [statuses, categories, groups, baseDocuments, users] = await Promise.allSettled([
    getDocumentStatuses(),
    getDocumentCategories(),
    getUsersPosts(),
    getDocumentFiles(),
    getUsers(),
  ]);

  if (statuses.status === "fulfilled") {
    apiStatusOptions.value = statuses.value;
  }

  if (categories.status === "fulfilled") {
    categoryOptions.value = categories.value;
  }

  if (groups.status === "fulfilled") {
    groupOptions.value = groups.value;
  }

  if (baseDocuments.status === "fulfilled") {
    baseDocumentOptions.value = baseDocuments.value;
  }

  if (users.status === "fulfilled") {
    responsibleUsers.value = users.value;
  }
}

let lastRequestId = 0;

async function loadDocuments() {
  const requestId = ++lastRequestId;

  isLoading.value = true;
  loadError.value = "";

  try {
    const result = await getModeratorDocuments({
      page: currentPage.value,
      search: searchQuery.value.trim(),
      user: isEmployeeMode.value ? selectedResponsible.value : "",
    });

    if (requestId !== lastRequestId) {
      return;
    }

    documents.value = result.data;
    paginationMeta.value = result.meta;
  } catch {
    if (requestId !== lastRequestId) {
      return;
    }

    documents.value = [];
    paginationMeta.value = {
      current_page: 1,
      last_page: 1,
      per_page: pageSize,
      total: 0,
    };
    loadError.value = "Не удалось загрузить документы";
  } finally {
    if (requestId === lastRequestId) {
      isLoading.value = false;
    }
  }
}

function setPage(page) {
  if (!Number.isFinite(page) || page < 1 || page > totalPages.value) {
    return;
  }

  currentPage.value = page;
}

function openDocument(documentId) {
  router.push({
    name: "moderatorDocumentRecipients",
    params: {
      documentId,
    },
  });
}

function createDocument() {
  createError.value = "";
  editingDocument.value = null;
  isCreateModalOpen.value = true;
}

async function handleDocumentCreate(documentData) {
  createError.value = "";
  isCreatingDocument.value = true;

  try {
    await createModeratorDocument(documentData);
    selectedStatus.value = "all";
    searchQuery.value = "";
    currentPage.value = 1;
    await loadDocuments();
    isCreateModalOpen.value = false;
    editingDocument.value = null;
  } catch (error) {
    selectedStatus.value = "all";
    searchQuery.value = "";
    currentPage.value = 1;
    await loadDocuments();

    const wasCreated = documents.value.some(
      (documentItem) => documentItem.title === documentData.title,
    );

    if (wasCreated) {
      loadError.value = "";
      isCreateModalOpen.value = false;
      editingDocument.value = null;
      return;
    }

    createError.value = getApiErrorMessage(error, "Не удалось создать документ");
  } finally {
    isCreatingDocument.value = false;
  }
}

async function editDocument(documentId) {
  lastEditedDocumentId.value = documentId;
  createError.value = "";

  try {
    editingDocument.value = await getDocumentWithResolvedFile(documentId);
    isCreateModalOpen.value = true;
  } catch {
    loadError.value = "Не удалось загрузить документ для редактирования";
  }
}

async function getDocumentWithResolvedFile(documentId) {
  const documentItem = await getModeratorDocument(documentId);

  if (documentItem.documentId || !documentItem.fileName) {
    return documentItem;
  }

  let matchedFile = null;

  try {
    matchedFile = await resolveBaseDocumentByFileName(documentItem.fileName);
  } catch {
    matchedFile = null;
  }

  if (!matchedFile) {
    return documentItem;
  }

  if (!baseDocumentOptions.value.some((document) => document.id === matchedFile.id)) {
    baseDocumentOptions.value = [matchedFile, ...baseDocumentOptions.value];
  }

  return {
    ...documentItem,
    documentId: matchedFile.id,
  };
}

async function resolveBaseDocumentByFileName(fileName) {
  const normalizedFileName = normalizeOptionText(fileName);
  const localMatch = baseDocumentOptions.value.find(
    (document) => normalizeOptionText(document.label) === normalizedFileName,
  );

  if (localMatch) {
    return localMatch;
  }

  const foundDocuments = await getDocumentFiles({ search: fileName });

  return foundDocuments.find(
    (document) => normalizeOptionText(document.label) === normalizedFileName,
  );
}

async function handleDocumentUpdate(documentData) {
  if (!editingDocument.value) {
    return;
  }

  createError.value = "";
  isCreatingDocument.value = true;

  try {
    await updateModeratorDocument(editingDocument.value.id, documentData);
    await loadDocuments();
    isCreateModalOpen.value = false;
    editingDocument.value = null;
  } catch (error) {
    createError.value = getApiErrorMessage(error, "Не удалось обновить документ");
  } finally {
    isCreatingDocument.value = false;
  }
}

async function deleteDocument(documentId) {
  try {
    await deleteModeratorDocument(documentId);
    await loadDocuments();
  } catch {
    loadError.value = "Не удалось удалить документ";
  }
}
</script>

<template>
  <AppLayout>
    <section class="moderator-documents">
      <h1 class="moderator-documents__title">Документы</h1>

      <div class="moderator-documents__filters">
        <div class="moderator-documents__select-wrap moderator-documents__select-wrap--status">
          <select v-model="selectedStatus" class="moderator-documents__select">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <UiKitIcon class="moderator-documents__select-icon" name="chevron-down" :size="20" />
        </div>

        <div class="moderator-documents__select-wrap moderator-documents__select-wrap--responsible">
          <select v-model="selectedResponsible" class="moderator-documents__select">
            <option v-for="option in responsibleOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <UiKitIcon class="moderator-documents__select-icon" name="chevron-down" :size="20" />
        </div>

        <div class="moderator-documents__search">
          <input
            v-model="searchQuery"
            class="moderator-documents__search-input"
            type="text"
            placeholder="Поиск по документам"
            autocomplete="off"
          />
          <UiKitIcon class="moderator-documents__search-icon" name="search" :size="24" />
        </div>

        <UiKitButton class="moderator-documents__create" icon="plus" @click="createDocument">
          Добавить документ
        </UiKitButton>
      </div>

      <div class="moderator-documents__table-wrap">
        <div
          class="moderator-documents__table"
          :class="{ 'moderator-documents__table--status': isEmployeeMode }"
        >
          <div class="moderator-documents__head">
            <div class="moderator-documents__head-cell moderator-documents__head-cell--sortable">
              <span>Название документа</span>
              <svg
                class="moderator-documents__sort-icon"
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

            <div class="moderator-documents__head-cell moderator-documents__head-cell--sortable">
              <span>Дата и время</span>
              <svg
                class="moderator-documents__sort-icon"
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

            <div class="moderator-documents__head-cell">Прикрепленный файл</div>
            <div class="moderator-documents__head-cell moderator-documents__head-cell--last">
              {{ isEmployeeMode ? "Статус" : "Действие" }}
            </div>
          </div>

          <div
            v-for="(documentItem, index) in visibleDocuments"
            :key="documentItem.id"
            class="moderator-documents__row"
            :class="{ 'moderator-documents__row--last': index === visibleDocuments.length - 1 }"
          >
            <div class="moderator-documents__cell" data-label="Название документа">
              <button
                class="moderator-documents__title-button"
                type="button"
                :title="documentItem.title"
                @click="openDocument(documentItem.id)"
              >
                {{ documentItem.title }}
              </button>
            </div>

            <div
              class="moderator-documents__cell"
              data-label="Дата и время"
              :title="documentItem.createdAt"
            >
              {{ documentItem.createdAt }}
            </div>

            <div
              class="moderator-documents__cell"
              data-label="Прикрепленный файл"
              :title="documentItem.fileName"
            >
              {{ documentItem.fileName }}
            </div>

            <div
              v-if="isEmployeeMode"
              class="moderator-documents__cell moderator-documents__cell--last"
              data-label="Статус"
            >
              <UiKitTag
                :variant="getStatusMeta(documentItem.status).variant"
                :label="getStatusMeta(documentItem.status).label"
              />
            </div>

            <div
              v-else
              class="moderator-documents__cell moderator-documents__cell--last"
              data-label="Действие"
            >
              <div class="moderator-documents__actions">
                <button
                  class="moderator-documents__action"
                  type="button"
                  aria-label="Редактировать документ"
                  @click="editDocument(documentItem.id)"
                >
                  <UiKitIcon name="edit" :size="24" />
                </button>

                <button
                  class="moderator-documents__action"
                  type="button"
                  aria-label="Удалить документ"
                  @click="deleteDocument(documentItem.id)"
                >
                  <UiKitIcon name="trash" :size="24" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="!visibleDocuments.length" class="moderator-documents__empty">
            {{ emptyMessage }}
          </div>
        </div>
      </div>

      <nav class="moderator-documents__pagination" aria-label="Пагинация">
        <button
          class="moderator-documents__page moderator-documents__page--arrow"
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
          class="moderator-documents__page"
          :class="{
            'moderator-documents__page--active': item.value === currentPage,
            'moderator-documents__page--ellipsis': item.type === 'ellipsis',
          }"
          type="button"
          :disabled="item.type === 'ellipsis'"
          @click="setPage(item.value)"
        >
          {{ item.type === "ellipsis" ? "..." : item.value }}
        </button>

        <button
          class="moderator-documents__page moderator-documents__page--arrow"
          type="button"
          aria-label="Следующая страница"
          :disabled="currentPage === totalPages"
          @click="setPage(currentPage + 1)"
        >
          <UiKitIcon name="chevron-right" :size="24" />
        </button>
      </nav>

      <ModeratorDocumentCreateModal
        v-model="isCreateModalOpen"
        :mode="documentModalMode"
        :document="editingDocument"
        :categories="categoryOptions"
        :groups="groupOptions"
        :base-documents="baseDocumentOptions"
        :is-submitting="isCreatingDocument"
        :submit-error="createError"
        @create="handleDocumentCreate"
        @update="handleDocumentUpdate"
      />
    </section>
  </AppLayout>
</template>

<style scoped>
.moderator-documents {
  display: flex;
  flex-direction: column;
}

.moderator-documents__title {
  margin: 0 0 42px;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.moderator-documents__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 30px;
}

.moderator-documents__select-wrap,
.moderator-documents__search {
  position: relative;
  flex: none;
}

.moderator-documents__select-wrap--status {
  width: 180px;
}

.moderator-documents__select-wrap--responsible {
  width: 253px;
}

.moderator-documents__search {
  width: 385px;
}

.moderator-documents__select,
.moderator-documents__search-input {
  display: block;
  width: 100%;
  height: 42px;
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

.moderator-documents__select {
  padding-right: 43px;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.moderator-documents__search-input {
  padding-right: 47px;
}

.moderator-documents__search-input::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.moderator-documents__select-icon,
.moderator-documents__search-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.moderator-documents__select-icon {
  right: 15px;
  color: var(--color-text-strong);
}

.moderator-documents__search-icon {
  right: 15px;
  color: var(--color-primary);
}

.moderator-documents__create {
  align-self: center;
  flex: 0 0 220px;
}

.moderator-documents__table-wrap {
  overflow-x: auto;
}

.moderator-documents__table {
  width: 100%;
  min-width: 0;
  border-radius: var(--radius-sm);
}

.moderator-documents__head,
.moderator-documents__row {
  display: grid;
  grid-template-columns:
    minmax(180px, 1.2fr)
    minmax(150px, 0.75fr)
    minmax(0, 1.35fr)
    96px;
  gap: 16px;
  align-items: center;
  padding: 16px;
}

.moderator-documents__table--status .moderator-documents__head,
.moderator-documents__table--status .moderator-documents__row {
  grid-template-columns:
    minmax(180px, 1.2fr)
    minmax(150px, 0.75fr)
    minmax(0, 1.35fr)
    96px;
}

.moderator-documents__head {
  background: var(--color-secondary);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.moderator-documents__head-cell {
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

.moderator-documents__head-cell--sortable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.moderator-documents__head-cell--last {
  text-align: center;
}

.moderator-documents__sort-icon {
  display: block;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
}

.moderator-documents__row {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.moderator-documents__row--last {
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}

.moderator-documents__cell {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.moderator-documents__cell:not(.moderator-documents__cell--last) {
  display: block;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.moderator-documents__title-button {
  display: block;
  max-width: 100%;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.moderator-documents__title-button:hover {
  color: var(--color-primary);
}

.moderator-documents__cell--last {
  display: flex;
  align-items: center;
  justify-content: center;
}

.moderator-documents__actions {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.moderator-documents__action {
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

.moderator-documents__empty {
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

.moderator-documents__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 45px;
}

.moderator-documents__page {
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

.moderator-documents__page--active {
  background: var(--color-primary);
  color: var(--color-surface);
}

.moderator-documents__page--arrow {
  color: var(--color-primary);
}

.moderator-documents__page--ellipsis,
.moderator-documents__page:disabled {
  cursor: default;
}

@media (max-width: 1340px) and (min-width: 768px) {
  .moderator-documents__filters {
    display: grid;
    grid-template-columns: 180px minmax(220px, 1fr) 220px;
    align-items: center;
  }

  .moderator-documents__search {
    grid-column: 1 / -1;
    grid-row: 2;
    width: 100%;
  }

  .moderator-documents__create {
    grid-column: 3;
    grid-row: 1;
  }
}

@media (max-width: 767px) {
  .moderator-documents {
    gap: 20px;
  }

  .moderator-documents__title {
    margin-bottom: 0;
  }

  .moderator-documents__filters {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    margin-bottom: 0;
  }

  .moderator-documents__select-wrap,
  .moderator-documents__search,
  .moderator-documents__create {
    width: 100%;
    flex-basis: auto;
  }

  .moderator-documents__table {
    min-width: 0;
  }

  .moderator-documents__table-wrap {
    overflow-x: visible;
  }

  .moderator-documents__head {
    display: none;
  }

  .moderator-documents__row,
  .moderator-documents__table--status .moderator-documents__row {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "title action"
      "date action"
      "file action";
    gap: 14px 16px;
    align-items: start;
    padding: 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    margin-bottom: 12px;
  }

  .moderator-documents__row--last {
    border-radius: var(--radius-sm);
  }

  .moderator-documents__cell {
    display: block;
    min-width: 0;
    overflow: hidden;
    flex-direction: column;
    gap: 4px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .moderator-documents__cell:nth-child(1) {
    grid-area: title;
  }

  .moderator-documents__cell:nth-child(2) {
    grid-area: date;
  }

  .moderator-documents__cell:nth-child(3) {
    grid-area: file;
  }

  .moderator-documents__cell::before {
    content: attr(data-label);
    display: block;
    margin-bottom: 4px;
    overflow: hidden;
    color: var(--color-text-muted);
    font-family: var(--font-family-base);
    font-size: 11px;
    font-weight: 600;
    line-height: 14px;
    letter-spacing: 0.22px;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .moderator-documents__title-button {
    display: block;
    max-width: 100%;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .moderator-documents__cell--last {
    grid-area: action;
    align-items: flex-end;
    justify-content: flex-start;
    justify-self: end;
  }

  .moderator-documents__cell--last::before {
    content: none;
  }

  .moderator-documents__actions {
    gap: 8px;
  }

  .moderator-documents__action {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--color-secondary);
  }

  .moderator-documents__pagination {
    flex-wrap: wrap;
    margin-top: 0;
  }
}
</style>
