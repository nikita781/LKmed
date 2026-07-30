<script setup>
import { computed, onMounted, ref, watch } from "vue";
import AssignRoleModal from "../components/admin/AssignRoleModal.vue";
import ImportUsersModal from "../components/admin/ImportUsersModal.vue";
import ResetPasswordModal from "../components/admin/ResetPasswordModal.vue";
import UiKitButton from "../components/ui/UiKitButton.vue";
import UiKitConfirmDialog from "../components/ui/UiKitConfirmDialog.vue";
import UiKitIcon from "../components/ui/UiKitIcon.vue";
import UiKitSearchInput from "../components/ui/UiKitSearchInput.vue";
import UiKitSortIndicator from "../components/ui/UiKitSortIndicator.vue";
import { useTableSort } from "../composables/useTableSort";
import AppLayout from "../layouts/AppLayout.vue";
import {
  assignUserRole,
  deleteAdminUser,
  getAdminRoles,
  getAdminUsers,
  registerUsersFromExcel,
  resetUserPassword,
} from "../services/adminApi";
import { getUserApiErrorMessage } from "../services/apiClient";

const pageSize = 15;
const allUsers = ref([]);
const roles = ref([]);
const searchQuery = ref("");
const selectedRole = ref("");
const currentPage = ref(1);
const isLoading = ref(false);
const loadError = ref("");

const isAssignRoleOpen = ref(false);
const isResetPasswordOpen = ref(false);
const isImportOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const selectedUser = ref(null);
const userToDelete = ref(null);

const isAssigningRole = ref(false);
const isResettingPassword = ref(false);
const isImporting = ref(false);
const isDeletingUser = ref(false);

const assignRoleError = ref("");
const resetPasswordError = ref("");
const importError = ref("");
const deleteError = ref("");

const { sortKey, sortDirection, toggleSort, applySort } = useTableSort();

const selectedRoleTitle = computed(
  () => roles.value.find((roleItem) => roleItem.id === selectedRole.value)?.title ?? "",
);

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return allUsers.value.filter((user) => {
    if (selectedRoleTitle.value && user.roleTitle !== selectedRoleTitle.value) {
      return false;
    }

    if (!query) {
      return true;
    }

    return (
      user.fullName.toLowerCase().includes(query) ||
      user.employeeNumber.toLowerCase().includes(query)
    );
  });
});

const sortedUsers = computed(() =>
  applySort(filteredUsers.value, {
    fullName: (user) => user.fullName,
    employeeNumber: (user) => user.employeeNumber,
  }),
);

const totalPages = computed(() => Math.max(1, Math.ceil(sortedUsers.value.length / pageSize)));

const visibleUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;

  return sortedUsers.value.slice(start, start + pageSize);
});

const emptyMessage = computed(() => {
  if (isLoading.value) {
    return "Загрузка пользователей...";
  }

  return loadError.value || "По вашему запросу пользователи не найдены";
});

const paginationItems = computed(() => buildPaginationItems(currentPage.value, totalPages.value));

const roleOptions = computed(() => [
  { value: "", label: "Все роли" },
  ...roles.value.map((roleItem) => ({ value: roleItem.id, label: roleItem.title })),
]);

watch([searchQuery, selectedRole], () => {
  currentPage.value = 1;
});

watch(totalPages, (nextTotalPages) => {
  if (currentPage.value > nextTotalPages) {
    currentPage.value = nextTotalPages;
  }
});

onMounted(async () => {
  await loadRoles();
  await loadUsers();
});

async function loadRoles() {
  try {
    roles.value = await getAdminRoles();
  } catch {
    roles.value = [];
  }
}

let lastRequestId = 0;

async function loadUsers() {
  const requestId = ++lastRequestId;

  isLoading.value = true;
  loadError.value = "";

  try {
    const first = await getAdminUsers({ page: 1 });

    if (requestId !== lastRequestId) {
      return;
    }

    const collected = [...first.data];
    const lastPage = Number(first.meta?.last_page) || 1;

    if (lastPage > 1) {
      const remaining = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, index) =>
          getAdminUsers({ page: index + 2 }),
        ),
      );

      if (requestId !== lastRequestId) {
        return;
      }

      remaining.forEach((pageResult) => collected.push(...pageResult.data));
    }

    allUsers.value = collected;
  } catch (error) {
    if (requestId !== lastRequestId) {
      return;
    }

    allUsers.value = [];
    loadError.value = getUserApiErrorMessage(error, "Не удалось загрузить пользователей");
  } finally {
    if (requestId === lastRequestId) {
      isLoading.value = false;
    }
  }
}

function buildPaginationItems(page, lastPage) {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => ({
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
        { key: `page-${lastPage}`, type: "page", value: lastPage },
      ]);
  }

  if (page >= lastPage - 3) {
    return [
      { key: "page-1", type: "page", value: 1 },
      { key: "ellipsis-left", type: "ellipsis" },
      ...Array.from({ length: 5 }, (_, index) => lastPage - 4 + index).map((value) => ({
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
    { key: `page-${lastPage}`, type: "page", value: lastPage },
  ];
}

function setPage(page) {
  if (!Number.isFinite(page) || page < 1 || page > totalPages.value) {
    return;
  }

  currentPage.value = page;
}

function openAssignRole(user) {
  assignRoleError.value = "";
  selectedUser.value = user;
  isAssignRoleOpen.value = true;
}

function openResetPassword(user) {
  resetPasswordError.value = "";
  selectedUser.value = user;
  isResetPasswordOpen.value = true;
}

function askDelete(user) {
  deleteError.value = "";
  userToDelete.value = user;
  isDeleteDialogOpen.value = true;
}

function openImport() {
  importError.value = "";
  isImportOpen.value = true;
}

async function handleAssignRoleSubmit(payload) {
  assignRoleError.value = "";
  isAssigningRole.value = true;

  try {
    await assignUserRole(payload.userId, payload.roleId);
    isAssignRoleOpen.value = false;
    await loadUsers();
  } catch (error) {
    assignRoleError.value = getUserApiErrorMessage(error, "Не удалось назначить роль");
  } finally {
    isAssigningRole.value = false;
  }
}

async function handleResetPasswordSubmit(payload) {
  resetPasswordError.value = "";
  isResettingPassword.value = true;

  try {
    await resetUserPassword(payload.userId, payload.password);
    isResetPasswordOpen.value = false;
  } catch (error) {
    resetPasswordError.value = getUserApiErrorMessage(error, "Не удалось сбросить пароль");
  } finally {
    isResettingPassword.value = false;
  }
}

async function handleImportSubmit(file) {
  importError.value = "";
  isImporting.value = true;

  try {
    await registerUsersFromExcel(file);
    isImportOpen.value = false;
    await loadUsers();
  } catch (error) {
    importError.value = getUserApiErrorMessage(error, "Не удалось загрузить пользователей");
  } finally {
    isImporting.value = false;
  }
}

async function handleConfirmDelete() {
  if (!userToDelete.value) {
    return;
  }

  isDeletingUser.value = true;
  deleteError.value = "";

  try {
    await deleteAdminUser(userToDelete.value.id);
    isDeleteDialogOpen.value = false;
    userToDelete.value = null;
    await loadUsers();
  } catch (error) {
    deleteError.value = getUserApiErrorMessage(error, "Не удалось удалить пользователя");
  } finally {
    isDeletingUser.value = false;
  }
}
</script>

<template>
  <AppLayout>
    <section class="users-screen">
      <h1 class="users-screen__title">Пользователи</h1>

      <div class="users-screen__filters">
        <div class="users-screen__select-wrap">
          <select v-model="selectedRole" class="users-screen__select">
            <option v-for="option in roleOptions" :key="option.value || 'all'" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <UiKitIcon class="users-screen__select-icon" name="chevron-down" :size="20" />
        </div>

        <div class="users-screen__search">
          <UiKitSearchInput
            v-model="searchQuery"
            :loading="isLoading"
            placeholder="Поиск по ФИО или табельному"
          />
        </div>

        <UiKitButton class="users-screen__import" icon="upload" @click="openImport">
          Импорт XLSX
        </UiKitButton>
      </div>

      <p v-if="deleteError" class="users-screen__error">{{ deleteError }}</p>

      <div class="users-screen__table-wrap">
        <div class="users-screen__table">
          <div class="users-screen__head">
            <button
              class="users-screen__head-cell users-screen__head-cell--sortable"
              type="button"
              @click="toggleSort('fullName')"
            >
              <span>ФИО</span>
              <UiKitSortIndicator :direction="sortKey === 'fullName' ? sortDirection : null" />
            </button>

            <button
              class="users-screen__head-cell users-screen__head-cell--sortable"
              type="button"
              @click="toggleSort('employeeNumber')"
            >
              <span>Табельный</span>
              <UiKitSortIndicator
                :direction="sortKey === 'employeeNumber' ? sortDirection : null"
              />
            </button>

            <div class="users-screen__head-cell">Должность</div>
            <div class="users-screen__head-cell">Роль</div>
            <div class="users-screen__head-cell users-screen__head-cell--actions">Действие</div>
          </div>

          <div
            v-for="(user, index) in visibleUsers"
            :key="user.id"
            class="users-screen__row"
            :class="{ 'users-screen__row--last': index === visibleUsers.length - 1 }"
          >
            <div class="users-screen__cell" data-label="ФИО" :title="user.fullName">
              {{ user.fullName }}
            </div>
            <div
              class="users-screen__cell"
              data-label="Табельный"
              :title="user.employeeNumber"
            >
              {{ user.employeeNumber }}
            </div>
            <div class="users-screen__cell" data-label="Должность" :title="user.post">
              {{ user.post || "—" }}
            </div>
            <div class="users-screen__cell" data-label="Роль" :title="user.roleTitle">
              {{ user.roleTitle || "—" }}
            </div>
            <div class="users-screen__cell users-screen__cell--actions" data-label="Действие">
              <button
                class="users-screen__action"
                type="button"
                aria-label="Сменить роль"
                title="Сменить роль"
                @click="openAssignRole(user)"
              >
                <UiKitIcon name="edit" :size="24" />
              </button>
              <button
                class="users-screen__action"
                type="button"
                aria-label="Сбросить пароль"
                title="Сбросить пароль"
                @click="openResetPassword(user)"
              >
                <UiKitIcon name="key" :size="24" />
              </button>
              <button
                class="users-screen__action"
                type="button"
                aria-label="Удалить пользователя"
                title="Удалить"
                @click="askDelete(user)"
              >
                <UiKitIcon name="trash" :size="24" />
              </button>
            </div>
          </div>

          <div v-if="!visibleUsers.length" class="users-screen__empty">
            {{ emptyMessage }}
          </div>
        </div>
      </div>

      <nav class="users-screen__pagination" aria-label="Пагинация">
        <button
          class="users-screen__page users-screen__page--arrow"
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
          class="users-screen__page"
          :class="{
            'users-screen__page--active': item.value === currentPage,
            'users-screen__page--ellipsis': item.type === 'ellipsis',
          }"
          type="button"
          :disabled="item.type === 'ellipsis'"
          @click="setPage(item.value)"
        >
          {{ item.type === "ellipsis" ? "..." : item.value }}
        </button>

        <button
          class="users-screen__page users-screen__page--arrow"
          type="button"
          aria-label="Следующая страница"
          :disabled="currentPage === totalPages"
          @click="setPage(currentPage + 1)"
        >
          <UiKitIcon name="chevron-right" :size="24" />
        </button>
      </nav>

      <AssignRoleModal
        v-model="isAssignRoleOpen"
        :user="selectedUser"
        :roles="roles"
        :is-submitting="isAssigningRole"
        :submit-error="assignRoleError"
        @submit="handleAssignRoleSubmit"
      />

      <ResetPasswordModal
        v-model="isResetPasswordOpen"
        :user="selectedUser"
        :is-submitting="isResettingPassword"
        :submit-error="resetPasswordError"
        @submit="handleResetPasswordSubmit"
      />

      <ImportUsersModal
        v-model="isImportOpen"
        :is-submitting="isImporting"
        :submit-error="importError"
        @submit="handleImportSubmit"
      />

      <UiKitConfirmDialog
        v-model="isDeleteDialogOpen"
        title="Удалить пользователя?"
        :message="`«${userToDelete?.fullName ?? ''}» больше не сможет войти в систему.`"
        confirm-label="Удалить"
        variant="danger"
        :is-submitting="isDeletingUser"
        @confirm="handleConfirmDelete"
      />
    </section>
  </AppLayout>
</template>

<style scoped>
.users-screen {
  display: flex;
  flex-direction: column;
}

.users-screen__title {
  margin: 0 0 42px;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.users-screen__filters {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.users-screen__select-wrap {
  position: relative;
  flex: 0 0 220px;
}

.users-screen__search {
  position: relative;
  flex: 1 1 auto;
}

.users-screen__select,
.users-screen__search-input {
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

.users-screen__select {
  padding-right: 43px;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.users-screen__select:hover,
.users-screen__select:focus {
  border-color: var(--color-primary);
}

.users-screen__search-input {
  padding-right: 47px;
}

.users-screen__search-input::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}

.users-screen__select-icon,
.users-screen__search-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.users-screen__select-icon {
  right: 15px;
  color: var(--color-text-strong);
}

.users-screen__search-icon {
  right: 15px;
  color: var(--color-primary);
}

.users-screen__import {
  flex: 0 0 220px;
}

.users-screen__error {
  margin: 0 0 16px;
  color: #bc5555;
  font-family: var(--font-family-base);
  font-size: 14px;
  line-height: 1.3;
}

.users-screen__table-wrap {
  overflow-x: auto;
}

.users-screen__table {
  width: 100%;
  min-width: 0;
  border-radius: var(--radius-sm);
}

.users-screen__head,
.users-screen__row {
  display: grid;
  grid-template-columns:
    minmax(220px, 1.5fr)
    minmax(120px, 0.7fr)
    minmax(140px, 0.9fr)
    minmax(140px, 0.9fr)
    132px;
  gap: 16px;
  align-items: center;
  padding: 16px;
}

.users-screen__head {
  background: var(--color-secondary);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.users-screen__head-cell {
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

.users-screen__head-cell--sortable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

button.users-screen__head-cell--sortable {
  padding: 0;
  border: 0;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

button.users-screen__head-cell--sortable:hover {
  color: var(--color-primary);
}

.users-screen__head-cell--actions {
  text-align: center;
}

.users-screen__row {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.users-screen__row--last {
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}

.users-screen__cell {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-strong);
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.28px;
}

.users-screen__cell:not(.users-screen__cell--actions) {
  display: block;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.users-screen__cell--actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.users-screen__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  transition: background-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
}

.users-screen__action:hover {
  color: var(--color-primary-200);
  background: var(--color-secondary);
  box-shadow: 0 0 0 4px var(--color-secondary);
}

.users-screen__empty {
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

.users-screen__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 45px;
}

.users-screen__page {
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

.users-screen__page:not(.users-screen__page--active):not(:disabled):hover {
  background: var(--color-secondary);
  color: var(--color-primary-200);
}

.users-screen__page--active {
  background: var(--color-primary);
  color: var(--color-surface);
}

.users-screen__page--arrow {
  color: var(--color-primary);
}

.users-screen__page--ellipsis,
.users-screen__page:disabled {
  cursor: default;
}

@media (max-width: 1100px) {
  .users-screen__filters {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr) 220px;
    align-items: center;
  }
}

@media (max-width: 767px) {
  .users-screen {
    gap: 20px;
  }

  .users-screen__title {
    margin-bottom: 0;
  }

  .users-screen__filters {
    grid-template-columns: 1fr;
    margin-bottom: 0;
  }

  .users-screen__select-wrap,
  .users-screen__search,
  .users-screen__import {
    width: 100%;
    flex-basis: auto;
  }

  .users-screen__table {
    min-width: 0;
  }

  .users-screen__table-wrap {
    overflow-x: visible;
  }

  .users-screen__head {
    display: none;
  }

  .users-screen__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    padding: 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    margin-bottom: 12px;
  }

  .users-screen__row--last {
    border-radius: var(--radius-sm);
  }

  .users-screen__cell {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .users-screen__cell::before {
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

  .users-screen__cell--actions {
    align-items: flex-start;
    justify-content: flex-start;
  }

  .users-screen__cell--actions::before {
    content: none;
  }

  .users-screen__pagination {
    flex-wrap: wrap;
    margin-top: 0;
  }
}
</style>
