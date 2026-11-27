import 'server-only';
import {NextRequest,NextResponse} from 'next/server';
import {ADMIN_SESSION_SECONDS,adminToken,checkAdminToken,validAdminHash} from './admin-security';
import {ApiError,appUrl,env,route,websiteOrigin} from './server';

export function adminConfig(){
  const passwordHash=env('ADMIN_PASSWORD_HASH'),secret=env('TOKEN_DERIVATION_SECRET');
  if(!validAdminHash(passwordHash)||secret.length<32)throw new ApiError('ADMIN_NOT_CONFIGURED',503);
  return {passwordHash,secret,origin:appUrl()};
}
function cookieName(){return appUrl().startsWith('https:')?'__Host-tc_admin':'tc_admin_local';}
export function adminCookie(req:NextRequest){return req.cookies.get(cookieName())?.value;}
export function requireAdmin(req:NextRequest){
  if(!checkAdminToken(adminCookie(req),'session','admin',adminConfig()))throw new ApiError('ADMIN_UNAUTHORIZED',401);
}
export function setAdminSession(res:NextResponse,logout=false){
  res.cookies.set(cookieName(),logout?'':adminToken('session','admin',adminConfig()),{httpOnly:true,secure:appUrl().startsWith('https:'),sameSite:'strict',path:'/',maxAge:logout?0:ADMIN_SESSION_SECONDS});
  return res;
}
export function adminRoute(fn:(req:NextRequest)=>Promise<unknown>){
  return route(async req=>{requireAdmin(req);websiteOrigin(req);return fn(req);});
}
