import {NextResponse} from "next/server";
import {createClient} from "../../../../lib/supabase/server";
import {getDocument} from "../../../../lib/data/documents";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  try{return NextResponse.json({data:await getDocument((await params).id)})}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Document not found"},{status:404})}
}
