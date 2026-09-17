import React from 'react';
import { trackSponsorClick } from '../lib/analytics';

const SPONSOR_URL = 'https://kingcakeknives.com';

/**
 * Thin "Sponsored by kingcakeknives.com" bar pinned to the very top of every
 * page (rendered above the navbar). rel="sponsored" marks it as a paid link.
 */
export default function SponsorBar() {
  return (
    <a
      href={SPONSOR_URL}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => trackSponsorClick()}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        background: 'transparent',
        color: 'var(--ink)',
        borderBottom: '1px solid var(--border)',
        padding: '16px',
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.2,
        textAlign: 'center',
        textDecoration: 'none',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '1.6rem' }}>🔪</span>
      <span>
        Sponsored by <strong style={{ color: 'var(--purple)' }}>kingcakeknives.com</strong>
      </span>
    </a>
  );
}
