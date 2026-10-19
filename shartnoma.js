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
  function tagHtml(items, size, logo) {
    const w = +size?.w || 58, h = +size?.h || 40, k = h / 40, mm = x => (x * k).toFixed(2) + "mm";
    const fit = (t, base, max) => { const n = String(t || "").length; return mm(n > max ? base * max / n : base); };
    const one = t => `<div class="tag">
  <div class="top">${[["Model:", t.model, 15], ["Xotira:", t.mem, 9], ["Yomkost:", t.batt, 7]].map(([l, x, mx]) => `<div><i>${l}</i><b style="font-size:${fit(x, 3.1, mx)}">${v(x)}</b></div>`).join("")}</div>
  <div class="mid"><div class="side"><b style="font-size:${fit(t.region, 3, 8)}">${v(t.region)}</b><i>Region:</i></div>
    <div class="logo">${LOGO}</div>
    <div class="side"><b class="price" style="font-size:${fit(t.price, 3.6, 11)}">${v(t.price)}</b><i>Narx:</i></div></div>
  <div class="foot"><span>${TG}${IG} @barakasavdorasmiy</span><span>${PH} 73 <b>249-29-29</b></span></div></div>`;
    return `<!doctype html><html><head><meta charset="utf-8"><title>Sennik</title><style>
@page{size:${w}mm ${h}mm;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}
body{font-family:Arial,Helvetica,sans-serif;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.tag{width:${w}mm;height:${h}mm;padding:${mm(1.6)} ${mm(2)} ${mm(1)};display:flex;flex-direction:column;overflow:hidden;page-break-after:always;break-after:page}
.tag:last-child{page-break-after:auto;break-after:auto}
i{font-style:italic;font-size:${mm(2.4)};color:#222}b{font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:clip}
.top{display:grid;grid-template-columns:1.45fr 1fr 1fr;gap:${mm(1.5)};text-align:center}
.top div{display:flex;flex-direction:column;align-items:center;gap:${mm(0.6)}}.top b{display:block;width:100%;border-bottom:${mm(0.25)} solid #000;padding-bottom:${mm(0.3)};line-height:1.15}
.mid{flex:1;display:grid;grid-template-columns:1fr 1.15fr 1fr;align-items:end;gap:${mm(1.5)};padding-bottom:${mm(1)}}
.side{display:flex;flex-direction:column;align-items:center;text-align:center;gap:${mm(0.6)}}.side b{display:block;width:100%;border-bottom:${mm(0.25)} solid #000;padding-bottom:${mm(0.3)};line-height:1.15}
.logo{display:flex;align-items:center;justify-content:center;height:100%;padding-top:${mm(.5)}}.logo svg{width:100%;max-height:${mm(15)}}
.foot{border-top:${mm(0.3)} solid #000;padding-top:${mm(0.8)};display:flex;justify-content:space-between;align-items:center;font-size:${mm(2.2)};white-space:nowrap}
.foot span{display:flex;align-items:center;gap:${mm(0.6)}}.foot svg{width:${mm(2.6)};height:${mm(2.6)}}.foot b{font-size:${mm(2.6)}}
@media screen{body{background:#ddd;padding:12px;display:flex;flex-wrap:wrap;gap:12px}.tag{background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.3)}}
</style></head><body>${items.map(one).join("")}<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`;
  }
  // Qora-oq logo (termoprinter uchun): belgi + BARAKA + Development
  const LOGO = `<svg viewBox="0 0 220 150" aria-label="Baraka Development"><g transform="translate(66,0)">
<path d="M14 6h52v4L2 74V20Q2 6 14 6z" fill="#000"/><path d="M88 0v70q0 6-6 6H8L88 0z" fill="#000"/>
<path d="M24 76 50 50M40 76 66 50M56 76 82 50" stroke="#fff" stroke-width="0"/><rect x="30" y="44" width="5" height="34" fill="#fff"/><rect x="47" y="30" width="5" height="48" fill="#fff"/><rect x="64" y="16" width="5" height="62" fill="#fff"/></g>
<text x="110" y="118" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="38" letter-spacing="2">BARAKA</text>
<text x="110" y="142" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="17" letter-spacing=".5">Development</text></svg>`;
  const TG = '<svg viewBox="0 0 24 24"><path d="M2 11.5 21 4l-3.2 16-6-4.6-3 2.8.4-4.6L17 7 7.6 13.2 2 11.5z" fill="#000"/></svg>';
  const IG = '<svg viewBox="0 0 24 24"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#000"/><circle cx="12" cy="12" r="4.3" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="#fff"/></svg>';
  const PH = '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" fill="#000"/></svg>';

  window.Shartnoma = {buyHtml, sellHtml, open, words, backCoverUsd, tagHtml, REQ_PRESETS, REQ_FIELDS};
})();
