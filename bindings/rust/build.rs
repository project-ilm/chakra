// Compiles the CHAKRA C core straight into the crate — no prebuilt .so needed.
// Copyright (C) 1993-2026 Abhishek Choudhary. GPL-3.0-or-later.
fn main() {
    cc::Build::new()
        .file("../../lib/chakra.c")
        .include("../../lib")
        .opt_level(2)
        .compile("chakra");
    println!("cargo:rerun-if-changed=../../lib/chakra.c");
    println!("cargo:rerun-if-changed=../../lib/chakra.h");
}
