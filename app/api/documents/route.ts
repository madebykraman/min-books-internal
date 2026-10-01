import {NextResponse} from "next/server";
import {createClient} from "../../../lib/supabase/server";
import {getDocuments} from "../../../lib/data/documents";

export async function GET(request:Request){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const params=new URL(request.url).searchParams;
  const workspaceId=params.get("workspaceId");
  const type=params.get("type");
  if(type&&type!=="INVOICE"&&type!=="QUOTE")return NextResponse.json({error:"Invalid document type"},{status:400});
  if(!workspaceId)return NextResponse.json({error:"Workspace is required"},{status:400});
  try{return NextResponse.json({data:await getDocuments(workspaceId,type as "INVOICE"|"QUOTE"|undefined)})}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to load invoices"},{status:500})}
}
