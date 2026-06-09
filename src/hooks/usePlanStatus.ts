import { useEffect, useState } from "react";
import api from "../services/api";

export interface PlanStatus {
  status: "trial" | "trial_expiring" | "soft_locked" | "hard_locked" | "active" | "no_company";
  saas_plan: string;
  trial_days_left: number | null;
  soft_lock: boolean;
  trial_ends_at: string | null;
  plan_expires_at: string | null;
  lock_reason: string | null;
}

export function usePlanStatus() {
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/plan/status")
      .then(r => setPlanStatus(r.data?.data ?? null))
      .catch(() => setPlanStatus(null))
      .finally(() => setLoading(false));
  }, []);

  return { planStatus, loading };
}
