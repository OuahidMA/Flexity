/**
 * Sticky marketing navigation for public pages.
 *
 * Desktop shows inline links plus the login CTA; below `md` the links collapse
 * into a controlled mobile panel. Anchor links (`/#features`) are handled by
 * React Router so they work from any route.
 */
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Dumbbell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLORS = {
  background: "#000000",
  surface: "#202020",
  text: "#FFFFFF",
  textMuted: "#7D7D7D",
  accent: "#FFC000",
  border: "#202020",
};

const NAV_LINKS = [
  { label: "Features", to: "/#features" },
  { label: "Pricing", to: "/#pricing" },
];

/**
 * @param {object} props
 * @param {string} [props.brand="Flexity"] - Brand name shown next to the mark.
 * @returns {JSX.Element} Responsive site header.
 */
export default function Navbar({ brand = "Flexity" }) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b backdrop-blur"
      style={{
        backgroundColor: "rgba(0,0,0,0.8)",
        borderColor: COLORS.border,
        color: COLORS.text,
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-12">
        <Link to="/" className="inline-flex items-center gap-3">
          <span
            className="grid size-9 place-items-center"
            style={{ backgroundColor: COLORS.accent, color: COLORS.background }}
          >
            <Dumbbell className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight uppercase">
            {brand}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className="text-sm transition-colors hover:text-[#FFC000]"
              style={{ color: COLORS.textMuted }}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            render={<Link to="/#contact" />}
            nativeButton={false}
            className="text-sm"
            style={{ color: COLORS.text }}
          >
            Contact
          </Button>
          <Button
            render={<Link to="/login" />}
            nativeButton={false}
            className="h-9 rounded-none px-5 text-xs font-semibold tracking-[0.15em] uppercase"
            style={{ backgroundColor: COLORS.accent, color: COLORS.background }}
          >
            Get started
          </Button>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          className="md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t md:hidden",
          open ? "max-h-96" : "max-h-0"
        )}
        style={{ borderColor: COLORS.border }}
      >
        <nav className="flex flex-col gap-1 px-6 py-4">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={() => setOpen(false)}
              className="py-2 text-sm transition-colors hover:text-[#FFC000]"
              style={{ color: COLORS.textMuted }}
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to="/#contact"
            onClick={() => setOpen(false)}
            className="py-2 text-sm font-semibold"
            style={{ color: COLORS.accent }}
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
