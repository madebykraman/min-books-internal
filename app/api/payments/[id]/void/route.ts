import {NextResponse} from "next/server";
import {createClient} from "../../../../../lib/supabase/server";

export async function POST(
  request:Request,
  {params}:{params:Promise<{id:string}>}
){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});

  const {id}=await params;
  let body:{reason?:string}={};
  try{body=await request.json()}catch{}

  const {data,error}=await supabase.rpc("void_invoice_payment",{
    target_payment:id,
    void_reason:body.reason?.trim()||null
  });
  if(error||!data)return NextResponse.json({error:error?.message||"Unable to void payment"},{status:400});
  return NextResponse.json({data});
}
