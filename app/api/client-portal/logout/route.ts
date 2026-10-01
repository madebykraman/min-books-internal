import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {createHash} from "node:crypto";
import {createServiceClient} from "@/lib/supabase/service";

export async function POST(){
  const jar=await cookies();const token=jar.get("client_portal_session")?.value;
  if(token){const supabase=createServiceClient();await supabase.from("client_portal_sessions").delete().eq("token_hash",createHash("sha256").update(token).digest("hex"));}
  jar.delete("client_portal_session");
  return NextResponse.json({ok:true});
}
