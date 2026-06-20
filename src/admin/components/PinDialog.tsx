import { useContext, useEffect, useState } from "react";
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Loader2, ShieldCheck } from "lucide-react";
import { db } from "@/Firebase/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { COLLECTIONS } from "../lib/collections";
import {
  createPinCredential,
  isValidPin,
  PIN_LENGTH,
  verifyPin,
} from "../lib/pin";
import { writeAuditLog } from "../lib/audit";
import { AdminProfile } from "../types";

interface PinDialogProps {
  open: boolean;
  admin: AdminProfile | null;
  onCancel: () => void;
  onSuccess: () => void;
}

/** Masked PIN slots — render the digit count, never the digits. */
function PinSlots({ count, invalid }: { count: number; invalid: boolean }) {
  const ctx = useContext(OTPInputContext);
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: PIN_LENGTH }).map((_, i) => {
        const active = ctx?.slots[i]?.isActive ?? false;
        const filled = i < count;
        return (
          <div
            key={i}
            aria-hidden="true"
            className={cn(
              "relative flex h-12 w-10 items-center justify-center rounded-md border bg-input-background text-sm transition-all",
              active ? "z-10 border-ring ring-[3px] ring-ring/50" : "border-input",
              invalid && "border-destructive",
            )}
          >
            {filled && (
              <span className="h-2.5 w-2.5 rounded-full bg-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PinDialog({ open, admin, onCancel, onSuccess }: PinDialogProps) {
  // Require BOTH hash and salt to be in "verify" mode — a record with a hash
  // but a missing/corrupt salt would otherwise be an unrecoverable dead end;
  // instead we fall back to "setup" so the admin can re-establish a PIN.
  const hasUsablePin = Boolean(admin?.pinHash && admin?.pinSalt);
  const mode: "verify" | "setup" = hasUsablePin ? "verify" : "setup";
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Clear transient state whenever the dialog (re)opens.
  useEffect(() => {
    if (open) {
      setPin("");
      setConfirmPin("");
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (busy) return;
    if (!admin) {
      setError("No admin account is loaded.");
      return;
    }
    setError(null);

    if (mode === "verify") {
      if (!admin.pinHash || !admin.pinSalt) {
        setError("No PIN is configured for this account.");
        return;
      }
      if (!isValidPin(pin)) {
        setError(`Enter your ${PIN_LENGTH}-digit PIN.`);
        return;
      }
      setBusy(true);
      try {
        const ok = await verifyPin(pin, {
          hash: admin.pinHash,
          salt: admin.pinSalt,
          iterations: admin.pinIterations,
        });
        if (ok) {
          onSuccess();
        } else {
          setError("Incorrect PIN. Please try again.");
          setPin("");
        }
      } catch (err) {
        console.error("[pin] verification failed", err);
        setError("Could not verify PIN. Please try again.");
      } finally {
        setBusy(false);
      }
      return;
    }

    // setup mode
    if (!isValidPin(pin)) {
      setError(`Choose a ${PIN_LENGTH}-digit PIN.`);
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match.");
      setConfirmPin("");
      return;
    }
    setBusy(true);
    try {
      const cred = await createPinCredential(pin);
      await updateDoc(doc(db, COLLECTIONS.admins, admin.uid), {
        pinHash: cred.hash,
        pinSalt: cred.salt,
        pinIterations: cred.iterations,
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog({
        actorUid: admin.uid,
        actorEmail: admin.email,
        action: "admin.pin_set",
      });
      onSuccess();
    } catch (err) {
      console.error("[pin] could not save PIN", err);
      setError("Could not save PIN. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    !busy &&
    isValidPin(pin) &&
    (mode === "verify" || isValidPin(confirmPin));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center">
            {mode === "setup" ? "Set your security PIN" : "Security verification"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === "setup"
              ? `Create a ${PIN_LENGTH}-digit PIN. You'll be asked for it before sensitive actions.`
              : "Enter your security PIN to continue with this sensitive action."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            {mode === "setup" && (
              <label className="block text-center text-sm font-medium text-muted-foreground">
                New PIN
              </label>
            )}
            <OTPInput
              maxLength={PIN_LENGTH}
              value={pin}
              onChange={setPin}
              pattern={REGEXP_ONLY_DIGITS}
              inputMode="numeric"
              autoFocus
              disabled={busy}
              containerClassName="flex items-center justify-center"
              aria-label={mode === "setup" ? "New security PIN" : "Security PIN"}
            >
              <PinSlots count={pin.length} invalid={!!error} />
            </OTPInput>
          </div>

          {mode === "setup" && (
            <div className="space-y-2">
              <label className="block text-center text-sm font-medium text-muted-foreground">
                Confirm PIN
              </label>
              <OTPInput
                maxLength={PIN_LENGTH}
                value={confirmPin}
                onChange={setConfirmPin}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                disabled={busy}
                containerClassName="flex items-center justify-center"
                aria-label="Confirm security PIN"
              >
                <PinSlots count={confirmPin.length} invalid={!!error} />
              </OTPInput>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {mode === "setup" ? "Save PIN" : "Verify"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
