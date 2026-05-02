import type { Metadata } from 'next'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { getSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Community Guidelines',
  description:
    'Read the CreatorHub Community Guidelines. Learn what is expected of creators and travelers on our platform.',
}

export default async function CommunityGuidelinesPage() {
  const session = await getSession()
  return (
    <>
      <WebHeader session={session} />
      <main id="main-content" className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-serif text-4xl font-bold mb-2" style={{ color: 'var(--ink)' }}>
          Community Guidelines
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--ink-soft)' }}>
          Last updated: January 2026
        </p>

        <p className="text-base leading-relaxed mb-10" style={{ color: 'var(--ink-soft)' }}>
          CreatorHub is built on trust between creators and travelers. These guidelines exist to ensure
          that everyone — whether sharing a story or booking an experience — feels safe, respected, and
          inspired.
        </p>

        <div className="space-y-8 text-base leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              1. Be Authentic
            </h2>
            <p>
              Share real experiences. Do not fabricate itineraries, fake reviews, or misrepresent
              locations. Travelers trust creators to give them honest accounts of places and
              experiences. Misleading content will result in removal and account suspension.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              2. Respect All People and Cultures
            </h2>
            <p>
              CreatorHub celebrates the diversity of India and beyond. Do not post content that
              discriminates against or demeans any person based on religion, caste, gender, ethnicity,
              nationality, disability, or sexual orientation.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              3. Safety First
            </h2>
            <p>
              Do not promote or encourage illegal activities, unsafe travel practices, or reckless
              behaviour. When hosting experiences, creators are responsible for ensuring participant
              safety. Clearly communicate any physical requirements or risks in your listings.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              4. Original Content Only
            </h2>
            <p>
              Only post content you own or have rights to use. Do not plagiarise text, photos, or
              videos from other creators or publications. Properly credit collaborators and
              photographers when their work is featured.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              5. No Spam or Misleading Promotion
            </h2>
            <p>
              Do not post repetitive content, unsolicited promotions, or affiliate links without
              disclosure. Content must be primarily travel-focused. Undisclosed paid promotions violate
              both our guidelines and advertising regulations.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              6. Responsible Reviews
            </h2>
            <p>
              Reviews must reflect genuine personal experiences. Do not post fake reviews — positive or
              negative — for any creator or experience. Review manipulation of any kind will result in
              account termination.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              7. Protect Privacy
            </h2>
            <p>
              Do not share private information about other users without their consent. Avoid posting
              photos of individuals — especially children — without permission. Do not share precise
              locations of private residences or restricted areas.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              8. Responsible Travel
            </h2>
            <p>
              Promote sustainable and responsible travel. Respect local customs, wildlife, and natural
              environments. Do not share content that encourages damage to heritage sites, littering,
              wildlife disturbance, or overtourism of sensitive locations.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              9. Enforcement
            </h2>
            <p>
              Violations of these guidelines may result in content removal, temporary suspension, or
              permanent account termination — depending on severity. We rely on community reporting to
              help us identify violations. Use the report button on any content or profile.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              10. Questions
            </h2>
            <p>
              If you have questions about these guidelines or need to report a violation, contact us
              at <span style={{ color: 'var(--ink)' }}>safety@creatorhub.in</span>.
            </p>
            <p className="mt-4 text-sm p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--ink-soft)' }}>
              Note: These Community Guidelines are a placeholder and will be expanded before the
              public launch of CreatorHub.
            </p>
          </section>
        </div>
      </main>

      <WebFooter />
    </>
  )
}
