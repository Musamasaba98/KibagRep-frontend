import axios from "axios";
import { store } from "../store/store";
import { logout } from "../store/authSlice";
import { enqueue } from "../lib/offlineQueue";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

// Endpoints that should be queued when offline (write operations by reps)
const QUEUEABLE = [
  "/field-doctor/add-doctor-activity",
  "/field-doctor/add-nca",
  "/field-pharmacy",
  "/daily-report",
];

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

// Queue rep write endpoints on any network failure; only auto-logout on 401 when genuinely online
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // ── No network response = connectivity failure ─────────────────────────────
    // Queue queueable endpoints regardless of navigator.onLine — that flag is
    // unreliable on mobile (can be true even when there's no real connectivity).
    if (!error.response) {
      const cfg = error.config;
      const urlPath: string = cfg?.url ?? "";
      const method: "POST" | "PUT" = cfg?.method?.toUpperCase() === "PUT" ? "PUT" : "POST";
      const shouldQueue = QUEUEABLE.some((p) => urlPath.includes(p));

      if (shouldQueue && cfg?.data) {
        await enqueue({
          type: urlPath.includes("nca") ? "nca"
              : urlPath.includes("pharmacy") ? "pharmacy_visit"
              : urlPath.includes("daily-report") ? "daily_report"
              : "doctor_visit",
          payload: typeof cfg.data === "string" ? JSON.parse(cfg.data) : cfg.data,
          endpoint: `${BASE_URL}${urlPath}`,
          method,
        });
        return Promise.resolve({
          data: { success: true, queued: true, message: "Saved offline — will sync when back online" },
          status: 202,
          statusText: "Queued",
          headers: {},
          config: cfg,
        });
      }
      // Non-queueable network failure — just propagate, don't logout
      return Promise.reject(error);
    }

    // ── 401 from server: only auto-logout when the device is actually online ───
    // If we're offline, a 401 may come from a captive portal or be stale; don't
    // force the user out — they'd be stuck unable to re-authenticate.
    if (error.response.status === 401) {
      const url: string = error.config?.url ?? "";
      const isAuthCall = url.includes("/auth/login") || url.includes("/auth/register");
      if (!isAuthCall && navigator.onLine) {
        store.dispatch(logout());
        window.location.href = "/login";
      }
      return Promise.reject(error);
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
export const bulkEditDoctorsApi = (ids: string[], fields: Record<string, unknown>) => api.post("/doctor/bulk-edit", { ids, fields });
export const bulkUploadDoctorsApi = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/doctor/bulk-upload", form, { headers: { "Content-Type": "multipart/form-data" } });
};
export const downloadDoctorTemplateApi = () => api.get("/doctor/bulk-upload/template", { responseType: "blob" });
export const deleteDoctorApi = (id: string) => api.delete(`/doctor/${id}`);

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
export const createCompanyTeamApi = (team_name: string, supervisor_id?: string) => api.post("/team/company", { team_name, supervisor_id });
export const renameCompanyTeamApi = (id: string, team_name: string) => api.put(`/team/company/${id}`, { team_name });
export const updateCompanyTeamApi = (id: string, data: { team_name?: string; supervisor_id?: string | null }) => api.put(`/team/company/${id}`, data);
export const deleteCompanyTeamApi = (id: string) => api.delete(`/team/company/${id}`);
export const addTeamProductApi = (teamId: string, product_id: string) => api.post(`/team/company/${teamId}/products`, { product_id });
export const removeTeamProductApi = (teamId: string, productId: string) => api.delete(`/team/company/${teamId}/products/${productId}`);

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
export const updateCompanyUserApi = (userId: string, data: {
  role?: string;
  team_id?: string | null;
}) => api.put(`/user/company/${userId}`, data);
export const removeUserFromCompanyApi = (userId: string) => api.delete(`/user/company/${userId}`);
export const getUnassignedUsersApi = () => api.get("/user/unassigned");
export const getAllPlatformUsersApi = (params?: { q?: string; role?: string; company_id?: string }) =>
  api.get("/user/all", { params });
export const searchUsersApi = (q: string) => api.get(`/user/search?q=${encodeURIComponent(q)}`);

// ─── HCP Doctor List (company-scoped) ─────────────────────────────────────────
export const getCompanyDoctorListApi = (params?: { q?: string; page?: number; limit?: number }) =>
  api.get("/doctor", { params });
export const setDoctorTierApi = (doctorId: string, data: { tier: string; visit_frequency?: number; notes?: string }) =>
  api.put(`/doctor/${doctorId}/tier`, data);

export default api;
export const signupApi = (data: unknown) => api.post('/user/addUser', data);

// ─── Doctor Activities ────────────────────────────────────────────────────────
export const addDoctorActivityApi = (data: unknown) => api.post('/field-doctor/add-doctor-activity', data);
export const addNcaApi = (data: unknown) => api.post('/field-doctor/add-nca', data);
export const getActivityHistoryApi = (params?: { days?: number; limit?: number; page?: number }) => api.get('/field-doctor/history', { params });
export const getTodayActivitiesApi = () => api.get('/field-doctor/today');
export const getCompanyFeedApi = (params?: { days?: number; limit?: number }) =>
  api.get('/field-doctor/company-feed', { params });

// ─── Pharmacy Activities ──────────────────────────────────────────────────────
export const addPharmacyActivityApi = (data: unknown) => api.post('/field-pharmacy/add-pharmacy-activity', data);
export const getPharmacyActivityHistoryApi = (params?: { days?: number; limit?: number }) => api.get('/field-pharmacy/history', { params });

// ─── Products (alias) ─────────────────────────────────────────────────────────
export const getProductsApi = () => api.get('/product/company');

// ─── Sample Balance ───────────────────────────────────────────────────────────
export const getSampleBalancesApi = () => api.get('/sample-balance/my');

// ─── Call Cycles ──────────────────────────────────────────────────────────────
export const getCurrentCycleApi = (month?: number, year?: number) =>
  api.get('/cycle/current', { params: { ...(month && { month }), ...(year && { year }) } });
export const submitCycleApi = (id: string) => api.post(`/cycle/${id}/submit`);
export const carryForwardCycleApi = () => api.post('/cycle/carry-forward');
export const getPendingCyclesApi = () => api.get('/cycle/pending');
export const approveCycleApi = (id: string) => api.put(`/cycle/${id}/approve`);
export const rejectCycleApi = (id: string, data: { note: string }) => api.put(`/cycle/${id}/reject`, data);

// ─── Late Submission Requests ─────────────────────────────────────────────────
export const createLateRequestApi = (data: { type: 'CYCLE' | 'TOUR_PLAN' | 'DAILY_REPORT'; month: number; year: number; note: string }) =>
  api.post('/late-requests', data);
export const getMyLateRequestsApi = () => api.get('/late-requests/my');
export const getPendingLateRequestsApi = () => api.get('/late-requests/pending');
export const approveLateRequestApi = (id: string) => api.put(`/late-requests/${id}/approve`);
export const rejectLateRequestApi = (id: string, data?: { note?: string }) => api.put(`/late-requests/${id}/reject`, data);

// ─── Daily Reports ────────────────────────────────────────────────────────────
export const getTodayReportApi = () => api.get('/daily-report/today');
export const submitDailyReportApi = (data: unknown) => api.post('/daily-report/submit', data);
export const getMyReportsApi = (days?: number) => api.get('/daily-report/my', { params: days ? { days } : undefined });
export const getPendingReportsApi = () => api.get('/daily-report/pending');
export const approveReportApi = (id: string) => api.put(`/daily-report/${id}/approve`);
export const rejectReportApi = (id: string, data?: { note?: string }) => api.put(`/daily-report/${id}/reject`, data);
export const getCompanyObserversApi = () => api.get('/daily-report/observers');
export const getCompanyReportsApi = (params?: string) => api.get(`/daily-report/company${params ? '?' + params : ''}`);
export const getJfwReportsApi = () => api.get('/daily-report/jfw');
export const submitJfwScoreApi = (reportId: string, data: { criteria: Record<string, number>; notes: string; overall_score: number }) =>
  api.post(`/daily-report/${reportId}/jfw-score`, data);

// ─── Tour Plan ────────────────────────────────────────────────────────────────
export const getTodayTourPlanApi = () => api.get('/tour-plan/today');

// ─── Profile ──────────────────────────────────────────────────────────────────
export const updateMyProfileApi = (data: { firstname?: string; lastname?: string; contact?: string }) => api.put('/user/me', data);
export const changePasswordApi = (data: { current_password: string; new_password: string }) => api.put('/auth/change-password', data);
export const createCompanyUserApi = (data: {
  firstname: string; lastname: string; email: string; username: string;
  password: string; role: string; gender: string; contact?: string;
  company_id: string; must_reset_password: boolean;
}) => api.post('/user/addUser', data);

// ─── Pharmacy Search ──────────────────────────────────────────────────────────
export const searchPharmaciesApi = (q: string) => api.get(`/pharmacy/search?q=${encodeURIComponent(q)}`);

// ─── Doctor Directory & Recommendations ───────────────────────────────────────
export const getDoctorDirectoryApi = (params?: { q?: string; page?: number; limit?: number }) =>
  api.get('/doctor', { params: { scope: 'all', ...params } });
export const addCycleItemApi = (data: { doctor_id: string; tier?: string; frequency?: number }) => api.post('/cycle/current/items', data);
export const removeCycleItemApi = (itemId: string) => api.delete(`/cycle/current/items/${itemId}`);
export const recommendDoctorApi = (doctorId: string) => api.post('/doctor/recommend', { doctor_id: doctorId });
export const reportNewClinicianApi = (data: { clinician_name: string; clinician_cadre?: string; clinician_location?: string; clinician_contact?: string }) => api.post('/doctor/report-clinician', data);
export const getRecommendationsApi = (status?: string) => api.get('/doctor/recommendations', { params: status ? { status } : undefined });
export const approveRecommendationApi = (id: string) => api.put(`/doctor/recommendations/${id}/approve`);
export const rejectRecommendationApi = (id: string, note?: string) => api.put(`/doctor/recommendations/${id}/reject`, { review_note: note });
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
export const rejectExpenseClaimApi = (claimId: string, data: { note: string }) => api.put(`/expense/${claimId}/reject`, data);

// ─── Territories ──────────────────────────────────────────────────────────────
export const getTerritoriesApi = () => api.get('/territory');
export const getMyTerritoryApi  = () => api.get('/territory/my');
export const createTerritoryApi = (data: { name: string; region?: string; territory_type?: string }) => api.post('/territory', data);
export const updateTerritoryApi = (id: string, data: unknown) => api.put(`/territory/${id}`, data);
export const deleteTerritoryApi = (id: string) => api.delete(`/territory/${id}`);
export const addTerritoryFacilityApi = (id: string, data: { facility_id: string }) => api.post(`/territory/${id}/facilities`, data);
export const removeTerritoryFacilityApi = (id: string, facilityId: string) => api.delete(`/territory/${id}/facilities/${facilityId}`);
export const addTerritoryPharmacyApi = (id: string, data: { pharmacy_id: string }) => api.post(`/territory/${id}/pharmacies`, data);
export const removeTerritoryPharmacyApi = (id: string, pharmacyId: string) => api.delete(`/territory/${id}/pharmacies/${pharmacyId}`);
export const assignTerritoryRepApi = (id: string, data: { user_id: string }) => api.post(`/territory/${id}/reps`, data);
export const unassignTerritoryRepApi = (id: string, userId: string) => api.delete(`/territory/${id}/reps/${userId}`);
export const assignTerritoryTeamApi = (id: string, data: { team_id: string }) => api.post(`/territory/${id}/teams`, data);
export const unassignTerritoryTeamApi = (id: string, teamId: string) => api.delete(`/territory/${id}/teams/${teamId}`);

// ─── Tour Plan (extended) ─────────────────────────────────────────────────────
export const getCurrentTourPlanApi = () => api.get('/tour-plan/current');
export const updateTourPlanDayApi = (id: string, data: unknown) => api.put(`/tour-plan/${id}/day`, data);
export const addTourPlanEntryApi = (id: string, data: unknown) => api.post(`/tour-plan/${id}/entries`, data);
export const removeTourPlanEntryApi = (id: string, entryId: string) => api.delete(`/tour-plan/${id}/entries/${entryId}`);
export const submitTourPlanApi = (id: string) => api.put(`/tour-plan/${id}/submit`);
export const getPendingTourPlansApi = () => api.get('/tour-plan/pending');
export const approveTourPlanApi = (id: string) => api.put(`/tour-plan/${id}/approve`);
export const rejectTourPlanApi = (id: string, data: { review_note: string }) => api.put(`/tour-plan/${id}/reject`, data);

// ─── Daily Report (extended) ──────────────────────────────────────────────────
export const getDailyReportActivitiesApi = (id: string) => api.get(`/daily-report/${id}/activities`);

// ─── Supervisor ───────────────────────────────────────────────────────────────
export const getTeamPerformanceApi = () => api.get('/supervisor/team-performance');
export const getTeamMapApi = (days?: number) => api.get(`/supervisor/team-map${days ? '?days=' + days : ''}`);

// ─── Sales Targets ────────────────────────────────────────────────────────────
export const getMyTargetApi = () => api.get('/target/my');
export const getTeamTargetsApi = (month?: number, year?: number) => api.get(`/target/team${month && year ? '?month=' + month + '&year=' + year : ''}`);
export const setTargetApi = (data: unknown) => api.post('/target', data);

// ─── Field Events (OPD Breakfasts, CME, Launches, etc.) ──────────────────────
export const getFieldEventsApi = (params?: { status?: string; type?: string; month?: number; year?: number }) =>
  api.get('/field-events', { params });
export const createFieldEventApi = (data: unknown) => api.post('/field-events', data);
export const updateFieldEventApi = (id: string, data: unknown) => api.put(`/field-events/${id}`, data);
export const deleteFieldEventApi = (id: string) => api.delete(`/field-events/${id}`);

// ─── Report Download ──────────────────────────────────────────────────────────
export const downloadReportApi = (month: number, year: number, userId?: string) =>
  api.get('/report/generate-report', {
    params: { month, year, ...(userId ? { user_id: userId } : {}) },
    responseType: 'blob',
  });

export const getMyReportSummaryApi = (month?: number, year?: number) =>
  api.get('/report/my-summary', { params: { month, year } });

export const getVisitTrendApi = (days?: number) =>
  api.get('/report/visit-trend', { params: { days } });

export const getProductDetailingApi = (month?: number, year?: number) =>
  api.get('/report/product-detailing', { params: { month, year } });

export const getAnomaliesApi = (days?: number) =>
  api.get('/report/anomalies', { params: { days } });

export const getNationalOverviewApi = (month?: number, year?: number) =>
  api.get('/report/national-overview', { params: { month, year } });

export const getTerritoryCoverageApi = (month?: number, year?: number) =>
  api.get('/report/territory-coverage', { params: { month, year } });

export const getTierCoverageApi = (month?: number, year?: number) =>
  api.get('/report/tier-coverage', { params: { month, year } });

export const exportReportApi = (
  type: string, start: string, end: string,
  repId?: string, teamId?: string
) =>
  api.get('/report/export', {
    params: { type, start, end, rep_id: repId || undefined, team_id: teamId || undefined },
    responseType: 'blob',
  });

// ─── Stock Placement Targets ──────────────────────────────────────────────────
export const getPlacementTargetsApi = (month?: number, year?: number) =>
  api.get('/placement', { params: { month, year } });
export const upsertPlacementTargetApi = (data: unknown) => api.post('/placement', data);
export const bulkUpsertPlacementTargetsApi = (data: unknown) => api.post('/placement/bulk', data);

// ─── Pharmacy Staff ───────────────────────────────────────────────────────────
export const getPharmacyStaffApi = (pharmacyId: string) =>
  api.get(`/pharmacy-staff/pharmacy/${pharmacyId}`);
export const suggestPharmacyStaffApi = (data: { name: string; role: string; phone?: string; notes?: string; pharmacy_id: string }) =>
  api.post('/pharmacy-staff', data);
export const linkStaffToPharmacyApi = (staffId: string, pharmacyId: string) =>
  api.post(`/pharmacy-staff/${staffId}/link`, { pharmacy_id: pharmacyId });
export const getPendingStaffSupervisorApi = () => api.get('/pharmacy-staff/pending-supervisor');
export const getPendingStaffAdminApi    = () => api.get('/pharmacy-staff/pending-admin');
export const supervisorApproveStaffApi  = (id: string) => api.put(`/pharmacy-staff/${id}/supervisor-approve`);
export const adminApproveStaffApi       = (id: string) => api.put(`/pharmacy-staff/${id}/admin-approve`);
export const rejectStaffApi             = (id: string, note?: string) => api.put(`/pharmacy-staff/${id}/reject`, { note });

// ─── Location / GPS trail ─────────────────────────────────────────────────────
export const getMyTrailApi = (date?: string) =>
  api.get('/location/my-trail', { params: date ? { date } : undefined });
export const getRepTrailApi = (userId: string, date?: string) =>
  api.get(`/location/trail/${userId}`, { params: date ? { date } : undefined });
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api").replace(/\/api$/, "");

// ─── Facility Search ──────────────────────────────────────────────────────────
export const searchFacilitiesApi = (q: string) => api.get(`/facility/search?q=${encodeURIComponent(q)}`);

// ─── Company Doctor List (admin direct add/remove) ────────────────────────────
export const addDoctorToCompanyApi = (doctorId: string) =>
  api.post(`/doctor/${doctorId}/company-list`);
export const removeDoctorFromCompanyApi = (doctorId: string) =>
  api.delete(`/doctor/${doctorId}/company-list`);

// ─── Company Pharmacy List ─────────────────────────────────────────────────────
export const getCompanyPharmaciesApi = (params?: { q?: string; tier?: string; page?: number; limit?: number }) =>
  api.get('/company-pharmacy', { params });
export const addCompanyPharmacyApi = (data: { pharmacy_id: string; tier?: string; notes?: string }) =>
  api.post('/company-pharmacy', data);
export const updateCompanyPharmacyApi = (pharmacyId: string, data: { tier?: string; notes?: string }) =>
  api.put(`/company-pharmacy/${pharmacyId}`, data);
export const removeCompanyPharmacyApi = (pharmacyId: string) =>
  api.delete(`/company-pharmacy/${pharmacyId}`);

// ─── Company Facility List ─────────────────────────────────────────────────────
export const getCompanyFacilitiesApi = (params?: { q?: string; facility_type?: string; page?: number; limit?: number }) =>
  api.get('/company-facility', { params });
export const addCompanyFacilityApi = (data: { facility_id: string; notes?: string }) =>
  api.post('/company-facility', data);
export const updateCompanyFacilityApi = (facilityId: string, data: { notes?: string }) =>
  api.put(`/company-facility/${facilityId}`, data);
export const removeCompanyFacilityApi = (facilityId: string) =>
  api.delete(`/company-facility/${facilityId}`);


// ─── Plan / Subscription ───────────────────────────────────────────────────────
export const getPublicPlanConfigsApi = () => api.get('/plan/public');
export const getMyPlanStatusApi = () => api.get('/plan/status');
export const getAllPlanConfigsApi = () => api.get('/plan/config');
export const updatePlanConfigApi = (plan: string, data: object) => api.put(`/plan/config/${plan}`, data);
export const getAllCompaniesWithPlanApi = () => api.get('/plan/companies');
export const getCompanyPlanApi = (id: string) => api.get(`/plan/company/${id}`);
export const updateCompanyPlanApi = (id: string, data: object) => api.put(`/plan/company/${id}`, data);
