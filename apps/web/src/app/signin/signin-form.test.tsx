import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent, waitFor, fireEvent } from '@/test-helpers'

// Replace router so we can assert redirects.
const mockReplace = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    refresh: mockRefresh,
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/signin',
  useSearchParams: () => new URLSearchParams(),
}))

// Stub Firebase. Each test installs its own happy/sad behaviour via
// vi.mocked(firebase.sendPhoneOtp).mockResolvedValueOnce(...).
vi.mock('@/lib/firebase-client', () => ({
  isFirebaseConfigured: () => true,
  sendPhoneOtp: vi.fn(),
  verifyPhoneOtp: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
}))

// Stub the client-error pipe — we don't care about it ringing during tests.
vi.mock('@/lib/report-client-error', () => ({
  reportClientError: vi.fn(),
}))

import { SignInForm } from './signin-form'
import * as firebase from '@/lib/firebase-client'

describe('SignInForm', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockRefresh.mockClear()
    vi.mocked(firebase.sendPhoneOtp).mockReset()
    vi.mocked(firebase.verifyPhoneOtp).mockReset()
    vi.mocked(firebase.signInWithGoogle).mockReset()
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ onboardingComplete: true }), {
        status: 200,
      }),
    )
  })

  it('renders the 3-tab bar with Email selected by default + Forgot-password link', () => {
    render(<SignInForm next="/feed" />)
    expect(screen.getByRole('tab', { name: 'Email' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Phone' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Google' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Forgot password/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
  })

  it('rejects an obviously bad phone number before talking to Firebase', async () => {
    const user = userEvent.setup()
    render(<SignInForm next="/feed" />)
    await user.click(screen.getByRole('tab', { name: 'Phone' }))
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '12345' },
    })
    await user.click(screen.getByRole('button', { name: /Send code/i }))
    await waitFor(() => {
      expect(
        screen.getByText(/Enter a valid phone with country code/i),
      ).toBeInTheDocument()
    })
    expect(firebase.sendPhoneOtp).not.toHaveBeenCalled()
  })

  it('happy path: phone → OTP → /api/auth/signin → router.replace', async () => {
    vi.mocked(firebase.sendPhoneOtp).mockResolvedValue({
      confirmation: {} as unknown as Awaited<
        ReturnType<typeof firebase.sendPhoneOtp>
      >['confirmation'],
    })
    vi.mocked(firebase.verifyPhoneOtp).mockResolvedValue(
      'fake-firebase-id-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    )

    const user = userEvent.setup()
    render(<SignInForm next="/feed" />)
    await user.click(screen.getByRole('tab', { name: 'Phone' }))

    // Set the phone value via fireEvent.change rather than user.type —
    // user.type on controlled inputs in jsdom occasionally drops keypresses
    // when React 19 batches state with a startTransition wrapped submit.
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+919876543210' },
    })
    await user.click(screen.getByRole('button', { name: /Send code/i }))

    await waitFor(() => {
      expect(firebase.sendPhoneOtp).toHaveBeenCalledWith('+919876543210')
    })
    // OTP screen renders
    await waitFor(() => {
      expect(screen.getByLabelText(/6-digit code/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/6-digit code/i), {
      target: { value: '123456' },
    })
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/signin',
        expect.objectContaining({
          method: 'POST',
          credentials: 'same-origin',
        }),
      )
    })
    const firstCall = vi.mocked(global.fetch).mock.calls[0]
    if (!firstCall) throw new Error('expected /api/auth/signin to be called')
    const init = firstCall[1] as RequestInit
    const body = JSON.parse(init.body as string) as {
      firebase_token: string
      device_info: { platform: string }
    }
    expect(body.firebase_token).toMatch(/^fake-firebase-id-token/)
    expect(body.device_info.platform).toBe('web')
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/feed')
    })
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('first-time user (onboardingComplete=false) routes to /onboarding/profile', async () => {
    vi.mocked(firebase.sendPhoneOtp).mockResolvedValue({
      confirmation: {} as unknown as Awaited<
        ReturnType<typeof firebase.sendPhoneOtp>
      >['confirmation'],
    })
    vi.mocked(firebase.verifyPhoneOtp).mockResolvedValue('id-token-xxxxxxxxxxxxxxxxxxxxxxx')
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ onboardingComplete: false }), {
        status: 200,
      }),
    )

    const user = userEvent.setup()
    render(<SignInForm next="/feed" />)
    await user.click(screen.getByRole('tab', { name: 'Phone' }))
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+919876543210' },
    })
    await user.click(screen.getByRole('button', { name: /Send code/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/6-digit code/i)).toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText(/6-digit code/i), {
      target: { value: '123456' },
    })
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding/profile')
    })
  })

  it('surfaces the API detail when /api/auth/signin returns 4xx', async () => {
    vi.mocked(firebase.sendPhoneOtp).mockResolvedValue({
      confirmation: {} as unknown as Awaited<
        ReturnType<typeof firebase.sendPhoneOtp>
      >['confirmation'],
    })
    vi.mocked(firebase.verifyPhoneOtp).mockResolvedValue('id-token-xxxxxxxxxxxxxxxxxxxxxxx')
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Account locked' }), {
        status: 403,
      }),
    )

    const user = userEvent.setup()
    render(<SignInForm next="/feed" />)
    await user.click(screen.getByRole('tab', { name: 'Phone' }))
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+919876543210' },
    })
    await user.click(screen.getByRole('button', { name: /Send code/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/6-digit code/i)).toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText(/6-digit code/i), {
      target: { value: '123456' },
    })
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('Account locked')).toBeInTheDocument()
    })
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('surfaces friendly() copy for known Firebase auth/* error codes', async () => {
    vi.mocked(firebase.sendPhoneOtp).mockRejectedValue(
      Object.assign(new Error('boom'), { code: 'auth/too-many-requests' }),
    )

    const user = userEvent.setup()
    render(<SignInForm next="/feed" />)
    await user.click(screen.getByRole('tab', { name: 'Phone' }))
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+919876543210' },
    })
    await user.click(screen.getByRole('button', { name: /Send code/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/Too many attempts — wait a minute/i),
      ).toBeInTheDocument()
    })
  })

  it('clicks Continue with Google → /api/auth/signin with the Google id token', async () => {
    vi.mocked(firebase.signInWithGoogle).mockResolvedValue(
      'google-id-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    )

    const user = userEvent.setup()
    render(<SignInForm next="/feed" />)
    await user.click(screen.getByRole('tab', { name: 'Google' }))
    await user.click(
      screen.getByRole('button', { name: /Continue with Google/i }),
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/signin',
        expect.objectContaining({ method: 'POST' }),
      )
    })
    const firstCall = vi.mocked(global.fetch).mock.calls[0]
    if (!firstCall) throw new Error('expected /api/auth/signin to be called')
    const init = firstCall[1] as RequestInit
    const body = JSON.parse(init.body as string) as { firebase_token: string }
    expect(body.firebase_token).toMatch(/^google-id-token/)
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/feed')
    })
  })

  it('"Change" goes back from OTP screen to phone screen', async () => {
    vi.mocked(firebase.sendPhoneOtp).mockResolvedValue({
      confirmation: {} as unknown as Awaited<
        ReturnType<typeof firebase.sendPhoneOtp>
      >['confirmation'],
    })

    const user = userEvent.setup()
    render(<SignInForm next="/feed" />)
    await user.click(screen.getByRole('tab', { name: 'Phone' }))
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+919876543210' },
    })
    await user.click(screen.getByRole('button', { name: /Send code/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/6-digit code/i)).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /Change/i }))
    await waitFor(() => {
      expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument()
    })
  })
})
