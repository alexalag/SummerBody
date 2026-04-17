// ─── Canvas geometry ──────────────────────────────────────────────────────────
// Frames are variable size (≈30–36 wide × 35–36 tall).
// The renderer scales each frame dynamically to fill canvas.width × canvas.height.
// Canvas HTML attributes: width=36, height=36.
// CSS display size: 160 × 220 px.
//
// Flag emoji position (chest/singlet centre, frame 1 as reference col≈15 row≈14):
//   FLAG_CX = 15/33 * 160 ≈ 72 px from canvas left
//   FLAG_CY = 14/36 * 220 ≈ 85 px from canvas top
const FLAG_CX = 72;
const FLAG_CY = 85;

// ─── Colour palette (must match pixel.js colour index comments) ───────────────
const HAIR_HI   = '#D4880A';   // 1  golden highlight
const HAIR_SH   = '#2E2B46';   // 2  dark navy shadow (from sprite scan)
const SKIN_LT   = '#F1D991';   // 3  skin light / mid-tone
const SKIN_SH   = '#E4A45C';   // 4  skin shadow
const SHORTS_C  = '#C02030';   // 7  (kept for bib fallback)
const SHORTS_SH = '#8B1020';   // 8
const SHOE_C    = '#1E4196';   // 10  dark blue shoe (from sprite)
const EYE_C     = '#080808';   // 11
const PANTS_C   = '#29CC9F';   // 12  teal pants
const PANTS_SH  = '#1B9E64';   // 13  dark green pants shadow
const SOCK_C      = '#EEEEEE';   // existing — male sock (white)
const SOCK_FEMALE = '#4a247b';   // new — female sock (darker purple)

// Sex-dynamic colours (singlet + bib)
const SHIRT_MALE   = '#5C9CE4';   // blue singlet (original sprite colour)
const SHIRT_FEMALE = '#9b5de5';   // purple singlet
const PATCH_MALE   = '#A0C8FF';   // bib highlight male
const PATCH_FEMALE = '#d8b0ff';   // bib highlight female
