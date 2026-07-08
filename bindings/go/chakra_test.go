package chakra

import "testing"

func TestAshleshaAmavasya(t *testing.T) {
	p := Compute(2026, 8, 12, 6.5)
	if p.Vara != "Budhavāra" || p.Nakshatra != "Āśleṣā" || p.JDN != 2461265 {
		t.Fatalf("got %+v", p)
	}
}
