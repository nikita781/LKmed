import { apiClient } from "./apiClient";
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

export async function registerUsersFromExcel(file) {
  const session = readStoredSession();
  const formData = new FormData();
  formData.append("employees", file);

  const headers = session?.accessToken
    ? { Authorization: `Bearer ${session.accessToken}` }
    : {};

  const response = await fetch("/api/admin/registration", {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    throw new Error("Не удалось загрузить пользователей");
  }

  const blob = await response.blob();

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
