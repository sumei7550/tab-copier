import {NextRequest,NextResponse} from 'next/server';
import {adminConfig,requireAdmin,setAdminSession} from '@/lib/admin';
import {verifyAdminPassword} from '@/lib/admin-security';
import {ApiError,body,rateLimit,route,websiteOrigin} from '@/lib/server';
export const runtime='nodejs';
export const GET=route(async req=>{requireAdmin(req);return {authenticated:true};});
export async function POST(req:NextRequest){
  // Keep response cookies intact; ordinary JSON route results cannot carry Set-Cookie.
  let response:NextResponse|undefined;
  const handle=route(async request=>{
    websiteOrigin(request);const config=adminConfig();
    await rateLimit(request,'admin-login',5);
    const {password}=await body(request);
    if(!verifyAdminPassword(password,config.passwordHash))throw new ApiError('ADMIN_UNAUTHORIZED',401);
    response=setAdminSession(NextResponse.json({authenticated:true},{headers:{'Cache-Control':'no-store'}}));
    return {authenticated:true};
  });
  const result=await handle(req,{});return response??result;
}
export async function DELETE(req:NextRequest){
  let response:NextResponse|undefined;
  const handle=route(async request=>{websiteOrigin(request);response=setAdminSession(NextResponse.json({authenticated:false},{headers:{'Cache-Control':'no-store'}}),true);return {authenticated:false};});
  const result=await handle(req,{});return response??result;
}
