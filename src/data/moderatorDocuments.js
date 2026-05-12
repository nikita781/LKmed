const statusCycle = [
  "new",
  "new",
  "new",
  "success",
  "success",
  "success",
  "success",
  "error",
  "error",
  "success",
  "success",
];

export const statusMeta = {
  new: {
    label: "Новый",
    variant: "new",
  },
  success: {
    label: "Принят",
    variant: "success",
  },
  error: {
    label: "Просрочен",
    variant: "error",
  },
};

export const moderatorEmployees = [
  {
    id: "employee-1",
    fullName: "Фамилия Имя Отчество",
  },
];

export const moderatorDocumentsSeed = Array.from({ length: 100 }, (_, index) => ({
  id: index + 1,
  title: `Документ ${index + 1}`,
  createdAt: "дд.мм.гггг 00:00",
  fileName: "Название файла",
  status: statusCycle[index % statusCycle.length],
  employeeId: "employee-1",
}));

export function getStatusMeta(status) {
  return statusMeta[status] ?? statusMeta.success;
}

export function getDocumentById(documentId) {
  const numericId = Number(documentId);

  return moderatorDocumentsSeed.find((documentItem) => documentItem.id === numericId) ?? null;
}

export function getDocumentsForEmployee(employeeId) {
  return moderatorDocumentsSeed.filter((documentItem) => documentItem.employeeId === employeeId);
}

export function getDocumentRecipients(documentId) {
  const documentItem = getDocumentById(documentId) ?? moderatorDocumentsSeed[0];

  return Array.from({ length: 110 }, (_, index) => {
    const employee = moderatorEmployees[0];

    return {
      id: `${employee.id}-${index + 1}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      createdAt: documentItem.createdAt,
      fileName: documentItem.fileName,
      status: statusCycle[index % statusCycle.length],
    };
  });
}
