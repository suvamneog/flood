export default function Badge({ children, className = '', toneDot }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-bold tracking-wide ${className}`}
    >
      {toneDot ? (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${toneDot}`}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  )
}
