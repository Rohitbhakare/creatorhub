import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Community Guidelines',
  description:
    'Read the CreatorHub Community Guidelines. Learn what is expected of creators and travelers on our platform.',
}

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-linen)' }}>
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: '#E5E0D7' }}
      >
        <Link href="/" className="font-serif text-2xl font-bold" style={{ color: '#2C2823' }}>
          CreatorHub
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-serif text-4xl font-bold mb-2" style={{ color: '#2C2823' }}>
          Community Guidelines
        </h1>
        <p className="text-sm mb-10" style={{ color: '#9C9689' }}>
          Last updated: January 2026
        </p>

        <p className="text-base leading-relaxed mb-10" style={{ color: '#6B6660' }}>
          CreatorHub is built on trust between creators and travelers. These guidelines exist to ensure
          that everyone — whether sharing a story or booking an experience — feels safe, respected, and
          inspired.
        </p>

        <div className="space-y-8 text-base leading-relaxed" style={{ color: '#6B6660' }}>
          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              1. Be Authentic
            </h2>
            <p>
              Share real experiences. Do not fabricate itineraries, fake reviews, or misrepresent
              locations. Travelers trust creators to give them honest accounts of places and
              experiences. Misleading content will result in removal and account suspension.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              2. Respect All People and Cultures
            </h2>
            <p>
              CreatorHub celebrates the diversity of India and beyond. Do not post content that
              discriminates against or demeans any person based on religion, caste, gender, ethnicity,
              nationality, disability, or sexual orientation.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              3. Safety First
            </h2>
            <p>
              Do not promote or encourage illegal activities, unsafe travel practices, or reckless
              behaviour. When hosting experiences, creators are responsible for ensuring participant
              safety. Clearly communicate any physical requirements or risks in your listings.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              4. Original Content Only
            </h2>
            <p>
              Only post content you own or have rights to use. Do not plagiarise text, photos, or
              videos from other creators or publications. Properly credit collaborators and
              photographers when their work is featured.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              5. No Spam or Misleading Promotion
            </h2>
            <p>
              Do not post repetitive content, unsolicited promotions, or affiliate links without
              disclosure. Content must be primarily travel-focused. Undisclosed paid promotions violate
              both our guidelines and advertising regulations.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              6. Responsible Reviews
            </h2>
            <p>
              Reviews must reflect genuine personal experiences. Do not post fake reviews — positive or
              negative — for any creator or experience. Review manipulation of any kind will result in
              account termination.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              7. Protect Privacy
            </h2>
            <p>
              Do not share private information about other users without their consent. Avoid posting
              photos of individuals — especially children — without permission. Do not share precise
              locations of private residences or restricted areas.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              8. Responsible Travel
            </h2>
            <p>
              Promote sustainable and responsible travel. Respect local customs, wildlife, and natural
              environments. Do not share content that encourages damage to heritage sites, littering,
              wildlife disturbance, or overtourism of sensitive locations.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              9. Enforcement
            </h2>
            <p>
              Violations of these guidelines may result in content removal, temporary suspension, or
              permanent account termination — depending on severity. We rely on community reporting to
              help us identify violations. Use the report button on any content or profile.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              10. Questions
            </h2>
            <p>
              If you have questions about these guidelines or need to report a violation, contact us
              at <span style={{ color: '#2C2823' }}>safety@creatorhub.in</span>.
            </p>
            <p className="mt-4 text-sm p-4 rounded-xl" style={{ backgroundColor: '#F2EEE8', color: '#9C9689' }}>
              Note: These Community Guidelines are a placeholder and will be expanded before the
              public launch of CreatorHub.
            </p>
          </section>
        </div>
      </main>

      <footer className="py-6 px-6 mt-8 border-t" style={{ borderColor: '#E5E0D7' }}>
        <div className="flex justify-center gap-4 text-xs" style={{ color: '#9C9689' }}>
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  )
}
