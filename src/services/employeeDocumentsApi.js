import { apiClient } from "./apiClient";

const STATUS_LABEL_TO_KEY = {
  новый: "new",
  принят: "success",
  просрочен: "error",
};

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

function normalizeStatus(status) {
  if (!status) {
    return "new";
  }

  const rawTitle = typeof status === "string" ? status : status.title ?? status.name ?? "";
  const normalizedTitle = rawTitle.trim().toLowerCase();

  return STATUS_LABEL_TO_KEY[normalizedTitle] ?? normalizedTitle ?? "new";
}

function formatApiDate(value, fallback = "дд.мм.гггг 00:00") {
  if (!value) {
    return fallback;
  }

  const ruDateMatch = value.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/);

  if (ruDateMatch) {
    const [, day, month, year, hour = "00", minute = "00"] = ruDateMatch;

    return `${day}.${month}.${year} ${hour}:${minute}`;
  }

  const sqlDateMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/,
  );

  if (sqlDateMatch) {
    const [, year, month, day, hour = "00", minute = "00"] = sqlDateMatch;

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

function normalizeEmployeeUser(user) {
  return {
    id: user?.id?.toString() ?? "",
    name: user?.name ?? "Фамилия Имя Отчество",
    status: normalizeStatus(user?.document_status),
    viewingStartedAt: user?.viewing_start ? formatApiDate(user.viewing_start) : "",
  };
}

export function normalizeEmployeeDocument(documentItem) {
  const users = Array.isArray(documentItem.users)
    ? documentItem.users.map(normalizeEmployeeUser)
    : [];
  const firstUser = users[0] ?? null;
  const status = normalizeStatus(documentItem.status ?? firstUser?.status);

  return {
    id: documentItem.id?.toString() ?? "",
    documentId: documentItem.document_id?.toString() ?? documentItem.documentId ?? "",
    title: documentItem.title ?? "Документ",
    category: documentItem.category?.title ?? documentItem.category ?? "",
    fileName: documentItem.document_file_name ?? documentItem.file_name ?? "Название файла",
    filePath: documentItem.document_file_path ?? documentItem.file_path ?? "",
    createdAt: formatApiDate(documentItem.created_at),
    publishedAt: formatApiDate(documentItem.created_at, "дд.мм.гггг чч:мм"),
    readUntil: documentItem.expired_at
      ? formatApiDate(documentItem.expired_at, "дд.мм.гггг чч:мм")
      : "дд.мм.гггг чч:мм",
    responsible: documentItem.responsible?.name ?? "ФИО ответственного",
    users,
    viewingStartedAt: firstUser?.viewingStartedAt ?? "",
    status,
  };
}

export async function getEmployeeDocuments({ page = 1, search = "" } = {}) {
  const response = await apiClient("/documents", {
    query: {
      page,
      search,
    },
  });

  return {
    data: listFromResponse(response).map(normalizeEmployeeDocument),
    meta: metaFromResponse(response),
  };
}

export async function getEmployeeDocument(documentId) {
  const response = await apiClient(`/documents/${documentId}`);

  return normalizeEmployeeDocument(response.data ?? response);
}

export async function fixationEmployeeDocumentStartView(documentId) {
  await apiClient(`/documents/${documentId}/fixation-start-view`, {
    method: "POST",
  });
}

export async function signEmployeeDocument(documentId) {
  await apiClient(`/documents/${documentId}/signing`, {
    method: "POST",
  });
}
