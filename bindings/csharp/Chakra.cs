// Chakra.cs — P/Invoke bindings to the CHAKRA C core (libchakra.so / chakra.dll).
// Build the shared library first:  make -C ../../lib libchakra.so
//
// Copyright (C) 1993-2026 Abhishek Choudhary. Sole author.
// SPDX-License-Identifier: GPL-3.0-or-later. No warranty.
using System;
using System.Runtime.InteropServices;

namespace ProjectIlm.Chakra
{
    [StructLayout(LayoutKind.Sequential)]
    public struct CkPanchanga
    {
        public int VaraI;
        public int TithiI;
        public int Shukla;
        public int NakI;
        public int YogaI;
        public int KaranaI;
        public int ManzilI;
        public double MoonLat;
    }

    public static class Native
    {
        // "chakra" resolves to libchakra.so / libchakra.dylib / chakra.dll
        const string LIB = "chakra";

        [DllImport(LIB)] public static extern double ck_dayno(int y, int m, int d, double ut);
        [DllImport(LIB)] public static extern long   ck_jdn_of(double d);
        [DllImport(LIB)] public static extern double ck_ayan(double y);
        [DllImport(LIB)] public static extern void   ck_panchanga_calc(double d, double y, ref CkPanchanga outp);
    }

    public sealed class Panchanga
    {
        static readonly string[] Vara = { "Ravivāra","Somavāra","Maṅgalavāra","Budhavāra","Guruvāra","Śukravāra","Śanivāra" };
        static readonly string[] Tithi = { "Pratipadā","Dvitīyā","Tṛtīyā","Chaturthī","Pañcamī","Ṣaṣṭhī","Saptamī","Aṣṭamī","Navamī","Daśamī","Ekādaśī","Dvādaśī","Trayodaśī","Chaturdaśī","Pūrṇimā/Amāvāsyā" };
        static readonly string[] Nak = { "Aśvinī","Bharaṇī","Kṛttikā","Rohiṇī","Mṛgaśira","Ārdrā","Punarvasu","Puṣya","Āśleṣā","Maghā","P.Phalgunī","U.Phalgunī","Hasta","Chitrā","Svātī","Viśākhā","Anurādhā","Jyeṣṭhā","Mūla","P.Āṣāḍhā","U.Āṣāḍhā","Śravaṇa","Dhaniṣṭhā","Śatabhiṣā","P.Bhādrapada","U.Bhādrapada","Revatī" };

        public string VaraName, TithiName, Paksha, Nakshatra;
        public long Jdn;

        public static Panchanga Compute(int y, int m, int d, double ut)
        {
            double dn = Native.ck_dayno(y, m, d, ut);
            double yf = y + (m - 1) / 12.0;
            var p = new CkPanchanga();
            Native.ck_panchanga_calc(dn, yf, ref p);
            return new Panchanga {
                VaraName  = Vara[((p.VaraI % 7) + 7) % 7],
                TithiName = Tithi[((p.TithiI % 15) + 15) % 15],
                Paksha    = p.Shukla != 0 ? "Śukla" : "Kṛṣṇa",
                Nakshatra = Nak[((p.NakI % 27) + 27) % 27],
                Jdn       = Native.ck_jdn_of(dn),
            };
        }
    }

    public static class Program
    {
        public static void Main()
        {
            var p = Panchanga.Compute(2026, 8, 12, 6.5);
            Console.WriteLine($"{p.VaraName} · {p.TithiName} ({p.Paksha}) · {p.Nakshatra} · JDN {p.Jdn}");
            // expected: Budhavāra · Pūrṇimā/Amāvāsyā (Kṛṣṇa) · Āśleṣā · JDN 2461265
        }
    }
}
