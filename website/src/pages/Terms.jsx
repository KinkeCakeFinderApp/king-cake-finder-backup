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

export default function Terms() {
  return (
    <div className="container page" style={{ maxWidth: 760 }}>
      <h1 className="h1">Terms of Service</h1>
      <p className="faint small">Last updated: 2026</p>

      <Section title="Acceptance">
        By creating an account or using {SITE_NAME}, you agree to these Terms of Service and to our
        Privacy Policy. If you don't agree, please don't use the service.
      </Section>

      <Section title="Who can use King Cake Finder">
        You must be old enough to form a binding agreement in your location. You're responsible for
        keeping your account secure and for activity under it. One account works on both the website
        and the mobile app.
      </Section>

      <Section title="Community rules — zero tolerance">
        {SITE_NAME} has zero tolerance for objectionable content or abusive behavior. You agree not to
        post reviews or content that are unlawful, hateful, harassing, threatening, sexually explicit,
        defamatory, spam, or that infringe others' rights. Every review is automatically screened
        before publishing, you can report any review, and we may remove content, and suspend or
        terminate accounts, at our discretion. We aim to act on reports of objectionable content
        promptly (within 24 hours).
      </Section>

      <Section title="Your content">
        You keep ownership of what you post, but you grant us a license to display and distribute it
        within the service. Reviews and ratings are the personal opinions of the people who wrote them —
        not ours — and we don't verify their accuracy.
      </Section>

      <Section title="Food, allergens & health disclaimer">
        {SITE_NAME} is a discovery and listing service. We do not make, handle, sell, inspect, or
        guarantee any food, and we're not responsible for what any bakery sells or serves. IMPORTANT:
        many king cakes contain a small plastic baby, bean, or trinket baked or placed inside, which is
        a choking hazard — cut and eat carefully and keep pieces away from young children. King cakes
        commonly contain allergens including wheat/gluten, eggs, and dairy, and may contain or be
        prepared near nuts, soy, and others. Some listings are home bakers who may not be licensed or
        inspected. Always confirm ingredients and allergens directly with the bakery. You purchase and
        consume food at your own risk.
      </Section>

      <Section title="Listing accuracy — hours, prices & availability">
        {SITE_NAME} does not operate, manage, or guarantee the accuracy of any bakery's inventory,
        pricing, or hours. Prices, variations, and hours shown are submitted by bakery owners or the
        community and can change without notice — especially during peak Mardi Gras season, when king
        cakes commonly sell out. We cannot guarantee that a bakery will have king cakes available when
        you arrive, that listed prices are current, or that posted hours are accurate. Always call ahead
        before visiting.
      </Section>

      <Section title="Advertising">
        The website is free and supported by ads (including Google AdSense) and sponsored placements,
        which are labeled where they appear. See the Privacy Policy for how ad cookies work and how to
        manage your consent.
      </Section>

      <Section title="No warranty & limitation of liability">
        The service is provided "as is" without warranties of any kind. To the fullest extent allowed by
        law, {SITE_NAME} is not liable for any injury, illness, allergic reaction, or other loss arising
        from food you buy or eat, from bakery listings, or from your use of the service.
      </Section>

      <Section title="Changes & termination">
        We may update these terms or the service over time; continued use means you accept the changes.
        We may suspend or end access for violations of these terms. You can delete your account any time
        from your Account page (or in the app).
      </Section>

      <Section title="Contact">
        Questions about these terms? Reach out through the King Cake Finder app's in-app support, and
        we'll reply in your inbox.
      </Section>
    </div>
  );
}
