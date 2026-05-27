<script setup>
import { computed, onMounted, ref } from "vue";
import UiKitButton from "../components/ui/UiKitButton.vue";
import UiKitConfirmDialog from "../components/ui/UiKitConfirmDialog.vue";
import UiKitIcon from "../components/ui/UiKitIcon.vue";
import AppLayout from "../layouts/AppLayout.vue";
import { createDocumentCategory, deleteDocumentCategory } from "../services/adminApi";
import { getUserApiErrorMessage } from "../services/apiClient";
import { getDocumentCategories } from "../services/moderatorDocumentsApi";

const categories = ref([]);
const newTitle = ref("");
const isLoading = ref(false);
const loadError = ref("");
const createError = ref("");
const deleteError = ref("");
const isCreating = ref(false);
const isDeleting = ref(false);
const categoryToDelete = ref(null);
const isDeleteDialogOpen = ref(false);

const trimmedTitle = computed(() => newTitle.value.trim());
const isCreateDisabled = computed(() => isCreating.value || !trimmedTitle.value);
const emptyMessage = computed(() => {
  if (isLoading.value) {
    return "Загрузка категорий...";
  }

  return loadError.value || "Категории документов ещё не добавлены";
});

onMounted(loadCategories);

async function loadCategories() {
  isLoading.value = true;
  loadError.value = "";

  try {
    categories.value = await getDocumentCategories();
  } catch (error) {
    categories.value = [];
    loadError.value = getUserApiErrorMessage(error, "Не удалось загрузить категории");
  } finally {
    isLoading.value = false;
  }
}

async function handleCreate() {
  if (isCreateDisabled.value) {
    return;
  }

  createError.value = "";
  isCreating.value = true;

  try {
    await createDocumentCategory(trimmedTitle.value);
    newTitle.value = "";
    await loadCategories();
  } catch (error) {
    createError.value = getUserApiErrorMessage(error, "Не удалось создать категорию");
  } finally {
    isCreating.value = false;
  }
}

function askDelete(category) {
  deleteError.value = "";
  categoryToDelete.value = category;
  isDeleteDialogOpen.value = true;
}

async function handleConfirmDelete() {
  if (!categoryToDelete.value) {
    return;
  }

  isDeleting.value = true;
  deleteError.value = "";

  try {
    await deleteDocumentCategory(categoryToDelete.value.id);
    isDeleteDialogOpen.value = false;
    categoryToDelete.value = null;
    await loadCategories();
  } catch (error) {
    deleteError.value = getUserApiErrorMessage(error, "Не удалось удалить категорию");
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <AppLayout>
    <section class="categories-screen">
      <h1 class="categories-screen__title">Категории документов</h1>

      <form class="categories-screen__create" @submit.prevent="handleCreate">
        <input
          v-model="newTitle"
          class="categories-screen__create-input"
          type="text"
          placeholder="Название новой категории"
          autocomplete="off"
        />
        <UiKitButton
          class="categories-screen__create-button"
          type="submit"
          icon="plus"
          :disabled="isCreateDisabled"
        >
          Добавить
        </UiKitButton>
      </form>

      <p v-if="createError" class="categories-screen__error">{{ createError }}</p>

      <div class="categories-screen__table-wrap">
        <div class="categories-screen__table">
          <div class="categories-screen__head">
            <div class="categories-screen__head-cell">Название категории</div>
            <div class="categories-screen__head-cell categories-screen__head-cell--actions">
              Действие
            </div>
          </div>

          <div
            v-for="(category, index) in categories"
            :key="category.id"
            class="categories-screen__row"
            :class="{ 'categories-screen__row--last': index === categories.length - 1 }"
          >
            <div class="categories-screen__cell" :title="category.label">
              {{ category.label }}
            </div>
            <div class="categories-screen__cell categories-screen__cell--actions">
              <button
                class="categories-screen__action"
                type="button"
                aria-label="Удалить категорию"
                @click="askDelete(category)"
              >
                <UiKitIcon name="trash" :size="24" />
              </button>
            </div>
          </div>

          <div v-if="!categories.length" class="categories-screen__empty">
            {{ emptyMessage }}
          </div>
        </div>
      </div>

      <p v-if="deleteError" class="categories-screen__error">{{ deleteError }}</p>

      <UiKitConfirmDialog
        v-model="isDeleteDialogOpen"
        title="Удалить категорию?"
        :message="`Категория «${categoryToDelete?.label}» будет удалена.`"
        confirm-label="Удалить"
        variant="danger"
        :is-submitting="isDeleting"
        @confirm="handleConfirmDelete"
      />
    </section>
  </AppLayout>
</template>

<style scoped>
.categories-screen {
  display: flex;
  flex-direction: column;
}

.categories-screen__title {
  margin: 0 0 42px;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.categories-screen__create {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.categories-screen__create-input {
  display: block;
  flex: 1 1 auto;
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

.categories-screen__create-input::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.categories-screen__create-button {
  flex: 0 0 220px;
}

.categories-screen__error {
  margin: 0 0 16px;
  color: #bc5555;
  font-family: var(--font-family-base);
  font-size: 14px;
  line-height: 1.3;
}

.categories-screen__table-wrap {
  overflow-x: auto;
}

.categories-screen__table {
  width: 100%;
  min-width: 0;
  border-radius: var(--radius-sm);
}

.categories-screen__head,
.categories-screen__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  gap: 16px;
  align-items: center;
  padding: 16px;
}

.categories-screen__head {
  background: var(--color-secondary);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.categories-screen__head-cell {
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

.categories-screen__head-cell--actions {
  text-align: center;
}

.categories-screen__row {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.categories-screen__row--last {
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}

.categories-screen__cell {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.categories-screen__cell--actions {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.categories-screen__action {
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

.categories-screen__empty {
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

@media (max-width: 767px) {
  .categories-screen {
    gap: 20px;
  }

  .categories-screen__title {
    margin-bottom: 0;
  }

  .categories-screen__create {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 0;
  }

  .categories-screen__create-button {
    flex-basis: auto;
    width: 100%;
  }
}
</style>
