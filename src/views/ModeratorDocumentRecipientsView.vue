<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import UiKitIcon from "../components/ui/UiKitIcon.vue";
import UiKitTag from "../components/ui/UiKitTag.vue";
import {
  getDocumentById,
  getDocumentRecipients,
  getStatusMeta,
  moderatorDocumentsSeed,
} from "../data/moderatorDocuments";
import AppLayout from "../layouts/AppLayout.vue";

const pageSize = 11;
const route = useRoute();
const router = useRouter();
const currentPage = ref(1);
const selectedStatus = ref("all");

const statusOptions = [
  { value: "all", label: "Все статусы" },
  { value: "new", label: "Новый" },
  { value: "success", label: "Принят" },
  { value: "error", label: "Просрочен" },
];

const documentId = computed(() => Number(route.params.documentId));
const documentItem = computed(() => getDocumentById(documentId.value) ?? moderatorDocumentsSeed[0]);
const recipients = computed(() => getDocumentRecipients(documentItem.value.id));
const filteredRecipients = computed(() =>
  selectedStatus.value === "all"
    ? recipients.value
    : recipients.value.filter((recipient) => recipient.status === selectedStatus.value),
);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredRecipients.value.length / pageSize)),
);

const visibleRecipients = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize;

  return filteredRecipients.value.slice(startIndex, startIndex + pageSize);
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

watch([documentId, selectedStatus], () => {
  currentPage.value = 1;
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
        <span class="document-recipients__breadcrumb document-recipients__breadcrumb--active">
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
      </div>

      <div class="document-recipients__table-wrap">
        <div class="document-recipients__table">
          <div class="document-recipients__head">
            <div class="document-recipients__head-cell document-recipients__head-cell--sortable">
              <span>Имя сотрудника</span>
              <svg
                class="document-recipients__sort-icon"
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

            <div class="document-recipients__head-cell document-recipients__head-cell--sortable">
              <span>Дата и время</span>
              <svg
                class="document-recipients__sort-icon"
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
                @click="openEmployeeDocuments(recipient.employeeId)"
              >
                {{ recipient.employeeName }}
              </button>
            </div>

            <div class="document-recipients__cell" data-label="Дата и время">
              {{ recipient.createdAt }}
            </div>

            <div class="document-recipients__cell" data-label="Прикрепленный файл">
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
            По выбранному статусу сотрудники не найдены
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
  color: var(--color-primary);
  cursor: default;
}

.document-recipients__breadcrumb-icon {
  color: #1c1c1c;
}

.document-recipients__filters {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.document-recipients__select-wrap {
  position: relative;
  width: 180px;
  flex: none;
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
  grid-template-columns: 305px 209px 300px 100px;
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

.document-recipients__head-cell--status {
  text-align: center;
}

.document-recipients__sort-icon {
  display: block;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
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
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.document-recipients__employee-button {
  display: inline;
  max-width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-align: left;
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
    margin-bottom: 0;
  }

  .document-recipients__select-wrap {
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
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .document-recipients__cell::before {
    content: attr(data-label);
    color: var(--color-text-strong);
    font-family: var(--font-family-base);
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.24px;
    text-transform: uppercase;
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
