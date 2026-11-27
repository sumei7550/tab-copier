import { NextRequest, NextResponse } from 'next/server';
import { ApiError, body, hash, rpc, sandboxOnly, token, websiteOrigin } from '@/lib/server';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    sandboxOnly(); websiteOrigin(req);
    const { ticket } = await body(req);
    if (typeof ticket !== 'string' || ticket.length !== 43) throw new ApiError('INVALID_TICKET');
    const secret = token();
    const id = await rpc('exchange_checkout', { p_ticket: hash(ticket), p_website: hash(secret) });
    const res = NextResponse.json({ ready: true }, { headers: { 'Cache-Control': 'no-store' } });
    res.cookies.set('tc_checkout', `${id}.${secret}`, { httpOnly: true, secure: req.nextUrl.protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 86400 });
    return res;
  } catch (e) { const x = e instanceof ApiError ? e : new ApiError('INTERNAL_ERROR', 500); return NextResponse.json({ error: x.code }, { status: x.status, headers: { 'Cache-Control': 'no-store' } }); }
}
