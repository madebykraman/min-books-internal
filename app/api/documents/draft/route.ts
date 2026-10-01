import {NextResponse} from "next/server";
import {saveDraft} from "../../../../lib/data/documents";
import {createClient} from "../../../../lib/supabase/server";

export async function POST(request:Request){
 const supabase=await createClient();
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const body=await request.json();
 if(!body.workspaceId||!body.documentNumber||!body.issueDate||!body.payload)return NextResponse.json({error:"Missing required fields"},{status:400});
 try{return NextResponse.json({data:await saveDraft({...body,actorUserId:user.id})})}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to save draft"},{status:500})}
}