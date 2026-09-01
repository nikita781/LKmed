import { API_BASE_URL, apiClient, createApiError } from "./apiClient";
import { readStoredSession } from "./authSession";

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
  return (
    response?.meta ?? {
      current_page: response?.current_page ?? 1,
      last_page: response?.last_page ?? 1,
      per_page: response?.per_page ?? 15,
      total: response?.total ?? listFromResponse(response).length,
    }
  );
}

function normalizeAdminUser(user) {
  const roleValue = user?.role;

  return {
    id: user?.id?.toString() ?? "",
    fullName: user?.name ?? "",
    employeeNumber: user?.employee_number ?? "",
    post: user?.post ?? "",
    roleTitle: typeof roleValue === "string" ? roleValue : roleValue?.title ?? "",
    roleId: user?.role_id ?? roleValue?.id ?? null,
  };
}

export async function getAdminUsers({ page = 1, search = "", role = "", post = "" } = {}) {
  const response = await apiClient("/admin/users", {
    query: { page, search, role, post },
  });

  return {
    data: listFromResponse(response).map(normalizeAdminUser),
    meta: metaFromResponse(response),
  };
}

export async function getAdminRoles() {
  const response = await apiClient("/admin/roles");

  return listFromResponse(response).map((roleItem) => ({
    id: roleItem.id?.toString() ?? "",
    title: roleItem.title ?? "",
  }));
}

export async function assignUserRole(userId, roleId) {
  await apiClient(`/admin/users/${userId}/assigning-role`, {
    method: "POST",
    body: { role_id: Number(roleId) },
  });
}

export async function resetUserPassword(userId, password) {
  await apiClient(`/admin/users/${userId}/reset-password`, {
    method: "POST",
    body: { password },
  });
}

export async function deleteAdminUser(userId) {
  await apiClient(`/admin/users/${userId}`, { method: "DELETE" });
}

// xlsx — это zip-контейнер, он всегда начинается с сигнатуры "PK".
async function isXlsxBlob(blob) {
  try {
    const signature = new Uint8Array(await blob.slice(0, 2).arrayBuffer());

    return signature[0] === 0x50 && signature[1] === 0x4b;
  } catch {
    return false;
  }
}

export async function registerUsersFromExcel(file) {
  const session = readStoredSession();
  const formData = new FormData();
  formData.append("employees", file);

  const headers = session?.accessToken
    ? { Authorization: `Bearer ${session.accessToken}` }
    : {};
  const url = `${API_BASE_URL}/admin/registration`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    throw await createApiError(response, {
      method: "POST",
      url,
      fallbackMessage: "Не удалось загрузить пользователей",
    });
  }

  const blob = await response.blob();

  // Если запрос ушёл мимо API, сервер отдаёт index.html с кодом 200 —
  // без этой проверки он молча скачивался бы как «сломанный» passwords.xlsx.
  if (!(await isXlsxBlob(blob))) {
    const error = new Error(
      "Сервер вернул не Excel-файл. Проверьте адрес API: запрос ушёл не на бэкенд.",
    );

    error.status = response.status;
    error.userMessage = error.message;
    console.warn(
      `[API] POST ${url} → 200, но ответ не xlsx (content-type: ${
        response.headers.get("content-type") ?? "неизвестен"
      })`,
    );

    throw error;
  }

  triggerBlobDownload(blob, "passwords.xlsx");
}

function triggerBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function createDocumentCategory(title) {
  const response = await apiClient("/admin/documents-categories", {
    method: "POST",
    body: { title },
  });

  return {
    id: response?.id?.toString() ?? "",
    title: response?.title ?? title,
  };
}

export async function deleteDocumentCategory(categoryId) {
  await apiClient(`/admin/documents-categories/${categoryId}`, { method: "DELETE" });
}
