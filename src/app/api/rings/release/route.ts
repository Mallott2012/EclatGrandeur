import { NextResponse } from 'next/server'
import { z }            from 'zod'
import { releaseDiamond } from '@/lib/diamonds/reservation'

const schema = z.object({
  diamondId: z.string().uuid(),
  cartToken: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const body   = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
    }
    const { diamondId, cartToken } = parsed.data
    await releaseDiamond(diamondId, cartToken)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[release-diamond]', err)
    // Always return ok from the client's perspective — release is best-effort.
    return NextResponse.json({ ok: true })
  }
}
