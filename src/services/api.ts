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

// ─── Products ─────────────────────────────────────────────────────────────────
export const getCompanyProductsApi = () => api.get('/product/company');
export const createCompanyProductApi = (data: { product_name: string; classification?: string; generic_name?: string }) => api.post('/product/company', data);
export const deleteProductApi = (id: string) => api.delete(`/product/${id}`);
export const updateProductNameApi = (id: string, data: { product_name?: string; classification?: string; generic_name?: string }) => api.put(`/product/${id}`, data);

// ─── Sample Balance ───────────────────────────────────────────────────────────
export const issueSamplesAdminApi = (data: { user_id: string; product_id: string; quantity: number }) => api.post('/sample-balance/issue', data);
export const getTeamSampleBalancesFullApi = () => api.get('/sample-balance/team');

// ─── Password Reset ───────────────────────────────────────────────────────────
export const forgotPasswordApi = (email: string) => api.post('/user/forgot-password', { email });
export const resetPasswordApi = (token: string, new_password: string) => api.post('/user/reset-password', { token, new_password });
export const adminResetPasswordApi = (userId: string, new_password: string) => api.post('/user/admin-reset', { userId, new_password });

// ─── Teams ───────────────────────────────────────────────────────────────────
export const getTeamsApi = () => api.get("/team");
export const getCompanyTeamsApi = () => api.get("/team/company");
export const createCompanyTeamApi = (team_name: string) => api.post("/team/company", { team_name });

// ─── Company Management (Super Admin) ────────────────────────────────────────
export const getAllCompaniesApi = () => api.get("/company");
export const createCompanyApi = (data: { company_name: string; location: string }) => api.post("/company", data);
export const getCompanyUsersByIdApi = (companyId: string) => api.get(`/company/${companyId}/users`);
export const toggleCompanyActiveApi = (companyId: string) => api.put(`/company/${companyId}/toggle-active`);
export const getPlatformStatsApi = () => api.get("/company/stats");
export const getMyCompanyApi = () => api.get("/company/mine");

// ─── User Management ─────────────────────────────────────────────────────────
export const getCompanyUsersApi = () => api.get("/user/company/users");
export const addUserToCompanyApi = (data: { userId: string; role: string; company_id?: string; team_id?: string }) =>
  api.post("/user/company/add", data);
export const updateCompanyUserApi = (userId: string, data: { role?: string; team_id?: string | null }) =>
  api.put(`/user/company/${userId}`, data);
export const removeUserFromCompanyApi = (userId: string) => api.delete(`/user/company/${userId}`);
export const getUnassignedUsersApi = () => api.get("/user/unassigned");
export const searchUsersApi = (q: string) => api.get(`/user/search?q=${encodeURIComponent(q)}`);

// ─── HCP Doctor List (company-scoped) ─────────────────────────────────────────
export const getCompanyDoctorListApi = () => api.get("/doctor");
export const setDoctorTierApi = (doctorId: string, data: { tier: string; visit_frequency?: number; notes?: string }) =>
  api.put(`/doctor/${doctorId}/tier`, data);

export default api;
export const signupApi = (data: unknown) => api.post('/user/addUser', data);

// ─── Doctor Activities ────────────────────────────────────────────────────────
export const addDoctorActivityApi = (data: unknown) => api.post('/field-doctor/add-doctor-activity', data);
export const addNcaApi = (data: unknown) => api.post('/field-doctor/add-nca', data);
export const getActivityHistoryApi = (params?: string) => api.get(`/field-doctor/history${params ? '?' + params : ''}`);
export const getTodayActivitiesApi = () => api.get('/field-doctor/today');
export const getCompanyFeedApi = () => api.get('/field-doctor/company-feed');

// ─── Pharmacy Activities ──────────────────────────────────────────────────────
export const addPharmacyActivityApi = (data: unknown) => api.post('/field-pharmacy/add-pharmacy-activity', data);
export const getPharmacyActivityHistoryApi = () => api.get('/field-pharmacy/history');

// ─── Products (alias) ─────────────────────────────────────────────────────────
export const getProductsApi = () => api.get('/product/company');

// ─── Sample Balance ───────────────────────────────────────────────────────────
export const getSampleBalancesApi = () => api.get('/sample-balance/my');

// ─── Call Cycles ──────────────────────────────────────────────────────────────
export const getCurrentCycleApi = () => api.get('/cycle/current');
export const submitCycleApi = (id: string) => api.post(`/cycle/${id}/submit`);
export const getPendingCyclesApi = () => api.get('/cycle/pending');
export const approveCycleApi = (id: string) => api.put(`/cycle/${id}/approve`);
export const rejectCycleApi = (id: string, data: { reason: string }) => api.put(`/cycle/${id}/reject`, data);

// ─── Daily Reports ────────────────────────────────────────────────────────────
export const getTodayReportApi = () => api.get('/daily-report/today');
export const submitDailyReportApi = (data: unknown) => api.post('/daily-report/submit', data);
export const getMyReportsApi = () => api.get('/daily-report/my');
export const getPendingReportsApi = () => api.get('/daily-report/pending');
export const approveReportApi = (id: string) => api.put(`/daily-report/${id}/approve`);
export const rejectReportApi = (id: string, data: { reason: string }) => api.put(`/daily-report/${id}/reject`, data);
export const getCompanyObserversApi = () => api.get('/daily-report/observers');
export const getCompanyReportsApi = (params?: string) => api.get(`/daily-report/company${params ? '?' + params : ''}`);
export const getJfwReportsApi = () => api.get('/daily-report/jfw');

// ─── Tour Plan ────────────────────────────────────────────────────────────────
export const getTodayTourPlanApi = () => api.get('/tour-plan/today');

// ─── Profile ──────────────────────────────────────────────────────────────────
export const updateMyProfileApi = (data: { firstname?: string; lastname?: string; contact?: string }) => api.put('/user/me', data);
export const changePasswordApi = (data: { current_password: string; new_password: string }) => api.put('/user/change-password', data);

// ─── Pharmacy Search ──────────────────────────────────────────────────────────
export const searchPharmaciesApi = (q: string) => api.get(`/pharmacy/search?q=${encodeURIComponent(q)}`);

// ─── Doctor Directory & Recommendations ───────────────────────────────────────
export const getDoctorDirectoryApi = () => api.get('/doctor');
export const addCycleItemApi = (data: { doctor_id: string; tier?: string; frequency?: number }) => api.post('/cycle/current/items', data);
export const removeCycleItemApi = (itemId: string) => api.delete(`/cycle/current/items/${itemId}`);
export const recommendDoctorApi = (doctorId: string) => api.post('/doctor/recommend', { doctor_id: doctorId });
export const reportNewClinicianApi = (data: { clinician_name: string; clinician_cadre?: string; clinician_location?: string; clinician_contact?: string }) => api.post('/doctor/report-clinician', data);
export const getRecommendationsApi = () => api.get('/doctor/recommendations');
export const approveRecommendationApi = (id: string) => api.put(`/doctor/recommendations/${id}/approve`);
export const rejectRecommendationApi = (id: string, note?: string) => api.put(`/doctor/recommendations/${id}/reject`, { note });
export const forwardRecommendationApi = (id: string) => api.put(`/doctor/recommendations/${id}/forward`);

// ─── Facilities ───────────────────────────────────────────────────────────────
export const getFacilitiesApi = () => api.get('/facility');

// ─── Expense Claims ───────────────────────────────────────────────────────────
export const getMyExpenseClaimsApi = () => api.get('/expense/my');
export const createExpenseClaimApi = (data: { period: string }) => api.post('/expense/create', data);
export const addExpenseItemApi = (claimId: string, data: unknown) => api.post(`/expense/${claimId}/items`, data);
export const removeExpenseItemApi = (claimId: string, itemId: string) => api.delete(`/expense/${claimId}/items/${itemId}`);
export const submitExpenseClaimApi = (claimId: string) => api.put(`/expense/${claimId}/submit`);
export const getPendingExpenseClaimsApi = () => api.get('/expense/pending');
export const approveExpenseClaimApi = (claimId: string) => api.put(`/expense/${claimId}/approve`);
export const rejectExpenseClaimApi = (claimId: string, data: { reason: string }) => api.put(`/expense/${claimId}/reject`, data);

// ─── Territories ──────────────────────────────────────────────────────────────
export const getTerritoriesApi = () => api.get('/territory');
export const createTerritoryApi = (data: { name: string; region?: string }) => api.post('/territory', data);
export const updateTerritoryApi = (id: string, data: unknown) => api.put(`/territory/${id}`, data);
export const deleteTerritoryApi = (id: string) => api.delete(`/territory/${id}`);
export const addTerritoryFacilityApi = (id: string, data: { facility_id: string }) => api.post(`/territory/${id}/facilities`, data);
export const removeTerritoryFacilityApi = (id: string, facilityId: string) => api.delete(`/territory/${id}/facilities/${facilityId}`);
export const unassignTerritoryRepApi = (id: string, userId: string) => api.delete(`/territory/${id}/reps/${userId}`);

// ─── Tour Plan (extended) ─────────────────────────────────────────────────────
export const getCurrentTourPlanApi = () => api.get('/tour-plan/current');
export const updateTourPlanDayApi = (id: string, data: unknown) => api.put(`/tour-plan/${id}/day`, data);
export const addTourPlanEntryApi = (id: string, data: unknown) => api.post(`/tour-plan/${id}/entries`, data);
export const removeTourPlanEntryApi = (id: string, entryId: string) => api.delete(`/tour-plan/${id}/entries/${entryId}`);
export const submitTourPlanApi = (id: string) => api.put(`/tour-plan/${id}/submit`);

// ─── Daily Report (extended) ──────────────────────────────────────────────────
export const getDailyReportActivitiesApi = (id: string) => api.get(`/daily-report/${id}/activities`);

// ─── Supervisor ───────────────────────────────────────────────────────────────
export const getTeamPerformanceApi = () => api.get('/supervisor/team-performance');
export const getTeamMapApi = (days?: number) => api.get(`/supervisor/team-map${days ? '?days=' + days : ''}`);

// ─── Sales Targets ────────────────────────────────────────────────────────────
export const getMyTargetApi = () => api.get('/target/my');
export const getTeamTargetsApi = (month?: number, year?: number) => api.get(`/target/team${month && year ? '?month=' + month + '&year=' + year : ''}`);
export const setTargetApi = (data: unknown) => api.post('/target', data);
