"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Coins,
  Package,
  Store,
  Info,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  useReward,
  useRelatedRewards,
  useRewardEligibility,
  useRedeemReward,
} from "@/hooks/useRewards";
import { useWalletBalance } from "@/hooks/useWallet";
import { ProtectedRoute } from "@/components/auth";
import {
  RewardCard,
  RedeemModal,
  RedemptionSuccess,
  RewardDetailSkeleton,
} from "@/components/rewards";
import { formatCoins } from "@/types/wallet";
import type { Redemption } from "@/types/rewards";

export default function RewardDetailPage() {
  return (
    <ProtectedRoute>
      <RewardDetail />
    </ProtectedRoute>
  );
}

function RewardDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const [modalOpen, setModalOpen] = useState(false);
  const [redemption, setRedemption] = useState<Redemption | null>(null);

  const { data: reward, isLoading, isError } = useReward(slug);
  const { data: related } = useRelatedRewards(slug, Boolean(reward));
  const { data: eligibility } = useRewardEligibility(slug, Boolean(reward));
  const { data: balanceData } = useWalletBalance();
  const redeemMutation = useRedeemReward();

  const errorMessage = useMemo(() => {
    const error = redeemMutation.error as
      | { response?: { data?: { message?: string } } }
      | null;
    return error?.response?.data?.message ?? null;
  }, [redeemMutation.error]);

  const handleConfirm = async () => {
    try {
      const result = await redeemMutation.mutateAsync({ idOrSlug: slug });
      setModalOpen(false);
      setRedemption(result);
    } catch {
      // Error surfaces inside the modal via errorMessage.
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F1]">
        <div className="container-site py-6 md:py-10 max-w-3xl mx-auto">
          <RewardDetailSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !reward) {
    return (
      <div className="min-h-screen bg-[#FFF8F1]">
        <div className="container-site py-10 max-w-3xl mx-auto text-center">
          <p className="font-heading font-extrabold uppercase tracking-tight text-on-surface mb-2">
            Reward not found
          </p>
          <Link
            href="/rewards"
            className="text-sm font-sans text-brand-green underline"
          >
            Back to rewards
          </Link>
        </div>
      </div>
    );
  }

  const soldOut = reward.remainingStock === 0 || reward.status === "SOLD_OUT";
  const canRedeem = eligibility?.eligible ?? false;

  return (
    <div className="min-h-screen bg-[#FFF8F1] pb-28 sm:pb-10">
      <div className="container-site py-6 md:py-10 flex flex-col gap-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/rewards"
            aria-label="Back to rewards"
            className="size-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center border border-white/80 shadow-xs transition-all"
          >
            <ArrowLeft className="size-5 text-on-surface" />
          </Link>
          <h1 className="text-xl md:text-2xl font-heading font-extrabold uppercase text-on-surface tracking-tight line-clamp-1">
            {reward.title}
          </h1>
        </div>

        <div className="rounded-[28px] overflow-hidden bg-stone-100 aspect-[16/9]">
          {reward.bannerImage || reward.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(reward.bannerImage ?? reward.image) as string}
              alt={reward.title}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full flex items-center justify-center text-stone-300">
              <Package className="size-14" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/10 px-4 py-2 text-base font-sans font-extrabold text-brand-green">
            <Coins className="size-4" aria-hidden="true" />
            {formatCoins(reward.coinCost)} coins
          </span>
          {reward.category && (
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-stone-500 border border-white/80">
              {reward.category.name}
            </span>
          )}
          {reward.remainingStock !== null && (
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-stone-400">
              {reward.remainingStock} remaining
            </span>
          )}
        </div>

        {reward.description && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-heading font-extrabold uppercase tracking-tight text-on-surface">
              About
            </h2>
            <p className="text-sm font-sans text-stone-600 leading-relaxed whitespace-pre-line">
              {reward.description}
            </p>
          </section>
        )}

        {reward.stores.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-heading font-extrabold uppercase tracking-tight text-on-surface">
              <Store className="size-4 text-brand-green" aria-hidden="true" />
              Available at
            </h2>
            <ul className="flex flex-wrap gap-2">
              {reward.stores.map((store) => (
                <li
                  key={store.id}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-sans text-stone-600 border border-white/80"
                >
                  {store.name}
                  {store.city ? `, ${store.city}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {reward.terms && (
          <section className="flex flex-col gap-2">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-heading font-extrabold uppercase tracking-tight text-on-surface">
              <Info className="size-4 text-brand-green" aria-hidden="true" />
              Terms
            </h2>
            <p className="text-xs font-sans text-stone-500 leading-relaxed whitespace-pre-line">
              {reward.terms}
            </p>
          </section>
        )}

        {eligibility && !eligibility.eligible && !soldOut && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-xs font-sans text-amber-800"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {eligibility.reason}
              {eligibility.shortBy > 0 &&
                ` — you need ${formatCoins(eligibility.shortBy)} more coins.`}
            </span>
          </div>
        )}

        <div className="hidden sm:block">
          <RedeemButton
            disabled={!canRedeem || soldOut}
            soldOut={soldOut}
            loading={redeemMutation.isPending}
            onClick={() => setModalOpen(true)}
          />
        </div>

        {related && related.length > 0 && (
          <section aria-labelledby="related-heading" className="flex flex-col gap-4 mt-2">
            <h2
              id="related-heading"
              className="text-lg font-heading font-extrabold uppercase text-on-surface tracking-tight"
            >
              You may also like
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((item) => (
                <RewardCard
                  key={item.id}
                  reward={item}
                  balance={balanceData?.balance}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky action bar on mobile keeps the primary action reachable. */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-stone-100 p-4">
        <RedeemButton
          disabled={!canRedeem || soldOut}
          soldOut={soldOut}
          loading={redeemMutation.isPending}
          onClick={() => setModalOpen(true)}
        />
      </div>

      <RedeemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        reward={reward}
        eligibility={eligibility}
        isRedeeming={redeemMutation.isPending}
        error={errorMessage}
      />

      <RedemptionSuccess
        redemption={redemption}
        onClose={() => setRedemption(null)}
      />
    </div>
  );
}

function RedeemButton({
  disabled,
  soldOut,
  loading,
  onClick,
}: {
  disabled: boolean;
  soldOut: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-6 py-4 font-heading text-sm uppercase tracking-wider text-white shadow-soft transition-all hover:bg-brand-green-hover hover:shadow-hover cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {soldOut ? "Sold Out" : "Redeem Reward"}
    </button>
  );
}
