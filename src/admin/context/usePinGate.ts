import { useContext } from "react";
import { PinGateContext, PinGateValue } from "./PinContextObject";

export function usePinGate(): PinGateValue {
  const ctx = useContext(PinGateContext);
  if (!ctx) {
    throw new Error("usePinGate must be used within a <PinGateProvider>.");
  }
  return ctx;
}
