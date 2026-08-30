// src/data/saudiLocationHierarchy.ts
//
// Step 1: Static reference dataset for Saudi Arabia's 13 administrative
// regions (المناطق الإدارية), each with its main city/cities, and a
// representative sample of districts (أحياء) per city.
// Step 2: This is NOT an exhaustive list of every district in the Kingdom —
// it covers the major/most common districts per major city so the
// Region -> City -> District chain is enforceable end-to-end today.
// Step 3: To extend: add a new CityEntry under the right RegionEntry, or a
// new DistrictEntry under the right CityEntry. IDs must stay unique within
// their parent list. No other file needs to change — types, validation,
// and the form all read from this single source of truth.
// Step 4: Coordinates are approximate district-center points (WGS84,
// decimal degrees) — accurate enough to auto-fill latitude/longitude on
// district selection; not survey-grade.

import { RegionEntry } from "./location";


export const SAUDI_LOCATION_HIERARCHY: RegionEntry[] = [
  // Step 5: Region 1 — الرياض (Riyadh)
  {
    id: "riyadh-region",
    name: "منطقة الرياض",
    nameEn: "Riyadh Region",
    cities: [
      {
        id: "riyadh-city",
        name: "الرياض",
        nameEn: "Riyadh",
        districts: [
          { id: "riyadh-olaya", name: "العليا", nameEn: "Al Olaya", latitude: 24.6944, longitude: 46.6858 },
          { id: "riyadh-malaz", name: "الملز", nameEn: "Al Malaz", latitude: 24.6553, longitude: 46.7373 },
          { id: "riyadh-nakheel", name: "النخيل", nameEn: "Al Nakheel", latitude: 24.7716, longitude: 46.6285 },
          { id: "riyadh-sulaimaniyah", name: "السليمانية", nameEn: "Al Sulaimaniyah", latitude: 24.6917, longitude: 46.7219 },
          { id: "riyadh-malqa", name: "الملقا", nameEn: "Al Malqa", latitude: 24.7962, longitude: 46.6289 },
        ],
      },
      {
        id: "dawadmi-city",
        name: "الدوادمي",
        nameEn: "Al Dawadmi",
        districts: [
          { id: "dawadmi-center", name: "وسط الدوادمي", nameEn: "Central Dawadmi", latitude: 24.5075, longitude: 44.3931 },
        ],
      },
    ],
  },

  // Step 6: Region 2 — مكة المكرمة (Makkah)
  {
    id: "makkah-region",
    name: "منطقة مكة المكرمة",
    nameEn: "Makkah Region",
    cities: [
      {
        id: "jeddah-city",
        name: "جدة",
        nameEn: "Jeddah",
        districts: [
          { id: "jeddah-rawdah", name: "الروضة", nameEn: "Al Rawdah", latitude: 21.5646, longitude: 39.1728 },
          { id: "jeddah-shati", name: "الشاطئ", nameEn: "Al Shati", latitude: 21.6116, longitude: 39.1075 },
          { id: "jeddah-salamah", name: "السلامة", nameEn: "Al Salamah", latitude: 21.5729, longitude: 39.1541 },
          { id: "jeddah-hamra", name: "الحمراء", nameEn: "Al Hamra", latitude: 21.5498, longitude: 39.1611 },
        ],
      },
      {
        id: "makkah-city",
        name: "مكة المكرمة",
        nameEn: "Makkah",
        districts: [
          { id: "makkah-aziziyah", name: "العزيزية", nameEn: "Al Aziziyah", latitude: 21.3971, longitude: 39.8449 },
          { id: "makkah-shisha", name: "الششة", nameEn: "Al Shisha", latitude: 21.4267, longitude: 39.8134 },
        ],
      },
      {
        id: "taif-city",
        name: "الطائف",
        nameEn: "Taif",
        districts: [
          { id: "taif-shuhada", name: "الشهداء", nameEn: "Al Shuhada", latitude: 21.2854, longitude: 40.4183 },
          { id: "taif-salamah", name: "السلامة", nameEn: "Al Salamah", latitude: 21.2703, longitude: 40.3985 },
        ],
      },
    ],
  },

  // Step 7: Region 3 — المدينة المنورة (Madinah)
  {
    id: "madinah-region",
    name: "منطقة المدينة المنورة",
    nameEn: "Madinah Region",
    cities: [
      {
        id: "madinah-city",
        name: "المدينة المنورة",
        nameEn: "Madinah",
        districts: [
          { id: "madinah-aziziyah", name: "العزيزية", nameEn: "Al Aziziyah", latitude: 24.4483, longitude: 39.5877 },
          { id: "madinah-quba", name: "قباء", nameEn: "Quba", latitude: 24.4392, longitude: 39.6142 },
          { id: "madinah-sultanah", name: "السلطانة", nameEn: "Al Sultanah", latitude: 24.5115, longitude: 39.5876 },
        ],
      },
      {
        id: "yanbu-city",
        name: "ينبع",
        nameEn: "Yanbu",
        districts: [
          { id: "yanbu-sinaiyah", name: "ينبع الصناعية", nameEn: "Yanbu Industrial", latitude: 24.0895, longitude: 38.0618 },
        ],
      },
    ],
  },

  // Step 8: Region 4 — القصيم (Qassim)
  {
    id: "qassim-region",
    name: "منطقة القصيم",
    nameEn: "Qassim Region",
    cities: [
      {
        id: "buraidah-city",
        name: "بريدة",
        nameEn: "Buraidah",
        districts: [
          { id: "buraidah-faisaliyah", name: "الفيصلية", nameEn: "Al Faisaliyah", latitude: 26.3418, longitude: 43.9877 },
          { id: "buraidah-nahdah", name: "النهضة", nameEn: "Al Nahdah", latitude: 26.3592, longitude: 43.9721 },
        ],
      },
      {
        id: "unaizah-city",
        name: "عنيزة",
        nameEn: "Unaizah",
        districts: [
          { id: "unaizah-center", name: "وسط عنيزة", nameEn: "Central Unaizah", latitude: 26.0844, longitude: 43.9935 },
        ],
      },
    ],
  },

  // Step 9: Region 5 — المنطقة الشرقية (Eastern Province)
  {
    id: "eastern-region",
    name: "المنطقة الشرقية",
    nameEn: "Eastern Province",
    cities: [
      {
        id: "dammam-city",
        name: "الدمام",
        nameEn: "Dammam",
        districts: [
          { id: "dammam-faisaliyah", name: "الفيصلية", nameEn: "Al Faisaliyah", latitude: 26.4260, longitude: 50.1050 },
          { id: "dammam-shati", name: "الشاطئ", nameEn: "Al Shati", latitude: 26.4457, longitude: 50.0928 },
        ],
      },
      {
        id: "khobar-city",
        name: "الخبر",
        nameEn: "Al Khobar",
        districts: [
          { id: "khobar-thuqbah", name: "الثقبة", nameEn: "Al Thuqbah", latitude: 26.2989, longitude: 50.2088 },
          { id: "khobar-aqrabiyah", name: "العقربية", nameEn: "Al Aqrabiyah", latitude: 26.2756, longitude: 50.1928 },
        ],
      },
      {
        id: "ahsa-city",
        name: "الأحساء",
        nameEn: "Al Ahsa",
        districts: [
          { id: "ahsa-mubarraz", name: "المبرز", nameEn: "Al Mubarraz", latitude: 25.4058, longitude: 49.5928 },
        ],
      },
    ],
  },

  // Step 10: Region 6 — عسير (Asir)
  {
    id: "asir-region",
    name: "منطقة عسير",
    nameEn: "Asir Region",
    cities: [
      {
        id: "abha-city",
        name: "أبها",
        nameEn: "Abha",
        districts: [
          { id: "abha-sad", name: "السد", nameEn: "Al Sad", latitude: 18.2295, longitude: 42.5053 },
          { id: "abha-manhal", name: "المنهل", nameEn: "Al Manhal", latitude: 18.2465, longitude: 42.5117 },
        ],
      },
      {
        id: "khamis-mushait-city",
        name: "خميس مشيط",
        nameEn: "Khamis Mushait",
        districts: [
          { id: "khamis-center", name: "وسط خميس مشيط", nameEn: "Central Khamis Mushait", latitude: 18.3060, longitude: 42.7297 },
        ],
      },
    ],
  },

  // Step 11: Region 7 — تبوك (Tabuk)
  {
    id: "tabuk-region",
    name: "منطقة تبوك",
    nameEn: "Tabuk Region",
    cities: [
      {
        id: "tabuk-city",
        name: "تبوك",
        nameEn: "Tabuk",
        districts: [
          { id: "tabuk-sulaymaniyah", name: "السليمانية", nameEn: "Al Sulaymaniyah", latitude: 28.3998, longitude: 36.5715 },
          { id: "tabuk-muruj", name: "المروج", nameEn: "Al Muruj", latitude: 28.3776, longitude: 36.5619 },
        ],
      },
    ],
  },

  // Step 12: Region 8 — حائل (Hail)
  {
    id: "hail-region",
    name: "منطقة حائل",
    nameEn: "Hail Region",
    cities: [
      {
        id: "hail-city",
        name: "حائل",
        nameEn: "Hail",
        districts: [
          { id: "hail-nuqrah", name: "النقرة", nameEn: "Al Nuqrah", latitude: 27.5219, longitude: 41.6907 },
          { id: "hail-nafl", name: "النفل", nameEn: "Al Nafl", latitude: 27.5350, longitude: 41.7075 },
        ],
      },
    ],
  },

  // Step 13: Region 9 — الحدود الشمالية (Northern Borders)
  {
    id: "northern-borders-region",
    name: "منطقة الحدود الشمالية",
    nameEn: "Northern Borders Region",
    cities: [
      {
        id: "arar-city",
        name: "عرعر",
        nameEn: "Arar",
        districts: [
          { id: "arar-center", name: "وسط عرعر", nameEn: "Central Arar", latitude: 30.9753, longitude: 41.0381 },
        ],
      },
    ],
  },

  // Step 14: Region 10 — جازان (Jazan)
  {
    id: "jazan-region",
    name: "منطقة جازان",
    nameEn: "Jazan Region",
    cities: [
      {
        id: "jazan-city",
        name: "جازان",
        nameEn: "Jazan",
        districts: [
          { id: "jazan-corniche", name: "الكورنيش", nameEn: "Al Corniche", latitude: 16.8892, longitude: 42.5611 },
          { id: "jazan-rawdah", name: "الروضة", nameEn: "Al Rawdah", latitude: 16.9083, longitude: 42.5711 },
        ],
      },
    ],
  },

  // Step 15: Region 11 — نجران (Najran)
  {
    id: "najran-region",
    name: "منطقة نجران",
    nameEn: "Najran Region",
    cities: [
      {
        id: "najran-city",
        name: "نجران",
        nameEn: "Najran",
        districts: [
          { id: "najran-nasim", name: "النسيم", nameEn: "Al Nasim", latitude: 17.5656, longitude: 44.2289 },
        ],
      },
    ],
  },

  // Step 16: Region 12 — الباحة (Al Bahah)
  {
    id: "bahah-region",
    name: "منطقة الباحة",
    nameEn: "Al Bahah Region",
    cities: [
      {
        id: "bahah-city",
        name: "الباحة",
        nameEn: "Al Bahah",
        districts: [
          { id: "bahah-center", name: "وسط الباحة", nameEn: "Central Al Bahah", latitude: 20.0129, longitude: 41.4677 },
        ],
      },
    ],
  },

  // Step 17: Region 13 — الجوف (Al Jouf)
  {
    id: "jouf-region",
    name: "منطقة الجوف",
    nameEn: "Al Jouf Region",
    cities: [
      {
        id: "sakaka-city",
        name: "سكاكا",
        nameEn: "Sakaka",
        districts: [
          { id: "sakaka-center", name: "وسط سكاكا", nameEn: "Central Sakaka", latitude: 29.9697, longitude: 40.2064 },
        ],
      },
    ],
  },
];