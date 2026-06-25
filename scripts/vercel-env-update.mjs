/**
 * Updates Vercel env vars for all 3 environments (production, preview, development)
 * to point to NEW Supabase project fiseoqdajptkyxaymkli.
 *
 * Usage: node scripts/vercel-env-update.mjs <VERCEL_TOKEN>
 *
 * Get your token at: https://vercel.com/account/tokens
 */

const token = process.argv[2] || process.env.VERCEL_TOKEN
if (!token) {
  console.error('Usage: node scripts/vercel-env-update.mjs <VERCEL_TOKEN>')
  console.error('Or set VERCEL_TOKEN environment variable.')
  process.exit(1)
}

const NEW_URL  = 'https://fiseoqdajptkyxaymkli.supabase.co'
const NEW_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpc2VvcWRhanB0a3l4YXlta2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNTU3NDQsImV4cCI6MjA5NzYzMTc0NH0.cMV3rQ1qpESp8uyiSqkhVHi7niekbkOMvCQy9uaCF1s'
const NEW_SRK  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpc2VvcWRhanB0a3l4YXlta2xpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA1NTc0NCwiZXhwIjoyMDk3NjMxNzQ0fQ.QBCRueq7TuxIB2w7JYF7n6I-TjB9Tkm2xagsvOLkIUo'

const ENVS = ['production', 'preview', 'development']
const BASE  = 'https://api.vercel.com'

const VARS = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL',   value: NEW_URL,  type: 'plain' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: NEW_ANON, type: 'plain' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY',  value: NEW_SRK,  type: 'encrypted' },
  // Also update these if they exist in Vercel (some deployments add explicit copies)
  { key: 'SUPABASE_URL',               value: NEW_URL,  type: 'plain',     optional: true },
  { key: 'SUPABASE_ANON_KEY',          value: NEW_ANON, type: 'plain',     optional: true },
]

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

// 1. Find project
console.log('Fetching Vercel projects...')
const { projects } = await api('GET', '/v9/projects?limit=20')
console.log('Projects found:', projects.map(p => `${p.name} (${p.id})`).join(', '))

// Find eclat-grandeur project (adjust name if different)
const project = projects.find(p =>
  p.name.toLowerCase().includes('eclat') ||
  p.name.toLowerCase().includes('grandeur') ||
  p.name.toLowerCase().includes('eclat-grandeur')
)
if (!project) {
  console.error('Could not identify EclatGrandeur Vercel project. Available:', projects.map(p=>p.name).join(', '))
  process.exit(1)
}
console.log(`Using project: ${project.name} (${project.id})`)
const teamId = project.accountId

// 2. Get existing env vars for this project
const { envs: existing } = await api('GET', `/v9/projects/${project.id}/env?teamId=${teamId}`)
console.log(`\nExisting env vars (${existing.length}):`)
for (const e of existing) {
  console.log(`  ${e.key} [${e.target.join(',')}]`)
}

// Helper to check if var references OLD project
function refersToOld(val) {
  return typeof val === 'string' && val.includes('ieezorhsddcmjqlzxiai')
}

// 3. Update/create each variable for all target environments
console.log('\nUpdating env vars...')
for (const { key, value, type, optional } of VARS) {
  for (const target of ENVS) {
    const existingVar = existing.find(e => e.key === key && e.target.includes(target))

    if (existingVar) {
      // Update existing
      console.log(`  PATCH ${key} [${target}]`)
      await api('PATCH', `/v9/projects/${project.id}/env/${existingVar.id}?teamId=${teamId}`, {
        value,
        type,
        target: existingVar.target, // preserve all existing targets
      }).catch(err => {
        if (optional) { console.log(`    (optional, skipping: ${err.message})`) }
        else throw err
      })
    } else if (!optional) {
      // Create new
      console.log(`  POST ${key} [${target}] (creating)`)
      await api('POST', `/v9/projects/${project.id}/env?teamId=${teamId}`, {
        key,
        value,
        type,
        target: [target],
      }).catch(err => {
        console.warn(`    Warning creating ${key} [${target}]: ${err.message}`)
      })
    }
  }
}

// 4. Verify — re-fetch and confirm no OLD refs in decryptable vars
console.log('\nVerifying updated vars...')
const { envs: updated } = await api('GET', `/v9/projects/${project.id}/env?teamId=${teamId}`)
const supabaseVars = updated.filter(e => e.key.includes('SUPABASE'))
let hasOldRef = false
for (const e of supabaseVars) {
  const val = e.value // encrypted vars show '***'; plain vars show value
  const isOld = refersToOld(val)
  console.log(`  ${e.key} [${e.target.join(',')}] = ${val?.substring(0,60) ?? '(encrypted)'} ${isOld ? '⚠️ STILL OLD' : '✓'}`)
  if (isOld) hasOldRef = true
}

if (hasOldRef) {
  console.error('\n⚠️ Some vars still reference OLD project — check above.')
  process.exit(1)
}

// 5. Trigger production redeployment
console.log('\nTriggering production redeploy...')
const { deployments } = await api('GET', `/v6/deployments?projectId=${project.id}&teamId=${teamId}&limit=1&target=production`)
if (deployments?.[0]) {
  const latest = deployments[0]
  console.log(`  Latest deployment: ${latest.url} (${latest.state})`)
  // Redeploy by creating a new deployment from same git SHA
  const redeploy = await api('POST', `/v13/deployments?teamId=${teamId}`, {
    name: project.name,
    project: project.id,
    gitSource: latest.meta?.githubCommitSha ? {
      type: 'github',
      repoId: project.link?.repoId,
      ref: latest.meta?.githubCommitRef || 'main',
      sha: latest.meta?.githubCommitSha,
    } : undefined,
    target: 'production',
    forceNew: true,
  }).catch(async err => {
    // If git redeploy fails, try instant deploy alias
    console.log(`  Git redeploy failed (${err.message}), trying redeploy from latest...`)
    return api('POST', `/v12/deployments/${latest.uid}/redeploy?teamId=${teamId}`, { target: 'production' })
  })
  console.log(`  Redeployment triggered: ${redeploy.url ?? redeploy.id}`)
  console.log(`  State: ${redeploy.readyState ?? redeploy.status ?? 'queued'}`)
} else {
  console.log('  No existing production deployment found. Push a commit to trigger deploy.')
}

console.log('\n✓ Vercel env update complete.')
