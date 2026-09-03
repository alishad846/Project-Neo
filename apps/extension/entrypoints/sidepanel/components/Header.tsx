export function Header({ onLogout }: { onLogout?: () => void }) {
  return (
    <header className="border-b-4 border-black bg-[#ff90e8]">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <h1 className="font-display text-2xl tracking-wide text-black drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
          NEO
        </h1>
        <div className="flex items-center gap-2">
          <span className="rounded-full border-2 border-black bg-[#ffeb3b] px-2 py-1 font-body text-[10px] font-semibold">
            Catalogue compiler
          </span>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border-2 border-black bg-white px-2 py-1 font-body text-[10px] font-semibold text-black/70 transition-all hover:-translate-y-0.5"
            >
              Log out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
