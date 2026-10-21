/**
 * Standard heading block for dashboard pages.
 *
 * Purely presentational: it receives already-localized copy and optional action
 * nodes, keeping page-level layout consistent without knowing any data.
 *
 * @param {object} props
 * @param {string} [props.eyebrow] - Small contextual label above the title.
 * @param {string} props.title - Page title.
 * @param {string} [props.description] - Supporting copy under the title.
 * @param {React.ReactNode} [props.actions] - Buttons/links aligned to the right.
 * @returns {JSX.Element} Header with a bottom rule.
 */
export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-6">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-normal tracking-[0.28em] text-ink-subtle uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-3 text-3xl leading-[0.95] font-bold text-ink uppercase sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-subtle">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
