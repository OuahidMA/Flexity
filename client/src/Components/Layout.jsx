"use client";
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconLayoutDashboard,
  IconDumbbell,
  IconListSearch,
  IconFileDownload,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import Footer from "./Footer";

const navGroups = [
  {
    label: "Main",
    links: [
      {
        label: "Dashboard",
        href: "/",
        icon: <IconLayoutDashboard />,
      },
    ],
  },
  {
    label: "Library",
    links: [
      {
        label: "Exercise Library",
        href: "/library",
        icon: <IconListSearch />,
      },
      {
        label: "Saved Workouts",
        href: "/saved",
        icon: <IconFileDownload />,
      },
    ],
  },
];

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-background md:flex-row">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-6 flex flex-col gap-6">
              {navGroups.map((group) => (
                <div key={group.label} className="flex flex-col gap-1">
                  <span className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </span>
                  {group.links.map((link) => (
                    <SidebarLink key={link.label} link={link} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}

const LogoMark = () => (
  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-orange-500 to-orange-700 shadow-micro">
    <IconDumbbell className="h-5 w-5 text-white" strokeWidth={2.25} />
  </div>
);

export const Logo = () => {
  return (
    <Link
      to="/"
      className="relative z-20 flex items-center gap-2.5 px-1 py-1"
    >
      <LogoMark />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display text-lg font-bold tracking-tight whitespace-pre text-foreground"
      >
        Flexboard
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link to="/" className="group/logo relative z-20 flex items-center px-1 py-1">
      <LogoMark />
    </Link>
  );
};