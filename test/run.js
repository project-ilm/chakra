/* Node test runner — exits nonzero if any suite fails. Usage: node test/run.js */
const {execFileSync}=require("child_process");const fs=require("fs"),path=require("path");
const dir=__dirname;const suites=fs.readdirSync(dir).filter(f=>/^test-.*\.js$/.test(f)).sort();
let fail=0;
for(const s of suites){console.log("\n══════ "+s+" ══════");
  try{execFileSync(process.execPath,[path.join(dir,s)],{stdio:"inherit"});}
  catch(e){fail++;}}
console.log("\n"+(fail?("✗ "+fail+" suite(s) FAILED"):"✓ ALL SUITES PASSED"));
process.exit(fail?1:0);
