// A believable, plain "Add Product" form that mirrors a marketplace seller
// panel. This is the autofill target for the Neo extension's content script:
// it matches on these exact element ids, so they must not change casually.
//
//   #title          — input
//   #description    — textarea
//   #hsnCode        — input
//   #sellingPrice   — input
//   #submit         — button, type="button" (never navigates the page)

export function Demo() {
  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-10 text-[#1a1a1a]">
      <div className="mx-auto max-w-xl rounded-md border border-[#d0d0d0] bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Demo &middot; Add Product</h1>
        <p className="mb-6 text-sm text-[#555]">
          Open the Neo extension side panel &rarr; AI Composer &rarr; Autofill to fill this form.
        </p>

        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="text-sm font-medium text-[#333]">
              Product title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Printed Cotton Kurti"
              className="rounded border border-[#c9c9c9] px-3 py-2 text-sm outline-none focus:border-[#888]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-[#333]">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              placeholder="Describe the product..."
              className="resize-y rounded border border-[#c9c9c9] px-3 py-2 text-sm outline-none focus:border-[#888]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="hsnCode" className="text-sm font-medium text-[#333]">
                HSN code
              </label>
              <input
                id="hsnCode"
                name="hsnCode"
                type="text"
                placeholder="e.g. 6204"
                className="rounded border border-[#c9c9c9] px-3 py-2 text-sm outline-none focus:border-[#888]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="sellingPrice" className="text-sm font-medium text-[#333]">
                Selling price (&#8377;)
              </label>
              <input
                id="sellingPrice"
                name="sellingPrice"
                type="text"
                placeholder="e.g. 699"
                className="rounded border border-[#c9c9c9] px-3 py-2 text-sm outline-none focus:border-[#888]"
              />
            </div>
          </div>

          <button
            id="submit"
            type="button"
            className="mt-2 self-start rounded bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white hover:bg-[#333]"
          >
            Submit listing
          </button>
        </form>
      </div>
    </main>
  );
}
