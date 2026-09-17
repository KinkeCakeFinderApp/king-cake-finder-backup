import React from 'react';
import { SITE_NAME } from '../config';

function Faq({ q, children }) {
  return (
    <div className="card mt-2">
      <h3 className="h3" style={{ fontSize: '1.05rem' }}>{q}</h3>
      <p className="muted mt-1" style={{ marginTop: 6 }}>{children}</p>
    </div>
  );
}

export default function About() {
  return (
    <div className="container page" style={{ maxWidth: 760 }}>
      <div className="eyebrow">Our story</div>
      <h1 className="h1" style={{ marginTop: 8 }}>About {SITE_NAME}</h1>
      <p className="muted mt-2" style={{ fontSize: '1.1rem' }}>
        {SITE_NAME} helps you find king cakes close to you and compare prices, all in one spot.
      </p>

      <section className="card mt-4">
        <h2 className="h2">How this app came to be</h2>
        <p className="mt-2" style={{ lineHeight: 1.7 }}>
          I wanted to make an app, so I reached out to an app developer contractor over Zoom. We
          discussed the design, flow, and structure, and she told me it would take three months of
          full-time work and cost about $20,000. Another developer gave me the same estimate. That
          was too expensive for my small business, so I put it on the back burner.
        </p>
        <p className="mt-2" style={{ lineHeight: 1.7 }}>
          Then my 13-year-old son started learning to code from YouTube Shorts and built a Minecraft
          mod. That got him thinking about what else he could build. He remembered I'd been on a call
          about this app and said, <em>"I could try to code that, Mom."</em> So he did — for free.
          The first version took three days. Today it's grown into 16,085 lines of code across 185
          files: 16,085 individual pieces, down to small bits like a single button that opens the
          Google Play listing. This is his project, and I am amazed by what he built.
        </p>
      </section>

      <section className="mt-4">
        <h2 className="h2">Frequently asked questions</h2>

        <Faq q="Is this free?">
          Yes — the website and the app are both free. The website has ads; the app has none. Ads
          keep the website free.
        </Faq>

        <Faq q="What if my bakery isn't listed, or the listing isn't right?">
          Contact support in the app, or email{' '}
          <a href="mailto:kingcakeapp@gmail.com">kingcakeapp@gmail.com</a>.
        </Faq>

        <Faq q="The prices aren't right?">
          We built this ourselves. If you find a price that's wrong, contact support or email{' '}
          <a href="mailto:kingcakeapp@gmail.com">kingcakeapp@gmail.com</a>.
        </Faq>

        <Faq q="Why are there sponsored king cakes?">
          Apple charges to put and keep an app on the App Store.
        </Faq>

        <Faq q="Do you store my location?">
          We do not store or sell your location. We do store things like your username and email,
          but we do not sell any of this information.
        </Faq>

        <Faq q="Does the app cost money?">
          No, the app is free.
        </Faq>

        <Faq q="Why are there ads on the website?">
          The ads on the website are specifically to help get people onto the app. The more
          downloads the app gets, the higher up it appears on suggested lists.
        </Faq>

        <Faq q="On Android, the bottom bar is covered by the Android navigation bar?">
          Just swipe left and right to navigate — we're working on fixing this.
        </Faq>

        <Faq q="Your review was taken down or wasn't posted?">
          That's just the automated scan that checks your review is appropriate. If it was taken
          down, you don't need to message moderation about it — a person reviews it and then lets it
          through or denies it.
        </Faq>

        <Faq q="Can an account get deleted?">
          {SITE_NAME} reserves the right to delete accounts with repeated moderation incidents.
        </Faq>
      </section>
    </div>
  );
}
