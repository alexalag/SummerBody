// ─── IOC 3-letter code → ISO 3166-1 alpha-2 ────────────────────────────────
const ISO2 = {
  AFG:'AF', ALB:'AL', ALG:'DZ', AND:'AD', ANG:'AO', ANT:'AG', ARG:'AR',
  ARM:'AM', ARU:'AW', AUS:'AU', AUT:'AT', AZE:'AZ', BAH:'BS', BAN:'BD',
  BAR:'BB', BDI:'BI', BEL:'BE', BEN:'BJ', BHU:'BT', BIH:'BA', BLR:'BY',
  BOL:'BO', BOT:'BW', BRA:'BR', BRN:'BH', BUL:'BG', BUR:'BF', CAF:'CF',
  CAM:'KH', CAN:'CA', CHA:'TD', CHI:'CL', CHN:'CN', CIV:'CI', CMR:'CM',
  COD:'CD', COL:'CO', CPV:'CV', CRO:'HR', CUB:'CU', CYP:'CY', CZE:'CZ',
  DEN:'DK', DJI:'DJ', DOM:'DO', ECU:'EC', EGY:'EG', ERI:'ER', ESP:'ES',
  EST:'EE', ETH:'ET', FIN:'FI', FRA:'FR', GAB:'GA', GAM:'GM', GBR:'GB',
  GEO:'GE', GER:'DE', GHA:'GH', GRE:'GR', GRN:'GD', GUA:'GT', GUI:'GN',
  GUY:'GY', HAI:'HT', HKG:'HK', HON:'HN', HUN:'HU', INA:'ID', IND:'IN',
  IRI:'IR', IRL:'IE', ISL:'IS', ISR:'IL', ITA:'IT', JAM:'JM', JOR:'JO',
  JPN:'JP', KAZ:'KZ', KEN:'KE', KGZ:'KG', KOR:'KR', KOS:'XK', KUW:'KW',
  LAT:'LV', LBA:'LY', LBR:'LR', LIE:'LI', LTU:'LT', LUX:'LU', MAD:'MG',
  MAR:'MA', MAS:'MY', MDA:'MD', MEX:'MX', MGL:'MN', MLT:'MT', MNE:'ME',
  MON:'MC', MOZ:'MZ', MRI:'MU', MTN:'MR', NAM:'NA', NED:'NL', NEP:'NP',
  NGR:'NG', NIG:'NE', NOR:'NO', NZL:'NZ', OMA:'OM', PAK:'PK', PAN:'PA',
  PAR:'PY', PER:'PE', PHI:'PH', POL:'PL', POR:'PT', QAT:'QA', ROU:'RO',
  RSA:'ZA', RUS:'RU', RWA:'RW', SAM:'WS', SEN:'SN', SGP:'SG', SLE:'SL',
  SLO:'SI', SOM:'SO', SRB:'RS', SRI:'LK', SSD:'SS', SUD:'SD', SUI:'CH',
  SUR:'SR', SVK:'SK', SWE:'SE', SWZ:'SZ', TAN:'TZ', THA:'TH', TJK:'TJ',
  TKM:'TM', TOG:'TG', TPE:'TW', TTO:'TT', TUN:'TN', TUR:'TR', UAE:'AE',
  UGA:'UG', UKR:'UA', URU:'UY', USA:'US', UZB:'UZ', VAN:'VU', VEN:'VE',
  VIE:'VN', ZAM:'ZM', ZIM:'ZW',
};

// Returns a flag emoji for a 3-letter IOC country code
function flagEmoji(nat) {
  const iso = ISO2[nat];
  if (!iso) return '🏳️';
  return [...iso]
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('');
}
