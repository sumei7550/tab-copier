export function purchaseEmail(value:unknown){
  if(typeof value!=='string')throw Error('INVALID_PURCHASE_EMAIL');
  const email=value.trim().toLowerCase();
  if(email.length>254||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))throw Error('INVALID_PURCHASE_EMAIL');
  return email;
}
