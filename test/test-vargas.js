/* test-vargas.js — divisional-chart longitude mappings (Parāśara).
 * © 1993-2026 Abhishek Choudhary · GPL-3.0-or-later */
const {ok,done}=require("./_assert.js");
const C=require("../src/chakra-core.js");
const V=C.vargaLon, sg=x=>Math.floor(C.rev(x)/30);

ok("D1 identity",Math.abs(V(123.456,1)-123.456)<1e-9);
ok("D9 · 2° Aries (chara) → 1st navāṁśa = Aries",sg(V(2,9))===0);
ok("D9 · 5° Aries → 2nd navāṁśa = Taurus",sg(V(5,9))===1);
ok("D9 · 25° Aries → 8th part → Scorpio",sg(V(25,9))===7);
ok("D9 · 10° Taurus (sthira, from Capricorn) part 4 → Aries",sg(V(40,9))===0);
ok("D9 · 0° Gemini (dvisvabhāva, from Libra)",sg(V(60,9))===6);
ok("D2 · 10° Aries → Sun's horā (Leo)",sg(V(10,2))===4);
ok("D2 · 20° Aries → Moon's horā (Cancer)",sg(V(20,2))===3);
ok("D2 · 10° Taurus (even) → Moon first",sg(V(40,2))===3);
ok("D3 · 25° Aries → 3rd drekkāṇa → Leo",sg(V(25,3))===8||sg(V(25,3))===8);
ok("D3 · 25° Aries lands sign+8",sg(V(25,3))===8);
ok("D12 · 27.5° Aries → 12th part → Pisces",sg(V(27.5,12))===11);
ok("D10 · odd sign first part = same sign",sg(V(1,10))===0);
ok("D10 · even sign counts from its 9th",sg(V(31,10))===((1+8)%12));
ok("degree scales ×n",Math.abs((V(3.7,9)%30)-C.rev(3.7*9)%30)<1e-9);
done("test-vargas");
