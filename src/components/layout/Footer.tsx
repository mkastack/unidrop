import { Store } from "lucide-react";
export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30 py-10">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2 font-display font-semibold text-foreground">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-amber text-primary"><Store className="h-4 w-4" /></span>
          Tradie
        </div>
        <p>© {new Date().getFullYear()} Tradie. Built for campus.</p>
      </div>
    </footer>
  );
}
