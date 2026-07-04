const C=require("../src/chakra-core.js");const {ok,near,eq,done}=require("./_assert.js");
const J=(Y,M,D)=>C.greg2jdn(Y,M,D);
console.log("CALENDARS");
const heb=j=>{const h=C.hebrew(j);return h.d+" "+h.month+" "+h.y;};
eq("Hebrew 2000-01-01 = 23 Tevet 5760",heb(J(2000,1,1)),"23 Tevet 5760");
eq("Hebrew 2025-09-23 = 1 Tishri 5786 (Rosh Hashana)",heb(J(2025,9,23)),"1 Tishri 5786");
eq("Hebrew 2024-04-23 = 15 Nisan 5784 (Pesach)",heb(J(2024,4,23)),"15 Nisan 5784");
eq("Hebrew 2026-04-06 = 19 Nisan 5786",heb(J(2026,4,6)),"19 Nisan 5786");
const nan=j=>{const n=C.nanakshahi(j);return n.d+" "+n.month+" "+n.y;};
eq("Nanakshahi 2026-03-14 = 1 Chet 558",nan(J(2026,3,14)),"1 Chet 558");
const su=C.hijriSunni(J(2024,1,1)),sh=C.hijriShia(J(2024,1,1));
eq("Sunni Hijrī 2024-01-01 = 19/6/1445",su.d+"/"+su.m+"/"+su.y,"19/6/1445");
// Shia/Sunni divergence exists in 2026-2027
let diff=null;for(let j=J(2026,1,1);j<J(2027,12,31)&&!diff;j++){const a=C.hijriSunni(j),b=C.hijriShia(j);if(a.d!==b.d||a.m!==b.m||a.y!==b.y)diff=j;}
ok("Shia and Sunni Hijrī diverge within 2026-2027",diff!==null);
// Solar Hijri & Samvatsara (dayNo based)
const dn=(Y,M,D,h)=>C.dayNo(Y,M,D,h||0);
const s=C.solarHijri(dn(2026,7,4,6),2026);eq("Solar Hijrī 2026-07-04 = 13 Tīr 1405",s.d+" "+s.m+" "+s.y,"13 Tīr 1405");
const sv=C.samvInfo(dn(2026,7,4,0),2026);eq("Samvatsara 2026-07 = Parābhava",sv.name,"Parābhava");
eq("Śaka 2026 = 1948",sv.saka,1948);eq("Vikrama 2026 = 2083",sv.vikrama,2083);
const svF=C.samvInfo(dn(2026,2,1,0),2026);eq("Samvatsara pre-saṅkrānti (Feb) = Viśvāvasu",svF.name,"Viśvāvasu");
done("test-calendars");
