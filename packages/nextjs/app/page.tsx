"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Address, EtherInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, parseEther, parseUnits } from "viem";
import { base } from "viem/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const TAX_RECIPIENT = "0xB2ac59aE04d0f7310dC3519573BF70387b3b6E3a" as const;
const ROUTER_ADDRESS = "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24" as const;
const PAIR_ADDRESS = "0x16048B16Aace160Cdb7dF4De2E20b4d28b5227FA" as const;
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as const;
const YEET_ADDRESS = "0xd369f5884df947030f9e54fc51f7b35d07496b3e" as const;

const formatYeet = (raw: bigint | undefined) => {
  if (raw === undefined) return "—";
  const whole = raw / 10n ** 18n;
  const frac = raw % 10n ** 18n;
  // Show up to 4 decimals
  const fracStr = frac.toString().padStart(18, "0").slice(0, 4).replace(/0+$/, "");
  return fracStr.length > 0 ? `${whole.toString()}.${fracStr}` : whole.toString();
};

const formatEth = (raw: bigint | undefined) => {
  if (raw === undefined) return "—";
  const eth = formatEther(raw);
  // Trim long fractions
  const [w, f] = eth.split(".");
  if (!f) return w;
  return `${w}.${f.slice(0, 6).replace(/0+$/, "") || "0"}`;
};

const HeroSection = () => (
  <div className="bg-base-100 border-b-4 border-primary">
    <div className="max-w-5xl mx-auto px-4 py-12 text-center">
      <div className="text-secondary uppercase tracking-[0.4em] text-sm font-bold mb-3">Sunday Sunday Sunday</div>
      <h1 className="text-5xl sm:text-7xl font-black text-primary uppercase tracking-tight leading-none drop-shadow-lg">
        YEET Token
      </h1>
      <div className="text-3xl sm:text-5xl font-black text-accent uppercase tracking-tight leading-none mt-2">
        Crush. Flatten. Yeet.
      </div>
      <p className="mt-6 text-lg sm:text-xl font-bold text-base-content max-w-3xl mx-auto">
        1% TAX ON EVERY BUY &amp; SELL. ALL TAXIN&rsquo; GOES TO THE VAULT.
      </p>
    </div>
  </div>
);

const TruckStats = ({ connectedAddress }: { connectedAddress?: string }) => {
  const { data: yeetBalance } = useScaffoldReadContract({
    contractName: "YeetToken",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { data: vaultBalance } = useScaffoldReadContract({
    contractName: "YeetToken",
    functionName: "balanceOf",
    args: [TAX_RECIPIENT],
  });

  const { data: token0 } = useScaffoldReadContract({
    contractName: "YeetPair",
    functionName: "token0",
  });

  const { data: reserves } = useScaffoldReadContract({
    contractName: "YeetPair",
    functionName: "getReserves",
  });

  const { ethReserve, yeetReserve } = useMemo(() => {
    if (!reserves || !token0) return { ethReserve: undefined, yeetReserve: undefined };
    const r0 = reserves[0] as bigint;
    const r1 = reserves[1] as bigint;
    const isToken0Weth = (token0 as string).toLowerCase() === WETH_ADDRESS.toLowerCase();
    return {
      ethReserve: isToken0Weth ? r0 : r1,
      yeetReserve: isToken0Weth ? r1 : r0,
    };
  }, [reserves, token0]);

  return (
    <div className="bg-base-200 border-2 border-primary rounded-box p-6">
      <h2 className="text-2xl sm:text-3xl font-black text-primary uppercase tracking-wider mb-4">Truck Stats</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-base-100 rounded-box p-4 border border-primary/30">
          <div className="text-xs uppercase tracking-widest text-secondary font-bold">Your YEET Balance</div>
          <div className="text-2xl font-black text-base-content mt-1">
            {connectedAddress ? formatYeet(yeetBalance as bigint | undefined) : "—"} YEET
          </div>
        </div>
        <div className="bg-base-100 rounded-box p-4 border border-primary/30">
          <div className="text-xs uppercase tracking-widest text-secondary font-bold">Tax Vault Balance</div>
          <div className="text-2xl font-black text-accent mt-1">
            {formatYeet(vaultBalance as bigint | undefined)} YEET
          </div>
        </div>
        <div className="bg-base-100 rounded-box p-4 border border-primary/30">
          <div className="text-xs uppercase tracking-widest text-secondary font-bold">Pair Address</div>
          <div className="mt-1">
            <Address address={PAIR_ADDRESS} chain={base} />
          </div>
        </div>
        <div className="bg-base-100 rounded-box p-4 border border-primary/30">
          <div className="text-xs uppercase tracking-widest text-secondary font-bold">Pool Reserves</div>
          <div className="text-base font-bold text-base-content mt-1">
            {formatEth(ethReserve)} ETH
            <span className="text-primary mx-2">/</span>
            {formatYeet(yeetReserve)} YEET
          </div>
        </div>
      </div>
    </div>
  );
};

const SwapPanel = ({ connectedAddress }: { connectedAddress: string }) => {
  const [buyEth, setBuyEth] = useState("");
  const [sellAmount, setSellAmount] = useState("");

  const triggerMobileDeepLink = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return;
    if (window.ethereum) return; // already in an in-app browser
    setTimeout(() => {
      window.location.href = "metamask://";
    }, 2000);
  }, []);

  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [approvalCooldown, setApprovalCooldown] = useState(false);

  const sellAmountWei = useMemo(() => {
    if (!sellAmount || isNaN(Number(sellAmount))) return 0n;
    try {
      return parseUnits(sellAmount, 18);
    } catch {
      return 0n;
    }
  }, [sellAmount]);

  const { data: allowance, refetch: refetchAllowance } = useScaffoldReadContract({
    contractName: "YeetToken",
    functionName: "allowance",
    args: [connectedAddress, ROUTER_ADDRESS],
  });

  const { writeContractAsync: writeYeet, isMining: isYeetMining } = useScaffoldWriteContract({
    contractName: "YeetToken",
  });
  const { writeContractAsync: writeRouter, isMining: isRouterMining } = useScaffoldWriteContract({
    contractName: "UniswapV2Router",
  });

  const needsApproval = (allowance as bigint | undefined) === undefined || (allowance as bigint) < sellAmountWei;

  const handleBuy = async () => {
    if (!buyEth || Number(buyEth) <= 0) {
      notification.error("Enter an ETH amount to crush buy");
      return;
    }
    try {
      const value = parseEther(buyEth);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
      const writePromise = writeRouter({
        functionName: "swapExactETHForTokensSupportingFeeOnTransferTokens",
        args: [0n, [WETH_ADDRESS, YEET_ADDRESS], connectedAddress as `0x${string}`, deadline],
        value,
      });
      triggerMobileDeepLink();
      await writePromise;
      notification.success("CRUSH BUY confirmed");
      setBuyEth("");
    } catch (e: any) {
      console.error(e);
      notification.error(e?.shortMessage || e?.message || "Buy failed");
    }
  };

  const handleApprove = async () => {
    if (approvalSubmitting || approvalCooldown) return;
    if (sellAmountWei === 0n) {
      notification.error("Enter a YEET amount to approve");
      return;
    }
    setApprovalSubmitting(true);
    try {
      await writeYeet({
        functionName: "approve",
        args: [ROUTER_ADDRESS, sellAmountWei],
      });
      setApprovalCooldown(true);
      setTimeout(() => {
        setApprovalCooldown(false);
        refetchAllowance();
      }, 4000);
    } catch (e: any) {
      console.error(e);
      notification.error(e?.shortMessage || e?.message || "Approval failed");
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const handleSell = async () => {
    if (sellAmountWei === 0n) {
      notification.error("Enter a YEET amount to flatten sell");
      return;
    }
    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
      const writePromise = writeRouter({
        functionName: "swapExactTokensForETHSupportingFeeOnTransferTokens",
        args: [sellAmountWei, 0n, [YEET_ADDRESS, WETH_ADDRESS], connectedAddress as `0x${string}`, deadline],
      });
      triggerMobileDeepLink();
      await writePromise;
      notification.success("FLATTEN SELL confirmed");
      setSellAmount("");
    } catch (e: any) {
      console.error(e);
      notification.error(e?.shortMessage || e?.message || "Sell failed");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* BUY */}
      <div className="bg-base-200 border-2 border-primary rounded-box p-6">
        <h3 className="text-2xl font-black text-primary uppercase tracking-wider mb-1">Crush Buy</h3>
        <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-4">ETH → YEET</p>

        <div className="mb-3">
          <EtherInput placeholder="ETH amount" onValueChange={({ valueInEth }) => setBuyEth(valueInEth)} />
        </div>

        <button
          className="btn btn-primary w-full text-lg font-black uppercase tracking-wider"
          disabled={isRouterMining}
          onClick={handleBuy}
        >
          {isRouterMining ? <span className="loading loading-spinner loading-sm" /> : "🔥 CRUSH BUY"}
        </button>
      </div>

      {/* SELL */}
      <div className="bg-base-200 border-2 border-accent rounded-box p-6">
        <h3 className="text-2xl font-black text-accent uppercase tracking-wider mb-1">Flatten Sell</h3>
        <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-4">YEET → ETH</p>

        <div className="mb-3">
          <input
            type="text"
            inputMode="decimal"
            placeholder="YEET amount"
            value={sellAmount}
            onChange={e => setSellAmount(e.target.value)}
            className="input input-bordered w-full bg-base-100 focus:outline-primary"
          />
        </div>

        {needsApproval ? (
          <button
            className="btn btn-secondary w-full text-lg font-black uppercase tracking-wider"
            disabled={approvalSubmitting || approvalCooldown || isYeetMining}
            onClick={handleApprove}
          >
            {approvalCooldown ? (
              "Confirming..."
            ) : approvalSubmitting || isYeetMining ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Approve YEET"
            )}
          </button>
        ) : (
          <button
            className="btn btn-accent w-full text-lg font-black uppercase tracking-wider"
            disabled={isRouterMining}
            onClick={handleSell}
          >
            {isRouterMining ? <span className="loading loading-spinner loading-sm" /> : "💀 FLATTEN SELL"}
          </button>
        )}
      </div>
    </div>
  );
};

const CarnageFeed = () => {
  const { data: events, isLoading } = useScaffoldEventHistory({
    contractName: "YeetToken",
    eventName: "Transfer",
    fromBlock: 0n,
    watch: true,
    blockData: true,
    filters: { to: TAX_RECIPIENT },
  });

  const taxEvents = useMemo(() => {
    if (!events) return [];
    return events.slice(0, 10);
  }, [events]);

  return (
    <div className="bg-base-200 border-2 border-accent rounded-box p-6">
      <h2 className="text-2xl sm:text-3xl font-black text-accent uppercase tracking-wider mb-4">💥 Carnage Feed</h2>
      <p className="text-xs uppercase tracking-widest text-secondary font-bold mb-4">
        Last 10 tax payments to the vault
      </p>

      {isLoading && taxEvents.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      )}

      {!isLoading && taxEvents.length === 0 && (
        <div className="text-center py-8 text-base-content/60 italic">No carnage yet. Crush something.</div>
      )}

      {taxEvents.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr className="text-secondary uppercase">
                <th>Time</th>
                <th>From</th>
                <th>Amount (YEET)</th>
              </tr>
            </thead>
            <tbody>
              {taxEvents.map((evt: any) => {
                const ts = evt.blockData?.timestamp
                  ? new Date(Number(evt.blockData.timestamp) * 1000).toLocaleString()
                  : "—";
                const value = evt.args?.value as bigint | undefined;
                const from = evt.args?.from as string | undefined;
                return (
                  <tr key={`${evt.transactionHash}-${evt.logIndex}`}>
                    <td className="text-xs whitespace-nowrap">{ts}</td>
                    <td>{from ? <Address address={from as `0x${string}`} chain={base} /> : "—"}</td>
                    <td className="font-bold text-primary">{formatYeet(value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const HomeInner = () => {
  const { isConnected, address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();

  const isWrongNetwork = isConnected && chainId !== base.id;

  return (
    <div className="flex flex-col grow">
      <HeroSection />

      <div className="max-w-5xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        {!isConnected && (
          <div className="bg-base-200 border-2 border-primary rounded-box p-8 text-center">
            <h2 className="text-2xl font-black text-primary uppercase tracking-wider mb-4">Connect to Yeet</h2>
            <p className="mb-4 text-base-content">Hook up your wallet to crush, flatten, and watch the carnage.</p>
            <div className="flex justify-center">
              {openConnectModal ? (
                <button className="btn btn-primary text-lg font-black uppercase" onClick={() => openConnectModal?.()}>
                  Connect Wallet
                </button>
              ) : (
                <RainbowKitCustomConnectButton />
              )}
            </div>
          </div>
        )}

        {isWrongNetwork && (
          <div className="bg-base-200 border-2 border-warning rounded-box p-8 text-center">
            <h2 className="text-2xl font-black text-warning uppercase tracking-wider mb-4">Wrong Network</h2>
            <p className="mb-4 text-base-content">YEET lives on Base. Switch up before yeeting.</p>
            <button
              className="btn btn-warning text-lg font-black uppercase"
              onClick={() => switchChain?.({ chainId: base.id })}
            >
              Switch to Base
            </button>
          </div>
        )}

        <TruckStats connectedAddress={connectedAddress} />

        {isConnected && !isWrongNetwork && connectedAddress && <SwapPanel connectedAddress={connectedAddress} />}

        <CarnageFeed />
      </div>
    </div>
  );
};

const Home: NextPage = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col grow">
        <HeroSection />
      </div>
    );
  }

  return <HomeInner />;
};

export default Home;
