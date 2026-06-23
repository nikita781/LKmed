<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import UiKitIcon from "../components/ui/UiKitIcon.vue";
import UiKitSearchInput from "../components/ui/UiKitSearchInput.vue";
import UiKitTag from "../components/ui/UiKitTag.vue";
import { getStatusMeta } from "../data/moderatorDocuments";
import AppLayout from "../layouts/AppLayout.vue";
import {
  getDocumentStatuses,
  getModeratorDocumentUsers,
} from "../services/moderatorDocumentsApi";
import { useTableSort, parseSortableDate } from "../composables/useTableSort";
import UiKitSortIndicator from "../components/ui/UiKitSortIndicator.vue";

const pageSize = 11;
const route = useRoute();
const router = useRouter();
const { sortKey, sortDirection, toggleSort, applySort } = useTableSort();
const currentPage = ref(1);
const selectedStatus = ref("all");
const searchQuery = ref("");
const recipients = ref([]);
const documentItem = ref({
  id: "",
  title: "Документ",
  createdAt: "дд.мм.гггг 00:00",
  fileName: "Название файла",
});
const paginationMeta = ref({
  current_page: 1,
  last_page: 1,
  per_page: pageSize,
  total: 0,
});
const isLoading = ref(false);
const loadError = ref("");

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

const documentId = computed(() => route.params.documentId?.toString() ?? "");
const filteredRecipients = computed(() =>
  selectedStatus.value === "all"
    ? recipients.value
    : recipients.value.filter((recipient) => recipient.status === selectedStatus.value),
);

const totalPages = computed(() => Math.max(1, Number(paginationMeta.value.last_page) || 1));
const visibleRecipients = computed(() =>
  applySort(filteredRecipients.value, {
    employeeName: (recipient) => recipient.employeeName,
    createdAt: (recipient) => parseSortableDate(recipient.createdAt),
  }),
);
const emptyMessage = computed(() => {
  if (isLoading.value) {
    return "Загрузка сотрудников...";
  }

  return loadError.value || "По выбранному статусу сотрудники не найдены";
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

watch([documentId, selectedStatus, searchQuery], () => {
  currentPage.value = 1;
});

watch([documentId, currentPage, searchQuery], () => {
  loadRecipients();
});

watch(totalPages, (nextTotalPages) => {
  if (currentPage.value > nextTotalPages) {
    currentPage.value = nextTotalPages;
  }
});

onMounted(() => {
  loadStatuses();
  loadRecipients();
});

async function loadStatuses() {
  try {
    apiStatusOptions.value = await getDocumentStatuses();
  } catch {
    apiStatusOptions.value = [];
  }
}

let lastRequestId = 0;

async function loadRecipients() {
  if (!documentId.value) {
    return;
  }

  const requestId = ++lastRequestId;

  isLoading.value = true;
  loadError.value = "";

  try {
    const result = await getModeratorDocumentUsers(documentId.value, {
      page: currentPage.value,
      search: searchQuery.value.trim(),
    });

    if (requestId !== lastRequestId) {
      return;
    }

    recipients.value = result.data;
    documentItem.value = result.documentItem;
    paginationMeta.value = result.meta;
  } catch {
    if (requestId !== lastRequestId) {
      return;
    }

    recipients.value = [];
    paginationMeta.value = {
      current_page: 1,
      last_page: 1,
      per_page: pageSize,
      total: 0,
    };
    loadError.value = "Не удалось загрузить сотрудников";
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

function goToDocuments() {
  router.push({
    name: "moderatorDocuments",
  });
}

function openEmployeeDocuments(employeeId) {
  router.push({
    name: "moderatorDocuments",
    query: {
      employee: employeeId,
    },
  });
}
</script>

<template>
  <AppLayout>
    <section class="document-recipients">
      <h1 class="document-recipients__title">Документы</h1>

      <nav class="document-recipients__breadcrumbs" aria-label="Хлебные крошки">
        <button class="document-recipients__breadcrumb" type="button" @click="goToDocuments">
          Документы
        </button>
        <UiKitIcon class="document-recipients__breadcrumb-icon" name="chevron-right" :size="20" />
        <span
          class="document-recipients__breadcrumb document-recipients__breadcrumb--active"
          :title="documentItem.title"
        >
          {{ documentItem.title }}
        </span>
      </nav>

      <div class="document-recipients__filters">
        <div class="document-recipients__select-wrap">
          <select v-model="selectedStatus" class="document-recipients__select">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <UiKitIcon class="document-recipients__select-icon" name="chevron-down" :size="20" />
        </div>

        <div class="document-recipients__search">
          <UiKitSearchInput v-model="searchQuery" placeholder="Поиск по сотруднику" />
        </div>
      </div>

      <div class="document-recipients__table-wrap">
        <div class="document-recipients__table">
          <div class="document-recipients__head">
            <button
              class="document-recipients__head-cell document-recipients__head-cell--sortable"
              type="button"
              @click="toggleSort('employeeName')"
            >
              <span>Имя сотрудника</span>
              <UiKitSortIndicator :direction="sortKey === 'employeeName' ? sortDirection : null" />
            </button>

            <button
              class="document-recipients__head-cell document-recipients__head-cell--sortable"
              type="button"
              @click="toggleSort('createdAt')"
            >
              <span>Дата и время</span>
              <UiKitSortIndicator :direction="sortKey === 'createdAt' ? sortDirection : null" />
            </button>

            <div class="document-recipients__head-cell">Прикрепленный файл</div>
            <div class="document-recipients__head-cell document-recipients__head-cell--status">
              Статус
            </div>
          </div>

          <div
            v-for="(recipient, index) in visibleRecipients"
            :key="recipient.id"
            class="document-recipients__row"
            :class="{ 'document-recipients__row--last': index === visibleRecipients.length - 1 }"
          >
            <div class="document-recipients__cell" data-label="Имя сотрудника">
              <button
                class="document-recipients__employee-button"
                type="button"
                :title="recipient.employeeName"
                @click="openEmployeeDocuments(recipient.employeeId)"
              >
                {{ recipient.employeeName }}
              </button>
            </div>

            <div
              class="document-recipients__cell"
              data-label="Дата и время"
              :title="recipient.createdAt"
            >
              {{ recipient.createdAt }}
            </div>

            <div
              class="document-recipients__cell"
              data-label="Прикрепленный файл"
              :title="recipient.fileName"
            >
              {{ recipient.fileName }}
            </div>

            <div class="document-recipients__cell document-recipients__cell--status" data-label="Статус">
              <UiKitTag
                :variant="getStatusMeta(recipient.status).variant"
                :label="getStatusMeta(recipient.status).label"
              />
            </div>
          </div>

          <div v-if="!visibleRecipients.length" class="document-recipients__empty">
            {{ emptyMessage }}
          </div>
        </div>
      </div>

      <nav class="document-recipients__pagination" aria-label="Пагинация">
        <button
          class="document-recipients__page document-recipients__page--arrow"
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
          class="document-recipients__page"
          :class="{
            'document-recipients__page--active': item.value === currentPage,
            'document-recipients__page--ellipsis': item.type === 'ellipsis',
          }"
          type="button"
          :disabled="item.type === 'ellipsis'"
          @click="setPage(item.value)"
        >
          {{ item.type === "ellipsis" ? "..." : item.value }}
        </button>

        <button
          class="document-recipients__page document-recipients__page--arrow"
          type="button"
          aria-label="Следующая страница"
          :disabled="currentPage === totalPages"
          @click="setPage(currentPage + 1)"
        >
          <UiKitIcon name="chevron-right" :size="24" />
        </button>
      </nav>
    </section>
  </AppLayout>
</template>

<style scoped>
.document-recipients {
  display: flex;
  flex-direction: column;
}

.document-recipients__title {
  margin: 0 0 34px;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.document-recipients__breadcrumbs {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
}

.document-recipients__breadcrumb {
  display: inline-flex;
  flex: none;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #1c1c1c;
  font-family: var(--font-family-base);
  font-size: 18px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0.36px;
  cursor: pointer;
}

.document-recipients__breadcrumb--active {
  display: block;
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
}

.document-recipients__breadcrumb-icon {
  flex: none;
  color: #1c1c1c;
}

.document-recipients__filters {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.document-recipients__select-wrap,
.document-recipients__search {
  position: relative;
  flex: none;
}

.document-recipients__select-wrap {
  width: 180px;
}

.document-recipients__search {
  width: 385px;
}

.document-recipients__search-input {
  display: block;
  width: 100%;
  height: 42px;
  padding: 10px 47px 10px 15px;
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

.document-recipients__search-input::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.document-recipients__search-icon {
  position: absolute;
  top: 50%;
  right: 15px;
  color: var(--color-primary);
  transform: translateY(-50%);
  pointer-events: none;
}

.document-recipients__select {
  display: block;
  width: 100%;
  height: 42px;
  padding: 10px 43px 10px 15px;
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
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.document-recipients__select:hover,
.document-recipients__select:focus {
  border-color: var(--color-primary);
}

.document-recipients__select-icon {
  position: absolute;
  top: 50%;
  right: 15px;
  color: var(--color-text-strong);
  transform: translateY(-50%);
  pointer-events: none;
}

.document-recipients__table-wrap {
  overflow-x: auto;
}

.document-recipients__table {
  min-width: 1128px;
  border-radius: var(--radius-sm);
}

.document-recipients__head,
.document-recipients__row {
  display: grid;
  grid-template-columns:
    minmax(220px, 1.5fr)
    minmax(150px, 0.9fr)
    minmax(180px, 1.2fr)
    minmax(90px, 0.45fr);
  gap: 16px;
  align-items: center;
  padding: 16px;
}

.document-recipients__head {
  background: var(--color-secondary);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.document-recipients__head-cell {
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

.document-recipients__head-cell--sortable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

button.document-recipients__head-cell--sortable {
  padding: 0;
  border: 0;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

button.document-recipients__head-cell--sortable:hover {
  color: var(--color-primary);
}

.document-recipients__head-cell--status {
  text-align: center;
}

.document-recipients__row {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.document-recipients__row--last {
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}

.document-recipients__cell {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.document-recipients__cell:not(.document-recipients__cell--status) {
  display: block;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-recipients__employee-button {
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

.document-recipients__employee-button:hover {
  color: var(--color-primary);
}

.document-recipients__cell--status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-recipients__empty {
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

.document-recipients__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 45px;
}

.document-recipients__page {
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
  transition: background-color 0.15s ease, color 0.15s ease;
}

.document-recipients__page:not(.document-recipients__page--active):not(:disabled):hover {
  background: var(--color-secondary);
  color: var(--color-primary-200);
}

.document-recipients__page--active {
  background: var(--color-primary);
  color: var(--color-surface);
}

.document-recipients__page--arrow {
  color: var(--color-primary);
}

.document-recipients__page--ellipsis,
.document-recipients__page:disabled {
  cursor: default;
}

@media (max-width: 767px) {
  .document-recipients {
    gap: 20px;
  }

  .document-recipients__title,
  .document-recipients__breadcrumbs {
    margin-bottom: 0;
  }

  .document-recipients__breadcrumbs {
    flex-wrap: wrap;
  }

  .document-recipients__filters {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 0;
  }

  .document-recipients__select-wrap,
  .document-recipients__search {
    width: 100%;
  }

  .document-recipients__table {
    min-width: 0;
  }

  .document-recipients__head {
    display: none;
  }

  .document-recipients__row {
    grid-template-columns: 1fr;
    gap: 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    margin-bottom: 12px;
  }

  .document-recipients__row--last {
    border-radius: var(--radius-sm);
  }

  .document-recipients__cell {
    display: block;
    min-width: 0;
    overflow: hidden;
    flex-direction: column;
    gap: 4px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .document-recipients__employee-button {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .document-recipients__cell::before {
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

  .document-recipients__cell--status {
    align-items: flex-start;
    justify-content: flex-start;
  }

  .document-recipients__pagination {
    flex-wrap: wrap;
    margin-top: 0;
  }
}
</style>
