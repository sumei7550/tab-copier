import {reportingQuery,TransactionLookupRequired} from './transaction-lookup.ts';
export async function probeTransactionPair({buyerId,sellerId,providerOrderId,merchantId,paymentDate}:{buyerId:string;sellerId:string;providerOrderId:string;merchantId:string;paymentDate?:string},call:(path:string)=>Promise<any>){
  async function query(id:string){
    try{
      const rows=await reportingQuery(id,paymentDate,call);
      const exact=rows.filter((row:any)=>row?.transaction_info?.transaction_id===id);
      const related=exact.some((row:any)=>{
        const info=row.transaction_info;
        return info.paypal_account_id===merchantId&&info.transaction_status==='S'&&(info.transaction_id===sellerId||(info.paypal_reference_id_type==='ODR'&&info.paypal_reference_id===providerOrderId));
      });
      return {queriedId:id,status:'ok',returnedCount:rows.length,exactIdFound:exact.length>0,relatedToOrder:related};
    }catch(e){return {queriedId:id,status:e instanceof TransactionLookupRequired?e.reason:'reporting_unavailable',returnedCount:0,exactIdFound:false,relatedToOrder:false};}
  }
  const [buyer,seller]=await Promise.all([query(buyerId),query(sellerId)]);
  const conclusion=buyer.status==='reporting_permission_denied'||seller.status==='reporting_permission_denied'?'reporting_permission_required':
    seller.status!=='ok'||!seller.relatedToOrder?'inconclusive':buyer.status!=='ok'?'inconclusive':buyer.relatedToOrder?'buyer_match_observed':'buyer_not_matched_in_this_test';
  return {buyer,seller,conclusion};
}
