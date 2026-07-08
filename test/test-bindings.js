/* test-bindings.js — exercises the Node binding (CLI-spawn) against the JS core,
 * so CI covers at least one language binding end-to-end. Skips gracefully if the
 * C CLI has not been built.
 * © 1993-2026 Abhishek Choudhary · GPL-3.0-or-later */
const {ok,done}=require("./_assert.js");
const fs=require("fs"),path=require("path");
const cli=path.join(__dirname,"..","lib","chakra");
if(!fs.existsSync(cli)){
  console.log("  (lib/chakra not built — skipping binding test; run: make -C lib chakra)");
  done("test-bindings");
}else{
  process.env.CHAKRA_CLI=cli;
  const ck=require("../bindings/node/index.js");
  const cal=ck.calendars("2026-06-16");
  ok("node binding · Sunni Hijrī 1447",/1447/.test(cal.hijriSunni));
  ok("node binding · Shia Hijrī 1448",/1448/.test(cal.hijriShia));
  const ev=ck.events(2026);
  ok("node binding · Dīpāvalī 2026-11-08 (pradoṣa)",
     ev.some(e=>e.name.indexOf("Dīpāvalī")>=0&&e.date==="2026-11-08"));
  const pc=ck.panchang("2026-08-12","06:30",28.61,77.21);
  ok("node binding · vara Budhavāra",pc.vara==="Budhavāra");
  ok("node binding · nakṣatra Āśleṣā",pc.nakshatra==="Āśleṣā");
  done("test-bindings");
}
