import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ADSENSE_SRC =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX';

/**
 * Injects the Google AdSense (Auto Ads) loader script on every route except
 * /admin. Once injected it stays for the life of the tab — if a superuser
 * lands directly on /admin without visiting another page first, the script
 * never loads at all.
 */
export default function AdsenseLoader() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    if (document.querySelector(`script[src="${ADSENSE_SRC}"]`)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = ADSENSE_SRC;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }, [pathname]);

  return null;
}
