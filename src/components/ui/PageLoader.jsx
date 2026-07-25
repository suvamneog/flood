export default function PageLoader() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4"
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary-200 border-t-primary-600 dark:border-primary-900 dark:border-t-primary-400" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Loading…
      </p>
    </div>
  )
}
