import {NextResponse} from "next/server";
import {saveDraft} from "../../../../lib/data/documents";
import {createClient} from "../../../../lib/supabase/server";
import {validateInvoiceInput} from "../../../../lib/domain/calculations";

export async function POST(request:Request){
 const supabase=await createClient();
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const body=await request.json();
 if(!body.workspaceId||!body.documentNumber||!body.issueDate||!body.payload)return NextResponse.json({error:"Missing required fields"},{status:400});
 try{validateInvoiceInput(body.payload.items)}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid invoice lines"},{status:400})}
 const documentType=body.documentType??"INVOICE";
 if(documentType!=="INVOICE"&&documentType!=="QUOTE")return NextResponse.json({error:"Invalid document type"},{status:400});
 try{return NextResponse.json({data:await saveDraft({...body,documentType,actorUserId:user.id})})}
 catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to save draft"},{status:500})}
}