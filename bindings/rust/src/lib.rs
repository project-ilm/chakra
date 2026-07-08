//! chakra-sys — Rust bindings to the CHAKRA C core.
//!
//! Raw FFI in [`ffi`]; a safe [`panchanga`] wrapper on top. The C sources are
//! compiled by `build.rs`, so no prebuilt library is required.
//!
//! Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
//! SPDX-License-Identifier: GPL-3.0-or-later. No warranty.
use std::os::raw::{c_double, c_int, c_long};

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct CkPanchanga {
    pub vara_i: c_int,
    pub tithi_i: c_int,
    pub shukla: c_int,
    pub nak_i: c_int,
    pub yoga_i: c_int,
    pub karana_i: c_int,
    pub manzil_i: c_int,
    pub moon_lat: c_double,
}

pub mod ffi {
    use super::*;
    extern "C" {
        pub fn ck_dayno(y: c_int, m: c_int, d: c_int, ut: c_double) -> c_double;
        pub fn ck_jdn_of(d: c_double) -> c_long;
        pub fn ck_ayan(y: c_double) -> c_double;
        pub fn ck_panchanga_calc(d: c_double, y: c_double, out: *mut CkPanchanga);
    }
}

pub const VARA: [&str; 7] = ["Ravivāra", "Somavāra", "Maṅgalavāra", "Budhavāra",
    "Guruvāra", "Śukravāra", "Śanivāra"];
pub const TITHI: [&str; 15] = ["Pratipadā","Dvitīyā","Tṛtīyā","Chaturthī","Pañcamī",
    "Ṣaṣṭhī","Saptamī","Aṣṭamī","Navamī","Daśamī","Ekādaśī","Dvādaśī",
    "Trayodaśī","Chaturdaśī","Pūrṇimā/Amāvāsyā"];
pub const NAK: [&str; 27] = ["Aśvinī","Bharaṇī","Kṛttikā","Rohiṇī","Mṛgaśira","Ārdrā",
    "Punarvasu","Puṣya","Āśleṣā","Maghā","P.Phalgunī","U.Phalgunī","Hasta","Chitrā",
    "Svātī","Viśākhā","Anurādhā","Jyeṣṭhā","Mūla","P.Āṣāḍhā","U.Āṣāḍhā","Śravaṇa",
    "Dhaniṣṭhā","Śatabhiṣā","P.Bhādrapada","U.Bhādrapada","Revatī"];

/// A safe, owned pañcāṅga result.
#[derive(Debug, Clone)]
pub struct Panchanga {
    pub vara: String,
    pub tithi: String,
    pub paksha: String,
    pub nakshatra: String,
    pub jdn: i64,
}

/// Compute the pañcāṅga for a civil UT instant.
pub fn panchanga(y: i32, m: i32, d: i32, ut: f64) -> Panchanga {
    unsafe {
        let dn = ffi::ck_dayno(y, m, d, ut);
        let yf = y as f64 + (m as f64 - 1.0) / 12.0;
        let mut p = CkPanchanga { vara_i: 0, tithi_i: 0, shukla: 0, nak_i: 0,
            yoga_i: 0, karana_i: 0, manzil_i: 0, moon_lat: 0.0 };
        ffi::ck_panchanga_calc(dn, yf, &mut p);
        Panchanga {
            vara: VARA[(p.vara_i % 7) as usize].to_string(),
            tithi: TITHI[(p.tithi_i % 15) as usize].to_string(),
            paksha: if p.shukla != 0 { "Śukla" } else { "Kṛṣṇa" }.to_string(),
            nakshatra: NAK[(p.nak_i % 27) as usize].to_string(),
            jdn: ffi::ck_jdn_of(dn) as i64,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn ashlesha_amavasya_2026_08_12() {
        let p = panchanga(2026, 8, 12, 6.5);
        assert_eq!(p.vara, "Budhavāra");
        assert_eq!(p.nakshatra, "Āśleṣā");
        assert_eq!(p.jdn, 2461265);
    }
    #[test]
    fn hijri_divergence_day_jdn() {
        // 2026-06-16 — the Sunni/Shia tabular split day
        let p = panchanga(2026, 6, 16, 12.0);
        assert_eq!(p.jdn, 2461205);
    }
}
