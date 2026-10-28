# danielrajakumar.com

My personal portfolio: who I am, my resume, the projects I've built, and a way to reach me.

**Live:** [danielrajakumar.com](https://www.danielrajakumar.com)

## What's on it

- **About, Resume, Portfolio, and Contact tabs.** A Blog tab appears once there are posts.
- **Command palette.** Press ⌘K (Ctrl+K on Windows) to jump anywhere.
- **Contact form** that emails me through [Resend](https://resend.com), with a hidden field that catches bots.
- **Case studies** written in Markdown, in `public/case-study/`.
- **Generated preview images** for links shared on social media, plus the site icons.
- **`/text`**, which opens a new text message to me on a phone. My GitHub profile's "Message me" badge links here, since GitHub strips `sms:` links. Computers go to `/message`, a card with my number.

All of the content (profile, experience, projects, skills) lives in [`src/lib/data.ts`](src/lib/data.ts), so updating the site rarely means touching a component.

## Built with

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · deployed on Vercel

## Run it locally

Use Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Then open http://localhost:3000.

## Environment variables

Everything works without these except sending the contact form.

| Variable | What it's for |
| --- | --- |
| `RESEND_API_KEY` | Sends contact form messages |
| `CONTACT_TO_EMAIL` | Where contact form messages go |
| `CONTACT_FROM_EMAIL` | The sender address Resend uses |
| `NEXT_PUBLIC_SITE_URL` | The site's public URL, used in link previews |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `NEXT_PUBLIC_PLAUSIBLE_SRC` | Plausible analytics (optional) |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, `NEXT_PUBLIC_UMAMI_SRC` | Umami analytics (optional) |
| `DEV_SETTINGS_ENABLED` | Set to `true` to turn on the `/dev` settings page |

## Deploying

Changes go to the `preview` branch first, which Vercel deploys as a preview. Merging `preview` into `master` deploys the live site.

## Credits

The layout started from [vCard](https://github.com/codewithsadee/vcard-personal-portfolio) by codewithsadee (MIT license), rebuilt in Next.js and TypeScript.
