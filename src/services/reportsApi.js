import { API_BASE_URL, apiClient } from "./apiClient";
import { getStoredAccessToken } from "./authSession";

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

function normalizeReport(report) {
  return {
    id: report?.id?.toString() ?? "",
    title: report?.title ?? "",
    createdAt: report?.date ?? report?.created_at ?? "",
  };
}

export async function getReports({ page = 1, search = "" } = {}) {
  const response = await apiClient("/manager/reports", {
    query: { page, search },
  });

  return {
    data: listFromResponse(response).map(normalizeReport),
    meta: metaFromResponse(response),
  };
}

export async function createReport(payload) {
  const body = {
    title: payload.title,
    type: payload.type,
  };

  if (payload.type === "employee") {
    body.user_id = Number(payload.userId);
    body.year = payload.year?.toString() ?? "";
  } else {
    body.document_id = payload.documentId;
    body.status_id = payload.statusId;
    body.department = payload.department ?? "all";
  }

  const response = await apiClient("/manager/reports", {
    method: "POST",
    body,
  });

  return normalizeReport(response?.data ?? response);
}

function parseFileNameFromHeader(header) {
  if (!header) {
    return "";
  }

  const utfMatch = /filename\*\s*=\s*([^;]+)/i.exec(header);

  if (utfMatch) {
    const value = utfMatch[1].trim();
    const encodingSeparator = value.indexOf("''");

    if (encodingSeparator !== -1) {
      try {
        return decodeURIComponent(value.slice(encodingSeparator + 2));
      } catch {
        return value.slice(encodingSeparator + 2);
      }
    }
  }

  const asciiMatch = /filename\s*=\s*"?([^";]+)"?/i.exec(header);

  return asciiMatch ? asciiMatch[1] : "";
}

export async function downloadReportFile(reportId, fallbackName = "report.xlsx") {
  const accessToken = getStoredAccessToken();
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const response = await fetch(`${API_BASE_URL}/manager/reports/${reportId}`, {
    headers,
  });

  if (!response.ok) {
    const error = new Error("Не удалось скачать отчёт");
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const fileName = parseFileNameFromHeader(response.headers.get("content-disposition")) || fallbackName;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
