type Result = {status:string};
export const terminalPaymentStates = new Set(['paid','review','refunded','reversed']);
function wait(ms:number,signal:AbortSignal){
  return new Promise<void>((resolve,reject)=>{
    signal.throwIfAborted();
    const cancel=()=>{clearTimeout(timer);reject(signal.reason);};
    const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve();},ms);
    signal.addEventListener('abort',cancel,{once:true});
  });
}
// Serial, bounded retries: an approval/capture/webhook may settle after the first return request.
export async function pollPayment({request,signal,onRetry,attempts=12,delay=5000,sleep=wait}:{
  request:()=>Promise<Result>;signal:AbortSignal;onRetry:()=>void;attempts?:number;delay?:number;sleep?:(ms:number,signal:AbortSignal)=>Promise<void>;
}):Promise<Result>{
  for(let attempt=0;attempt<attempts;attempt++){
    signal.throwIfAborted();
    try{
      const result=await request();signal.throwIfAborted();
      if(terminalPaymentStates.has(result.status))return result;
    }catch(e){
      signal.throwIfAborted();
      if(e instanceof Error&&['UNAUTHORIZED','ORDER_NOT_FOUND','NOT_SANDBOX'].includes(e.message))throw e;
      if(attempt===attempts-1)throw e;
    }
    if(attempt<attempts-1){onRetry();await sleep(delay,signal);}
  }
  throw new Error('PAYMENT_CONFIRMATION_PENDING');
}
