const $app = document.getElementById("app");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ---------- router ---------- */
function route() {
  const [, page, arg] = location.hash.split("/");
  stopMetro();
  window.scrollTo(0, 0);
  if (page === "ch" && arg) return chapterView(arg);
  if (page === "script") return scriptView();
  if (page === "cpr") return cprView();
  if (page === "me") return meView();
  if (page === "quiz") return quizView();
  if (page === "bag") return bagView();
  return homeView();
}
window.addEventListener("hashchange", route);

/* ---------- home ---------- */
function homeView() {
  const groups = [...new Set(CHAPTERS.map(c => c.group))];
  $app.innerHTML = `
    <section class="hero">
      <h1>คู่มือเอาตัวรอด</h1>
      <p>ทำทีละขั้น · อ่านง่าย · ใช้ได้แม้มือสั่น</p>
    </section>
    <div class="nums">
      ${NUMBERS.map(n => `<a class="num ${n.main ? "main" : ""}" href="tel:${n.n}"><b>${n.n}</b><small>${n.t}</small></a>`).join("")}
    </div>
    <div class="tools">
      <a class="tool" href="#/script"><b>🗣️ บทพูดตอนแจ้งเหตุ</b><span>กรอกข้อมูล → ได้ประโยคให้อ่านตามได้เลย</span></a>
      <a class="tool" href="#/cpr"><b>🎵 จับจังหวะ CPR</b><span>เมโทรนอม 110 ครั้ง/นาที มีเสียง+สั่น</span></a>
      <a class="tool" href="#/me"><b>🪪 บัตรสุขภาพของฉัน</b><span>โรค/ยา/แพ้ยา + ส่งตำแหน่งให้ญาติ</span></a>
      <a class="tool" href="#/quiz"><b>🧠 ทดสอบความรู้</b><span>6 ข้อ ทบทวนก่อนเหตุจริง</span></a>
      <a class="tool" href="#/bag"><b>🎒 เช็กลิสต์กระเป๋าฉุกเฉิน</b><span>เตรียมของรับภัยพิบัติ</span></a>
    </div>
    <input class="search" id="q" type="search" placeholder="ค้นหา เช่น สำลัก, งู, ไฟไหม้…" aria-label="ค้นหา">
    <div id="list"></div>`;
  const list = document.getElementById("list");
  const draw = q => {
    q = q.trim().toLowerCase();
    let n = 0;
    list.innerHTML = groups.map(g => {
      const items = CHAPTERS.filter(c => c.group === g && (!q || (c.title + c.when + c.steps.join(" ")).toLowerCase().includes(q)));
      if (!items.length) return "";
      return `<div class="group-title">${g}</div><div class="chapters">${items.map(c => {
        n++;
        return `<a class="chap ${c.urgent ? "urgent" : ""}" href="#/ch/${c.id}"><span class="ic">${c.icon}</span><span><b>${c.title}</b><small>${c.when}</small></span><span class="no">บทที่ ${CHAPTERS.indexOf(c) + 1}</span></a>`;
      }).join("")}</div>`;
    }).join("") || `<p>ไม่พบ “${esc(q)}” ลองคำอื่น หรือโทร 1669 ถ้าฉุกเฉิน</p>`;
  };
  draw("");
  document.getElementById("q").addEventListener("input", e => draw(e.target.value));
}

/* ---------- chapter ---------- */
function chapterView(id) {
  const i = CHAPTERS.findIndex(c => c.id === id);
  if (i < 0) return homeView();
  const c = CHAPTERS[i], prev = CHAPTERS[i - 1], next = CHAPTERS[i + 1];
  $app.innerHTML = `
    <a class="back" href="#/">← สารบัญ</a>
    <div class="chapter-head">
      <div class="kicker">บทที่ ${i + 1} · ${c.group}</div>
      <h1>${c.icon} ${c.title}</h1>
    </div>
    <div class="when"><b>สังเกต:</b> ${c.when}</div>
    ${c.urgent ? `<a class="callbox" href="tel:1669"><span>📞</span>เห็นแบบนี้ → โทร 1669 ก่อน แล้วค่อยทำตามขั้นตอน</a>` : ""}
    <ol class="steps">${c.steps.map(s => `<li>${s}</li>`).join("")}</ol>
    <p style="color:var(--muted);font-size:14px;margin:-4px 0 8px">แตะแต่ละข้อเมื่อทำเสร็จเพื่อติ๊กถูก</p>
    <div class="dd">
      <div class="box do"><h3>✅ ควรทำ</h3><ul>${c.dos.map(d => `<li>${d}</li>`).join("")}</ul></div>
      <div class="box dont"><h3>⛔ ห้ามทำ</h3><ul>${c.donts.map(d => `<li>${d}</li>`).join("")}</ul></div>
    </div>
    <div class="dd">
      <button class="btn" id="readAloud">🔊 อ่านออกเสียงให้ฟัง</button>
      <a class="btn" href="#/script">🗣️ เปิดบทพูดแจ้งเหตุ</a>
      ${c.tool === "cpr" ? `<a class="btn red" href="#/cpr">🎵 เปิดเมโทรนอม CPR</a>` : ""}
    </div>
    <div class="pager">
      ${prev ? `<a class="btn" href="#/ch/${prev.id}">← ${prev.icon} ก่อนหน้า</a>` : "<span></span>"}
      ${next ? `<a class="btn" href="#/ch/${next.id}">ถัดไป ${next.icon} →</a>` : ""}
    </div>`;
  $app.querySelectorAll("ol.steps li").forEach(li => li.addEventListener("click", () => li.classList.toggle("done")));
  // อ่านออกเสียงทีละข้อ — ใช้ตอนมือไม่ว่างหรือตื่นตระหนกจนอ่านไม่เข้าหัว
  document.getElementById("readAloud").onclick = e => {
    if (!("speechSynthesis" in window)) return alert("เบราว์เซอร์นี้ไม่รองรับเสียงอ่าน");
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); e.target.textContent = "🔊 อ่านออกเสียงให้ฟัง"; return; }
    e.target.textContent = "⏹ หยุดอ่าน";
    c.steps.forEach((s, n) => {
      const u = new SpeechSynthesisUtterance(`ขั้นที่ ${n + 1}. ` + s.replace(/<[^>]+>/g, ""));
      u.lang = "th-TH"; u.rate = .9;
      if (n === c.steps.length - 1) u.onend = () => (e.target.textContent = "🔊 อ่านออกเสียงให้ฟัง");
      speechSynthesis.speak(u);
    });
  };
}

/* ---------- script generator ---------- */
function scriptView() {
  const st = Object.assign(
    { type: "ambu", sit: "faint", loc: "", mark: "", count: "1", age: "", gender: "", time: "", phone: "", name: "", eta: "10", disease: "", allergy: "", lat: "", lon: "", home: "" },
    store.get("scriptState", {})
  );
  // เติมข้อมูลจากบัตรสุขภาพให้อัตโนมัติ ถ้ายังว่าง
  const me = store.get("me", {});
  if (!st.name && me.name) st.name = me.name;
  if (!st.phone && me.phone) st.phone = me.phone;
  if (!st.disease && me.conditions) st.disease = [me.conditions, me.meds].filter(Boolean).join(" / ");
  if (!st.allergy && me.allergies) st.allergy = me.allergies;
  $app.innerHTML = `
    <a class="back" href="#/">← สารบัญ</a>
    <h1>🗣️ บทพูดตอนแจ้งเหตุ</h1>
    <p>เลือกสถานการณ์ กรอกเท่าที่รู้ แล้ว<b>อ่านตามกล่องเหลืองด้านล่างได้เลย</b> ระบบจะจำค่าไว้ให้ครั้งหน้า (เก็บในเครื่องคุณเท่านั้น)</p>
    <div class="card">
      <h2>1) โทรหาใคร</h2>
      <div class="pills" data-k="type">${SCRIPT_TYPES.map(t => `<button class="pill" data-v="${t.id}">${t.label}</button>`).join("")}</div>
      <h2 style="margin-top:14px">2) เกิดอะไรขึ้น</h2>
      <div class="pills" data-k="sit">${SITUATIONS.map(t => `<button class="pill" data-v="${t.id}">${t.label}</button>`).join("")}</div>
    </div>
    <div class="card">
      <h2>3) ข้อมูล (กรอกเท่าที่รู้)</h2>
      <label>ที่เกิดเหตุ (บ้านเลขที่/ซอย/ถนน/เขต)</label>
      <div class="row" style="margin-bottom:6px">
        <button class="btn red" id="gpsBtn" type="button">📍 ใช้ตำแหน่งปัจจุบัน</button>
        <button class="btn" id="homeBtn" type="button">🏠 บ้านของฉัน</button>
        <button class="btn" id="saveHome" type="button">💾 จำที่อยู่นี้เป็นบ้าน</button>
      </div>
      <div id="geoMsg" style="font-size:15px;color:var(--muted);margin-bottom:6px"></div>
      <input class="f" data-f="loc" placeholder="เช่น 12/3 ซอยสุขุมวิท 22 เขตคลองเตย">
      <label>จุดสังเกตใกล้เคียง</label><input class="f" data-f="mark" placeholder="เช่น ตรงข้าม 7-11 / หน้าตลาด">
      <label>จำนวนผู้ป่วย</label><input class="f" data-f="count" inputmode="numeric">
      <label>อายุโดยประมาณ</label><input class="f" data-f="age" placeholder="เช่น 60 ปี / ทารก / เด็ก 5 ขวบ">
      <label>เพศ</label><select class="f" data-f="gender"><option value="">ไม่ระบุ</option><option>ชาย</option><option>หญิง</option></select>
      <label>เริ่มมีอาการเมื่อ (เวลา)</label><input class="f" data-f="time" placeholder="เช่น 14.20 น. / 10 นาทีที่แล้ว">
      <label>ชื่อผู้แจ้ง</label><input class="f" data-f="name" placeholder="ชื่อของคุณ">
      <label>เบอร์โทรกลับ</label><input class="f" data-f="phone" inputmode="tel" placeholder="08x-xxx-xxxx">
      <div id="hospExtra">
        <label>รถจะถึง รพ. ภายใน (นาที)</label><input class="f" data-f="eta" inputmode="numeric">
        <label>โรคประจำตัว / ยาที่กิน</label><input class="f" data-f="disease">
        <label>ประวัติแพ้ยา</label><input class="f" data-f="allergy">
      </div>
    </div>
    <h2>📖 อ่านตามนี้</h2>
    <div class="script" id="out"></div>
    <div class="dd" style="margin-top:10px">
      <button class="btn" id="copyBtn">📋 คัดลอกข้อความ</button>
      <button class="btn" id="speakBtn">🔊 ให้เครื่องอ่านให้ฟัง</button>
    </div>
    <div class="card"><h2>💬 เจ้าหน้าที่มักถามอะไร</h2><div class="qa">
      <div><b>ถาม:</b> “เกิดเหตุที่ไหนคะ?” → ตอบที่อยู่ + จุดสังเกต</div>
      <div><b>ถาม:</b> “เกิดอะไรขึ้น?” → ประโยคสั้น เช่น “เขาหมดสติ ไม่หายใจ”</div>
      <div><b>ถาม:</b> “เขารู้สึกตัวไหม? หายใจไหม?” → ตอบตามที่เห็น</div>
      <div><b>ถาม:</b> “กี่คน อายุเท่าไหร่?”</div>
      <div><b>ถาม:</b> “มีโรคประจำตัวหรือแพ้ยาไหม?”</div>
      <div><b>บอก:</b> “ฉันจะอยู่ในสาย ช่วยบอกวิธีทำด้วย”</div>
    </div></div>
    <div class="card"><h2>📌 เคล็ดลับตอนโทร</h2><ul class="tips">${PHONE_TIPS.map(t => `<li>${t}</li>`).join("")}</ul></div>`;

  const out = document.getElementById("out");
  const hosp = document.getElementById("hospExtra");
  const m = v => v ? `<mark>${esc(v)}</mark>` : `<mark>……(ไม่ทราบ)</mark>`;

  function build(html) {
    const sit = SITUATIONS.find(s => s.id === st.sit);
    const detail = sit.detail.replace("{เวลา}", st.time || "…");
    const who = `ผู้ป่วย ${st.count || "1"} คน${st.gender ? " เป็น" + st.gender : ""}${st.age ? " อายุประมาณ " + st.age : ""}`;
    const lines = [];
    const M = html ? m : (v => v || "……");
    if (st.type === "hospital") {
      lines.push(`สวัสดีค่ะ/ครับ ฉันชื่อ ${M(st.name)} ขอสายห้องฉุกเฉิน`);
      lines.push(`มีผู้ป่วยฉุกเฉินกำลังจะเดินทางไปที่โรงพยาบาลของคุณ ภายในประมาณ ${M(st.eta)} นาที`);
      lines.push(`อาการ: ${detail}`);
      lines.push(`${who}`);
      if (st.time) lines.push(`เริ่มมีอาการเมื่อ ${M(st.time)}`);
      lines.push(`โรคประจำตัว/ยาที่กิน: ${M(st.disease)}  ประวัติแพ้ยา: ${M(st.allergy)}`);
      lines.push(`ขอให้เตรียมทีมรับที่หน้าห้องฉุกเฉินด้วย เบอร์โทรกลับ ${M(st.phone)}`);
      lines.push(`ขอบคุณค่ะ/ครับ`);
    } else {
      const fire = st.type === "fire" || st.sit === "fire";
      lines.push(`สวัสดีค่ะ/ครับ ฉันชื่อ ${M(st.name)} ขอแจ้งเหตุ${fire ? "ไฟไหม้" : "ฉุกเฉิน"}`);
      lines.push(`เหตุเกิดที่ ${M(st.loc)}${st.mark ? " ใกล้ " + M(st.mark) : ""}`);
      if (st.lat) lines.push(`พิกัด GPS ละติจูด ${M(st.lat)} ลองจิจูด ${M(st.lon)}`);
      lines.push(`${detail}`);
      if (st.sit !== "fire") lines.push(who);
      if (st.time && st.sit !== "stroke") lines.push(`เริ่มเมื่อ ${M(st.time)}`);
      lines.push(`เบอร์โทรกลับ ${M(st.phone)}`);
      lines.push(`ฉันจะอยู่ในสาย ช่วยบอกวิธีทำด้วยนะคะ/ครับ`);
    }
    return lines.join("\n");
  }
  function paint() {
    out.innerHTML = build(true);
    hosp.style.display = st.type === "hospital" ? "" : "none";
    $app.querySelectorAll(".pills").forEach(p => p.querySelectorAll(".pill").forEach(b => b.classList.toggle("on", st[p.dataset.k] === b.dataset.v)));
    store.set("scriptState", st);
  }
  $app.querySelectorAll(".pills").forEach(p => p.addEventListener("click", e => {
    const b = e.target.closest(".pill"); if (!b) return;
    st[p.dataset.k] = b.dataset.v; paint();
  }));
  $app.querySelectorAll("[data-f]").forEach(el => {
    el.value = st[el.dataset.f];
    el.addEventListener("input", () => { st[el.dataset.f] = el.value; paint(); });
  });
  document.getElementById("copyBtn").onclick = async e => {
    try { await navigator.clipboard.writeText(build(false)); e.target.textContent = "✓ คัดลอกแล้ว"; } catch { e.target.textContent = "คัดลอกไม่ได้ — เลือกข้อความเอง"; }
  };
  document.getElementById("speakBtn").onclick = () => {
    if (!("speechSynthesis" in window)) return alert("เบราว์เซอร์นี้ไม่รองรับเสียงอ่าน");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(build(false).replace(/\n/g, " "));
    u.lang = "th-TH"; u.rate = .9; speechSynthesis.speak(u);
  };
  paint();

  /* ---- GPS: หาตำแหน่งปัจจุบันแล้วเติมที่อยู่ให้อัตโนมัติ ---- */
  const geoMsg = document.getElementById("geoMsg"), locInput = $app.querySelector('[data-f="loc"]');
  const setLoc = v => { st.loc = v; locInput.value = v; paint(); };
  async function useGps() {
    if (!navigator.geolocation) { geoMsg.textContent = "เครื่องนี้ไม่รองรับ GPS — พิมพ์ที่อยู่เอง หรือกด “บ้านของฉัน”"; return; }
    geoMsg.textContent = "⏳ กำลังหาตำแหน่ง… (กด “อนุญาต” ถ้ามีหน้าต่างถาม)";
    navigator.geolocation.getCurrentPosition(async pos => {
      st.lat = pos.coords.latitude.toFixed(5); st.lon = pos.coords.longitude.toFixed(5);
      const acc = Math.round(pos.coords.accuracy);
      geoMsg.textContent = `✅ ได้พิกัดแล้ว (คลาดเคลื่อน ~${acc} ม.) กำลังแปลงเป็นที่อยู่…`;
      setLoc(st.loc || `พิกัด ${st.lat}, ${st.lon}`);
      try {
        const ctl = new AbortController(); setTimeout(() => ctl.abort(), 7000);
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=th&zoom=18&lat=${st.lat}&lon=${st.lon}`, { signal: ctl.signal });
        const j = await r.json();
        if (j.display_name) { setLoc(j.display_name.replace(/, ประเทศไทย$/, "").replace(/, \d{5}$/, "")); geoMsg.textContent = `✅ เติมที่อยู่จากตำแหน่งแล้ว (คลาดเคลื่อน ~${acc} ม.) — ตรวจสอบก่อนพูดทุกครั้ง`; }
      } catch { geoMsg.textContent = `✅ ได้พิกัด GPS แล้ว (ออฟไลน์/แปลงที่อยู่ไม่ได้) — เจ้าหน้าที่ใช้พิกัดนี้ได้ แต่ควรบอกชื่อถนน/จุดสังเกตด้วย`; }
    }, err => {
      geoMsg.textContent = err.code === 1 ? "❌ ไม่ได้อนุญาตตำแหน่ง — เปิดสิทธิ์ Location ให้เว็บนี้ หรือกด “บ้านของฉัน”" : "❌ หาตำแหน่งไม่ได้ ลองออกที่โล่ง หรือพิมพ์เอง";
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  }
  document.getElementById("gpsBtn").onclick = useGps;
  document.getElementById("homeBtn").onclick = () => { if (!st.home) { geoMsg.textContent = "ยังไม่ได้บันทึกบ้าน — พิมพ์ที่อยู่แล้วกด “จำที่อยู่นี้เป็นบ้าน”"; return; } st.lat = st.lon = ""; setLoc(st.home); geoMsg.textContent = "🏠 ใช้ที่อยู่บ้านที่บันทึกไว้"; };
  document.getElementById("saveHome").onclick = () => { st.home = st.loc; store.set("scriptState", st); geoMsg.textContent = "💾 บันทึกที่อยู่บ้านแล้ว (เก็บในเครื่องนี้เท่านั้น)"; };
  // เปิดหน้านี้แล้วหาตำแหน่งให้ทันที ถ้ายังไม่มีที่อยู่ — ตอนฉุกเฉินจะไม่ต้องกดอะไรเพิ่ม
  // ล้างที่อยู่เก่าทุกครั้ง กันเอาตำแหน่งของคราวก่อนไปแจ้งผิดที่
  st.loc = ""; st.lat = ""; st.lon = ""; locInput.value = ""; paint();
  useGps();
}

/* ---------- CPR metronome ---------- */
let metro = null, audioCtx = null;
function stopMetro() { if (metro) { clearInterval(metro.t); metro = null; } }
function cprView() {
  $app.innerHTML = `
    <a class="back" href="#/">← สารบัญ</a>
    <h1>🎵 จับจังหวะ CPR</h1>
    <div class="when"><b>จำไว้:</b> กดกลางอก ลึก 5–6 ซม. · 100–120 ครั้ง/นาที · โทร 1669 ก่อนเสมอ</div>
    <div class="card metro">
      <div class="beat" id="beat">0</div>
      <div class="bpm">
        <button class="btn" id="minus">−</button><b style="font-size:24px"><span id="bpmVal">110</span> ครั้ง/นาที</b><button class="btn" id="plus">+</button>
      </div>
      <p><button class="btn red big" id="go">▶ เริ่มจับจังหวะ</button></p>
      <p id="timer" style="font-size:20px;color:var(--muted)">เวลา 0:00 · ถึง 2:00 ให้สลับคนกด</p>
    </div>
    <p><a class="btn" href="#/ch/cpr">← อ่านขั้นตอน CPR</a></p>`;
  let bpm = 110, count = 0, started = 0;
  const beat = document.getElementById("beat"), val = document.getElementById("bpmVal"), go = document.getElementById("go"), timer = document.getElementById("timer");
  const click = () => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; g.gain.setValueAtTime(.4, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + .09);
      o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + .1);
    } catch {}
    if (navigator.vibrate) navigator.vibrate(30);
  };
  const tick = () => {
    count++; beat.textContent = count; beat.classList.add("pulse"); setTimeout(() => beat.classList.remove("pulse"), 90); click();
    const s = Math.floor((Date.now() - started) / 1000);
    timer.textContent = `เวลา ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}${s >= 120 && s % 120 < 10 ? " · ⚠ สลับคนกด!" : " · ถึง 2:00 ให้สลับคนกด"}`;
  };
  const start = () => { stopMetro(); count = 0; started = Date.now(); metro = { t: setInterval(tick, 60000 / bpm) }; tick(); go.textContent = "■ หยุด"; };
  go.onclick = () => metro ? (stopMetro(), go.textContent = "▶ เริ่มจับจังหวะ") : start();
  const adj = d => { bpm = Math.min(120, Math.max(100, bpm + d)); val.textContent = bpm; if (metro) start(); };
  document.getElementById("minus").onclick = () => adj(-5);
  document.getElementById("plus").onclick = () => adj(5);
}

/* ---------- บัตรสุขภาพ + ส่งตำแหน่งให้ญาติ ---------- */
function meView() {
  const me = Object.assign({ name: "", phone: "", blood: "", conditions: "", meds: "", allergies: "", c1n: "", c1p: "", c2n: "", c2p: "" }, store.get("me", {}));
  const fld = (k, label, ph = "", type = "text") => `<label>${label}</label><input class="f" data-k="${k}" type="${type}" value="${esc(me[k])}" placeholder="${ph}">`;
  $app.innerHTML = `
    <a class="back" href="#/">← สารบัญ</a>
    <h1>🪪 บัตรสุขภาพของฉัน</h1>
    <p>เก็บในเครื่องนี้เท่านั้น ไม่ส่งออกไปที่ใด · ข้อมูลจะถูกเติมให้อัตโนมัติในบทพูดแจ้งเหตุ · พิมพ์เก็บในกระเป๋าได้</p>
    <div class="card">${fld("name", "ชื่อ-สกุล")}${fld("phone", "เบอร์โทรของฉัน", "08x-xxx-xxxx", "tel")}${fld("blood", "หมู่เลือด", "เช่น O Rh+")}
      ${fld("conditions", "โรคประจำตัว", "เช่น เบาหวาน ความดัน หอบหืด")}${fld("meds", "ยาที่กินประจำ")}${fld("allergies", "แพ้ยา/อาหาร", "เช่น เพนิซิลลิน กุ้ง")}</div>
    <div class="card"><h2>👪 ผู้ติดต่อฉุกเฉิน</h2>
      ${fld("c1n", "คนที่ 1 ชื่อ/ความสัมพันธ์")}${fld("c1p", "เบอร์", "", "tel")}${fld("c2n", "คนที่ 2 ชื่อ/ความสัมพันธ์")}${fld("c2p", "เบอร์", "", "tel")}</div>
    <div class="card"><h2>📍 ส่งตำแหน่งให้ญาติ</h2>
      <p>กดแล้วจะเปิดแอปข้อความพร้อมลิงก์แผนที่ตำแหน่งปัจจุบันของคุณ</p>
      <div class="dd"><button class="btn red" id="s1">ส่งให้คนที่ 1</button><button class="btn red" id="s2">ส่งให้คนที่ 2</button><button class="btn" id="cpmap">คัดลอกลิงก์ตำแหน่ง</button></div>
      <div id="geoMsg2" style="color:var(--muted)"></div></div>
    <button class="btn" onclick="window.print()">🖨️ พิมพ์บัตร</button>`;
  $app.querySelectorAll("[data-k]").forEach(i => i.addEventListener("input", () => { me[i.dataset.k] = i.value; store.set("me", me); }));
  const msg = document.getElementById("geoMsg2");
  const where = cb => {
    if (!navigator.geolocation) return (msg.textContent = "เครื่องนี้ไม่รองรับ GPS");
    msg.textContent = "⏳ กำลังหาตำแหน่ง…";
    navigator.geolocation.getCurrentPosition(p => { msg.textContent = ""; cb(`https://maps.google.com/?q=${p.coords.latitude.toFixed(5)},${p.coords.longitude.toFixed(5)}`); },
      () => (msg.textContent = "❌ หาตำแหน่งไม่ได้ (ต้องอนุญาต Location)"), { enableHighAccuracy: true, timeout: 10000 });
  };
  const sms = (phone, n) => { if (!phone) return (msg.textContent = `ยังไม่ได้ใส่เบอร์คนที่ ${n}`); where(url => { location.href = `sms:${phone.replace(/\s/g, "")}?body=${encodeURIComponent(`🆘 ฉันต้องการความช่วยเหลือ ตำแหน่งตอนนี้: ${url}`)}`; }); };
  document.getElementById("s1").onclick = () => sms(me.c1p, 1);
  document.getElementById("s2").onclick = () => sms(me.c2p, 2);
  document.getElementById("cpmap").onclick = () => where(async url => { try { await navigator.clipboard.writeText(url); msg.textContent = "✓ คัดลอกแล้ว: " + url; } catch { msg.textContent = url; } });
}

/* ---------- ทดสอบความรู้ ---------- */
function quizView() {
  let i = 0, score = 0;
  const draw = () => {
    if (i >= QUIZ.length) {
      $app.innerHTML = `<a class="back" href="#/">← สารบัญ</a><div class="card" style="text-align:center"><h1>ได้ ${score} / ${QUIZ.length}</h1>
        <p>${score === QUIZ.length ? "เยี่ยม! ความรู้แน่นมาก 🎉" : score >= 4 ? "ดีมาก ทบทวนข้อที่พลาดอีกหน่อย" : "ลองอ่านคู่มืออีกรอบแล้วทำใหม่นะ"}</p>
        <button class="btn red" id="again">ทำใหม่</button> <a class="btn" href="#/">กลับสารบัญ</a></div>`;
      return (document.getElementById("again").onclick = () => { i = 0; score = 0; draw(); });
    }
    const q = QUIZ[i];
    $app.innerHTML = `<a class="back" href="#/">← สารบัญ</a><h1>🧠 ข้อ ${i + 1}/${QUIZ.length}</h1><div class="card"><h2>${q.q}</h2>
      ${q.a.map((t, n) => `<button class="btn big" style="display:block;width:100%;margin:8px 0;text-align:left" data-n="${n}">${t}</button>`).join("")}<div id="fb"></div></div>`;
    $app.querySelectorAll("[data-n]").forEach(b => b.onclick = () => {
      const ok = +b.dataset.n === q.c; if (ok) score++;
      $app.querySelectorAll("[data-n]").forEach(x => { x.disabled = true; if (+x.dataset.n === q.c) x.style.background = "var(--green)", x.style.color = "#fff"; });
      if (!ok) b.style.background = "var(--red)", b.style.color = "#fff";
      document.getElementById("fb").innerHTML = `<div class="when"><b>${ok ? "ถูกต้อง ✅" : "ยังไม่ถูก ❌"}</b> ${q.why}</div><button class="btn red" id="nx">${i === QUIZ.length - 1 ? "ดูคะแนน" : "ข้อถัดไป →"}</button>`;
      document.getElementById("nx").onclick = () => { i++; draw(); };
    });
  };
  draw();
}

/* ---------- เช็กลิสต์กระเป๋าฉุกเฉิน ---------- */
function bagView() {
  const done = new Set(store.get("bag", []));
  $app.innerHTML = `<a class="back" href="#/">← สารบัญ</a><h1>🎒 กระเป๋าฉุกเฉิน</h1><p id="prog" style="font-weight:700"></p>
    <ol class="steps">${BAG.map((t, n) => `<li data-n="${n}" class="${done.has(n) ? "done" : ""}">${t}</li>`).join("")}</ol>
    <p style="color:var(--muted)">แตะเพื่อติ๊กของที่เตรียมแล้ว · เช็กวันหมดอายุของยาและอาหารทุก 6 เดือน</p>`;
  const prog = () => (document.getElementById("prog").textContent = `เตรียมแล้ว ${done.size} / ${BAG.length}`);
  prog();
  $app.querySelectorAll("li").forEach(li => li.onclick = () => { const n = +li.dataset.n; done.has(n) ? done.delete(n) : done.add(n); li.classList.toggle("done"); store.set("bag", [...done]); prog(); });
}

/* ---------- panic mode ---------- */
const panic = document.getElementById("panic");
let breathTimer = null, calmI = 0;
function openPanic() {
  panic.hidden = false;
  const c = document.getElementById("breathCircle"), t = document.getElementById("breathText"), line = document.getElementById("calmLine");
  const phases = [["หายใจเข้า", 4, 1.7], ["ค้างไว้", 4, 1.7], ["หายใจออก", 6, 1]];
  let p = 0;
  const run = () => {
    const [txt, sec, sc] = phases[p % 3];
    t.textContent = txt; c.style.transitionDuration = sec + "s"; c.style.transform = `scale(${sc})`;
    if (p % 3 === 0) { line.textContent = CALM_LINES[calmI++ % CALM_LINES.length]; }
    breathTimer = setTimeout(run, sec * 1000); p++;
  };
  run();
}
function closePanic() { panic.hidden = true; clearTimeout(breathTimer); }
document.getElementById("panicBtn").onclick = openPanic;
document.getElementById("panicClose").onclick = closePanic;
document.getElementById("panicScript").addEventListener("click", closePanic);
document.addEventListener("keydown", e => { if (e.key === "Escape") closePanic(); });

if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
route();
