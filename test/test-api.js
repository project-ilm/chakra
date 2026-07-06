const C=require("../src/chakra-core.js");const K=require("../src/chakra-kernel.js");const API=require("../src/chakra-api.js");
const {ok,near,eq,done}=require("./_assert.js");
console.log("KERNEL + API");
// Kernel snapshot coherence
const k=K.create({refDate:"2026-07-04",refTime:"06:30",lat:28.61,lon:77.21,tz:5.5});
const M=k.moment();
ok("moment() returns calendars",!!M.calendars && !!M.calendars.solarHijri);
eq("kernel Solar Hijrī matches core",M.calendars.solarHijri,"13 Tīr 1405 SH");
eq("kernel samvatsara",M.calendars.samvatsara,"Parābhava");
ok("kernel yogas is array",Array.isArray(M.yogas));
ok("kernel telescope has Moon RA/Dec",typeof M.telescope.Moon.raH==="number");
// Event bus
let hits=0;const un=k.subscribe(()=>hits++);k.set({lat:19.07});k.set({lon:72.88});un();k.set({lat:0});
eq("subscribe fires then unsubscribes",hits,2);
// Inverse solver via kernel action
const k2=K.create({refDate:"2026-07-04",refTime:"06:30"});
const a0=k2.moment().ascendant;k2.solveAscendant(C.rev(a0+60));
near("kernel.solveAscendant lands target (±1 min ≈ 0.25°/min quantization)",Math.abs(C.rev(k2.moment().ascendant-(a0+60))),0,0.2);
// API endpoints
const alm=API.handle(new URLSearchParams("api=almanac&date=2026-08-12&time=03:00&lat=28.61&lon=77.21&tz=5.5"));
ok("API almanac returns JSON",alm.contentType==="application/json");
const p=JSON.parse(alm.body);ok("API almanac has disclaimer",/heritage/.test(p.disclaimer));
const tel=API.handle(new URLSearchParams("api=telescope&date=2026-07-04&time=18:00&lat=28.61&lon=77.21&tz=5.5"));
const td=JSON.parse(tel.body);ok("API telescope bodies present",!!td.bodies.Jupiter && typeof td.bodies.Jupiter.dec==="number");
const yg=API.handle(new URLSearchParams("api=yogas&date=2026-07-04"));ok("API yogas endpoint",Array.isArray(JSON.parse(yg.body).yogas));
const evr=API.handle(new URLSearchParams("api=events&year=2026"));
ok("events endpoint: 4 eclipses in 2026",evr.data.events.filter(e=>e.tradition==="Astronomical").length===4);
ok("events endpoint: Dīpāvalī present",evr.data.events.some(e=>e.name.indexOf("Dīpāvalī")>=0));
done("test-api");
