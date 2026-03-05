import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

// ─── DATA GENERATION ───────────────────────────────────────────────────────────
function generateData() {
  const methods = ["credit_card","debit_card","pix","oxxo","pse","bank_transfer"];
  const countries = ["Brazil","Mexico","Colombia","Spain"];
  const currencies = { Brazil:"BRL", Mexico:"MXN", Colombia:"COP", Spain:"EUR" };
  const processors = ["Stripe","Adyen","Kushki","PagSeguro"];
  const failureReasons = {
    soft: ["insufficient_funds","issuer_timeout","do_not_honor","processing_error"],
    hard: ["expired_card","invalid_cvv","stolen_card","fraud_suspected","card_blocked"]
  };
  const methodAuthRates = { credit_card:0.74, debit_card:0.78, pix:0.93, oxxo:0.88, pse:0.82, bank_transfer:0.80 };
  const countryModifier = { Brazil:1.0, Mexico:0.93, Colombia:0.96, Spain:1.05 };

  const txns = [];
  const now = Date.now();
  for (let i = 0; i < 1500; i++) {
    const country = countries[Math.floor(Math.random() * countries.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const daysAgo = Math.random() * 30;
    const ts = new Date(now - daysAgo * 86400000);
    const baseRate = methodAuthRates[method] * countryModifier[country];
    const amount = Math.floor(Math.random() * 1500 + 50);

    const passValidation = Math.random() < 0.98;
    if (!passValidation) {
      txns.push({ id: i, method, country, currency: currencies[country], amount, processor: processors[Math.floor(Math.random()*4)], ts, stage: "validation", status: "failed", declineType: "hard", reason: "invalid_cvv" });
      continue;
    }

    const passAuth = Math.random() < baseRate;
    if (!passAuth) {
      const isSoft = Math.random() < 0.55;
      const pool = isSoft ? failureReasons.soft : failureReasons.hard;
      const reason = pool[Math.floor(Math.random() * pool.length)];
      txns.push({ id: i, method, country, currency: currencies[country], amount, processor: processors[Math.floor(Math.random()*4)], ts, stage: "authorization", status: "failed", declineType: isSoft ? "soft" : "hard", reason });
      continue;
    }

    const passCapture = Math.random() < 0.97;
    if (!passCapture) {
      txns.push({ id: i, method, country, currency: currencies[country], amount, processor: processors[Math.floor(Math.random()*4)], ts, stage: "capture", status: "failed", declineType: "soft", reason: "processing_error" });
      continue;
    }

    txns.push({ id: i, method, country, currency: currencies[country], amount, processor: processors[Math.floor(Math.random()*4)], ts, stage: "capture", status: "success", declineType: null, reason: null });
  }
  return txns;
}

const ALL_DATA = generateData();

// ─── HELPERS ────────────────────────────────────────────────────────────────────
const fmt = n => n.toLocaleString();
const pct = (a, b) => b === 0 ? "0%" : (a / b * 100).toFixed(1) + "%";
const METHOD_LABELS = { credit_card:"Credit Card", debit_card:"Debit Card", pix:"PIX", oxxo:"OXXO", pse:"PSE", bank_transfer:"Bank Transfer" };
const REASON_LABELS = { insufficient_funds:"Insufficient Funds", issuer_timeout:"Issuer Timeout", do_not_honor:"Do Not Honor", processing_error:"Processing Error", expired_card:"Expired Card", invalid_cvv:"Invalid CVV", stolen_card:"Stolen Card", fraud_suspected:"Fraud Suspected", card_blocked:"Card Blocked" };

// ─── PAYMENT METHOD LOGOS ───────────────────────────────────────────────────────
const METHOD_LOGOS = {
  credit_card: (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="20" rx="3" fill="#1A1F71"/>
      <rect y="5" width="28" height="5" fill="#F7B600"/>
      <rect x="3" y="13" width="7" height="2" rx="1" fill="white" opacity="0.7"/>
    </svg>
  ),
  debit_card: (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="20" rx="3" fill="#EB001B"/>
      <circle cx="11" cy="10" r="6" fill="#EB001B"/>
      <circle cx="17" cy="10" r="6" fill="#F79E1B"/>
      <path d="M14 5.27C15.27 6.27 16.13 7.54 16.13 10C16.13 12.46 15.27 13.73 14 14.73C12.73 13.73 11.87 12.46 11.87 10C11.87 7.54 12.73 6.27 14 5.27Z" fill="#FF5F00"/>
    </svg>
  ),
  pix: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#32BCAD"/>
    </svg>
  ),
  oxxo: (
    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="20" rx="3" fill="#E8000A"/>
      <text x="20" y="14" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial">OXXO</text>
    </svg>
  ),
  pse: (
    <svg width="36" height="20" viewBox="0 0 36 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="20" rx="3" fill="#003087"/>
      <text x="18" y="14" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial">PSE</text>
    </svg>
  ),
  bank_transfer: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="9" width="18" height="11" rx="1" stroke="#4958e2" strokeWidth="1.5" fill="none"/>
      <path d="M11 2L20 9H2L11 2Z" stroke="#4958e2" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
      <rect x="5" y="12" width="3" height="5" rx="0.5" fill="#4958e2"/>
      <rect x="9.5" y="12" width="3" height="5" rx="0.5" fill="#4958e2"/>
      <rect x="14" y="12" width="3" height="5" rx="0.5" fill="#4958e2"/>
    </svg>
  ),
};

// ─── YUNO DESIGN TOKENS ─────────────────────────────────────────────────────────
const Y = {
  primary:   "#4958e2",
  primary2:  "#5463e3",
  primary3:  "#808be8",
  primaryBg: "#ecedf7",
  lavender:  "#afb6ee",
  dark:      "#292b31",
  gray:      "#a4a5ac",
  pageBg:    "#f4f5fb",
  cardBg:    "#ffffff",
  border:    "#e2e4f0",
  success:   "#16a34a",
  successBg: "#dcfce7",
  warn:      "#d97706",
  warnBg:    "#fef3c7",
  error:     "#dc2626",
  errorBg:   "#fee2e2",
};

function getDateRange(days) {
  return Date.now() - days * 86400000;
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterDays, setFilterDays] = useState(30);
  const [activeStage, setActiveStage] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState("Brazil");
  const [compareB, setCompareB] = useState("Mexico");

  const filtered = useMemo(() => {
    const cutoff = getDateRange(filterDays);
    return ALL_DATA.filter(t => {
      if (filterMethod !== "all" && t.method !== filterMethod) return false;
      if (filterCountry !== "all" && t.country !== filterCountry) return false;
      if (t.ts.getTime() < cutoff) return false;
      return true;
    });
  }, [filterMethod, filterCountry, filterDays]);

  function computeFunnel(data) {
    const total = data.length;
    const failedValidation = data.filter(t => t.stage === "validation" && t.status === "failed").length;
    const passedValidation = total - failedValidation;
    const failedAuth = data.filter(t => t.stage === "authorization" && t.status === "failed").length;
    const passedAuth = passedValidation - failedAuth;
    const failedCapture = data.filter(t => t.stage === "capture" && t.status === "failed").length;
    const captured = passedAuth - failedCapture;
    const authRate = passedValidation > 0 ? (passedAuth / passedValidation * 100).toFixed(1) : 0;
    const authFailed = data.filter(t => t.stage === "authorization" && t.status === "failed");
    const softDeclines = authFailed.filter(t => t.declineType === "soft").length;
    const hardDeclines = authFailed.filter(t => t.declineType === "hard").length;
    const reasonsByStage = {};
    ["validation","authorization","capture"].forEach(s => {
      const fails = data.filter(t => t.stage === s && t.status === "failed");
      const counts = {};
      fails.forEach(t => { counts[t.reason] = (counts[t.reason] || 0) + 1; });
      reasonsByStage[s] = Object.entries(counts).map(([r,c]) => ({ reason: REASON_LABELS[r] || r, count: c, pct: fails.length > 0 ? (c/fails.length*100).toFixed(1) : 0 })).sort((a,b)=>b.count-a.count);
    });
    return { total, passedValidation, failedValidation, passedAuth, failedAuth, captured, failedCapture, authRate, softDeclines, hardDeclines, authFailed: authFailed.length, reasonsByStage };
  }

  const funnel = useMemo(() => computeFunnel(filtered), [filtered]);

  const trendData = useMemo(() => {
    const days = [];
    for (let i = filterDays - 1; i >= 0; i--) {
      const dayStart = getDateRange(i + 1);
      const dayEnd = getDateRange(i);
      const dayData = filtered.filter(t => t.ts.getTime() >= dayStart && t.ts.getTime() < dayEnd);
      if (dayData.length === 0) continue;
      const f = computeFunnel(dayData);
      const d = new Date(dayEnd);
      days.push({ date: `${d.getMonth()+1}/${d.getDate()}`, authRate: parseFloat(f.authRate), volume: dayData.length });
    }
    return days;
  }, [filtered, filterDays]);

  const methodBreakdown = useMemo(() => {
    return ["credit_card","debit_card","pix","oxxo","pse","bank_transfer"].map(m => {
      const d = filtered.filter(t => t.method === m);
      if (d.length === 0) return null;
      const f = computeFunnel(d);
      return { method: METHOD_LABELS[m], authRate: parseFloat(f.authRate), volume: d.length };
    }).filter(Boolean).sort((a,b) => b.authRate - a.authRate);
  }, [filtered]);

  const insight = useMemo(() => {
    const best = methodBreakdown[0];
    const worst = methodBreakdown[methodBreakdown.length - 1];
    if (!best || !worst) return null;
    const softPct = funnel.authFailed > 0 ? (funnel.softDeclines / funnel.authFailed * 100).toFixed(0) : 0;
    if (parseFloat(funnel.authRate) < 75) return { type: "error", msg: `Authorization rate is critically low at ${funnel.authRate}% — immediate action needed.` };
    if (softPct > 60) return { type: "info", msg: `${softPct}% of declines are soft — retry logic could recover significant revenue.` };
    if (best.authRate - worst.authRate > 15) return { type: "warn", msg: `${worst.method} has a ${worst.authRate}% auth rate vs ${best.method}'s ${best.authRate}% — investigate this gap.` };
    return { type: "success", msg: `${best.method} is your top performer at ${best.authRate}% authorization rate.` };
  }, [funnel, methodBreakdown]);

  const compareData = useMemo(() => {
    if (!compareMode) return null;
    const cutoff = getDateRange(filterDays);
    const dA = ALL_DATA.filter(t => t.country === compareA && t.ts.getTime() >= cutoff);
    const dB = ALL_DATA.filter(t => t.country === compareB && t.ts.getTime() >= cutoff);
    return { a: { label: compareA, ...computeFunnel(dA) }, b: { label: compareB, ...computeFunnel(dB) } };
  }, [compareMode, compareA, compareB, filterDays]);

  const stageH = (val, max) => Math.max(40, (val / max) * 180);

  const insightColors = {
    success: { bg: Y.successBg, border: Y.success, color: "#14532d", icon: "✓" },
    warn:    { bg: Y.warnBg,    border: Y.warn,    color: "#78350f", icon: "!" },
    error:   { bg: Y.errorBg,  border: Y.error,   color: "#7f1d1d", icon: "!" },
    info:    { bg: Y.primaryBg, border: Y.primary, color: Y.dark,   icon: "i" },
  };

  return (
    <div style={{ background: Y.pageBg, minHeight:"100vh", color: Y.dark, fontFamily:"'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ background: Y.primary, padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <img src="https://cdn.prod.website-files.com/65e210a414fae2cb8054a995/695d6f6d2ced24e0f5c0cb0b_yuno_wordmark_blue.svg"
            alt="Yuno" style={{ height:22, filter:"brightness(0) invert(1)" }} />
          <div style={{ width:1, height:28, background:"rgba(255,255,255,0.25)" }} />
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", fontWeight:500 }}>Payment Intelligence Hub for TravelHub</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ fontSize:12, color: Y.lavender }}>
            {fmt(filtered.length)} transactions · Last {filterDays} days
          </div>
          <a href="/proposal" style={{ background:"white", color: Y.primary, fontSize:12, fontWeight:600, padding:"6px 14px", borderRadius:8, textDecoration:"none" }}>
            View Proposal →
          </a>
        </div>
      </div>

      <div style={{ padding:"24px 32px" }}>

        {/* Filters */}
        <div style={{ background: Y.cardBg, borderRadius:12, border:`1px solid ${Y.border}`, padding:"16px 20px", marginBottom:20, display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-end" }}>
          <FilterBadge label="Payment Method">
            <select value={filterMethod} onChange={e=>setFilterMethod(e.target.value)} style={selectStyle}>
              <option value="all">All Methods</option>
              {Object.entries(METHOD_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </FilterBadge>
          <FilterBadge label="Country">
            <select value={filterCountry} onChange={e=>setFilterCountry(e.target.value)} style={selectStyle}>
              <option value="all">All Countries</option>
              {["Brazil","Mexico","Colombia","Spain"].map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </FilterBadge>
          <FilterBadge label="Time Range">
            <select value={filterDays} onChange={e=>setFilterDays(Number(e.target.value))} style={selectStyle}>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </FilterBadge>
          <button onClick={()=>{setFilterMethod("all");setFilterCountry("all");setFilterDays(30);}} style={{ background:"white", border:`1px solid ${Y.border}`, color: Y.gray, padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12 }}>
            ↺ Reset
          </button>
          <button onClick={()=>setCompareMode(!compareMode)} style={{ background: compareMode ? Y.primary : "white", border:`1px solid ${compareMode ? Y.primary : Y.border}`, color: compareMode ? "white" : Y.dark, padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12, marginLeft:"auto", fontWeight:500 }}>
            ⚖️ Compare Mode
          </button>
        </div>

        {/* Active filter tags */}
        {(filterMethod !== "all" || filterCountry !== "all" || filterDays !== 30) && (
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
            {filterMethod !== "all" && <Tag label={METHOD_LABELS[filterMethod]} onRemove={()=>setFilterMethod("all")} />}
            {filterCountry !== "all" && <Tag label={filterCountry} onRemove={()=>setFilterCountry("all")} />}
            {filterDays !== 30 && <Tag label={`Last ${filterDays} days`} onRemove={()=>setFilterDays(30)} />}
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
          <KPI label="Authorization Rate" value={`${funnel.authRate}%`} sub={`${fmt(funnel.passedAuth)} approved`}
            color={parseFloat(funnel.authRate)>80 ? Y.success : parseFloat(funnel.authRate)>70 ? Y.warn : Y.error}
            bg={parseFloat(funnel.authRate)>80 ? Y.successBg : parseFloat(funnel.authRate)>70 ? Y.warnBg : Y.errorBg} />
          <KPI label="Total Transactions" value={fmt(funnel.total)} sub={`${fmt(funnel.captured)} captured`} color={Y.primary} bg={Y.primaryBg} />
          <KPI label="Soft Declines" value={pct(funnel.softDeclines, funnel.authFailed)} sub={`${fmt(funnel.softDeclines)} retryable`} color={Y.warn} bg={Y.warnBg} />
          <KPI label="Hard Declines" value={pct(funnel.hardDeclines, funnel.authFailed)} sub={`${fmt(funnel.hardDeclines)} permanent`} color={Y.error} bg={Y.errorBg} />
        </div>

        {/* Insight Banner */}
        {insight && (() => { const c = insightColors[insight.type]; return (
          <div style={{ background: c.bg, border:`1px solid ${c.border}`, borderRadius:10, padding:"12px 18px", marginBottom:20, fontSize:13, color: c.color, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ background: c.border, color:"white", borderRadius:"50%", width:20, height:20, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{c.icon}</span>
            {insight.msg}
          </div>
        ); })()}

        {/* Compare Mode */}
        {compareMode && compareData && (
          <div style={{ background: Y.cardBg, borderRadius:12, padding:24, marginBottom:20, border:`1px solid ${Y.border}` }}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:16, color: Y.dark }}>Country Comparison</div>
            <div style={{ display:"flex", gap:12, marginBottom:20 }}>
              <select value={compareA} onChange={e=>setCompareA(e.target.value)} style={selectStyle}>
                {["Brazil","Mexico","Colombia","Spain"].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ alignSelf:"center", color: Y.gray, fontWeight:600 }}>vs</span>
              <select value={compareB} onChange={e=>setCompareB(e.target.value)} style={selectStyle}>
                {["Brazil","Mexico","Colombia","Spain"].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
              {[compareData.a, compareData.b].map(d => (
                <div key={d.label}>
                  <div style={{ fontWeight:600, color: Y.primary, marginBottom:12, fontSize:14 }}>{d.label}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <KPI label="Auth Rate" value={`${d.authRate}%`} color={parseFloat(d.authRate)>80 ? Y.success : Y.warn} bg={parseFloat(d.authRate)>80 ? Y.successBg : Y.warnBg} sub="" />
                    <KPI label="Volume" value={fmt(d.total)} color={Y.primary} bg={Y.primaryBg} sub="" />
                  </div>
                  <MiniBar stages={[{name:"Validation",val:d.passedValidation},{name:"Auth",val:d.passedAuth},{name:"Captured",val:d.captured}]} max={d.total} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20, marginBottom:20 }}>

          {/* Funnel */}
          <div style={{ background: Y.cardBg, borderRadius:12, padding:24, border:`1px solid ${Y.border}` }}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:4, color: Y.dark }}>Payment Flow Funnel</div>
            <div style={{ fontSize:12, color: Y.gray, marginBottom:24 }}>Click a stage to see failure breakdown</div>
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:0 }}>
              {[
                { key:"validation",    label:"Validation",    total: funnel.total,           passed: funnel.passedValidation, failed: funnel.failedValidation, color: Y.primary },
                { key:"authorization", label:"Authorization", total: funnel.passedValidation, passed: funnel.passedAuth,       failed: funnel.failedAuth,       color: Y.primary2 },
                { key:"capture",       label:"Capture",       total: funnel.passedAuth,       passed: funnel.captured,         failed: funnel.failedCapture,    color: Y.success },
              ].map((stage, idx) => {
                const h = stageH(stage.passed, funnel.total);
                const isActive = activeStage === stage.key;
                return (
                  <div key={stage.key} style={{ display:"flex", alignItems:"flex-end" }}>
                    {idx > 0 && (
                      <div style={{ width:28, display:"flex", alignItems:"flex-end" }}>
                        <div style={{ width:0, height:0, borderTop:`${stageH([funnel.passedValidation,funnel.passedAuth][idx-1], funnel.total)/2}px solid transparent`, borderBottom:`${stageH([funnel.passedValidation,funnel.passedAuth][idx-1], funnel.total)/2}px solid transparent`, borderLeft:`28px solid ${[Y.primary,Y.primary2][idx-1]}`, opacity:0.25 }} />
                      </div>
                    )}
                    <div onClick={() => setActiveStage(isActive ? null : stage.key)} style={{ cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center" }}>
                      <div style={{ fontSize:12, fontWeight:600, color: Y.dark, marginBottom:6 }}>{fmt(stage.passed)}</div>
                      <div style={{ width:130, height:h, background: isActive ? stage.color : stage.color+"22", border:`2px solid ${isActive ? stage.color : stage.color+"55"}`, borderRadius:8, transition:"all 0.2s", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", position:"relative" }}>
                        <div style={{ fontSize:12, fontWeight:700, color: isActive ? "white" : stage.color }}>{stage.label}</div>
                        <div style={{ fontSize:11, color: isActive ? "rgba(255,255,255,0.8)" : Y.gray }}>{pct(stage.passed, stage.total)} pass</div>
                        {stage.failed > 0 && (
                          <div style={{ position:"absolute", top:-10, right:-10, background: Y.error, borderRadius:20, padding:"2px 8px", fontSize:11, fontWeight:700, color:"white" }}>
                            -{fmt(stage.failed)}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:11, color: Y.gray, marginTop:6 }}>{stage.label}</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ display:"flex", alignItems:"flex-end" }}>
                <div style={{ width:28, display:"flex", alignItems:"flex-end" }}>
                  <div style={{ width:0, height:0, borderTop:`${stageH(funnel.passedAuth, funnel.total)/2}px solid transparent`, borderBottom:`${stageH(funnel.passedAuth, funnel.total)/2}px solid transparent`, borderLeft:`28px solid ${Y.success}44` }} />
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <div style={{ fontSize:12, fontWeight:600, color: Y.success, marginBottom:6 }}>{fmt(funnel.captured)}</div>
                  <div style={{ width:90, height:stageH(funnel.captured, funnel.total), background: Y.successBg, borderRadius:8, border:`2px solid ${Y.success}`, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center" }}>
                    <div style={{ fontSize:12, fontWeight:700, color: Y.success }}>✓</div>
                    <div style={{ fontSize:11, color: Y.success }}>{pct(funnel.captured, funnel.total)}</div>
                  </div>
                  <div style={{ fontSize:11, color: Y.gray, marginTop:6 }}>Captured</div>
                </div>
              </div>
            </div>

            {activeStage && funnel.reasonsByStage[activeStage]?.length > 0 && (
              <div style={{ marginTop:20, background: Y.pageBg, borderRadius:10, padding:16, border:`1px solid ${Y.border}` }}>
                <div style={{ fontSize:13, fontWeight:600, color: Y.dark, marginBottom:12 }}>
                  Failure Breakdown — {activeStage.charAt(0).toUpperCase()+activeStage.slice(1)}
                </div>
                {funnel.reasonsByStage[activeStage].map(r => (
                  <div key={r.reason} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color: Y.dark, marginBottom:3 }}>
                      <span>{r.reason}</span><span style={{ color: Y.gray }}>{r.pct}% · {fmt(r.count)}</span>
                    </div>
                    <div style={{ height:6, background: Y.border, borderRadius:3 }}>
                      <div style={{ height:6, width:`${r.pct}%`, background: Y.error, borderRadius:3 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeStage && funnel.reasonsByStage[activeStage]?.length === 0 && (
              <div style={{ marginTop:16, color: Y.success, fontSize:13, textAlign:"center", fontWeight:500 }}>No failures at this stage</div>
            )}
          </div>

          {/* Method Breakdown */}
          <div style={{ background: Y.cardBg, borderRadius:12, padding:24, border:`1px solid ${Y.border}` }}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:4, color: Y.dark }}>Auth Rate by Method</div>
            <div style={{ fontSize:12, color: Y.gray, marginBottom:20 }}>Higher is better</div>
            {methodBreakdown.map(m => {
              const key = Object.keys(METHOD_LABELS).find(k => METHOD_LABELS[k] === m.method);
              return (
                <div key={m.method} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:32 }}>
                        {METHOD_LOGOS[key]}
                      </div>
                      <span style={{ fontSize:13, color: Y.dark }}>{m.method}</span>
                    </div>
                    <span style={{ fontWeight:600, fontSize:13, color: m.authRate>85 ? Y.success : m.authRate>75 ? Y.warn : Y.error }}>{m.authRate}%</span>
                  </div>
                  <div style={{ height:8, background: Y.primaryBg, borderRadius:4 }}>
                    <div style={{ height:8, width:`${m.authRate}%`, background: m.authRate>85 ? Y.success : m.authRate>75 ? Y.primary : Y.error, borderRadius:4, transition:"width 0.3s" }} />
                  </div>
                  <div style={{ fontSize:11, color: Y.gray, marginTop:2, paddingLeft:40 }}>{fmt(m.volume)} transactions</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trend Chart */}
        <div style={{ background: Y.cardBg, borderRadius:12, padding:24, border:`1px solid ${Y.border}`, marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:4, color: Y.dark }}>Authorization Rate Trend</div>
          <div style={{ fontSize:12, color: Y.gray, marginBottom:16 }}>Daily auth rate over selected period</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={Y.border} />
              <XAxis dataKey="date" stroke={Y.gray} tick={{fontSize:11, fill: Y.gray}} interval={Math.floor(trendData.length/6)} />
              <YAxis stroke={Y.gray} tick={{fontSize:11, fill: Y.gray}} domain={[50,100]} unit="%" />
              <Tooltip contentStyle={{ background:"white", border:`1px solid ${Y.border}`, borderRadius:8, color: Y.dark, fontSize:12 }} />
              <Line type="monotone" dataKey="authRate" stroke={Y.primary} strokeWidth={2.5} dot={false} name="Auth Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Country Volume */}
        <div style={{ background: Y.cardBg, borderRadius:12, padding:24, border:`1px solid ${Y.border}` }}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:4, color: Y.dark }}>Volume by Country</div>
          <div style={{ fontSize:12, color: Y.gray, marginBottom:16 }}>Transaction volume breakdown</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={["Brazil","Mexico","Colombia","Spain"].map(c => ({
              country: c,
              volume: filtered.filter(t=>t.country===c).length,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={Y.border} />
              <XAxis dataKey="country" stroke={Y.gray} tick={{fontSize:12, fill: Y.dark}} />
              <YAxis stroke={Y.gray} tick={{fontSize:11, fill: Y.gray}} />
              <Tooltip contentStyle={{ background:"white", border:`1px solid ${Y.border}`, borderRadius:8, color: Y.dark, fontSize:12 }} />
              <Bar dataKey="volume" fill={Y.primary} radius={[6,6,0,0]} name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

// ─── SUBCOMPONENTS ──────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color, bg }) {
  return (
    <div style={{ background: bg || "#f4f5fb", borderRadius:12, padding:20, border:`1px solid ${color}33` }}>
      <div style={{ fontSize:12, color:"#a4a5ac", marginBottom:6, fontWeight:500 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color, lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#a4a5ac", marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function FilterBadge({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <span style={{ fontSize:10, color:"#a4a5ac", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>{label}</span>
      {children}
    </div>
  );
}

function Tag({ label, onRemove }) {
  return (
    <span style={{ background:"#ecedf7", color:"#4958e2", fontSize:12, padding:"4px 12px", borderRadius:20, display:"inline-flex", alignItems:"center", gap:6, border:"1px solid #afb6ee", fontWeight:500 }}>
      {label}
      <span onClick={onRemove} style={{ cursor:"pointer", color:"#808be8", fontSize:14, lineHeight:1 }}>×</span>
    </span>
  );
}

function MiniBar({ stages, max }) {
  return (
    <div style={{ marginTop:12 }}>
      {stages.map(s => (
        <div key={s.name} style={{ marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#a4a5ac", marginBottom:3 }}>
            <span>{s.name}</span><span style={{ fontWeight:500, color:"#292b31" }}>{fmt(s.val)}</span>
          </div>
          <div style={{ height:6, background:"#ecedf7", borderRadius:3 }}>
            <div style={{ height:6, width:`${(s.val/max)*100}%`, background:"#4958e2", borderRadius:3 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const selectStyle = { background:"white", color:"#292b31", border:"1px solid #e2e4f0", borderRadius:8, padding:"8px 12px", fontSize:13, cursor:"pointer", outline:"none", minWidth:140 };
