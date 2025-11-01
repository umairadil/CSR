import { Spinner } from "@/components/ui/spinner";

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-md bg-background/80 p-6 shadow-sm">
        <Spinner size={28} />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}



