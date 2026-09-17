import React from 'react';

function Cake({ filled, size }) {
  const color = filled ? '#C99A2E' : '#E4DBCB';
  // A ring / king-cake glyph (outer circle with a hole via even-odd fill).
  return (
    <svg className="cake" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 6a4 4 0 110 8 4 4 0 010-8z"
        fill={color}
      />
    </svg>
  );
}

/**
 * 1–5 king-cake rating. Display mode shows the average (with optional value +
 * count); interactive mode lets the user tap to choose a whole-number rating.
 */
export default function KingCakeRating({
  value = 0, interactive = false, onChange, size = 18, showValue = false, count,
}) {
  const rounded = Math.round(value);
  return (
    <span className={`kc-rating${interactive ? ' interactive' : ''}`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = interactive ? i <= value : i <= rounded;
        if (!interactive) return <Cake key={i} filled={filled} size={size} />;
        return (
          <span
            key={i}
            role="button"
            tabIndex={0}
            aria-label={`Rate ${i} out of 5`}
            onClick={() => onChange && onChange(i)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange && onChange(i); } }}
            style={{ display: 'inline-flex' }}
          >
            <Cake filled={filled} size={size} />
          </span>
        );
      })}
      {showValue && !interactive ? (
        <span className="val">
          {value ? value.toFixed(1) : 'New'}
          {typeof count === 'number' && count > 0 ? <span className="cnt">{`  (${count})`}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
