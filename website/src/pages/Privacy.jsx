import React from 'react';
import { SITE_NAME } from '../config';

function Section({ title, children }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 className="h3">{title}</h2>
      <p className="muted" style={{ marginTop: 6 }}>{children}</p>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="container page" style={{ maxWidth: 760 }}>
      <h1 className="h1">Privacy Policy</h1>
      <p className="faint small">Last updated: 2026</p>

      <Section title="Overview">
        {SITE_NAME} helps you discover, rate, and review king-cake bakeries. This policy explains what
        we collect and how it's used, including cookies used for advertising. We keep data collection
        to the minimum needed to run the site and its companion mobile app.
      </Section>

      <Section title="Information we collect">
        When you create an account we store your username, first and last name, and email address.
        When you write reviews we store the review text, your rating, and a timestamp. We also store
        your list of favorited bakeries. Your account and this data are shared with the mobile app.
      </Section>

      <Section title="Location">
        With your permission, the website reads your browser's location to show distance to bakeries and
        sort by proximity. Location is used in your browser only and is never uploaded or shared. You can
        deny or revoke this permission at any time — the site still works, you just won't see distances.
      </Section>

      <Section title="Cookies & advertising">
        This website displays ads through Google AdSense to keep it free. With your consent (via the
        cookie banner), Google and its partners may set and read cookies to serve and measure ads,
        including personalized ads where permitted. You can decline ad cookies in the banner or change
        your browser settings at any time. The mobile app shows only clearly-labeled sponsored
        placements (chosen by us, the same for everyone) and uses no third-party ad network or ad
        tracking. For details on how Google uses data, see Google's advertising and privacy policies.
      </Section>

      <Section title="User-generated content & moderation">
        Reviews are public. To keep content PG, every review is automatically screened before it's
        published, and flagged content is held for human moderation. You can report any review you find
        inappropriate, and moderators can edit, remove, or hold reviews.
      </Section>

      <Section title="How we use your data">
        We use your information solely to operate the service: to authenticate you, display your reviews
        and favorites, compute distances, moderate content, and (on the website) show ads. We do not sell
        your personal data.
      </Section>

      <Section title="Data retention & deletion">
        You can delete your account at any time from your Account page (or in the app). Deleting your
        account permanently removes your profile, reviews, and favorites, and updates affected bakery
        ratings accordingly.
      </Section>

      <Section title="Security">
        Data is stored in Google Firebase with access controlled by security rules: you can only read and
        write your own profile and your own reviews, and only moderators can manage bakery listings and
        moderate content.
      </Section>

      <Section title="Contact">
        Questions about your privacy? Reach out through the King Cake Finder app's in-app support, and
        we'll reply in your inbox.
      </Section>
    </div>
  );
}
