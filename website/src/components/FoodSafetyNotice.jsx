import React from 'react';

/**
 * Food-safety warning shown on every bakery page: the hidden baby/trinket
 * choking hazard, allergens, and that we don't make or inspect the food.
 */
export default function FoodSafetyNotice() {
  return (
    <div
      style={{
        background: 'var(--gold-soft)',
        border: '1px solid var(--gold)',
        borderRadius: 'var(--radius)',
        padding: 14,
        margin: '16px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: 'var(--ink)' }}>
        <span aria-hidden="true">⚠️</span> Before you eat
      </div>
      <p className="small" style={{ color: 'var(--ink)', marginTop: 6, lineHeight: 1.5 }}>
        <strong>Choking hazard:</strong> many king cakes hide a small plastic baby, bean, or trinket
        inside. Cut and eat carefully, warn your guests, and keep pieces away from young children.<br />
        <strong>Allergens:</strong> king cakes commonly contain wheat/gluten, eggs, and dairy, and may
        contain or be made near nuts, soy, or other allergens. If you have a food allergy, check with
        the bakery before eating.<br />
        <strong>No guarantee:</strong> King Cake Finder lists bakeries but does not make, inspect, or
        guarantee any food. Some listings are home bakers who may not be licensed or inspected — you eat
        at your own risk.
      </p>
    </div>
  );
}
