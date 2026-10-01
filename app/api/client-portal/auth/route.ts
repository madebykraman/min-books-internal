import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {randomBytes,scryptSync,timingSafeEqual,createHash} from "node:crypto";
import {createServiceClient} from "@/lib/supabase/service";
import {hashPortalPassword} from "@/lib/client-portal/auth";

function verify(password:string,encoded:string){
  const [scheme,saltHex,keyHex]=String(encoded).split("$");
  if(scheme!=="scrypt"||!saltHex||!keyHex)return false;
  const salt=Buffer.from(saltHex,"hex"),expected=Buffer.from(keyHex,"hex");
  const derived=scryptSync(password,salt,expected.length);
  return timingSafeEqual(derived,expected);
}
function tokenHash(token:string){return createHash("sha256").update(token).digest("hex")}

export async function POST(request:Request){
  const body=await request.json().catch(()=>({}));
  const slug=String(body.slug||"").trim(),password=String(body.password||"");
  if(!slug||!password)return NextResponse.json({error:"Portal and password are required."},{status:400});
  try{
    const supabase=createServiceClient();
    const {data:client}=await supabase.from("clients").select("id,name,portal_enabled,portal_password_hash,portal_slug").eq("portal_slug",slug).maybeSingle();
    if(!client||!client.portal_enabled||!client.portal_password_hash||!verify(password,client.portal_password_hash))return NextResponse.json({error:"Invalid portal credentials."},{status:401});
    const token=randomBytes(32).toString("hex");
    const session=await supabase.from("client_portal_sessions").insert({client_id:client.id,token_hash:tokenHash(token),expires_at:new Date(Date.now()+7*86400000).toISOString()}).select("id,expires_at").single();
    if(session.error)return NextResponse.json({error:session.error.message},{status:500});
    const jar=await cookies();
    jar.set("client_portal_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:7*86400});
    return NextResponse.json({ok:true,expiresAt:session.data.expires_at});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Portal unavailable"},{status:500})}
}
