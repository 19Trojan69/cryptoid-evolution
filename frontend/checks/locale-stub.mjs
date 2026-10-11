export const useLocale=()=>({locale:'de',t:(s,p)=>p?Object.entries(p).reduce((a,[k,v])=>a.replace('{'+k+'}',v),s):s,lives:n=>n+' lives',choose:()=>{},automatic:true});
export const languages=[];
