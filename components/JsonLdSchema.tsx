"use client";

import { useEffect, useState } from "react";

const videoGameSchema = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: "Shadowrun FPS",
  genre: ["First-Person Shooter", "Multiplayer"],
  potentialAction: {
    "@type": "SearchAction",
    target: "https://ShadowrunFPS.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: "FASA Studios",
    image: "https://ShadowrunFPS.com/shadowrun_invite_banner.png",
    datePublished: "2007-05-29",
  },
  description:
    "Shadowrun FPS is a 2007 multiplayer shooter by FASA Studios for Xbox 360 and PC. Join the fan community and keep the game alive!",
  platform: ["Xbox 360", "PC"],
  url: "https://ShadowrunFPS.com",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://ShadowrunFPS.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Events",
      item: "https://www.shadowrunfps.com/docs/events",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Shadowrun PC Install Guide",
      item: "https://www.shadowrunfps.com/docs/install",
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Shadowrun PC Troubleshooting Guide",
      item: "https://www.shadowrunfps.com/docs/troubleshoot",
    },
    {
      "@type": "ListItem",
      position: 5,
      name: "Join the Discord Community",
      item: "discord://discord.com/servers/this-is-shadowrun-930362820627943495",
    },
  ],
};

export default function JsonLdSchema() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(videoGameSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  );
}
