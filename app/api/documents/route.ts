import {NextResponse} from "next/server";
import {createClient} from "../../../lib/supabase/server";
import {getDocuments} from "../../../lib/data/documents";

export async function GET(request:Request){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const workspaceId=new URL(request.url).searchParams.get("workspaceId");
  if(!workspaceId)return NextResponse.json({error:"Workspace is required"},{status:400});
  try{return NextResponse.json({data:await getDocuments(workspaceId)})}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to load invoices"},{status:500})}
}
