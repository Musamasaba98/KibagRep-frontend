import axios from "axios";
import { store } from "../store/store";
import { logout } from "../store/authSlice";

const BASE_URL = "http://localhost:4000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = store.getState().auth?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const loginApi = (email: string, password: string) =>
  api.post("/auth/login", { email, password });

export const getMeApi = () => api.get("/auth/me");

// ─── Doctors ─────────────────────────────────────────────────────────────────
export const getDoctorsApi = () => api.get("/doctor");
export const createDoctorApi = (data: unknown) => api.post("/doctor", data);

// ─── Pharmacies ──────────────────────────────────────────────────────────────
export const getPharmaciesApi = () => api.get("/pharmacy");

// ─── Products ────────────────────────────────────────────────────────────────
export const getProductsApi = () => api.get("/product");

// ─── Activities ──────────────────────────────────────────────────────────────
export const getTodayActivitiesApi = () => api.get("/field-doctor/today");

export const addDoctorActivityApi = (data: unknown) =>
  api.post("/field-doctor/add-doctor-activity", data);

export const addNcaApi = (data: unknown) =>
  api.post("/field-doctor/add-nca", data);

export const addPharmacyActivityApi = (data: unknown) =>
  api.post("/field-pharmacy/add-pharmacy-activity", data);

// ─── Visit history & team feed ───────────────────────────────────────────────
export const getActivityHistoryApi = (params?: { days?: number; page?: number; limit?: number }) =>
  api.get("/field-doctor/history", { params });

export const getCompanyFeedApi = (params?: { days?: number; page?: number }) =>
  api.get("/field-doctor/company-feed", { params });

export const searchDoctorsApi = (q: string) =>
  api.get("/doctor/search", { params: { q } });

// ─── Call Cycles ─────────────────────────────────────────────────────────────
export const getCurrentCycleApi = () => api.get("/cycle/current");
export const addCycleItemApi = (data: { doctor_id: string; tier?: string; frequency?: number }) =>
  api.post("/cycle/current/items", data);
export const removeCycleItemApi = (itemId: string) =>
  api.delete(`/cycle/current/items/${itemId}`);
export const submitCycleApi = (cycleId: string) => api.post(`/cycle/${cycleId}/submit`);
export const getPendingCyclesApi = () => api.get("/cycle/pending");
export const approveCycleApi = (cycleId: string) => api.put(`/cycle/${cycleId}/approve`);
export const rejectCycleApi = (cycleId: string, note?: string) =>
  api.put(`/cycle/${cycleId}/reject`, { note });

// ─── Daily Reports ────────────────────────────────────────────────────────────
export const getTodayReportApi = () => api.get("/daily-report/today");
export const submitDailyReportApi = (data: { summary?: string }) =>
  api.post("/daily-report/submit", data);
export const getMyReportsApi = (days?: number) =>
  api.get("/daily-report/my", { params: { days } });
export const getPendingReportsApi = () => api.get("/daily-report/pending");
export const approveReportApi = (id: string) => api.put(`/daily-report/${id}/approve`);
export const rejectReportApi = (id: string, note?: string) =>
  api.put(`/daily-report/${id}/reject`, { note });

// ─── Legacy report generator ─────────────────────────────────────────────────
export const generateReportApi = (params?: unknown) =>
  api.get("/report/generate-report", { params });

// ─── Expense Claims (supervisor/manager — approval) ──────────────────────────
export const getPendingExpenseClaimsApi = () => api.get("/expense/pending");
export const approveExpenseClaimApi = (id: string) => api.put(`/expense/${id}/approve`);
export const rejectExpenseClaimApi = (id: string, note?: string) =>
  api.put(`/expense/${id}/reject`, { note });

// ─── Expense Claims (rep — own claims) ───────────────────────────────────────
export const getMyExpenseClaimsApi = () => api.get("/expense/my");
export const createExpenseClaimApi = (period?: string) =>
  api.post("/expense/create", period ? { period } : {});
export const addExpenseItemApi = (
  claimId: string,
  data: { category: string; description: string; amount: number; date: string }
) => api.post(`/expense/${claimId}/items`, data);
export const removeExpenseItemApi = (claimId: string, itemId: string) =>
  api.delete(`/expense/${claimId}/items/${itemId}`);
export const submitExpenseClaimApi = (claimId: string) =>
  api.put(`/expense/${claimId}/submit`);

// ─── Sample Balances ──────────────────────────────────────────────────────────
export const getSampleBalancesApi = () => api.get("/sample-balance/my");
export const getTeamSampleBalancesApi = () => api.get("/sample-balance/team");
export const issueSamplesApi = (data: { user_id: string; product_id: string; quantity: number }) =>
  api.post("/sample-balance/issue", data);
export const giveSamplesApi = (data: { product_id: string; quantity: number }) =>
  api.post("/sample-balance/give", data);

// ─── Doctor tier classification ───────────────────────────────────────────────
export const setDoctorTierApi = (
  doctorId: string,
  data: { tier: "A" | "B" | "C"; visit_frequency?: number; notes?: string }
) => api.put(`/doctor/${doctorId}/tier`, data);

// ─── User management ─────────────────────────────────────────────────────────
export const signupApi = (data: unknown) => api.post("/user/addUser", data);

// ─── Teams ───────────────────────────────────────────────────────────────────
export const getTeamsApi = () => api.get("/team");

export default api;
