import { IconDumbbell } from "@tabler/icons-react";

export default function Footer() {
  return (
    <footer className="border-t border-sidebar-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-[8px] bg-gradient-to-br from-primary to-primary-deep">
            <IconDumbbell className="h-3.5 w-3.5 text-white" strokeWidth={2.25} />
          </div>
          <span className="font-medium text-foreground">Flexboard</span>
        </div>
        <p>Copyright © {new Date().getFullYear()} Flexboard Labs. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="transition-colors hover:text-primary">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-primary">
            Terms
          </a>
          <a href="#" className="transition-colors hover:text-primary">
            Help
          </a>
        </div>
      </div>
    </footer>
  );
}