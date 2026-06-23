import { apiClient } from "./apiClient";

const STATUS_LABEL_TO_KEY = {
  новый: "new",
  принят: "success",
  просрочен: "error",
};
const MEDICAL_POST_ORDER = ["Хирург", "Терапевт", "Кардиолог", "Медсестра"];
const EXCLUDED_TARGET_POSTS = new Set(["Администратор", "Менеджер", "Модератор"]);

function listFromResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function metaFromResponse(response) {
  return response?.meta ?? {
    current_page: response?.current_page ?? 1,
    last_page: response?.last_page ?? 1,
    per_page: response?.per_page ?? 15,
    total: response?.total ?? listFromResponse(response).length,
  };
}

export function normalizeStatus(status) {
  if (!status) {
    return "new";
  }

  const rawTitle = typeof status === "string" ? status : status.title ?? status.name ?? "";
  const normalizedTitle = rawTitle.trim().toLowerCase();

  return STATUS_LABEL_TO_KEY[normalizedTitle] ?? normalizedTitle ?? "new";
}

function formatApiDate(value) {
  if (!value) {
    return "дд.мм.гггг 00:00";
  }

  const ruDateMatch = value.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/);

  if (ruDateMatch) {
    const [, day, month, year, hour = "00", minute = "00"] = ruDateMatch;

    return `${day}.${month}.${year} ${hour}:${minute}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const formattedDate = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const formattedTime = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${formattedDate} ${formattedTime}`;
}

export function normalizeDocument(documentItem) {
  const firstUser = Array.isArray(documentItem.users) ? documentItem.users[0] : null;

  return {
    id: documentItem.id?.toString() ?? "",
    documentId: documentItem.document_id?.toString() ?? documentItem.documentId ?? "",
    title: documentItem.title ?? "Документ",
    createdAt: formatApiDate(documentItem.created_at),
    fileName: documentItem.document_file_name ?? documentItem.file_name ?? "Название файла",
    filePath: documentItem.document_file_path ?? documentItem.file_path ?? "",
    status: normalizeStatus(
      documentItem.status ?? documentItem.document_status ?? firstUser?.document_status,
    ),
    employeeId:
      firstUser?.id?.toString() ??
      documentItem.user_id?.toString() ??
      documentItem.employeeId ??
      "",
    employeeName: firstUser?.name ?? "",
    category: documentItem.category?.title ?? documentItem.category ?? "",
    groups: documentItem.target_groups ?? documentItem.groups ?? [],
    readUntil: documentItem.expired_at ?? "",
  };
}

function normalizeUser(user) {
  return {
    id: user.id?.toString() ?? "",
    fullName: user.name ?? user.full_name ?? "Фамилия Имя Отчество",
    post: user.post ?? "",
  };
}

export function normalizeRecipient(user, documentItem) {
  const normalizedUser = normalizeUser(user);

  return {
    id: `${normalizedUser.id}-${documentItem.id}`,
    employeeId: normalizedUser.id,
    employeeName: normalizedUser.fullName,
    createdAt: user.viewing_start ? formatApiDate(user.viewing_start) : documentItem.createdAt,
    fileName: documentItem.fileName,
    status: normalizeStatus(user.document_status),
  };
}

export async function getModeratorDocuments({ page = 1, search = "", user = "" } = {}) {
  const response = await apiClient("/manager/documents", {
    query: {
      page,
      search,
      user,
    },
  });

  return {
    data: listFromResponse(response).map(normalizeDocument),
    meta: metaFromResponse(response),
  };
}

export async function getModeratorDocument(documentId) {
  const response = await apiClient(`/manager/documents/${documentId}`);

  return normalizeDocument(response.data ?? response);
}

export async function getModeratorDocumentUsers(documentId, { page = 1, search = "" } = {}) {
  const response = await apiClient(`/manager/documents/${documentId}/users`, {
    query: {
      page,
      search,
    },
  });
  const documentItem = await getModeratorDocument(documentId);

  return {
    data: listFromResponse(response).map((user) => normalizeRecipient(user, documentItem)),
    meta: metaFromResponse(response),
    documentItem,
  };
}

export async function createModeratorDocument(documentData) {
  const formData = new FormData();

  appendDocumentFormData(formData, documentData);

  const response = await apiClient("/manager/documents", {
    method: "POST",
    body: formData,
  });

  return normalizeDocument(response.data ?? response);
}

export async function updateModeratorDocument(documentId, documentData) {
  const formData = new FormData();

  appendDocumentFormData(formData, documentData);

  const response = await apiClient(`/manager/documents/${documentId}`, {
    method: "PUT",
    body: formData,
  });

  return normalizeDocument(response.data ?? response);
}

function appendDocumentFormData(formData, documentData) {
  formData.append("title", documentData.title);
  formData.append("expired_at", documentData.readUntil);

  if (documentData.categoryId) {
    formData.append("category_id", documentData.categoryId);
  }

  (documentData.targetGroups ?? []).forEach((group) => {
    formData.append("target_groups[]", group);
  });

  if (documentData.mode === "base") {
    formData.append("document_id", documentData.baseDocumentId);
  } else {
    formData.append("document_file", documentData.file);
  }
}

export async function deleteModeratorDocument(documentId) {
  await apiClient(`/manager/documents/${documentId}`, {
    method: "DELETE",
  });
}

export async function getDocumentStatuses() {
  const response = await apiClient("/lists/documents-statuses");

  return listFromResponse(response).map((status) => ({
    id: status.id?.toString() ?? "",
    value: normalizeStatus(status),
    label: status.title ?? status.name ?? status.value ?? "Статус",
  }));
}

export async function getDocumentCategories() {
  const response = await apiClient("/lists/documents-categories");

  return listFromResponse(response).map((category) => ({
    id: category.id?.toString() ?? category.value?.toString() ?? "",
    label: category.title ?? category.name ?? category.label ?? "Категория",
  }));
}

export async function getDocumentFiles({ search = "" } = {}) {
  const response = await apiClient("/lists/documents-files", {
    query: {
      search,
    },
  });

  return listFromResponse(response).map((documentItem) => ({
    id: documentItem.id?.toString() ?? "",
    label: documentItem.title ?? documentItem.name ?? "Документ",
    filePath: documentItem.file_path ?? documentItem.document_file_path ?? "",
  }));
}

export async function getUsers({ search = "" } = {}) {
  const response = await apiClient("/lists/users", {
    query: {
      search,
    },
  });

  return listFromResponse(response).map(normalizeUser);
}

export async function getUsersPosts() {
  const response = await apiClient("/lists/users-posts");

  return listFromResponse(response)
    .map((post) => post?.toString() ?? "")
    .filter((post) => post && !EXCLUDED_TARGET_POSTS.has(post))
    .sort((firstPost, secondPost) => {
      const firstIndex = MEDICAL_POST_ORDER.indexOf(firstPost);
      const secondIndex = MEDICAL_POST_ORDER.indexOf(secondPost);
      const normalizedFirstIndex = firstIndex === -1 ? Number.POSITIVE_INFINITY : firstIndex;
      const normalizedSecondIndex = secondIndex === -1 ? Number.POSITIVE_INFINITY : secondIndex;

      return (
        normalizedFirstIndex - normalizedSecondIndex || firstPost.localeCompare(secondPost, "ru")
      );
    })
    .map((post) => ({
      id: post,
      label: post,
    }));
}
