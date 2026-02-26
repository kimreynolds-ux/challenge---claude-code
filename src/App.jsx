import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

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

function getDateRange(days) {
  const now = Date.now();
  return now - days * 86400000;
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

    const authAttempts = passedValidation;
    const authRate = authAttempts > 0 ? (passedAuth / authAttempts * 100).toFixed(1) : 0;
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
    if (parseFloat(funnel.authRate) < 75) return { type: "warn", msg: `⚠️ Authorization rate is critically low at ${funnel.authRate}% — immediate action needed.` };
    if (softPct > 60) return { type: "info", msg: `💡 ${softPct}% of declines are soft — retry logic could recover significant revenue.` };
    if (best.authRate - worst.authRate > 15) return { type: "warn", msg: `⚠️ ${worst.method} has a ${worst.authRate}% auth rate vs ${best.method}'s ${best.authRate}% — investigate this gap.` };
    return { type: "good", msg: `✅ ${best.method} is your top performer at ${best.authRate}% authorization rate.` };
  }, [funnel, methodBreakdown]);

  const compareData = useMemo(() => {
    if (!compareMode) return null;
    const cutoff = getDateRange(filterDays);
    const dA = ALL_DATA.filter(t => t.country === compareA && t.ts.getTime() >= cutoff);
    const dB = ALL_DATA.filter(t => t.country === compareB && t.ts.getTime() >= cutoff);
    return { a: { label: compareA, ...computeFunnel(dA) }, b: { label: compareB, ...computeFunnel(dB) } };
  }, [compareMode, compareA, compareB, filterDays]);

  const stageH = (val, max) => Math.max(40, (val / max) * 180);

  return (
    <div style={{ background:"#0f172a", minHeight:"100vh", color:"#e2e8f0", fontFamily:"'Inter',sans-serif", padding:"0" }}>
      <div style={{ background:"#1e293b", borderBottom:"1px solid #334155", padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:"#f1f5f9" }}>✈️ TravelHub</div>
          <div style={{ fontSize:12, color:"#94a3b8" }}>Payment Intelligence Dashboard</div>
        </div>
        <div style={{ fontSize:12, color:"#64748b" }}>
          {fmt(filtered.length)} transactions · Last {filterDays} days
        </div>
      </div>

      <div style={{ padding:"24px 32px" }}>
        <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap", alignItems:"center" }}>
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
          <button onClick={()=>{setFilterMethod("all");setFilterCountry("all");setFilterDays(30);}} style={{ background:"#334155", border:"none", color:"#94a3b8", padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12 }}>
            ↺ Reset
          </button>
          <button onClick={()=>setCompareMode(!compareMode)} style={{ background: compareMode?"#6366f1":"#334155", border:"none", color: compareMode?"white":"#94a3b8", padding:"8px 14px", borderRadius:8, cursor:"pointer", fontSize:12, marginLeft:"auto" }}>
            ⚖️ Compare Mode
          </button>
        </div>

        {(filterMethod !== "all" || filterCountry !== "all" || filterDays !== 30) && (
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
            {filterMethod !== "all" && <Tag label={METHOD_LABELS[filterMethod]} onRemove={()=>setFilterMethod("all")} />}
            {filterCountry !== "all" && <Tag label={filterCountry} onRemove={()=>setFilterCountry("all")} />}
            {filterDays !== 30 && <Tag label={`Last ${filterDays} days`} onRemove={()=>setFilterDays(30)} />}
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
          <KPI label="Auth Rate" value={`${funnel.authRate}%`} sub={`${fmt(funnel.passedAuth)} approved`} color={parseFloat(funnel.authRate)>80?"#10b981":parseFloat(funnel.authRate)>70?"#f59e0b":"#ef4444"} />
          <KPI label="Total Transactions" value={fmt(funnel.total)} sub={`${fmt(funnel.captured)} captured`} color="#6366f1" />
          <KPI label="Soft Declines" value={pct(funnel.softDeclines, funnel.authFailed)} sub={`${fmt(funnel.softDeclines)} retryable`} color="#f59e0b" />
          <KPI label="Hard Declines" value={pct(funnel.hardDeclines, funnel.authFailed)} sub={`${fmt(funnel.hardDeclines)} permanent`} color="#ef4444" />
        </div>

        {insight && (
          <div style={{ background: insight.type==="warn"?"#7c2d12":insight.type==="good"?"#14532d":"#1e3a5f", border:`1px solid ${insight.type==="warn"?"#dc2626":insight.type==="good"?"#16a34a":"#3b82f6"}`, borderRadius:10, padding:"12px 18px", marginBottom:24, fontSize:14, color:"#f1f5f9" }}>
            {insight.msg}
          </div>
        )}

        {compareMode && compareData && (
          <div style={{ background:"#1e293b", borderRadius:12, padding:24, marginBottom:24, border:"1px solid #334155" }}>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:16, color:"#f1f5f9" }}>⚖️ Country Comparison</div>
            <div style={{ display:"flex", gap:12, marginBottom:20 }}>
              <select value={compareA} onChange={e=>setCompareA(e.target.value)} style={selectStyle}>
                {["Brazil","Mexico","Colombia","Spain"].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ alignSelf:"center", color:"#64748b" }}>vs</span>
              <select value={compareB} onChange={e=>setCompareB(e.target.value)} style={selectStyle}>
                {["Brazil","Mexico","Colombia","Spain"].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
              {[compareData.a, compareData.b].map(d => (
                <div key={d.label}>
                  <div style={{ fontWeight:600, color:"#94a3b8", marginBottom:12 }}>{d.label}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <KPI label="Auth Rate" value={`${d.authRate}%`} color={parseFloat(d.authRate)>80?"#10b981":"#f59e0b"} sub="" />
                    <KPI label="Volume" value={fmt(d.total)} color="#6366f1" sub="" />
                  </div>
                  <MiniBar stages={[{name:"Validation",val:d.passedValidation},{name:"Auth",val:d.passedAuth},{name:"Captured",val:d.captured}]} max={d.total} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:24, marginBottom:24 }}>
          <div style={{ background:"#1e293b", borderRadius:12, padding:24, border:"1px solid #334155" }}>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:4, color:"#f1f5f9" }}>Payment Flow Funnel</div>
            <div style={{ fontSize:12, color:"#64748b", marginBottom:20 }}>Click a stage to see failure breakdown</div>
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:0, position:"relative" }}>
              {[
                { key:"validation", label:"Validation", total: funnel.total, passed: funnel.passedValidation, failed: funnel.failedValidation, color:"#6366f1" },
                { key:"authorization", label:"Authorization", total: funnel.passedValidation, passed: funnel.passedAuth, failed: funnel.failedAuth, color:"#3b82f6" },
                { key:"capture", label:"Capture", total: funnel.passedAuth, passed: funnel.captured, failed: funnel.failedCapture, color:"#10b981" },
              ].map((stage, idx) => {
                const h = stageH(stage.passed, funnel.total);
                const isActive = activeStage === stage.key;
                return (
                  <div key={stage.key} style={{ display:"flex", alignItems:"flex-end", gap:0 }}>
                    {idx > 0 && (
                      <div style={{ width:30, display:"flex", alignItems:"flex-end", marginBottom:0 }}>
                        <div style={{ width:0, height:0, borderTop:`${stageH([funnel.passedValidation,funnel.passedAuth][idx-1], funnel.total)/2}px solid transparent`, borderBottom:`${stageH([funnel.passedValidation,funnel.passedAuth][idx-1], funnel.total)/2}px solid transparent`, borderLeft:`30px solid ${["#6366f1","#3b82f6"][idx-1]}`, opacity:0.4 }} />
                      </div>
                    )}
                    <div onClick={() => setActiveStage(isActive ? null : stage.key)} style={{ cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#94a3b8", marginBottom:6 }}>{fmt(stage.passed)}</div>
                      <div style={{ width:140, height:h, background: isActive ? stage.color : stage.color+"99", borderRadius:8, border: isActive?`2px solid ${stage.color}`:"2px solid transparent", transition:"all 0.2s", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", position:"relative" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"white" }}>{stage.label}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)" }}>{pct(stage.passed, stage.total)} pass</div>
                        {stage.failed > 0 && (
                          <div style={{ position:"absolute", top:-10, right:-10, background:"#ef4444", borderRadius:20, padding:"2px 8px", fontSize:11, fontWeight:700, color:"white" }}>
                            -{fmt(stage.failed)}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:11, color:"#64748b", marginTop:6 }}>{stage.label}</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ display:"flex", alignItems:"flex-end", gap:0 }}>
                <div style={{ width:30, display:"flex", alignItems:"flex-end" }}>
                  <div style={{ width:0, height:0, borderTop:`${stageH(funnel.passedAuth, funnel.total)/2}px solid transparent`, borderBottom:`${stageH(funnel.passedAuth, funnel.total)/2}px solid transparent`, borderLeft:`30px solid #10b98166` }} />
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#10b981", marginBottom:6 }}>{fmt(funnel.captured)}</div>
                  <div style={{ width:100, height:stageH(funnel.captured, funnel.total), background:"#10b98133", borderRadius:8, border:"2px solid #10b981", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#10b981" }}>✓ Done</div>
                    <div style={{ fontSize:11, color:"#10b981" }}>{pct(funnel.captured, funnel.total)}</div>
                  </div>
                  <div style={{ fontSize:11, color:"#64748b", marginTop:6 }}>Captured</div>
                </div>
              </div>
            </div>

            {activeStage && funnel.reasonsByStage[activeStage]?.length > 0 && (
              <div style={{ marginTop:24, background:"#0f172a", borderRadius:10, padding:16, border:"1px solid #334155" }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#f1f5f9", marginBottom:12 }}>
                  🔍 Failure Breakdown — {activeStage.charAt(0).toUpperCase()+activeStage.slice(1)} Stage
                </div>
                {funnel.reasonsByStage[activeStage].map(r => (
                  <div key={r.reason} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#94a3b8", marginBottom:3 }}>
                      <span>{r.reason}</span><span>{r.pct}% · {fmt(r.count)}</span>
                    </div>
                    <div style={{ height:6, background:"#334155", borderRadius:3 }}>
                      <div style={{ height:6, width:`${r.pct}%`, background:"#ef4444", borderRadius:3 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeStage && funnel.reasonsByStage[activeStage]?.length === 0 && (
              <div style={{ marginTop:16, color:"#10b981", fontSize:13, textAlign:"center" }}>✅ No failures at this stage</div>
            )}
          </div>

          <div style={{ background:"#1e293b", borderRadius:12, padding:24, border:"1px solid #334155" }}>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:4, color:"#f1f5f9" }}>Auth Rate by Method</div>
            <div style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>Higher is better</div>
            {methodBreakdown.map(m => (
              <div key={m.method} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#94a3b8", marginBottom:3 }}>
                  <span>{m.method}</span>
                  <span style={{ fontWeight:600, color: m.authRate>85?"#10b981":m.authRate>75?"#f59e0b":"#ef4444" }}>{m.authRate}%</span>
                </div>
                <div style={{ height:8, background:"#334155", borderRadius:4 }}>
                  <div style={{ height:8, width:`${m.authRate}%`, background: m.authRate>85?"#10b981":m.authRate>75?"#f59e0b":"#ef4444", borderRadius:4, transition:"width 0.3s" }} />
                </div>
                <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{fmt(m.volume)} txns</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:"#1e293b", borderRadius:12, padding:24, border:"1px solid #334155", marginBottom:24 }}>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:4, color:"#f1f5f9" }}>Authorization Rate Trend</div>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>Daily auth rate over selected period</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#475569" tick={{fontSize:11}} interval={Math.floor(trendData.length/6)} />
              <YAxis stroke="#475569" tick={{fontSize:11}} domain={[50,100]} unit="%" />
              <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,color:"#f1f5f9"}} />
              <Line type="monotone" dataKey="authRate" stroke="#6366f1" strokeWidth={2} dot={false} name="Auth Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:"#1e293b", borderRadius:12, padding:24, border:"1px solid #334155" }}>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:4, color:"#f1f5f9" }}>Volume by Country</div>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>Transaction volume breakdown</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={["Brazil","Mexico","Colombia","Spain"].map(c => ({
              country: c,
              volume: filtered.filter(t=>t.country===c).length,
              authRate: parseFloat(computeFunnel(filtered.filter(t=>t.country===c)).authRate)
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="country" stroke="#475569" tick={{fontSize:12}} />
              <YAxis stroke="#475569" tick={{fontSize:11}} />
              <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,color:"#f1f5f9"}} />
              <Bar dataKey="volume" fill="#6366f1" radius={[4,4,0,0]} name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── SUBCOMPONENTS ──────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color }) {
  return (
    <div style={{ background:"#1e293b", borderRadius:10, padding:16, border:"1px solid #334155" }}>
      <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function FilterBadge({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
      <span style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:1 }}>{label}</span>
      {children}
    </div>
  );
}

function Tag({ label, onRemove }) {
  return (
    <span style={{ background:"#312e81", color:"#a5b4fc", fontSize:12, padding:"4px 10px", borderRadius:20, display:"inline-flex", alignItems:"center", gap:6 }}>
      {label}
      <span onClick={onRemove} style={{ cursor:"pointer", color:"#818cf8" }}>×</span>
    </span>
  );
}

function MiniBar({ stages, max }) {
  return (
    <div style={{ marginTop:12 }}>
      {stages.map(s => (
        <div key={s.name} style={{ marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#94a3b8", marginBottom:2 }}>
            <span>{s.name}</span><span>{fmt(s.val)}</span>
          </div>
          <div style={{ height:6, background:"#334155", borderRadius:3 }}>
            <div style={{ height:6, width:`${(s.val/max)*100}%`, background:"#6366f1", borderRadius:3 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const selectStyle = { background:"#0f172a", color:"#e2e8f0", border:"1px solid #334155", borderRadius:8, padding:"8px 12px", fontSize:13, cursor:"pointer", outline:"none" };
