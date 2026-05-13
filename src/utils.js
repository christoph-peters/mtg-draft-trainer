export const BASIC_LANDS = new Set(["Plains", "Island", "Swamp", "Mountain", "Forest", "Snow-Covered Plains", "Snow-Covered Island", "Snow-Covered Swamp", "Snow-Covered Mountain", "Snow-Covered Forest", "Wastes"]);

// Ordered by release date, newest first
export const SETS = [
  { id: 'SOS', name: 'Secrets of Strixhaven (2026)' },
  { id: 'TMT', name: 'TMNT (2026)' },
  { id: 'ECL', name: 'Lorwyn Eclipsed (2026)' },
  { id: 'TLA', name: 'Avatar: The Last Airbender (2025)' },
  { id: 'SPM', name: "Marvel's Spider-Man (2025)" },
  { id: 'EOE', name: 'Edge of Eternities (2025)' },
  { id: 'FIN', name: 'Final Fantasy (2025)' },
  { id: 'TDM', name: 'Tarkir: Dragonstorm (2025)' },
  { id: 'DFT', name: 'Aetherdrift (2025)' },
  { id: 'FDN', name: 'Foundations (2024)' },
  { id: 'DSK', name: 'Duskmourn (2024)' },
  { id: 'BLB', name: 'Bloomburrow (2024)' },
  { id: 'MH3', name: 'Modern Horizons 3 (2024)' },
  { id: 'OTJ', name: 'Outlaws of Thunder Junction (2024)' },
  { id: 'MKM', name: 'Karlov Manor (2024)' },
  { id: 'LCI', name: 'Lost Caverns of Ixalan (2023)' },
  { id: 'WOE', name: 'Wilds of Eldraine (2023)' },
  { id: 'LTR', name: 'Lord of the Rings (2023)' },
  { id: 'MOM', name: 'March of the Machine (2023)' },
  { id: 'ONE', name: 'Phyrexia: All Will Be One (2023)' },
  { id: 'BRO', name: "Brothers' War (2022)" },
  { id: 'DMU', name: 'Dominaria United (2022)' },
  { id: 'SNC', name: 'New Capenna (2022)' },
  { id: 'NEO', name: 'Kamigawa: Neon Dynasty (2022)' },
  { id: 'VOW', name: 'Crimson Vow (2021)' }
];

export const getGuildFromColors = (colors) => {
  if (colors.length !== 2) return 'Overall';
  
  const guilds = ['WU', 'UB', 'BR', 'RG', 'WG', 'WB', 'UR', 'BG', 'WR', 'UG'];
  const str1 = colors[0] + colors[1];
  const str2 = colors[1] + colors[0];
  
  if (guilds.includes(str1)) return str1;
  if (guilds.includes(str2)) return str2;
  
  return 'Overall';
};
