import { useEffect, useState } from "react";
import { Save, CheckCircle2, Store } from "lucide-react";
import {
  BUSINESS_FIELD_GROUPS,
  EMPTY_BUSINESS_DETAILS,
  getBusinessDetails,
  saveBusinessDetails,
  type BusinessDetails as Details,
} from "../businessDetails";

const inputClass =
  "mt-1 w-full rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs";

// One-time seller profile: the legal/mandatory Meesho fields that repeat on
// every listing. Saved in the browser and merged into every AI autofill.
export function BusinessDetails() {
  const [details, setDetails] = useState<Details>(EMPTY_BUSINESS_DETAILS);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getBusinessDetails().then((d) => {
      setDetails(d);
      setLoading(false);
    });
  }, []);

  function update(key: keyof Details, value: string) {
    setDetails((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save() {
    await saveBusinessDetails(details);
    setSaved(true);
  }

  if (loading) {
    return <p className="p-4 font-cartoon text-sm">Loading your details…</p>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <Store className="h-5 w-5 stroke-[3px] text-black" />
        <h2 className="font-accent text-xl tracking-wide text-black">Business Details</h2>
      </div>
      <p className="mt-1 font-body text-xs text-black/60">
        Enter these once. Neo fills them into every Meesho listing automatically.
      </p>

      <div className="mt-3 flex flex-col gap-3">
        {BUSINESS_FIELD_GROUPS.map((group) => (
          <fieldset
            key={group.title}
            className="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]"
          >
            <legend className="px-1 font-accent text-sm text-[#ff90e8]">{group.title}</legend>
            <div className="grid gap-2">
              {group.fields.map((f) => (
                <label key={f.key} className="font-cartoon text-xs font-semibold">
                  {f.label}
                  <input
                    className={inputClass}
                    value={details[f.key]}
                    placeholder={f.placeholder}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <button
        onClick={save}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#b2ff59] px-3 py-2.5 font-cartoon text-sm font-bold shadow-[3px_3px_0px_0px_#000] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
      >
        {saved ? <CheckCircle2 className="h-4 w-4 stroke-[3px]" /> : <Save className="h-4 w-4 stroke-[3px]" />}
        {saved ? "Saved!" : "Save details"}
      </button>
    </div>
  );
}
