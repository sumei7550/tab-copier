import 'server-only';
import { ApiError, env, sandboxOnly } from './server';
async function accessToken() {
  sandboxOnly();
  const base = 'https://api-m.sandbox.paypal.com';
  const auth = await fetch(`${base}/v1/oauth2/token`, { method: 'POST', headers: {
    Authorization: `Basic ${Buffer.from(`${env('PAYPAL_CLIENT_ID')}:${env('PAYPAL_CLIENT_SECRET')}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }, body: 'grant_type=client_credentials', cache: 'no-store', signal: AbortSignal.timeout(15_000) });
  if (!auth.ok) throw new ApiError('PAYPAL_AUTH_UNAVAILABLE', 503);
  const { access_token } = await auth.json();
  return access_token as string;
}
async function request(access_token:string,path:string,method='GET',data?:unknown,requestId?:string){
  const base='https://api-m.sandbox.paypal.com';
  const response = await fetch(`${base}${path}`, { method, headers: {
    Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json',
    ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
  }, body: data === undefined ? undefined : JSON.stringify(data), cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new ApiError(path.startsWith('/v1/reporting/')&&response.status===403?'PAYPAL_REPORTING_FORBIDDEN':'PAYPAL_REQUEST_FAILED', 502);
  return response.status === 204 ? null : response.json();
}
export function paypalClient(){
  let auth:Promise<string>|undefined;
  return async(path:string,method='GET',data?:unknown,requestId?:string)=>{auth??=accessToken();return request(await auth,path,method,data,requestId);};
}
export async function paypal(path:string,method='GET',data?:unknown,requestId?:string){return paypalClient()(path,method,data,requestId);}
