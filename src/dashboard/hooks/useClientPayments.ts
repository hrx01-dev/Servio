import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../Firebase/useAuth";
import { subscribeClientBilling } from "../services/paymentsService";
import { paymentErrorMessage } from "../lib/payments";
import type { ClientBilling } from "../lib/payments";

export interface ClientPaymentsState {
  /** The client's billing, or null when no billing document exists yet. */
  billing: ClientBilling | null;
  loading: boolean;
  /** Firestore error message (e.g. permission denied), or null. */
  error: string | null;
  /**
   * True when the signed-in account's email is not yet verified. Billing is
   * addressed by email and the security rules only release it to a VERIFIED
   * address, so we surface a "verify your email" prompt instead of firing a
   * query that the rules would deny.
   */
  needsEmailVerification: boolean;
  /** Re-run the billing subscription in place (no full page reload). */
  retry: () => void;
}

/**
 * Real-time view of the admin-authored billing addressed to the signed-in client
 * (by their verified email). Replaces the old demo/mock payments — when the
 * client has no billing document, `billing` is null and the UI shows an empty
 * state. The total-cost, amount-paid, remaining-balance and percentage figures
 * are derived in `lib/payments`, so they always reflect the recorded payments.
 */
export function useClientPayments(): ClientPaymentsState {
  const { currentUser } = useAuth();
  const email = currentUser?.email ?? null;
  const emailVerified = currentUser?.emailVerified ?? false;

  // Bumped by retry() to re-trigger the subscription effect without a reload.
  const [retryCount, setRetryCount] = useState(0);
  const retry = useCallback(() => setRetryCount((c) => c + 1), []);

  const [state, setState] = useState<Omit<ClientPaymentsState, "retry">>({
    billing: null,
    loading: true,
    error: null,
    needsEmailVerification: false,
  });

  useEffect(() => {
    // No email on the account → nothing can be addressed to this user.
    if (!email) {
      setState({
        billing: null,
        loading: false,
        error: null,
        needsEmailVerification: false,
      });
      return;
    }

    // Unverified email → the rules would deny the read; prompt to verify.
    if (!emailVerified) {
      setState({
        billing: null,
        loading: false,
        error: null,
        needsEmailVerification: true,
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      needsEmailVerification: false,
    }));
    const unsubscribe = subscribeClientBilling(
      email,
      (billing) =>
        setState({
          billing,
          loading: false,
          error: null,
          needsEmailVerification: false,
        }),
      (err) =>
        setState({
          billing: null,
          loading: false,
          error: paymentErrorMessage(err),
          needsEmailVerification: false,
        }),
    );
    return unsubscribe;
  }, [email, emailVerified, retryCount]);

  return { ...state, retry };
}
