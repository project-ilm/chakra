// Package chakra provides cgo bindings to the CHAKRA C core — offline
// panchāṅga, ten calendars and jyotiṣa computed from live geometry.
//
// The C sources are compiled directly via cgo; no prebuilt library needed.
//
// Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
// SPDX-License-Identifier: GPL-3.0-or-later. No warranty.
package chakra

/*
#cgo CFLAGS: -I${SRCDIR}/../../lib -O2
#include "chakra.h"
#include "../../lib/chakra.c"
*/
import "C"

var vara = [7]string{"Ravivāra", "Somavāra", "Maṅgalavāra", "Budhavāra",
	"Guruvāra", "Śukravāra", "Śanivāra"}
var tithi = [15]string{"Pratipadā", "Dvitīyā", "Tṛtīyā", "Chaturthī", "Pañcamī",
	"Ṣaṣṭhī", "Saptamī", "Aṣṭamī", "Navamī", "Daśamī", "Ekādaśī", "Dvādaśī",
	"Trayodaśī", "Chaturdaśī", "Pūrṇimā/Amāvāsyā"}
var nak = [27]string{"Aśvinī", "Bharaṇī", "Kṛttikā", "Rohiṇī", "Mṛgaśira", "Ārdrā",
	"Punarvasu", "Puṣya", "Āśleṣā", "Maghā", "P.Phalgunī", "U.Phalgunī", "Hasta",
	"Chitrā", "Svātī", "Viśākhā", "Anurādhā", "Jyeṣṭhā", "Mūla", "P.Āṣāḍhā",
	"U.Āṣāḍhā", "Śravaṇa", "Dhaniṣṭhā", "Śatabhiṣā", "P.Bhādrapada", "U.Bhādrapada", "Revatī"}

// Panchanga is an owned pañcāṅga result.
type Panchanga struct {
	Vara      string
	Tithi     string
	Paksha    string
	Nakshatra string
	JDN       int64
}

// Compute returns the pañcāṅga for a civil UT instant.
func Compute(y, m, d int, ut float64) Panchanga {
	dn := C.ck_dayno(C.int(y), C.int(m), C.int(d), C.double(ut))
	yf := float64(y) + (float64(m)-1.0)/12.0
	var p C.ck_panchanga
	C.ck_panchanga_calc(dn, C.double(yf), &p)
	paksha := "Kṛṣṇa"
	if int(p.shukla) != 0 {
		paksha = "Śukla"
	}
	return Panchanga{
		Vara:      vara[int(p.vara_i)%7],
		Tithi:     tithi[int(p.tithi_i)%15],
		Paksha:    paksha,
		Nakshatra: nak[int(p.nak_i)%27],
		JDN:       int64(C.ck_jdn_of(dn)),
	}
}
