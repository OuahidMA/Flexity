"use client";;
import { cn } from "@/lib/utils";
import { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { IconMenu2, IconX } from "@tabler/icons-react";

const SidebarContext = createContext(undefined);

const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full border-r border-sidebar-border bg-sidebar px-4 py-4 hidden md:flex md:flex-col w-[300px] shrink-0",
          className
        )}
        animate={{
          width: animate ? (open ? "280px" : "76px") : "280px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "flex flex-row items-center justify-between w-full px-4 h-12 md:hidden border-b border-sidebar-border bg-sidebar",
          className
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-neutral dark:text-neutral-300"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "flex flex-col justify-between fixed inset-0 h-full w-full bg-sidebar p-6 z-[100]",
                className
              )}
            >
              <div
                className="absolute right-6 top-6 z-50 text-neutral dark:text-neutral-300"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}) => {
  const { open, animate } = useSidebar();
  const { pathname } = useLocation();
  const active =
    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

  return (
    <Link
      to={link.href}
      className={cn(
        "group/sidebar flex items-center justify-start gap-2.5 rounded-[12px] px-3 py-2.5 transition-colors",
        active
          ? "bg-primary-subtle text-primary-dark"
          : "text-neutral hover:bg-muted hover:text-foreground",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "shrink-0 [&_svg]:size-5",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        {link.icon}
      </span>

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm font-medium whitespace-pre inline-block !p-0 !m-0 group-hover/sidebar:translate-x-1 transition-transform duration-150"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};