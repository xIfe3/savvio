const API_URL = "http://localhost:3005";

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return res.json();
}

async function fetchRaw(endpoint: string): Promise<Response> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return fetch(`${API_URL}${endpoint}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// Auth
export const auth = {
  register: (data: { name: string; email: string; password: string }) =>
    fetchApi("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    fetchApi("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  profile: () => fetchApi("/auth/profile"),
  updateProfile: (data: { name?: string; email?: string; currency?: string; locale?: string }) =>
    fetchApi("/auth/profile", { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchApi("/auth/change-password", { method: "POST", body: JSON.stringify(data) }),
};

// Categories
export const categories = {
  list: () => fetchApi("/categories"),
  create: (data: { name: string; color: string; icon?: string }) =>
    fetchApi("/categories", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { name?: string; color?: string; icon?: string }) =>
    fetchApi(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/categories/${id}`, { method: "DELETE" }),
};

// Expenses
export const expenses = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi(`/expenses${query}`);
  },
  get: (id: number) => fetchApi(`/expenses/${id}`),
  create: (data: {
    amount: number;
    description: string;
    date: string;
    categoryId: number;
    notes?: string;
    receiptUrl?: string;
    tagIds?: number[];
    splits?: Array<{ label: string; amount: number }>;
  }) => fetchApi("/expenses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    fetchApi(`/expenses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/expenses/${id}`, { method: "DELETE" }),
};

// Budgets
export const budgets = {
  list: (month?: string) => {
    const query = month ? `?month=${month}` : "";
    return fetchApi(`/budgets${query}`);
  },
  create: (data: { amount: number; month: string; categoryId: number }) =>
    fetchApi("/budgets", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { amount?: number }) =>
    fetchApi(`/budgets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/budgets/${id}`, { method: "DELETE" }),
};

// Income
export const income = {
  list: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi(`/income${query}`);
  },
  create: (data: {
    amount: number;
    source: string;
    description?: string;
    date: string;
    isRecurring?: boolean;
    frequency?: string;
    categoryId?: number;
  }) => fetchApi("/income", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    fetchApi(`/income/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/income/${id}`, { method: "DELETE" }),
  summary: (month: string) => fetchApi(`/income/summary?month=${month}`),
};

// Recurring Expenses
export const recurringExpenses = {
  list: () => fetchApi("/recurring-expenses"),
  create: (data: {
    amount: number;
    description: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    categoryId: number;
  }) => fetchApi("/recurring-expenses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    fetchApi(`/recurring-expenses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/recurring-expenses/${id}`, { method: "DELETE" }),
  process: () => fetchApi("/recurring-expenses/process"),
};

// Savings Goals
export const savingsGoals = {
  list: () => fetchApi("/savings-goals"),
  create: (data: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    deadline?: string;
    color?: string;
    categoryId?: number;
  }) => fetchApi("/savings-goals", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Record<string, unknown>) =>
    fetchApi(`/savings-goals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  addFunds: (id: number, amount: number) =>
    fetchApi(`/savings-goals/${id}/add-funds`, { method: "PATCH", body: JSON.stringify({ amount }) }),
  delete: (id: number) => fetchApi(`/savings-goals/${id}`, { method: "DELETE" }),
};

// Notifications
export const notifications = {
  list: (unreadOnly = false) =>
    fetchApi(`/notifications${unreadOnly ? "?unread=true" : ""}`),
  unreadCount: () => fetchApi("/notifications/unread-count"),
  markAsRead: (id: number) =>
    fetchApi(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllAsRead: () =>
    fetchApi("/notifications/read-all", { method: "PATCH" }),
  checkBudgets: (month: string) =>
    fetchApi(`/notifications/check-budgets?month=${month}`),
  delete: (id: number) =>
    fetchApi(`/notifications/${id}`, { method: "DELETE" }),
};

// Tags
export const tags = {
  list: () => fetchApi("/tags"),
  create: (data: { name: string; color?: string }) =>
    fetchApi("/tags", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { name: string; color?: string }) =>
    fetchApi(`/tags/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/tags/${id}`, { method: "DELETE" }),
  addToExpense: (expenseId: number, tagId: number) =>
    fetchApi(`/tags/expense/${expenseId}/tag/${tagId}`, { method: "POST" }),
  removeFromExpense: (expenseId: number, tagId: number) =>
    fetchApi(`/tags/expense/${expenseId}/tag/${tagId}`, { method: "DELETE" }),
};

// Analytics
export const analytics = {
  summary: (month: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ month });
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return fetchApi(`/analytics/summary?${params}`);
  },
  categories: (month: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ month });
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return fetchApi(`/analytics/categories?${params}`);
  },
  trend: (months?: number) =>
    fetchApi(`/analytics/trend${months ? `?months=${months}` : ""}`),
  daily: (month: string) => fetchApi(`/analytics/daily?month=${month}`),
  weeklyPattern: (month: string) =>
    fetchApi(`/analytics/weekly-pattern?month=${month}`),
  incomeVsExpense: (months?: number) =>
    fetchApi(`/analytics/income-vs-expense${months ? `?months=${months}` : ""}`),
  topExpenses: (month: string, limit?: number) =>
    fetchApi(`/analytics/top-expenses?month=${month}${limit ? `&limit=${limit}` : ""}`),
};

// Export
export const exportApi = {
  expensesCsv: (month: string) => fetchRaw(`/export/expenses/csv?month=${month}`),
  incomeCsv: (month: string) => fetchRaw(`/export/income/csv?month=${month}`),
  report: (month: string) => fetchApi(`/export/report?month=${month}`),
};
