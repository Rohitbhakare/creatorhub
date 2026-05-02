import type { Metadata } from 'next'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { getSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the CreatorHub Privacy Policy. Learn how we collect, use, and protect your personal information.',
}

export default async function PrivacyPage() {
  const session = await getSession()
  return (
    <>
      <WebHeader session={session} />
      <main id="main-content" className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-serif text-4xl font-bold mb-2" style={{ color: 'var(--ink)' }}>
          Privacy Policy
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--ink-soft)' }}>
          Last updated: January 2026
        </p>

        <div className="space-y-8 text-base leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly, such as your phone number for
              authentication, profile information (name, bio, avatar), and content you create. We also
              collect usage data, device information, and location data (with your permission).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              2. How We Use Your Information
            </h2>
            <p>
              We use your information to provide and improve the Service, process payments, send
              notifications, prevent fraud, and comply with legal obligations. We do not sell your
              personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              3. Authentication
            </h2>
            <p>
              We use Firebase Authentication for phone number verification (OTP). Your phone number is
              used as your primary identifier. We support Google and Apple sign-in as optional
              methods.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              4. Data Storage
            </h2>
            <p>
              Your data is stored in secure cloud infrastructure. Profile images and content media are
              stored in Firebase Storage. Your personal data may be stored on servers located in India
              and/or Singapore.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              5. KYC Information
            </h2>
            <p>
              Creators who publish paid content must complete KYC verification. KYC documents
              (Aadhaar, PAN) are collected and stored securely. This information is used only for
              identity verification and tax compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              6. Third-Party Services
            </h2>
            <p>
              We use third-party services including Firebase (auth and storage), Razorpay (payments),
              Google Maps (location), PostHog (analytics), and Sentry (error tracking). Each service
              has its own privacy policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              7. Your Rights
            </h2>
            <p>
              You have the right to access, correct, or delete your personal data. You can request
              account deletion through the app settings. Certain data may be retained for legal and
              financial compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              8. Cookies and Tracking
            </h2>
            <p>
              Our web presence uses minimal cookies required for functionality. We use analytics to
              understand how the platform is used. You can opt out of analytics tracking in your
              account settings.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              9. Children&rsquo;s Privacy
            </h2>
            <p>
              CreatorHub is not intended for users under 18 years of age. We do not knowingly collect
              personal information from minors. If you believe a minor has provided us with their
              information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--ink)' }}>
              10. Contact
            </h2>
            <p>
              For privacy-related queries, contact our Data Protection Officer at{' '}
              <span style={{ color: 'var(--ink)' }}>privacy@creatorhub.in</span>.
            </p>
            <p className="mt-4 text-sm p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--ink-soft)' }}>
              Note: This Privacy Policy is a placeholder and will be finalized with legal review and
              compliance with the Digital Personal Data Protection Act, 2023 before public launch.
            </p>
          </section>
        </div>
      </main>

      <WebFooter />
    </>
  )
}
