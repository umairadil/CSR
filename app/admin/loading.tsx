import { Spinner } from "@/components/ui/spinner";

export default function AdminLoading() {
  return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="flex items-center gap-3">
        <Spinner size={28} />
        <span className="text-sm text-muted-foreground">Loading dashboard…</span>
      </div>
    </div>
  );
}



