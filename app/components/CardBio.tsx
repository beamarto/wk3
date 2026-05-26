"use client";

import { useState } from "react";

type CardBioProps = {
  bio: string | null | undefined;
  cardId: string;
};

export default function CardBio({ bio, cardId }: CardBioProps) {
  const [expanded, setExpanded] = useState(false);

  if (!bio?.trim()) return null;

  return (
    <div className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
      <p
        id={`bio-${cardId}`}
        className={expanded ? "" : "line-clamp-3"}
      >
        {bio}
      </p>
      {bio.length > 120 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 font-semibold text-amber-800 hover:underline dark:text-amber-300"
          aria-expanded={expanded}
          aria-controls={`bio-${cardId}`}
        >
          {expanded ? "↑ less" : "… more"}
        </button>
      )}
    </div>
  );
}
