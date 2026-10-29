/* ================= SHARTNOMALAR (admin panel va sotuvchi ilovasi uchun umumiy) =================
   1) Sotib olish: mijoz telefonini firmaga sotadi (mijoz — Sotuvchi, firma — Sotib oluvchi).
   2) Sotish: firma mijozga telefon sotadi, muddatli to'lov va trade-in bilan.
   Har ikkisi bitta A4 varaqqa sig'adi. Ma'lumotlar tizimdan avtomatik to'ldiriladi,
   yo'q ma'lumot o'rniga "______" chiziq qo'yiladi (qo'lda yoziladi). */
(function () {
  const B = "______";
  const e = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
  const v = s => (s === undefined || s === null || String(s).trim() === "") ? B : e(s);
  const som = n => Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  const toD = d => d?.toDate ? d.toDate() : d?.seconds ? new Date(d.seconds * 1000) : d ? new Date(d) : new Date();
  const dateLine = d => { d = toD(d); return `"${String(d.getDate()).padStart(2, "0")}" ${MONTHS[d.getMonth()]} ${d.getFullYear()} y.`; };
  const dmy = s => /^\d{4}-\d{2}-\d{2}$/.test(s || "") ? s.split("-").reverse().join(".") : e(s || "");

  // Sonni o'zbekcha (lotin) so'z bilan: 4 200 000 -> "to'rt million ikki yuz ming"
  const ONES = ["", "bir", "ikki", "uch", "to'rt", "besh", "olti", "yetti", "sakkiz", "to'qqiz"];
  const TENS = ["", "o'n", "yigirma", "o'ttiz", "qirq", "ellik", "oltmish", "yetmish", "sakson", "to'qson"];
  const tri = n => { const h = Math.floor(n / 100), t = Math.floor(n % 100 / 10), o = n % 10, w = []; if (h) w.push(h > 1 ? ONES[h] : "bir", "yuz"); if (t) w.push(TENS[t]); if (o) w.push(ONES[o]); return w; };
  function words(n) {
    n = Math.round(Math.abs(n || 0)); if (!n) return "nol";
    const w = [];
    for (const [val, name] of [[1e9, "milliard"], [1e6, "million"], [1e3, "ming"], [1, ""]]) { const q = Math.floor(n / val); n %= val; if (q) w.push(...tri(q), ...(name ? [name] : [])); }
    return w.join(" ");
  }

  const CSS = `<style>@page{size:A4;margin:9mm 11mm}body{font-family:'Times New Roman',Times,serif;font-size:10.5pt;line-height:1.25;color:#000;margin:0;background:#fff}
h1{text-align:center;font-size:12.5pt;margin:0}.no{text-align:center;margin:0 0 4px}.top{display:flex;justify-content:space-between;gap:16px;margin-bottom:5px}
h2{font-size:10.5pt;margin:6px 0 2px}p{margin:0 0 3px;text-align:justify}table{width:100%;border-collapse:collapse;margin:3px 0 4px}
td,th{border:1px solid #000;padding:2px 4px;font-size:10pt;vertical-align:top}th{background:#eee}.r{text-align:right;white-space:nowrap}.c{text-align:center}
.req td{width:50%;font-size:9.5pt;line-height:1.3}.sign{margin-top:8px}.sch td{font-size:9pt;padding:1px 4px}
.bar{position:sticky;top:0;background:#00297D;color:#fff;padding:8px 12px;font-family:Arial,sans-serif;display:flex;gap:8px;align-items:center;justify-content:space-between}
.bar button{font:600 14px Arial;padding:7px 14px;border-radius:8px;border:0;background:#E8B921;color:#00297D;cursor:pointer}.page{max-width:190mm;margin:0 auto;padding:10px}
@media print{.bar{display:none}.page{padding:0;max-width:none}}</style>`;
  const shell = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title>${CSS}</head>
<body><div class="bar"><span>${e(title)}</span><button onclick="print()">🖨 Chop etish / PDF</button></div><div class="page">${body}</div></body></html>`;
  const head = (no, date, place, sub = "") => `<h1>OLDI-SOTDI SHARTNOMASI</h1><p class="no">${sub}№ ${v(no)}</p><div class="top"><span>${dateLine(date)}</span><span>${v(place)}</span></div>`;
  const firm = (role, r) => `<b>${role}:</b> ${v(r.firm)}<br>Manzil: ${v(r.addr)}<br>H/r: ${v(r.account)}, ${v(r.bank)}<br>MFO: ${v(r.mfo)}, STIR: ${v(r.stir)}, tel: ${v(r.phone)}<div class="sign">Rahbar: ${v(r.director)} ____________ M.O'.</div>`;
  const cli = (role, c) => `<b>${role}:</b> ${v(c.name)}<br>Pasport: ${v(c.passport)}<br>Manzil: ${c.address ? e(c.address) : "________________________________"}<br>Tel: ${v(c.phone)}<div class="sign">Imzo: ____________</div>`;

  /* ---------- 1. SOTIB OLISH ---------- */
  function buyHtml(d) {
    const r = d.req || {}, c = d.client || {}, items = d.items || [], total = items.reduce((t, i) => t + (i.sum || 0), 0), t = d.terms || {};
    const rows = items.map((i, k) => `<tr><td class="c">${k + 1}</td><td>${v(i.name)}</td><td>${v(i.cond)}</td><td>${v(i.imei)}</td><td class="r">${som(i.sum)} so'm</td></tr>`).join("");
    return shell(`Sotib olish shartnomasi № ${d.no || ""}`, `${head(d.no, d.date, r.place)}
<p><b>Sotuvchi</b> ${v(c.name)} (pasport ${v(c.passport)}) bir tomondan va <b>Sotib oluvchi</b> ${v(r.firm)} Ustavi asosida harakat qiluvchi rahbar ${v(r.director)} nomidan ikkinchi tomondan quyidagilar to'g'risida mazkur shartnomani tuzdilar:</p>
<h2>1. SHARTNOMA PREDMETI</h2>
<p>1.1. Sotuvchi o'ziga tegishli quyidagi mahsulotni Sotib oluvchiga mulk qilib topshiradi, Sotib oluvchi uni qabul qilib, haqini to'laydi:</p>
<table><tr><th>№</th><th>Mahsulotning nomi</th><th>Holati</th><th>IMEI</th><th>Summasi</th></tr>${rows}
<tr><td></td><td colspan="3"><b>Jami:</b></td><td class="r"><b>${som(total)} so'm</b></td></tr></table>
<p>1.2. Mahsulotning umumiy bahosi ${som(total)} (${words(total)}) so'm.</p>
<p>1.3. Sotuvchi ma'lum qilgan nuqsonlar: ${d.defects ? e(d.defects) : "yo'q"}.</p>
<h2>2. TO'LOV SHARTLARI</h2>
<p>2.1. Sotib oluvchi mahsulot qiymatini 100% miqdorida naqd yoki plastik karta orqali to'laydi.</p>
<p>2.2. Mahsulot sotib olingandan so'ng 7 (yetti) kun ichida unda kamchilik yoki nuqsonlar aniqlansa, mahsulot Sotuvchi ${v(c.name)}ga qaytariladi va Sotuvchi olgan pulini 100% miqdorida qaytarishga majbur bo'ladi.</p>
<h2>3. SOTUVCHINING KAFOLATLARI VA JAVOBGARLIGI</h2>
<p>3.1. Sotuvchi mahsulotni shartnoma imzolangan kuni qutisi, hujjatlari va aksessuarlari (mavjud bo'lsa) bilan birga topshiradi.</p>
<p>3.2. Sotuvchi mahsulot g'ayriqonuniy yo'l bilan qo'lga kiritilmaganligi, bloklanmaganligi, bo'lib to'lash (nasiya) yo'li bilan olinmaganligi va uchinchi shaxslar da'volaridan xoli ekanligini kafolatlaydi.</p>
<p>3.3. Mahsulotning 1.3-bandda ko'rsatilmagan nuqsonlari aniqlansa yoki mahsulot yuzasidan nazorat organlari tomonidan surishtiruv o'tkazilsa, barcha javobgarlik Sotuvchi zimmasida bo'ladi va Sotib oluvchi ko'rgan zarar Sotuvchi tomonidan to'liq qoplanadi.</p>
<h2>4. YAKUNIY QOIDALAR</h2>
<p>4.1. Nizolar muzokara yo'li bilan, kelishuvga erishilmasa O'zbekiston Respublikasi qonunchiligiga muvofiq sud orqali hal etiladi.</p>
<p>4.2. Shartnoma ikki nusxada tuzilib, bir xil yuridik kuchga ega. Shartnoma imzolangan kundan kuchga kiradi va ${v(t.months)} oy amal qiladi. Qo'shimcha shartlar: ${v(t.extra)}</p>
<h2>5. TARAFLARNING REKVIZITLARI</h2>
<table class="req"><tr><td>${cli("Sotuvchi", c)}</td><td>${firm("Sotib oluvchi", r)}</td></tr></table>`);
  }

  /* ---------- 2. SOTISH ---------- */
  function sellHtml(d) {
    const r = d.req || {}, c = d.client || {}, it = d.item || {}, t = d.terms || {}, sch = d.schedule || [], ti = d.tradeIn;
    let schHtml = "";
    if (sch.length) {
      const half = Math.ceil(sch.length / 2), cell = i => sch[i] ? `<td class="c">${i + 1}</td><td class="c">${dmy(sch[i].due)}</td><td class="r">${som(sch[i].amount)}</td><td style="width:16%"></td>` : "<td></td><td></td><td></td><td></td>";
      schHtml = `<table class="sch"><tr><th>№</th><th>Sana</th><th>Summa</th><th>Imzo</th><th>№</th><th>Sana</th><th>Summa</th><th>Imzo</th></tr>${Array.from({length: half}, (_, i) => `<tr>${cell(i)}${cell(i + half)}</tr>`).join("")}</table>`;
    }
    const pay = sch.length
      ? `<p>2.2. Qolgan ${som(d.rest)} so'm ${sch.length} oyga bo'lib to'lanadi: ustama bilan jami ${som(d.total)} (${words(d.total)}) so'm, oylik to'lov ${som(d.monthly)} so'm. To'lovlar naqd yoki karta orqali quyidagi jadval bo'yicha amalga oshiriladi; muddatidan oldin to'lash mumkin:</p>${schHtml}`
      : d.rest > 0 ? `<p>2.2. Qolgan ${som(d.rest)} (${words(d.rest)}) so'm shartnoma imzolangan kuni naqd yoki karta orqali to'liq to'lanadi.</p>`
      : d.rest < 0 ? `<p>2.2. Narxlar farqi ${som(-d.rest)} (${words(-d.rest)}) so'm Sotuvchi tomonidan Sotib oluvchiga shartnoma imzolangan kuni qaytariladi.</p>` : "";
    return shell(`Sotish shartnomasi № ${d.no || ""}`, `${head(d.no, d.date, r.place, sch.length ? "(muddatli to'lov bilan) " : "")}
<p><b>Sotuvchi</b> ${v(r.firm)} Ustavi asosida harakat qiluvchi rahbar ${v(r.director)} nomidan bir tomondan va <b>Sotib oluvchi</b> ${v(c.name)} (pasport ${v(c.passport)}) ikkinchi tomondan quyidagilar to'g'risida mazkur shartnomani tuzdilar:</p>
<h2>1. SHARTNOMA PREDMETI</h2>
<p>1.1. Sotuvchi quyidagi mahsulotni Sotib oluvchiga sotadi, Sotib oluvchi uni qabul qilib, haqini shartnomada belgilangan tartibda to'laydi:</p>
<table><tr><th>№</th><th>Mahsulotning nomi</th><th>Holati</th><th>IMEI</th><th>Narxi</th></tr>
<tr><td class="c">1</td><td>${v(it.name)}</td><td>${v(it.cond)}</td><td>${v(it.imei)}</td><td class="r">${som(it.price)} so'm</td></tr></table>
<h2>2. TO'LOV TARTIBI</h2>
<p>2.1. Mahsulot narxi ${som(it.price)} (${words(it.price)}) so'm.${ti ? ` Shundan Sotib oluvchining eski mahsuloti (${v(ti.name)}${ti.imei ? ", IMEI " + e(ti.imei) : ""}) ${som(ti.sum)} so'mga baholanib, narx hisobiga qabul qilinadi (trade-in).` : ""}</p>
${pay}
<h2>3. TARAFLARNING MAJBURIYATLARI VA JAVOBGARLIGI</h2>
<p>3.1. Sotuvchi mahsulotni shartnoma imzolangan kuni to'liq komplektda topshiradi va uning qonuniy yo'l bilan olinganligi, bloklanmaganligini kafolatlaydi. Mahsulot qabul qilingach, tashqi ko'rinishiga oid e'tirozlar qabul qilinmaydi.</p>
<p>3.2. Sotib oluvchi ${sch.length ? "to'lovlarni jadval bo'yicha o'z vaqtida to'laydi va to'lov tugaguncha mahsulotni sotmaydi, garovga qo'ymaydi" : "mahsulot narxini shartnomada belgilangan tartibda to'laydi"}.</p>
<p>3.3. Mahsulotga 30 (o'ttiz) kun kafolat beriladi. Xarid qilingan kundan boshlab 3 (uch) kun ichida texnik nosozlik aniqlansa, mahsulot almashtirib beriladi. 3 kundan keyin 30 kungacha murojaat qilinsa, mahsulot servisga yo'naltiriladi. Kafolat mexanik shikast, suv tegishi va ruxsatsiz ta'mirga tatbiq etilmaydi.</p>
<h2>4. YAKUNIY QOIDALAR</h2>
<p>4.1. Nizolar muzokara yo'li bilan, kelishuvga erishilmasa O'zbekiston Respublikasi qonunchiligiga muvofiq sud orqali hal etiladi. Shartnoma ikki nusxada tuzilib, imzolangan kundan taraflar majburiyatlarini to'liq bajargunga qadar amal qiladi. Qo'shimcha shartlar: ${v(t.extra)}</p>
<h2>5. TARAFLARNING REKVIZITLARI</h2>
<table class="req"><tr><td>${firm("Sotuvchi", r)}</td><td>${cli("Sotib oluvchi", c)}</td></tr></table>`);
  }

  // Yangi oynada ochadi: yuqorida "Chop etish / PDF" tugmasi
  function open(html) {
    const w = window.open("", "_blank");
    if (!w) { alert("Brauzer yangi oyna ochishga ruxsat bermadi. Qalqib chiquvchi oynalarga ruxsat bering."); return false; }
    w.document.open(); w.document.write(html); w.document.close(); return true;
  }

  /* Telefon seriyasi bo'yicha orqa qopqoq yo'qligi uchun ayirma ($): 13–14 → 50, 15 → 60, 16 va yangilari → 70 */
  function backCoverUsd(modelName) {
    const n = +(String(modelName || "").match(/iPhone\s*(\d+)/i) || [])[1];
    return !n ? 0 : n <= 14 ? 50 : n === 15 ? 60 : 70;
  }

  /* Filiallar rekvizitlari (birinchi sozlash uchun tayyor ma'lumotlar; keyin admin paneldan tahrirlanadi) */
  const REQ_PRESETS = {
    1: {firm: "\"BUSSINES TRADE JSH\"", addr: "Qo'qon sh. Yangiobod MFY A.Charxiy ko'chasi 3D-uy (Ofis)", place: "Qo'qon shahar Furqat ko'chasi 102-uy (eski avtovokzal o'rni)", account: "20208000605633140001", bank: "\"InFinBank\" AJ Qo'qon filiali", mfo: "01116", stir: "310363549", phone: "+998 73 249 29 29", director: "Malikov S"},
    2: {firm: "\"INFINITY-SYSTEM\" MCHJ", addr: "Qo'qon sh. Yangiobod MFY A.Charxiy ko'chasi 3D-uy (Ofis)", place: "Qo'qon shahar A.T.Xo'qandiy mavzesi 93A-uy", account: "20208000905363278001", bank: "\"InFinBank\"", mfo: "01116", stir: "308311801", phone: "+998 73 249 29 29", director: "Kulbekov B"},
    3: {firm: "\"GOODS TRADE MALL\" MCHJ", addr: "Qo'qon sh. Yangiobod MFY A.Charxiy ko'chasi 3D-uy (Ofis)", place: "Farg'ona shahar Vatan ravnaqi ko'chasi 11B-uy, Simtepa MFY", account: "20208000305601401001", bank: "\"InFinBank\" ATB Qo'qon filiali", mfo: "01116", stir: "310134476", phone: "+998 73 249 29 29", director: "Tursunov B"},
    4: {firm: "INFINITE TRADE-2014", addr: "Qo'qon sh. Yangiobod MFY A.Charxiy ko'chasi 3D-uy (Ofis)", place: "Toshkent shahar Amir Temur shoh ko'chasi 61-uy", account: "20208000905585928001", bank: "\"KAPITALBANK\" ATB Qo'qon filiali", mfo: "01087", stir: "310003694", phone: "+998 73 249 29 29", director: "Bekmaxamatov Z"},
    5: {firm: "BUSSINES FACTORY", addr: "Qo'qon sh. Yangiobod MFY A.Charxiy ko'chasi 3D-uy (Ofis)", place: "Toshkent sh. Uchtepa tumani Ibrat ko'chasi 42-uy", account: "20208000805713345001", bank: "\"Kapitalbank\" ATB Qo'qon filiali", mfo: "01087", stir: "310895883", phone: "+998 73 249 29 29", director: "Kuldashev D"},
    6: {firm: "BARAKA DO'KONLAR TARMOG'I MCHJ №-1", addr: "Qo'qon sh. Yangiobod MFY A.Charxiy ko'chasi 3/1-uy (Ofis)", place: "Andijon vil. Izboskan tumani Oq oltin MFY, Poytug', Yuqori hosil ko'chasi 8-uy", account: "20208000307297944001", bank: "\"InFinBank\"", mfo: "01116", stir: "312368784", phone: "+998 73 249 29 29", director: "Madraximov X"},
    7: {firm: "BARAKA DO'KONLAR TARMOG'I MCHJ №-2", addr: "Qo'qon sh. Yangiobod MFY A.Charxiy ko'chasi 3/1-uy (Ofis)", place: "Andijon vil. Andijon shahar Mehnat MFY, Bobur Shoh ko'chasi 64-uy", account: "20208000507297944002", bank: "\"InFinBank\"", mfo: "01116", stir: "312368784", phone: "+998 73 229 49 49", director: "Madraximov X"}
  };
  const REQ_FIELDS = [["firm", "Firma nomi"], ["addr", "Manzil"], ["place", "Shartnoma tuzilgan joy"], ["account", "Hisob raqami"], ["bank", "Bank"], ["mfo", "MFO"], ["stir", "STIR"], ["phone", "Telefon"], ["director", "Rahbar F.I.O."]];

  /* ---------- SENNIK (narx yorlig'i) — Xprinter kabi termoprinter uchun ----------
     O'lcham Sozlamalarda (mm). Hamma o'lchamlar etiketka balandligiga qarab moslashadi. */
  /* Sennik dizaynlari (1–5). Hammasi qora-oq, termoprinter uchun: chetdan ~3 mm bo'sh joy, qalin yozuvlar. */
  const logoSvg = (fg = "#000", bg = "#fff", stacked = true) => {
    const mark = `<path d="M14 6h52v4L2 74V20Q2 6 14 6z" fill="${fg}"/><path d="M88 0v70q0 6-6 6H8L88 0z" fill="${fg}"/><rect x="30" y="44" width="5" height="34" fill="${bg}"/><rect x="47" y="30" width="5" height="48" fill="${bg}"/><rect x="64" y="16" width="5" height="62" fill="${bg}"/>`;
    return stacked
      ? `<svg viewBox="0 0 220 150"><g transform="translate(66,0)">${mark}</g><text x="110" y="120" text-anchor="middle" fill="${fg}" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="40" letter-spacing="2">BARAKA</text><text x="110" y="145" text-anchor="middle" fill="${fg}" font-family="Arial,sans-serif" font-weight="700" font-size="19">Development</text></svg>`
      : `<svg viewBox="0 0 330 80"><g>${mark}</g><text x="102" y="50" fill="${fg}" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="44" letter-spacing="2">BARAKA</text><text x="104" y="76" fill="${fg}" font-family="Arial,sans-serif" font-weight="700" font-size="20">Development</text></svg>`;
  };
  const TAG_DESIGNS = {1: "Klassik", 2: "Katta narx", 3: "Chap logo", 4: "Qora sarlavha", 5: "Jadval"};
  function tagHtml(items, size, logo, design) {
    const w = +size?.w || 58, h = +size?.h || 40, k = h / 40, mm = x => (x * k).toFixed(2) + "mm", d = TAG_DESIGNS[design] ? +design : 1, noRegion = false;
    const fit = (t, base, max) => { const n = String(t || "").length; return mm(n > max ? base * max / n : base); };
    const V = (x, base, max, cls = "") => `<b class="${cls}" style="font-size:${fit(x, base, max)}">${v(x)}</b>`;
    const foot = `<div class="foot"><span>${TG}${IG}<em>@barakasavdorasmiy</em></span><span>${PH}<em>73 249-29-29</em></span></div>`;
    const field = (l, x, base, max) => `<div class="f"><i>${l}</i>${V(x, base, max)}</div>`;
    const layouts = {
      1: t => `<div class="r3">${field("Model:", t.model, 3.4, 99)}${field("Xotira:", t.mem, 3.3, 7)}${field("Yomkost:", t.batt, 3.3, 5)}</div>
        ${noRegion ? `<div class="mid nr"><div class="lg">${logoSvg()}</div><div class="f end">${V(t.price, 4.6, 99)}<i>Narx:</i></div></div>`
          : `<div class="mid"><div class="f end">${V(t.region, 3.2, 7)}<i>Region:</i></div><div class="lg">${logoSvg()}</div><div class="f end">${V(t.price, 3.8, 99)}<i>Narx:</i></div></div>`}${foot}`,
      2: t => `<div class="r3">${field("Model:", t.model, 3.4, 99)}${field("Xotira:", t.mem, 3.2, 7)}${field("Yomkost:", t.batt, 3.2, 5)}</div>
        <div class="mid2"><div class="lg sm">${logoSvg()}</div><div class="f">${field("Region:", t.region, 3, 7)}</div></div>
        <div class="pricebar"><i>NARX</i>${V(t.price, 5.2, 11)}</div>${foot}`,
      3: t => `<div class="split"><div class="lg tall">${logoSvg()}</div><div class="rows">
        ${[["Model", t.model, 3.5, 99], ["Xotira", t.mem, 3.3, 9], ["Yomkost", t.batt, 3.3, 9], ["Region", t.region, 3.3, 9]].map(([l, x, b, mx]) => `<div class="row"><i>${l}:</i>${V(x, b, mx)}</div>`).join("")}
        <div class="row price"><i>Narx:</i>${V(t.price, 4, 99)}</div></div></div>${foot}`,
      4: t => `<div class="band">${logoSvg("#fff", "#000", false)}</div>
        <div class="g2">${field("Model:", t.model, 3.5, 99)}${field("Xotira:", t.mem, 3.3, 8)}${field("Yomkost:", t.batt, 3.3, 8)}${field("Region:", t.region, 3.3, 8)}</div>
        <div class="pricebar light"><i>Narx:</i>${V(t.price, 4.6, 11)}</div>${foot}`,
      5: t => `<div class="tb"><div class="c full head"><div class="lg line">${logoSvg("#000", "#fff", false)}</div></div>
        <div class="c full"><i>Model</i>${V(t.model, 3.8, 99)}</div>
        <div class="c"><i>Xotira</i>${V(t.mem, 3.3, 8)}</div><div class="c"><i>Yomkost</i>${V(t.batt, 3.3, 8)}</div>
        <div class="c"><i>Region</i>${V(t.region, 3.3, 8)}</div><div class="c"><i>Narx</i>${V(t.price, 3.6, 99)}</div></div>${foot}`
    };
    const css = `@page{size:${w}mm ${h}mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}
body{font-family:Arial,Helvetica,sans-serif;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.tag{width:${w}mm;height:${h}mm;padding:${mm(2.6)} ${mm(5)} ${mm(2.2)} ${mm(3.2)};display:flex;flex-direction:column;overflow:hidden;break-after:page;page-break-after:always}
.tag:last-child{break-after:auto;page-break-after:auto}
i{font-style:normal;font-weight:700;font-size:${mm(2.5)};color:#000;white-space:nowrap}b{font-weight:900;white-space:nowrap;overflow:hidden;line-height:1.12;color:#000}
em{font-style:normal;font-weight:800}
.f{display:flex;flex-direction:column;align-items:center;text-align:center;gap:${mm(.4)};min-width:0}.f b{display:block;width:100%;border-bottom:${mm(.35)} solid #000;padding-bottom:${mm(.3)}}
.f.end{justify-content:flex-end}
.r3{display:grid;grid-template-columns:1.9fr 1fr 1fr;gap:${mm(1.4)}}
.mid.nr{grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:${mm(3)}}.mid.nr .lg svg{max-height:${mm(18)}}
.mid{flex:1;display:grid;grid-template-columns:.9fr 1.25fr 1.3fr;align-items:end;gap:${mm(1.4)};padding:${mm(.6)} 0 ${mm(1.2)}}
.lg{display:flex;align-items:center;justify-content:center;height:100%;min-height:0}.lg svg{width:100%;height:100%;max-height:${mm(22)}}
.lg.sm svg{max-height:${mm(11)}}.lg.tall svg{max-height:${mm(26)}}.lg.line svg{max-height:${mm(5.5)}}
.mid2{flex:1;display:grid;grid-template-columns:1.3fr 1fr;align-items:center;gap:${mm(2)};padding:${mm(.6)} 0}
.pricebar{background:#000;color:#fff;border-radius:${mm(1)};display:flex;align-items:center;justify-content:space-between;padding:${mm(.6)} ${mm(2)};margin-bottom:${mm(1)}}
.pricebar i,.pricebar b{color:#fff}.pricebar b{flex:1;min-width:0;text-align:right;margin-left:${mm(1.5)}}.pricebar.light{background:#fff;border:${mm(.45)} solid #000}.pricebar.light i,.pricebar.light b{color:#000}
.split{flex:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.9fr);gap:${mm(2)};padding-bottom:${mm(1)};min-height:0}
.rows{display:flex;flex-direction:column;justify-content:space-between}.row{display:flex;align-items:baseline;gap:${mm(1)};border-bottom:${mm(.3)} solid #000;padding:${mm(.2)} 0}
.row i{width:${mm(11)};flex:none}.row b{flex:1;min-width:0;text-align:right}.row.price{border-bottom:${mm(.5)} solid #000}
.band{background:#000;border-radius:${mm(1)};padding:${mm(.8)} ${mm(2)};display:flex;justify-content:center;margin-bottom:${mm(1)}}.band svg{height:${mm(6)}}
.g2{flex:1;display:grid;grid-template-columns:1.3fr 1fr;grid-template-rows:1fr 1fr;gap:${mm(.6)} ${mm(2)};margin-bottom:${mm(1)}}.g2 .f{align-items:flex-start;text-align:left;justify-content:flex-end}
.tb{flex:1;display:grid;grid-template-columns:1fr 1fr;border:${mm(.45)} solid #000;border-radius:${mm(1)};overflow:hidden;margin-bottom:${mm(1)};min-height:0}
.tb .c{border-bottom:${mm(.3)} solid #000;padding:${mm(.3)} ${mm(1.2)};display:flex;flex-direction:column;justify-content:center;min-width:0}.tb .c:nth-child(even){border-right:${mm(.3)} solid #000}
.tb .full{grid-column:1/-1;border-right:0!important}.tb .c:nth-last-child(-n+2){border-bottom:0}.tb i{font-size:${mm(2.1)}}.tb .head{align-items:center}
.foot{overflow:hidden;border-top:${mm(.4)} solid #000;padding-top:${mm(.8)};display:flex;justify-content:space-between;align-items:center;font-size:${mm(2.45)};white-space:nowrap;gap:${mm(1)}}
.foot span{display:flex;align-items:center;gap:${mm(.6)}}.foot svg{width:${mm(2.8)};height:${mm(2.8)};flex:none}
@media screen{body{background:#ccc;padding:12px;display:flex;flex-wrap:wrap;gap:12px}.tag{background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.3)}}`;
    return `<!doctype html><html><head><meta charset="utf-8"><title>Sennik</title><style>${css}</style></head><body>${items.map(t => `<div class="tag d${d}">${layouts[d](t)}</div>`).join("")}<script>function fitAll(){document.querySelectorAll(".tag b").forEach(function(b){var s=parseFloat(getComputedStyle(b).fontSize);while(b.scrollWidth>b.clientWidth+.5&&s>5){s-=.25;b.style.fontSize=s+"px"}});document.querySelectorAll(".foot").forEach(function(f){var s=parseFloat(getComputedStyle(f).fontSize);while(f.scrollWidth>f.clientWidth+.5&&s>5){s-=.25;f.style.fontSize=s+"px"}})}fitAll();window.onload=function(){fitAll();if(!window.noPrint)setTimeout(function(){window.print()},300)}<\/script></body></html>`;
  }
  const TG = '<svg viewBox="0 0 24 24"><path d="M2 11.5 21 4l-3.2 16-6-4.6-3 2.8.4-4.6L17 7 7.6 13.2 2 11.5z" fill="#000"/></svg>';
  const IG = '<svg viewBox="0 0 24 24"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#000"/><circle cx="12" cy="12" r="4.3" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="#fff"/></svg>';
  const PH = '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" fill="#000"/></svg>';


  /* ---- Ombordagi telefonni ijtimoiy tarmoqlarga jo'natish: rasm-kartochka (1080×1350) + matn ----
     Telefonda tizimning "Ulashish" oynasi ochiladi (Telegram, Instagram, WhatsApp...). Kompyuterda — Telegram/WhatsApp havolalari, rasmni yuklab olish. */
  const SHARE_SITE = "https://barakaphone.github.io/mijoz.html";
  const SHARE_PHONES = [["Malika", "+998 91 154 99 44"], ["Anora", "+998 90 057 39 15"]];
  const slug = n => String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").replace(/^iphone-17-air$/, "iphone-air");
  const loadImg = src => new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const shareText = d => [`📱 ${d.model} ${d.mem || ""}`.trim(), d.color ? `🎨 Rangi: ${d.color}` : "", d.cond ? `✅ Holati: ${d.cond}${d.grade ? ", " + d.grade : ""}` : "",
    d.batt ? `🔋 Batareya: ${d.batt}%${d.cyc ? " · " + d.cyc + " sikl" : ""}` : "", d.box ? `📦 Qutisi: ${d.box}` : "", d.region ? `🌍 Region: ${d.region}` : "",
    `💰 Narxi: ${som(d.price)} so'm`, "", ...SHARE_PHONES.map(([n, t]) => `📞 ${t} (${n})`), `🌐 ${SHARE_SITE}`, "@barakasavdorasmiy"].filter((x, i) => x || i).join("\n");
  async function shareCard(d) {
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H); g.fillStyle = "#00297D"; g.fillRect(0, 0, W, 150); g.fillStyle = "#F2B705"; g.fillRect(0, 150, W, 10);
    const logo = await loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(logoSvg("#fff", "#00297D", false).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="330" height="80" ')));
    if (logo) g.drawImage(logo, 50, 35, 330, 80);
    g.fillStyle = "#fff"; g.font = "bold 34px Arial"; g.textAlign = "right"; g.fillText(d.cond || "", W - 50, 90); g.textAlign = "left";
    const ms = slug(d.model), cs = String(d.colorEn || "").toLowerCase().replace(/\(product\)/g, "product").replace(/[^a-z0-9]/g, "");
    const ph = (cs && await loadImg(`img/iphone/${ms}/${cs}.jpg`)) || await loadImg(d.img || `img/iphone/${ms}.jpg`);
    if (ph) { const box = 620, k = Math.min(box / ph.width, box / ph.height), w = ph.width * k, h = ph.height * k; g.drawImage(ph, (W - w) / 2, 190 + (box - h) / 2, w, h); }
    let y = 880; g.fillStyle = "#0b1220"; g.font = "bold 64px Arial"; g.fillText(`${d.model} ${d.mem || ""}`.trim(), 60, y);
    g.font = "36px Arial"; g.fillStyle = "#3a4458"; y += 60;
    for (const t of [d.color && "Rangi: " + d.color, [d.grade, d.batt && `batareya ${d.batt}%${d.cyc ? ", " + d.cyc + " sikl" : ""}`].filter(Boolean).join(" · "), [d.box && "Qutisi: " + d.box, d.region && "Region: " + d.region].filter(Boolean).join(" · ")].filter(Boolean)) { g.fillText(t, 60, y); y += 50; }
    g.fillStyle = "#00297D"; g.beginPath(); g.roundRect ? g.roundRect(60, 1110, W - 120, 120, 24) : g.rect(60, 1110, W - 120, 120); g.fill();
    g.fillStyle = "#F2B705"; g.font = "bold 72px Arial"; g.textAlign = "center"; g.fillText(`${som(d.price)} so'm`, W / 2, 1195);
    g.fillStyle = "#3a4458"; g.font = "30px Arial"; g.fillText(SHARE_PHONES.map(([n, t]) => `${t} (${n})`).join("   ·   "), W / 2, 1290); g.textAlign = "left";
    return new Promise(res => cv.toBlob(b => res(b), "image/jpeg", 0.9));
  }
  async function share(d) {
    const text = shareText(d), blob = await shareCard(d), name = `${slug(d.model)}-${String(d.mem || "").replace(/\s/g, "")}.jpg`;
    const file = new File([blob], name, {type: "image/jpeg"});
    // Telefonning o'zining (haqiqiy) rasmlari — kartochkadan keyin
    const real = await Promise.all((d.photos || []).map(async (u, i) => new File([await (await fetch(u)).blob()], name.replace(".jpg", `-${i + 1}.jpg`), {type: "image/jpeg"})));
    const files = [file, ...real];
    if (navigator.canShare && navigator.canShare({files})) {
      try { await navigator.share({files, text, title: `${d.model} ${d.mem || ""}`}); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    // Kompyuter yoki rasm ulashib bo'lmaydigan brauzer: oyna
    const url = URL.createObjectURL(blob), enc = encodeURIComponent, box = document.createElement("div");
    box.style.cssText = "position:fixed;inset:0;background:rgba(10,20,40,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px";
    box.innerHTML = `<div style="background:#fff;border-radius:16px;max-width:460px;width:100%;max-height:92vh;overflow:auto;padding:18px;font-family:Arial,sans-serif">
      <h3 style="margin:0 0 10px;color:#00297D">Jo'natish</h3><img src="${url}" style="width:100%;border-radius:10px;border:1px solid #ddd">
      ${real.length ? `<div style="font-weight:700;margin:10px 0 6px">Telefonning o'z rasmlari (${real.length})</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${(d.photos || []).map((u, i) => `<a download="${name.replace(".jpg", `-${i + 1}.jpg`)}" href="${u}"><img src="${u}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid #ddd"></a>`).join("")}</div>` : ""}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
        <a target="_blank" rel="noopener" href="https://t.me/share/url?url=${enc(SHARE_SITE)}&text=${enc(text)}" style="${btn("#229ED9")}">Telegram</a>
        <a target="_blank" rel="noopener" href="https://wa.me/?text=${enc(text)}" style="${btn("#25D366")}">WhatsApp</a>
        <button data-dlall style="${btn("#00297D")}">⬇ Rasmlarni yuklab olish${real.length ? ` (${real.length + 1})` : ""}</button>
        <button data-copy style="${btn("#555")}">📋 Matnni nusxalash</button></div>
      <p style="font-size:13px;color:#666;margin:10px 0 0">Instagram uchun: rasmni yuklab oling va Instagram'da post qiling, matnni nusxalab izohga qo'ying. Telefonda "Jo'natish" bosilsa, Instagram ro'yxatda o'zi chiqadi.</p>
      <button data-close style="${btn("#eee", "#222")};margin-top:12px;width:100%">Yopish</button></div>`;
    document.body.appendChild(box);
    box.onclick = async e => {
      if (e.target === box || e.target.closest("[data-close]")) { box.remove(); URL.revokeObjectURL(url); }
      if (e.target.closest("[data-dlall]")) [[url, name], ...(d.photos || []).map((u, i) => [u, name.replace(".jpg", `-${i + 1}.jpg`)])].forEach(([h, n], i) => setTimeout(() => { const a = document.createElement("a"); a.href = h; a.download = n; document.body.appendChild(a); a.click(); a.remove(); }, i * 400));
      if (e.target.closest("[data-copy]")) { try { await navigator.clipboard.writeText(text); e.target.textContent = "✓ Nusxalandi"; } catch { prompt("Matnni nusxalang:", text); } }
    };
  }
  const btn = (bg, fg = "#fff") => `display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:10px;background:${bg};color:${fg};text-decoration:none;font-weight:700;border:0;font-size:15px;cursor:pointer;padding:0 10px;text-align:center`;
  window.Shartnoma = {buyHtml, sellHtml, open, words, backCoverUsd, tagHtml, TAG_DESIGNS, REQ_PRESETS, REQ_FIELDS, share};
})();
