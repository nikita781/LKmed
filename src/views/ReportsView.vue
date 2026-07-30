<script setup>
import { computed, onMounted, ref, watch } from "vue";
import ReportCreateModal from "../components/reports/ReportCreateModal.vue";
import UiKitButton from "../components/ui/UiKitButton.vue";
import UiKitIcon from "../components/ui/UiKitIcon.vue";
import UiKitSearchInput from "../components/ui/UiKitSearchInput.vue";
import UiKitSortIndicator from "../components/ui/UiKitSortIndicator.vue";
import { parseSortableDate, useTableSort } from "../composables/useTableSort";
import AppLayout from "../layouts/AppLayout.vue";
import { getUserApiErrorMessage } from "../services/apiClient";
import { downloadReportFile, getReports } from "../services/reportsApi";

const reports = ref([]);
const searchQuery = ref("");
const currentPage = ref(1);
const lastPage = ref(1);
const isLoading = ref(false);
const loadError = ref("");
const downloadError = ref("");
const downloadingId = ref("");
const isCreateModalOpen = ref(false);
const { sortKey, sortDirection, toggleSort, applySort } = useTableSort();

let searchDebounceId = null;
let lastRequestId = 0;

const sortedReports = computed(() =>
  applySort(reports.value, {
    title: (report) => report.title,
    createdAt: (report) => parseSortableDate(report.createdAt),
  }),
);

const totalPages = computed(() => Math.max(1, lastPage.value));
const paginationItems = computed(() => buildPaginationItems(currentPage.value, totalPages.value));
const isEmptyState = computed(() => !isLoading.value && !sortedReports.value.length);
const emptyMessage = computed(() => {
  if (loadError.value) {
    return loadError.value;
  }

  return searchQuery.value.trim()
    ? "По вашему запросу отчеты не найдены"
    : "Отчёты ещё не созданы";
});

onMounted(loadReports);

watch(currentPage, loadReports);

watch(searchQuery, () => {
  if (searchDebounceId) {
    clearTimeout(searchDebounceId);
  }

  searchDebounceId = setTimeout(() => {
    if (currentPage.value !== 1) {
      currentPage.value = 1;
    } else {
      loadReports();
    }
  }, 300);
});

async function loadReports() {
  const requestId = ++lastRequestId;
  isLoading.value = true;
  loadError.value = "";

  try {
    const { data, meta } = await getReports({
      page: currentPage.value,
      search: searchQuery.value.trim(),
    });

    if (requestId !== lastRequestId) {
      return;
    }

    reports.value = data;
    lastPage.value = Number(meta?.last_page) || 1;

    if (currentPage.value > lastPage.value) {
      currentPage.value = lastPage.value;
    }
  } catch (error) {
    if (requestId !== lastRequestId) {
      return;
    }

    reports.value = [];
    lastPage.value = 1;
    loadError.value = getUserApiErrorMessage(error, "Не удалось загрузить отчёты");
  } finally {
    if (requestId === lastRequestId) {
      isLoading.value = false;
    }
  }
}

function buildPaginationItems(page, totalPagesValue) {
  if (totalPagesValue <= 7) {
    return Array.from({ length: totalPagesValue }, (_, index) => ({
      key: `page-${index + 1}`,
      type: "page",
      value: index + 1,
    }));
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5]
      .map((value) => ({ key: `page-${value}`, type: "page", value }))
      .concat([
        { key: "ellipsis-right", type: "ellipsis" },
        { key: `page-${totalPagesValue}`, type: "page", value: totalPagesValue },
      ]);
  }

  if (page >= totalPagesValue - 3) {
    return [
      { key: "page-1", type: "page", value: 1 },
      { key: "ellipsis-left", type: "ellipsis" },
      ...Array.from({ length: 5 }, (_, index) => totalPagesValue - 4 + index).map((value) => ({
        key: `page-${value}`,
        type: "page",
        value,
      })),
    ];
  }

  return [
    { key: "page-1", type: "page", value: 1 },
    { key: "ellipsis-left", type: "ellipsis" },
    { key: `page-${page - 1}`, type: "page", value: page - 1 },
    { key: `page-${page}`, type: "page", value: page },
    { key: `page-${page + 1}`, type: "page", value: page + 1 },
    { key: "ellipsis-right", type: "ellipsis" },
    { key: `page-${totalPagesValue}`, type: "page", value: totalPagesValue },
  ];
}

function setPage(page) {
  if (!Number.isFinite(page) || page < 1 || page > totalPages.value || page === currentPage.value) {
    return;
  }

  currentPage.value = page;
}

function openCreateModal() {
  isCreateModalOpen.value = true;
}

async function handleReportCreated() {
  isCreateModalOpen.value = false;

  if (currentPage.value !== 1) {
    currentPage.value = 1;
    return;
  }

  await loadReports();
}

async function handleDownload(report) {
  if (downloadingId.value === report.id) {
    return;
  }

  downloadError.value = "";
  downloadingId.value = report.id;

  try {
    await downloadReportFile(report.id, `${report.title || "report"}.xlsx`);
  } catch (error) {
    downloadError.value = getUserApiErrorMessage(error, "Не удалось скачать отчёт");
  } finally {
    downloadingId.value = "";
  }
}
</script>

<template>
  <AppLayout>
    <section class="reports-screen">
      <h1 class="reports-screen__title">Отчеты</h1>

      <div class="reports-screen__filters">
        <div class="reports-screen__search">
          <UiKitSearchInput
            v-model="searchQuery"
            :loading="isLoading"
            placeholder="Поиск по отчетам"
          />
        </div>

        <UiKitButton class="reports-screen__create" icon="plus" @click="openCreateModal">
          Создать отчет
        </UiKitButton>
      </div>

      <p v-if="downloadError" class="reports-screen__error">{{ downloadError }}</p>

      <div class="reports-screen__table-wrap">
        <div class="reports-screen__table">
          <div class="reports-screen__head">
            <button
              class="reports-screen__head-cell reports-screen__head-cell--sortable reports-screen__head-cell--title"
              type="button"
              @click="toggleSort('title')"
            >
              <span>Название отчета</span>
              <UiKitSortIndicator :direction="sortKey === 'title' ? sortDirection : null" />
            </button>

            <button
              class="reports-screen__head-cell reports-screen__head-cell--sortable reports-screen__head-cell--date"
              type="button"
              @click="toggleSort('createdAt')"
            >
              <span>Дата и время</span>
              <UiKitSortIndicator :direction="sortKey === 'createdAt' ? sortDirection : null" />
            </button>

            <div class="reports-screen__head-cell reports-screen__head-cell--actions">
              Действие
            </div>
          </div>

          <div
            v-for="(report, index) in sortedReports"
            :key="report.id"
            class="reports-screen__row"
            :class="{ 'reports-screen__row--last': index === sortedReports.length - 1 }"
          >
            <div
              class="reports-screen__cell reports-screen__cell--title"
              data-label="Название отчета"
              :title="report.title"
            >
              {{ report.title }}
            </div>

            <div
              class="reports-screen__cell reports-screen__cell--date"
              data-label="Дата и время"
              :title="report.createdAt"
            >
              {{ report.createdAt }}
            </div>

            <div
              class="reports-screen__cell reports-screen__cell--actions"
              data-label="Действие"
            >
              <button
                class="reports-screen__action"
                type="button"
                aria-label="Скачать отчет"
                :disabled="downloadingId === report.id"
                @click="handleDownload(report)"
              >
                <UiKitIcon name="download" :size="24" />
              </button>
            </div>
          </div>

          <div v-if="isEmptyState" class="reports-screen__empty">
            {{ emptyMessage }}
          </div>

          <div v-else-if="isLoading && !sortedReports.length" class="reports-screen__empty">
            Загрузка отчётов...
          </div>
        </div>
      </div>

      <nav v-if="totalPages > 1" class="reports-screen__pagination" aria-label="Пагинация">
        <button
          class="reports-screen__page reports-screen__page--arrow"
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
          class="reports-screen__page"
          :class="{
            'reports-screen__page--active': item.value === currentPage,
            'reports-screen__page--ellipsis': item.type === 'ellipsis',
          }"
          type="button"
          :disabled="item.type === 'ellipsis'"
          @click="setPage(item.value)"
        >
          {{ item.type === "ellipsis" ? "..." : item.value }}
        </button>

        <button
          class="reports-screen__page reports-screen__page--arrow"
          type="button"
          aria-label="Следующая страница"
          :disabled="currentPage === totalPages"
          @click="setPage(currentPage + 1)"
        >
          <UiKitIcon name="chevron-right" :size="24" />
        </button>
      </nav>

      <ReportCreateModal v-model="isCreateModalOpen" @created="handleReportCreated" />
    </section>
  </AppLayout>
</template>

<style scoped>
.reports-screen {
  display: flex;
  flex-direction: column;
}

.reports-screen__title {
  margin: 0 0 42px;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.reports-screen__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 30px;
}

.reports-screen__search {
  position: relative;
  flex: 1 1 auto;
  max-width: 563px;
}

.reports-screen__search-input {
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

.reports-screen__search-input::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.reports-screen__search-icon {
  position: absolute;
  top: 50%;
  right: 15px;
  color: var(--color-primary);
  transform: translateY(-50%);
  pointer-events: none;
}

.reports-screen__create {
  flex: 0 0 220px;
}

.reports-screen__error {
  margin: 0 0 16px;
  color: #bc5555;
  font-family: var(--font-family-base);
  font-size: 14px;
  line-height: 1.3;
}

.reports-screen__table-wrap {
  overflow-x: auto;
}

.reports-screen__table {
  width: 100%;
  min-width: 0;
  border-radius: var(--radius-sm);
}

.reports-screen__head,
.reports-screen__row {
  display: grid;
  grid-template-columns: minmax(280px, 600px) minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 16px;
}

.reports-screen__head {
  background: var(--color-secondary);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.reports-screen__head-cell {
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

.reports-screen__head-cell--sortable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

button.reports-screen__head-cell--sortable {
  padding: 0;
  border: 0;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

button.reports-screen__head-cell--sortable:hover {
  color: var(--color-primary);
}

.reports-screen__head-cell--actions {
  text-align: center;
}

.reports-screen__row {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.reports-screen__row--last {
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}

.reports-screen__cell {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.reports-screen__cell:not(.reports-screen__cell--actions) {
  display: block;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reports-screen__cell--actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.reports-screen__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  transition: background-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
}

.reports-screen__action:not(:disabled):hover {
  color: var(--color-primary-200);
  background: var(--color-secondary);
  box-shadow: 0 0 0 5px var(--color-secondary);
}

.reports-screen__action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reports-screen__empty {
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

.reports-screen__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 45px;
}

.reports-screen__page {
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

.reports-screen__page:not(.reports-screen__page--active):not(:disabled):hover {
  background: var(--color-secondary);
  color: var(--color-primary-200);
}

.reports-screen__page--active {
  background: var(--color-primary);
  color: var(--color-surface);
}

.reports-screen__page--arrow {
  color: var(--color-primary);
}

.reports-screen__page--ellipsis,
.reports-screen__page:disabled {
  cursor: default;
}

@media (max-width: 767px) {
  .reports-screen {
    gap: 20px;
  }

  .reports-screen__title {
    margin-bottom: 0;
  }

  .reports-screen__filters {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    margin-bottom: 0;
  }

  .reports-screen__search,
  .reports-screen__create {
    width: 100%;
    max-width: none;
    flex-basis: auto;
  }

  .reports-screen__table {
    min-width: 0;
  }

  .reports-screen__table-wrap {
    overflow-x: visible;
  }

  .reports-screen__head {
    display: none;
  }

  .reports-screen__row {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "title action"
      "date action";
    gap: 14px 16px;
    align-items: start;
    padding: 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    margin-bottom: 12px;
  }

  .reports-screen__row--last {
    border-radius: var(--radius-sm);
  }

  .reports-screen__cell {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .reports-screen__cell--title {
    grid-area: title;
    font-weight: 600;
  }

  .reports-screen__cell--date {
    grid-area: date;
  }

  .reports-screen__cell--actions {
    grid-area: action;
    align-items: flex-start;
    justify-content: flex-end;
    justify-self: end;
  }

  .reports-screen__cell::before {
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

  .reports-screen__cell--actions::before {
    content: none;
  }

  .reports-screen__action {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--color-secondary);
  }

  .reports-screen__pagination {
    flex-wrap: wrap;
    margin-top: 0;
  }
}
</style>
