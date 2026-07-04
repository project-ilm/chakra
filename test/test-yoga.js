const C=require("../src/chakra-core.js");const {ok,near,eq,done}=require("./_assert.js");
const dn=(Y,M,D,h)=>C.dayNo(Y,M,D,h||0);
console.log("JYOTIṢA: YOGAS & DAŚĀ");
// Kalasarpa occurs (dense window) and is detectable
let kal=false;for(let j=dn(2000,1,1);j<dn(2001,1,1);j++){const ch=C.buildChart(j,2000.5,28.61,77.21);if(C.computeYogas(ch).some(y=>y.name==="Kālasarpa")){kal=true;break;}}
ok("Kālasarpa detected during 2000",kal);
// A non-example date
const ch=C.buildChart(dn(2026,7,4,1),2026.5,28.61,77.21);const yn=C.computeYogas(ch).map(y=>y.name);
ok("2026-07-04 yields a yoga set",yn.length>0);
console.log("    detected: "+yn.join(", "));
// Vimshottari cross-checks
eq("Vimśottarī cycle = 120y",C.vimshottari(45,2000).seq.reduce((a,b)=>a+b.years,0),120);
eq("Aśvinī(1°)→Ketu",C.vimshottari(1,2000).startLord,"Ketu");
eq("Rohiṇī(45°)→Moon",C.vimshottari(45,2000).startLord,"Moon");
eq("Maghā(121°)→Ketu",C.vimshottari(121,2000).startLord,"Ketu");
// Mahapurusha logic: Jupiter own/exalt in kendra → Hamsa. Construct: need chart where Jupiter exalted (Cancer=3) in kendra.
ok("Mahāpuruṣa engine returns Haṃsa when Jupiter dignified in kendra",
   (function(){for(let j=dn(2000,1,1);j<dn(2015,1,1);j+=3){const c=C.buildChart(j,2007,28.61,77.21);if(C.computeYogas(c).some(y=>y.name.indexOf("Haṃsa")>=0))return true;}return false;})());
done("test-yoga.js");
