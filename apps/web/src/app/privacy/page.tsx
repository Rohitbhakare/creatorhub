import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the CreatorHub Privacy Policy. Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm mb-10" style={{ color: '#9C9689' }}>
          Last updated: January 2026
        </p>

        <div className="space-y-8 text-base leading-relaxed" style={{ color: '#6B6660' }}>
          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly, such as your phone number for
              authentication, profile information (name, bio, avatar), and content you create. We also
              collect usage data, device information, and location data (with your permission).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              2. How We Use Your Information
            </h2>
            <p>
              We use your information to provide and improve the Service, process payments, send
              notifications, prevent fraud, and comply with legal obligations. We do not sell your
              personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              3. Authentication
            </h2>
            <p>
              We use Firebase Authentication for phone number verification (OTP). Your phone number is
              used as your primary identifier. We support Google and Apple sign-in as optional
              methods.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              4. Data Storage
            </h2>
            <p>
              Your data is stored in secure cloud infrastructure. Profile images and content media are
              stored in Firebase Storage. Your personal data may be stored on servers located in India
              and/or Singapore.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              5. KYC Information
            </h2>
            <p>
              Creators who publish paid content must complete KYC verification. KYC documents
              (Aadhaar, PAN) are collected and stored securely. This information is used only for
              identity verification and tax compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              6. Third-Party Services
            </h2>
            <p>
              We use third-party services including Firebase (auth and storage), Razorpay (payments),
              Google Maps (location), PostHog (analytics), and Sentry (error tracking). Each service
              has its own privacy policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              7. Your Rights
            </h2>
            <p>
              You have the right to access, correct, or delete your personal data. You can request
              account deletion through the app settings. Certain data may be retained for legal and
              financial compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              8. Cookies and Tracking
            </h2>
            <p>
              Our web presence uses minimal cookies required for functionality. We use analytics to
              understand how the platform is used. You can opt out of analytics tracking in your
              account settings.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              9. Children&rsquo;s Privacy
            </h2>
            <p>
              CreatorHub is not intended for users under 18 years of age. We do not knowingly collect
              personal information from minors. If you believe a minor has provided us with their
              information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: '#2C2823' }}>
              10. Contact
            </h2>
            <p>
              For privacy-related queries, contact our Data Protection Officer at{' '}
              <span style={{ color: '#2C2823' }}>privacy@creatorhub.in</span>.
            </p>
            <p className="mt-4 text-sm p-4 rounded-xl" style={{ backgroundColor: '#F2EEE8', color: '#9C9689' }}>
              Note: This Privacy Policy is a placeholder and will be finalized with legal review and
              compliance with the Digital Personal Data Protection Act, 2023 before public launch.
            </p>
          </section>
        </div>
      </main>

      <footer className="py-6 px-6 mt-8 border-t" style={{ borderColor: '#E5E0D7' }}>
        <div className="flex justify-center gap-4 text-xs" style={{ color: '#9C9689' }}>
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
          <Link href="/community-guidelines" className="hover:underline">Community Guidelines</Link>
        </div>
      </footer>
    </div>
  )
}
