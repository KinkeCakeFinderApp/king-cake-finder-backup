import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import BakeryCard from './BakeryCard';

/**
 * Featured "Sponsored" bakeries — up to 5, chosen by an admin (via the star in
 * the Admin bakery list). Shown above the ad slots. Renders nothing when no
 * bakery is featured, so it never leaves an empty gap.
 */
export default function SponsoredRow() {
  const { bakeries } = useData();
  const sponsored = useMemo(
    () => bakeries.filter((b) => b.sponsored).slice(0, 5),
    [bakeries]
  );
  if (sponsored.length === 0) return null;

  return (
    <section className="mt-4" aria-label="Sponsored bakeries">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 className="h2">⭐ Sponsored</h2>
        <span className="small faint">Featured listings</span>
      </div>
      <div className="results mt-3">
        {sponsored.map((b) => <BakeryCard key={b.id} bakery={b} sponsored />)}
      </div>
    </section>
  );
}
