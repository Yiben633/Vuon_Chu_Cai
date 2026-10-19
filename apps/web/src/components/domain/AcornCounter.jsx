import { assets } from "../../assets/assetRegistry.js";

export function AcornCounter({ value = null }) {
  return (
    <div className="inline-flex min-h-14 items-center gap-2 rounded-full bg-[#fff7ed] px-4 font-display font-extrabold text-[#7c2d12]">
      <img alt="" aria-hidden="true" className="h-7 w-7" src={assets.acorn} />
      <span>{value ?? "..."}</span>
    </div>
  );
}
