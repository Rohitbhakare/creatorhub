// One-shot: find the seeded super_admin row and provision a Firebase
// Auth credential (emulator or real) with a fresh temp password. Prints
// the temp password once. Idempotent — rerunning issues a new temp.
//
// Usage (from apps/api):
//   pnpm tsx scripts/seed-admin-firebase.ts rohitbhakare@gmail.com

import { supabase } from '../src/lib/supabase.js'
import { provisionFirebaseAdmin } from '../src/services/admin-auth.service.js'

async function main(): Promise<void> {
  const email = process.argv[2] ?? 'rohitbhakare@gmail.com'

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (error) throw new Error(`admin_users lookup failed: ${error.message}`)
  if (!data) throw new Error(`no admin_users row for ${email} (run migration 018)`)

  const { tempPassword, firebaseUid } = await provisionFirebaseAdmin(data.id, data.email)

  console.log('────────────────────────────────────────')
  console.log(`Admin:         ${data.email}`)
  console.log(`Role:          ${data.role}`)
  console.log(`Firebase UID:  ${firebaseUid}`)
  console.log(`Temp password: ${tempPassword}`)
  console.log('────────────────────────────────────────')
  console.log('must_change_password is now true — first login forces /change-password')
}

main().catch((err: unknown) => {
  console.error('FAIL:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
