import { TransportMode } from "@/types/sensor";
import React, { createContext, useContext, useState } from "react";

interface TransportContextValue {
  mode: TransportMode;
  setMode: (mode: TransportMode) => void;
}

const TransportContext = createContext<TransportContextValue | null>(null);

export function TransportProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<TransportMode>("standing");

  return (
    <TransportContext.Provider value={{ mode, setMode }}>
      {children}
    </TransportContext.Provider>
  );
}

export function useTransport() {
  const ctx = useContext(TransportContext);
  if (!ctx) {
    throw new Error("useTransport must be used inside TransportProvider");
  }
  return ctx;
}
