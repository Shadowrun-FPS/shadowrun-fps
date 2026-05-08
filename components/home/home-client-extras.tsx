"use client";

import dynamic from "next/dynamic";

const FeaturedBroadcastEditor = dynamic(
  () =>
    import("@/components/featured-broadcast-editor").then(
      (m) => m.FeaturedBroadcastEditor
    ),
  { ssr: false }
);

export function HomeClientExtras({
  canEditBroadcast,
}: {
  canEditBroadcast: boolean;
}) {
  return (
    <>
      {canEditBroadcast ? <FeaturedBroadcastEditor /> : null}
    </>
  );
}

