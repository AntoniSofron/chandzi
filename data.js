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
  CHANDZI.words=words;CHANDZI.characters=characters;CHANDZI.loaded=true;
 }catch(e){CHANDZI.error=e.message;console.error("Chandzi: ",e)}
 document.dispatchEvent(new Event("chandzi:loaded"));
})();