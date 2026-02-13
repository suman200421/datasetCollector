import { TransportProvider } from "@/context/TransportContext";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <TransportProvider>
      <Stack />
    </TransportProvider>
  );
}
