/* Builds the country dropdown from ISO 3166-1 alpha-2 codes. Names come from the
   browser's own Intl data, falling back to the raw code on older browsers. */
(function () {
  var CODES = ("AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI " +
    "KH CM CA CV CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI " +
    "FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG " +
    "LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL " +
    "NZ NI NE NG MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RO RU RW KN LC VC WS SM ST SA SN RS SC " +
    "SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB " +
    "US UY UZ VU VA VE VN YE ZM ZW").split(" ");

  var select = document.getElementById("country");
  if (!select) return;

  var names;
  try {
    names = new Intl.DisplayNames(["en"], { type: "region" });
  } catch (e) {
    names = null;
  }

  CODES.map(function (code) {
    var label = code;
    if (names) {
      try { label = names.of(code) || code; } catch (e) { /* keep the code */ }
    }
    return { code: code, label: label };
  }).sort(function (a, b) {
    return a.label.localeCompare(b.label);
  }).forEach(function (country) {
    var option = document.createElement("option");
    option.value = country.label;
    option.textContent = country.label;
    select.appendChild(option);
  });
})();
