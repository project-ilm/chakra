// Minimal example: print a pañcāṅga as text.
// Copyright (C) 1993-2026 Abhishek Choudhary. GPL-3.0-or-later.
package main

import (
	"fmt"
	chakra "github.com/project-ilm/chakra/bindings/go"
)

func main() {
	p := chakra.Compute(2026, 8, 12, 6.5)
	fmt.Printf("%s · %s (%s) · %s · JDN %d\n",
		p.Vara, p.Tithi, p.Paksha, p.Nakshatra, p.JDN)
}
