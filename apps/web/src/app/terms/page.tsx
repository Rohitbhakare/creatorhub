import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the CreatorHub Terms of Service. These terms govern your use of the CreatorHub platform.',
}

export default function TermsPage() {
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

      <main id="main-content" className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-serif text-4xl font-bold mb-2" style={{ color: '#2C2823' }}>
          Terms of Service
        </h1>
        <p className="text-sm mb-10" style={{ color: '#9C9689' }}>
          Last updated: January 2026
        </p>

        <div className="space-y-8 text-base leading-relaxed" style={{ color: '#6B6660' }}>
          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the CreatorHub platform (&ldquo;Service&rdquo;), you agree to be
              bound by these Terms of Service. If you do not agree to these terms, please do not use
              the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              2. Description of Service
            </h2>
            <p>
              CreatorHub is a travel social platform and experience marketplace that allows users to
              share travel stories, discover curated itineraries, and book experiences led by local
              creators across India.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              3. User Accounts
            </h2>
            <p>
              To access certain features of the Service, you must create an account. You are
              responsible for maintaining the confidentiality of your account credentials and for all
              activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              4. Creator Content
            </h2>
            <p>
              Creators are responsible for the accuracy and quality of the content and experiences
              they publish on CreatorHub. By publishing content, creators represent that they have all
              necessary rights and permissions.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              5. Payments and Fees
            </h2>
            <p>
              CreatorHub charges a platform fee of 17% on paid bookings. All prices are displayed
              inclusive of applicable GST (18%). Payouts to creators are processed after experience
              completion and a 48-hour dispute window.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              6. Prohibited Conduct
            </h2>
            <p>
              You agree not to use the Service to post illegal content, harass other users, circumvent
              payment systems, or violate any applicable laws. Violations may result in account
              suspension or termination.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              7. Limitation of Liability
            </h2>
            <p>
              CreatorHub is not liable for the quality, safety, or legality of experiences offered by
              creators. Users engage with experiences at their own risk. Our liability is limited to the
              amount paid for the relevant booking.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              8. Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the
              exclusive jurisdiction of the courts in Bengaluru, Karnataka.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              9. Changes to Terms
            </h2>
            <p>
              We reserve the right to update these Terms at any time. Continued use of the Service
              after changes constitutes acceptance of the updated Terms. We will notify users of
              material changes via the app.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              10. Contact
            </h2>
            <p>
              For questions about these Terms, please contact us at{' '}
              <span style={{ color: '#2C2823' }}>legal@creatorhub.in</span>.
            </p>
            <p className="mt-4 text-sm p-4 rounded-xl" style={{ backgroundColor: '#F2EEE8', color: '#9C9689' }}>
              Note: These Terms of Service are a placeholder and will be finalized with legal review
              before the public launch of CreatorHub.
            </p>
          </section>
        </div>
      </main>

      <footer className="py-6 px-6 mt-8 border-t" style={{ borderColor: '#E5E0D7' }}>
        <div className="flex justify-center gap-4 text-xs" style={{ color: '#9C9689' }}>
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/community-guidelines" className="hover:underline">Community Guidelines</Link>
        </div>
      </footer>
    </div>
  )
}
