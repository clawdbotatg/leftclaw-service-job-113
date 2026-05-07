import React from "react";

const YEET_BASESCAN_URL = "https://basescan.org/token/0xd369f5884df947030f9e54fc51f7b35d07496b3e";

/**
 * Site footer
 */
export const Footer = () => {
  return (
    <div className="min-h-0 py-5 px-1 mb-2 lg:mb-0">
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-2 text-sm w-full">
            <span className="font-bold uppercase tracking-wider text-primary">YEET Token</span>
            <span>—</span>
            <span>Built on Base</span>
            <span>·</span>
            <a href={YEET_BASESCAN_URL} target="_blank" rel="noreferrer" className="link text-secondary">
              Basescan
            </a>
          </div>
        </ul>
      </div>
    </div>
  );
};
