// Tabulae ex eodem libro publico quo Dictionarium Sanctae Marthae utitur.
window.CHANDZI={words:[],characters:[],loaded:false,error:null};
(async function(){
 const url="https://docs.google.com/spreadsheets/d/e/2PACX-1vQZoAolAWEBzbwXjPzA67tmva1TyOR2AYB-49vqXPo98MXodomWq2dGKGewO_z8-iZIYbr0x6Z5jbPP/pub?output=xlsx";
 const clean=v=>String(v??"").trim();
 const reading=v=>{const x=clean(v);return x==="-"||x==="−"||x==="–"?null:x||undefined};
 const normalize=r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[clean(k).toUpperCase(),clean(v)]));
 const rows=(book,name)=>{
  const sheet=book.Sheets[name];
  if(!sheet)throw Error("Tabula non inventa: "+name);
  return XLSX.utils.sheet_to_json(sheet,{defval:"",raw:false}).map(normalize);
 };
 try{
  const response=await fetch(url,{cache:"no-store"});
  if(!response.ok)throw Error("HTTP "+response.status);
  const book=XLSX.read(new Uint8Array(await response.arrayBuffer()),{type:"array"});
  const words=rows(book,"Lexicon vocabulorum").filter(r=>r["漢字"]).map(r=>({
   t:r["漢字"],s:r["I"]||r["漢字"],meaning:r["I"]||"",
   langs:{sl:reading(r["SLA"]),ja:reading(r["JAP"]),ko:reading(r["COR"]),zh:reading(r["SIN"]),vi:reading(r["VIET"])}
  }));
  const characters=rows(book,"Lexicon characterum").filter(r=>r["漢字"]).map(r=>({
   t:r["漢字"],s:r["漢字"],meaning:r["II"]||"",
   sl:reading(r["SLA"]),ja:reading(r["JAP"]),ko:reading(r["COR"]),
   pinyin:reading(r["SIN"]),vi:reading(r["VIET"]),
   radical:r["I"]||"",number:""
  }));
  // Group all matching entries, even if they are separated in the sheet.
  const canonical=v=>String(v??"").normalize("NFKC").trim().replace(/\\s+/g," ").toLocaleLowerCase();
  const merge=(entries,signature)=>{
   const groups=new Map(),out=[];
   for(const entry of entries){
    const key=signature(entry);
    const existing=groups.get(key);
    if(existing){
     if(!existing.variants.includes(entry.t)){
      existing.variants.push(entry.t);
      if(entry.radical!==undefined)existing.radicals.push(entry.radical);
     }
    }else{
     const item={...entry,variants:[entry.t]};
     if(entry.radical!==undefined)item.radicals=[entry.radical];
     groups.set(key,item);out.push(item);
    }
   }
   return out;
  };
  CHANDZI.words=merge(words,w=>JSON.stringify([canonical(w.meaning),...["sl","ja","ko","zh","vi"].map(k=>canonical(w.langs[k]))]));
  CHANDZI.characters=merge(characters,c=>JSON.stringify([canonical(c.meaning),...["sl","ja","ko","pinyin","vi"].map(k=>canonical(c[k]))]));
  CHANDZI.loaded=true;
 }catch(e){CHANDZI.error=e.message;console.error("Chandzi: ",e)}
 document.dispatchEvent(new Event("chandzi:loaded"));
})();