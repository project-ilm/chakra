/* Release-hardening checks: API abuse, year generalization, calendar fuzz, determinism.
 * Copyright (C) 1993-2026 Abhishek Choudhary. GPL-3.0-or-later. */
const C=require("../src/chakra-core.js");
const API=require("../src/chakra-api.js");
const Kernel=require("../src/chakra-kernel.js");
const {ok,done}=require("./_assert.js");
console.log("HARDENING / RELEASE CHECKS");

/* — API abuse: hostile ?api= must never be echoed — */
const evil=API.handle(new URLSearchParams("api=%3Cscript%3Ealert(1)%3C%2Fscript%3E&date=2026-07-04"));
ok("unknown endpoint falls back to whitelist",evil.endpoint==="moment");
ok("endpoint is strictly [a-z]+",/^[a-z]+$/.test(evil.endpoint));
ok("hostile api param never enters body",evil.body.indexOf("<script")<0);
ok("response still valid JSON",!!JSON.parse(evil.body));
const alias=API.handle(new URLSearchParams("api=PANCHANGA"));
ok("case-insensitive alias resolves",alias.endpoint==="panchanga"&&!!alias.data.panchanga);

/* — festival engine generalizes beyond the 2026 anchors — */
const has=(l,n)=>l.some(e=>e.name.indexOf(n)>=0);
const e27=C.annualEvents(2027);
ok("2027: ≥40 events",e27.length>=40);
ok("2027: sorted ascending",e27.every((e,i)=>!i||e27[i-1].date<=e.date));
ok("2027: every date inside 2027",e27.every(e=>e.date.slice(0,4)==="2027"));
ok("2027: Dīpāvalī · Eid al-Fiṭr · Rosh Hashana all present",
   has(e27,"Dīpāvalī")&&has(e27,"Eid al-Fiṭr")&&has(e27,"Rosh Hashana"));
const e30=C.annualEvents(2030);
ok("2030: exactly 12 saṅkrāntis",e30.filter(e=>e.name.indexOf("Saṅkrānti")>=0).length===12);
ok("2030: Holi · Vaisakhi · Pesach present",has(e30,"Holi")&&has(e30,"Vaisakhi")&&has(e30,"Pesach"));

/* — weekly fuzz across 2027: calendar fields stay in valid ranges — */
let fuzz=true;
for(let j=C.greg2jdn(2027,1,1);j<=C.greg2jdn(2027,12,31);j+=7){
  const s=C.hijriSunni(j),sh=C.hijriShia(j),h=C.hebrew(j),n=C.nanakshahi(j);
  if(!(s.m>=1&&s.m<=12&&s.d>=1&&s.d<=30))fuzz=false;
  if(!(sh.m>=1&&sh.m<=12&&sh.d>=1&&sh.d<=30))fuzz=false;
  if(!(h.d>=1&&h.d<=30&&h.y>5700))fuzz=false;
  if(!(n.d>=1&&n.d<=32))fuzz=false;
}
ok("52-point fuzz 2027: Sunni/Shia/Hebrew/Nanakshahi fields in range",fuzz);

/* — kernel snapshots are deterministic — */
const mk=()=>Kernel.create({refDate:"2027-03-14",refTime:"06:30",lat:17.38,lon:78.48,tz:5.5}).moment();
ok("kernel deterministic (identical snapshots)",JSON.stringify(mk())===JSON.stringify(mk()));
done("test-hardening");
