import { IconDumbbell, IconClipboardList, IconListSearch, IconFileDownload } from "@tabler/icons-react";

const features = [
  {
    title: "Instant session tracking",
    desc: "Start a workout in one click and log sets, weights and reps as you lift.",
    icon: <IconDumbbell className="h-5 w-5" />,
  },
  {
    title: "Routine builder",
    desc: "Pre-build Push, Pull and Legs templates and reuse them in seconds.",
    icon: <IconClipboardList className="h-5 w-5" />,
  },
  {
    title: "Exercise library",
    desc: "Browse movements by muscle group with targeting and equipment details.",
    icon: <IconListSearch className="h-5 w-5" />,
  },
  {
    title: "Offline exports",
    desc: "Save completed workouts locally and export PDFs for offline reference.",
    icon: <IconFileDownload className="h-5 w-5" />,
  },
];

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary-subtle px-2.5 py-1 text-xs font-semibold text-primary">
        About Flexboard
      </span>
      <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-foreground">
        A workout planner built for consistency.
      </h1>
      <p className="mt-5 max-w-2xl text-base text-muted-foreground lg:text-lg">
        Flexboard organizes your training around simple routines — Push, Pull
        and Legs — with a clean dashboard designed to get you lifting as fast
        as possible. Your data is stored locally today and will sync to MongoDB
        once the backend is wired up.
      </p>
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-[16px] border border-sidebar-border bg-card p-6 shadow-subtle"
          >
            <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-primary-subtle text-primary">
              {feature.icon}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}