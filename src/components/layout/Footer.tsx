import { Store } from "lucide-react";
export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30 py-10">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-amber text-slate-950 shadow-amber"><Store className="h-5 w-5" /></span>
          UniDrop
        </div>
        <p className="text-sm font-medium tracking-wide">© {new Date().getFullYear()} UniDrop. Built for campus.</p>
      </div>
    </footer>
  );
}
