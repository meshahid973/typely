import { AppRouter } from "./AppRouter";
import { AppShell } from "./AppShell";

export function App() {
  return (
    <AppShell>
      <AppRouter />
    </AppShell>
  );
}
