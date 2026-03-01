
const parseEventDate = (dateStr: string) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.toLowerCase().replace(/,/g, '').trim();
    //console.log('cleanStr:', cleanStr);
    const parts = cleanStr.split(/[\s-]+/);
    console.log('parts:', parts);

    const monthMap: Record<string, number> = {
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
        'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
        'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };

    let day = -1, month = -1, year = new Date().getFullYear();

    // Check for "DD MMM YYYY" or "YYYY-MM-DD"
    if (parts.length >= 3) {
        // Iso-like YYYY-MM-DD
        if (parts[0].length === 4 && !isNaN(Number(parts[0]))) {
            year = Number(parts[0]);
            month = Number(parts[1]) - 1;
            day = Number(parts[2]);
        } else {
            // Natural "25 feb 2026"
            day = parseInt(parts[0]);
            const monthStr = parts.find(p => isNaN(Number(p)) && p.length >= 3);
            const yearStr = parts.find(p => !isNaN(Number(p)) && p.length === 4);

            if (monthStr) {
                Object.keys(monthMap).forEach(k => {
                    if (monthStr.startsWith(k)) month = monthMap[k];
                });
            }
            if (yearStr) year = parseInt(yearStr);
        }
    }

    console.log(`Parsed: D=${day}, M=${month}, Y=${year}`);

    if (day !== -1 && month !== -1) {
        return new Date(year, month, day);
    }
    return null;
};

const testDates = [
    "5 mar 2026",
    "05 mar 2026",
    "27 feb 2026",
    "2026-03-05",
    "5 Mar 2026",
    "5 Marzo 2026"
];

testDates.forEach(d => {
    console.log(`Testing "${d}":`, parseEventDate(d)?.toISOString());
});
