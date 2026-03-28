type Result = {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
};

export default function SectionCard({
  label,
  data,
  isRisk,
  isLoading,
  variant = "light",
}: {
  label: string;
  data: Result[] | undefined;
  isRisk: boolean;
  isLoading: boolean;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";

  return (
    <section
      className={`rounded-xl border p-4 shadow-sm ${
        isDark
          ? isRisk
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-zinc-800 bg-zinc-900/40"
          : isRisk
            ? "border-amber-200/80 bg-amber-50/40"
            : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3
          className={`text-sm font-semibold tracking-tight ${
            isDark ? "text-zinc-100" : "text-slate-900"
          }`}
        >
          {label}
        </h3>
        {isLoading && (
          <span className={`text-xs ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
            searching the web...
          </span>
        )}
        {data && !isLoading && (
          <span className={`text-xs ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
            {data.length} sources
          </span>
        )}
      </div>

      {data ? (
        <ul className="space-y-4">
          {data.map((result, i) => (
            <li
              key={`${result.url}-${i}`}
              className={`border-b pb-4 last:border-0 last:pb-0 ${
                isDark ? "border-zinc-800" : "border-slate-100"
              }`}
            >
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  isDark
                    ? "font-medium text-violet-400 hover:underline"
                    : "font-medium text-blue-700 hover:underline"
                }
              >
                {result.title}
              </a>
              {result.publishedDate && (
                <span
                  className={`ml-2 text-xs ${isDark ? "text-zinc-500" : "text-slate-500"}`}
                >
                  {result.publishedDate.slice(0, 10)}
                </span>
              )}
              <p
                className={`mt-1 text-sm leading-relaxed ${
                  isDark ? "text-zinc-300" : "text-slate-700"
                }`}
              >
                {result.snippet}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        !isLoading && (
          <p className={`text-sm ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
            No results found.
          </p>
        )
      )}
    </section>
  );
}
