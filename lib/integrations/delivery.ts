type SendEmailInput={to:string;subject:string;html:string;idempotencyKey:string};
export async function sendWithConfiguredProvider(input:SendEmailInput){
 const endpoint=process.env.DELIVERY_PROVIDER_URL,token=process.env.DELIVERY_PROVIDER_TOKEN,from=process.env.DELIVERY_FROM_EMAIL;
 if(!endpoint||!token||!from)throw new Error("Delivery provider is not configured. Set DELIVERY_PROVIDER_URL, DELIVERY_PROVIDER_TOKEN and DELIVERY_FROM_EMAIL.");
 const response=await fetch(endpoint,{method:"POST",headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json","Idempotency-Key":input.idempotencyKey},body:JSON.stringify({from,to:[input.to],subject:input.subject,html:input.html})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data?.message||data?.error||`Delivery provider returned ${response.status}`);
 return data;
}
