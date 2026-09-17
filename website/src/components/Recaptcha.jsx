import React, { useEffect, useRef } from 'react';
import { RECAPTCHA_SITE_KEY } from '../config';

// Load the reCAPTCHA v2 script once (explicit render mode).
let scriptPromise = null;
function loadRecaptcha() {
  if (window.grecaptcha && window.grecaptcha.render) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.onload = () => {
      const wait = () => {
        if (window.grecaptcha && window.grecaptcha.render) resolve();
        else setTimeout(wait, 50);
      };
      wait();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * reCAPTCHA v2 "I'm not a robot" checkbox. Calls onVerify(token) when solved.
 * Runs before a review is submitted so bots can't post.
 */
export default function Recaptcha({ onVerify, onExpire }) {
  const ref = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadRecaptcha()
      .then(() => {
        if (cancelled || !ref.current || widgetId.current !== null) return;
        widgetId.current = window.grecaptcha.render(ref.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token) => onVerify && onVerify(token),
          'expired-callback': () => onExpire && onExpire(),
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} style={{ minHeight: 78 }} />;
}
