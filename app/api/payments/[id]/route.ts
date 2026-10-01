import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const supabase=await createClient(); const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {id}=await params;
 const {data,error}=await supabase.from("payments").select("*,clients(name,email,company),payment_allocations(amount_minor,document_id,documents(document_number,issue_date,due_date,currency,draft_payload))").eq("id",id).single();
 if(error||!data)return NextResponse.json({error:error?.message||"Payment not found"},{status:404});
 return NextResponse.json({data});
}