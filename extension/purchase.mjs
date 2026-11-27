// Keep repeat clicks on the same authenticated purchase; never silently replace an unpaid order.
export function createPurchaseFlow({ get, set, api, open, configured, activate, schedule }) {
  let flight;
  async function run() {
    if (!configured()) throw new Error('PAYMENT_NOT_CONFIGURED');
    const s=await get();
    if(s.refreshToken&&s.active) return {status:'active'};
    if(s.purchaseId&&s.pollToken&&!s.refreshToken){
      const resumed=await api(`/api/purchases/${s.purchaseId}/checkout`,{},s.pollToken);
      if(resumed.status==='paid')return activate();
      if(!resumed.checkoutUrl)throw new Error('PURCHASE_UNAVAILABLE');
      await open(resumed.checkoutUrl);await schedule();return {status:'pending'};
    }
    const p=await api('/api/purchases',{installationId:s.installationId});
    await set({purchaseId:p.purchaseId,pollToken:p.pollToken,purchaseStartedAt:Date.now()});
    await open(p.checkoutUrl);await schedule();return {status:'pending'};
  }
  return ()=>{if(!flight)flight=run().finally(()=>{flight=undefined;});return flight;};
}
