import { useState } from "react";

const Y = {
  primary:   "#4958e2",
  primary2:  "#5463e3",
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

// ─── DATA ───────────────────────────────────────────────────────────────────────
const MONTHLY_TXNS    = 150000;
const AVG_VALUE       = 35;
const TOTAL_VOLUME    = MONTHLY_TXNS * AVG_VALUE; // $5,250,000

const PROVIDERS = [
  { name: "Adyen",     rate: 20.02, color: "#00b386" },
  { name: "MobilePay", rate: 37.76, color: "#5a78ff" },
  { name: "PayPal",    rate: 45.34, color: "#003087" },
  { name: "Stripe",    rate: 26.28, color: "#635bff" },
];

const YUNO_TARGET_RATE = 82;
const MONTHLY_PLATFORM_FEE = 2500;
const PER_TXN_FEE = 0.05;

const MARKETS = [
  { region: "Europe", countries: ["Sweden","Denmark","Belgium","UK","Germany","Spain","Finland","France","Croatia","Ireland","Italy","Netherlands","Poland","Portugal","Greece","Austria","Norway","Switzerland","Czech Republic","Romania","Bulgaria","Slovakia","Hungary","Luxembourg","Malta","Slovenia"] },
  { region: "Americas", countries: ["Canada","Argentina","Brazil","Mexico","Costa Rica","Ecuador","Chile"] },
  { region: "Asia Pacific", countries: ["Thailand","Japan","Korea","Hong Kong","Singapore","Malaysia","Australia","New Zealand"] },
  { region: "Middle East & Africa", countries: ["South Africa","UAE","Oman","Kuwait","Qatar","Bahrain","Türkiye","Serbia"] },
  { region: "Global", countries: ["Global"] },
];

const TOTAL_MARKETS = MARKETS.reduce((sum, r) => sum + r.countries.length, 0);

const avgCurrentRate = PROVIDERS.reduce((s, p) => s + p.rate, 0) / PROVIDERS.length;
const currentApproved = Math.round(MONTHLY_TXNS * (avgCurrentRate / 100));
const currentRevenue  = currentApproved * AVG_VALUE;
const yunoApproved    = Math.round(MONTHLY_TXNS * (YUNO_TARGET_RATE / 100));
const yunoRevenue     = yunoApproved * AVG_VALUE;
const upliftMonthly   = yunoRevenue - currentRevenue;
const upliftAnnual    = upliftMonthly * 12;
const monthlyCost     = MONTHLY_PLATFORM_FEE + (MONTHLY_TXNS * PER_TXN_FEE);
const netUpliftMonthly = upliftMonthly - monthlyCost;
const roi             = Math.round((netUpliftMonthly / monthlyCost) * 100);

const fmt  = (n) => n.toLocaleString();
const fmtM = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(2)}M` : `$${fmt(Math.round(n))}`;

export default function Proposal() {
  const [activeRegion, setActiveRegion] = useState(null);

  return (
    <div style={{ background: Y.pageBg, minHeight:"100vh", fontFamily:"'Inter', sans-serif", color: Y.dark }}>

      {/* Header */}
      <div style={{ background: Y.primary, padding:"0 40px", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <img src="https://cdn.prod.website-files.com/65e210a414fae2cb8054a995/695d6f6d2ced24e0f5c0cb0b_yuno_wordmark_blue.svg"
            alt="Yuno" style={{ height:22, filter:"brightness(0) invert(1)" }} />
          <div style={{ width:1, height:28, background:"rgba(255,255,255,0.25)" }} />
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.85)", fontWeight:500 }}>Payment Proposal</span>
        </div>
        <a href="/" style={{ fontSize:12, color:"rgba(255,255,255,0.7)", textDecoration:"none" }}>← Back to Dashboard</a>
      </div>

      <div style={{ maxWidth:960, margin:"0 auto", padding:"40px 24px" }}>

        {/* Hero */}
        <div style={{ background: Y.primary, borderRadius:16, padding:"48px 48px", marginBottom:32, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-60, right:-60, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
          <div style={{ position:"absolute", bottom:-80, right:80, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
          <div style={{ position:"relative" }}>
            <div style={{ fontSize:12, color: Y.lavender, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>Prepared for</div>
            <div style={{ fontSize:36, fontWeight:800, color:"white", lineHeight:1.2, marginBottom:8 }}>TravelHub</div>
            <div style={{ fontSize:18, color: Y.lavender, marginBottom:32 }}>Payment Optimization Proposal</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
              {[
                { label:"Monthly Volume", value: fmtM(TOTAL_VOLUME) },
                { label:"Monthly Transactions", value: fmt(MONTHLY_TXNS) },
                { label:"Markets Covered", value: `${TOTAL_MARKETS}` },
              ].map(s => (
                <div key={s.label} style={{ background:"rgba(255,255,255,0.1)", borderRadius:12, padding:"16px 20px" }}>
                  <div style={{ fontSize:11, color: Y.lavender, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</div>
                  <div style={{ fontSize:28, fontWeight:700, color:"white" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The Problem */}
        <Section title="The Problem" subtitle="Current authorization rates are significantly below industry benchmarks">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <div>
              {PROVIDERS.map(p => {
                const lost = Math.round(MONTHLY_TXNS * ((100 - p.rate) / 100));
                return (
                  <div key={p.name} style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:10, height:10, borderRadius:"50%", background: p.color }} />
                        <span style={{ fontSize:14, fontWeight:500 }}>{p.name}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ fontSize:12, color: Y.error }}>↓ {(100 - p.rate).toFixed(1)}% declined</span>
                        <span style={{ fontSize:15, fontWeight:700, color: Y.error }}>{p.rate}%</span>
                      </div>
                    </div>
                    <div style={{ height:10, background: Y.primaryBg, borderRadius:5 }}>
                      <div style={{ height:10, width:`${p.rate}%`, background: p.color, borderRadius:5 }} />
                    </div>
                    <div style={{ fontSize:11, color: Y.gray, marginTop:3 }}>{fmt(lost)} transactions declined/month</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <StatCard
                label="Average Auth Rate"
                value={`${avgCurrentRate.toFixed(1)}%`}
                sub="Across all providers"
                color={Y.error}
                bg={Y.errorBg}
              />
              <StatCard
                label="Transactions Declined Monthly"
                value={fmt(MONTHLY_TXNS - currentApproved)}
                sub={`${((MONTHLY_TXNS - currentApproved)/MONTHLY_TXNS*100).toFixed(0)}% of all transactions`}
                color={Y.error}
                bg={Y.errorBg}
              />
              <StatCard
                label="Revenue Lost Monthly"
                value={fmtM(TOTAL_VOLUME - currentRevenue)}
                sub="From failed transactions"
                color={Y.warn}
                bg={Y.warnBg}
              />
            </div>
          </div>
        </Section>

        {/* Revenue at Risk */}
        <Section title="Revenue at Risk" subtitle="The financial impact of low authorization rates">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
            <BigStat label="Annual Revenue at Risk" value={fmtM(upliftAnnual)} color={Y.error} bg={Y.errorBg} />
            <BigStat label="Monthly Transactions Lost" value={fmt(MONTHLY_TXNS - currentApproved)} color={Y.warn} bg={Y.warnBg} />
            <BigStat label="Current Approval Revenue" value={fmtM(currentRevenue)} color={Y.primary} bg={Y.primaryBg} sub="per month" />
          </div>
          <div style={{ background: Y.errorBg, border:`1px solid ${Y.error}33`, borderRadius:10, padding:"14px 18px", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ background: Y.error, color:"white", borderRadius:"50%", width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, flexShrink:0 }}>!</div>
            <span style={{ fontSize:13, color:"#7f1d1d" }}>At an average auth rate of <strong>{avgCurrentRate.toFixed(1)}%</strong>, TravelHub is losing approximately <strong>{fmtM(upliftAnnual)}/year</strong> in potential revenue — transactions that could be recovered with intelligent payment orchestration.</span>
          </div>
        </Section>

        {/* Markets */}
        <Section title="Global Coverage" subtitle={`Yuno supports all ${TOTAL_MARKETS} of TravelHub's markets out of the box`}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
            {MARKETS.map(r => (
              <div key={r.region}
                onClick={() => setActiveRegion(activeRegion === r.region ? null : r.region)}
                style={{ background: activeRegion === r.region ? Y.primaryBg : Y.cardBg, border:`1px solid ${activeRegion === r.region ? Y.primary : Y.border}`, borderRadius:10, padding:"14px 16px", cursor:"pointer", transition:"all 0.2s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: activeRegion === r.region ? 10 : 0 }}>
                  <span style={{ fontWeight:600, fontSize:13, color: activeRegion === r.region ? Y.primary : Y.dark }}>{r.region}</span>
                  <span style={{ background: Y.primary, color:"white", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20 }}>{r.countries.length}</span>
                </div>
                {activeRegion === r.region && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                    {r.countries.map(c => (
                      <span key={c} style={{ background:"white", border:`1px solid ${Y.border}`, color: Y.dark, fontSize:11, padding:"2px 8px", borderRadius:20 }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop:12, fontSize:12, color: Y.gray, textAlign:"center" }}>Click a region to expand countries</div>
        </Section>

        {/* Yuno Solution */}
        <Section title="The Yuno Solution" subtitle="Intelligent payment orchestration that maximises authorization rates">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {[
              { icon:"🔀", title:"Smart Routing", desc:"Automatically routes each transaction to the best-performing provider based on real-time data, country, card type and more." },
              { icon:"🔄", title:"Auto Retry", desc:"Soft declines are automatically retried across alternative providers — recovering revenue that would otherwise be lost." },
              { icon:"📊", title:"Unified Analytics", desc:"One dashboard across all providers and markets. No more piecing together reports from Adyen, Stripe, and PayPal separately." },
              { icon:"🌍", title:"Local Methods", desc:"Native support for local payment methods in every market — PIX in Brazil, OXXO in Mexico, iDEAL in Netherlands and more." },
              { icon:"⚡", title:"Single Integration", desc:"One API to replace multiple provider integrations. Faster time to market in new countries." },
              { icon:"🛡️", title:"Redundancy", desc:"No single point of failure. If one provider goes down, traffic automatically shifts to the next best option." },
            ].map(f => (
              <div key={f.title} style={{ background: Y.cardBg, border:`1px solid ${Y.border}`, borderRadius:10, padding:"20px 18px" }}>
                <div style={{ fontSize:24, marginBottom:10 }}>{f.icon}</div>
                <div style={{ fontSize:14, fontWeight:600, color: Y.dark, marginBottom:6 }}>{f.title}</div>
                <div style={{ fontSize:12, color: Y.gray, lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Projected Impact */}
        <Section title="Projected Impact" subtitle={`Targeting ${YUNO_TARGET_RATE}% authorization rate — in line with industry benchmarks for orchestrated payments`}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
            <div style={{ background: Y.errorBg, border:`1px solid ${Y.error}33`, borderRadius:12, padding:24 }}>
              <div style={{ fontSize:12, color: Y.error, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Current State</div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color: Y.gray }}>Auth Rate</div>
                <div style={{ fontSize:32, fontWeight:800, color: Y.error }}>{avgCurrentRate.toFixed(1)}%</div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color: Y.gray }}>Monthly Approved Revenue</div>
                <div style={{ fontSize:22, fontWeight:700, color: Y.dark }}>{fmtM(currentRevenue)}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color: Y.gray }}>Approved Transactions</div>
                <div style={{ fontSize:16, fontWeight:600, color: Y.dark }}>{fmt(currentApproved)}/month</div>
              </div>
            </div>
            <div style={{ background: Y.successBg, border:`1px solid ${Y.success}33`, borderRadius:12, padding:24 }}>
              <div style={{ fontSize:12, color: Y.success, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>With Yuno</div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color: Y.gray }}>Auth Rate</div>
                <div style={{ fontSize:32, fontWeight:800, color: Y.success }}>{YUNO_TARGET_RATE}%</div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color: Y.gray }}>Monthly Approved Revenue</div>
                <div style={{ fontSize:22, fontWeight:700, color: Y.dark }}>{fmtM(yunoRevenue)}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color: Y.gray }}>Approved Transactions</div>
                <div style={{ fontSize:16, fontWeight:600, color: Y.dark }}>{fmt(yunoApproved)}/month</div>
              </div>
            </div>
          </div>
          <div style={{ background: Y.primary, borderRadius:12, padding:24, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:0 }}>
            {[
              { label:"Monthly Revenue Uplift", value: fmtM(upliftMonthly) },
              { label:"Annual Revenue Uplift", value: fmtM(upliftAnnual) },
              { label:"Additional Transactions Approved", value: `+${fmt(yunoApproved - currentApproved)}/mo` },
            ].map((s, i) => (
              <div key={s.label} style={{ padding:"0 24px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.2)" : "none" }}>
                <div style={{ fontSize:11, color: Y.lavender, marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:26, fontWeight:800, color:"white" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Pricing */}
        <Section title="Simple, Transparent Pricing" subtitle="No hidden fees. No per-percentage-point charges. Just one platform fee and a flat rate per transaction.">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            <div style={{ background: Y.cardBg, border:`2px solid ${Y.primary}`, borderRadius:12, padding:28 }}>
              <div style={{ fontSize:12, color: Y.primary, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:16 }}>Yuno Pricing</div>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:16, borderBottom:`1px solid ${Y.border}` }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color: Y.dark }}>Monthly Platform Fee</div>
                    <div style={{ fontSize:12, color: Y.gray }}>Fixed, regardless of volume</div>
                  </div>
                  <div style={{ fontSize:22, fontWeight:800, color: Y.primary }}>${fmt(MONTHLY_PLATFORM_FEE)}</div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:16, borderBottom:`1px solid ${Y.border}` }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color: Y.dark }}>Per Transaction Fee</div>
                    <div style={{ fontSize:12, color: Y.gray }}>Applied to all transactions</div>
                  </div>
                  <div style={{ fontSize:22, fontWeight:800, color: Y.primary }}>${PER_TXN_FEE.toFixed(2)}</div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color: Y.dark }}>Est. Monthly Total</div>
                    <div style={{ fontSize:12, color: Y.gray }}>At {fmt(MONTHLY_TXNS)} transactions/month</div>
                  </div>
                  <div style={{ fontSize:22, fontWeight:800, color: Y.primary }}>{fmtM(monthlyCost)}</div>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <StatCard label="Monthly Net Revenue Uplift" value={fmtM(netUpliftMonthly)} sub="After Yuno fees" color={Y.success} bg={Y.successBg} />
              <StatCard label="Annual Net Revenue Uplift" value={fmtM(netUpliftMonthly * 12)} sub="After Yuno fees" color={Y.success} bg={Y.successBg} />
              <StatCard label="Return on Investment" value={`${roi}x`} sub="Revenue uplift vs Yuno cost" color={Y.primary} bg={Y.primaryBg} />
            </div>
          </div>
        </Section>

        {/* Next Steps */}
        <div style={{ background: Y.primary, borderRadius:16, padding:"40px 48px", textAlign:"center" }}>
          <div style={{ fontSize:24, fontWeight:800, color:"white", marginBottom:8 }}>Ready to recover {fmtM(upliftAnnual)}/year?</div>
          <div style={{ fontSize:14, color: Y.lavender, marginBottom:32 }}>Let's get TravelHub live on Yuno. Implementation typically takes 2–4 weeks.</div>
          <div style={{ display:"flex", justifyContent:"center", gap:16, flexWrap:"wrap" }}>
            {["Book a Technical Call", "Request a Sandbox", "Review Full API Docs"].map((s, i) => (
              <div key={s} style={{ background: i === 0 ? "white" : "rgba(255,255,255,0.15)", color: i === 0 ? Y.primary : "white", padding:"12px 24px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.3)" }}>
                {s}
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop:24, fontSize:11, color: Y.gray }}>
          Prepared by Yuno · {new Date().toLocaleDateString("en-GB", { year:"numeric", month:"long", day:"numeric" })}
        </div>

      </div>
    </div>
  );
}

// ─── SUBCOMPONENTS ──────────────────────────────────────────────────────────────
function Section({ title, subtitle, children }) {
  return (
    <div style={{ background:"white", borderRadius:12, border:`1px solid #e2e4f0`, padding:28, marginBottom:20 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:700, color:"#292b31", marginBottom:4 }}>{title}</div>
        {subtitle && <div style={{ fontSize:13, color:"#a4a5ac" }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color, bg }) {
  return (
    <div style={{ background: bg, border:`1px solid ${color}33`, borderRadius:10, padding:"14px 18px" }}>
      <div style={{ fontSize:11, color:"#a4a5ac", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#a4a5ac", marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function BigStat({ label, value, sub, color, bg }) {
  return (
    <div style={{ background: bg, border:`1px solid ${color}33`, borderRadius:12, padding:20, textAlign:"center" }}>
      <div style={{ fontSize:11, color:"#a4a5ac", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
      <div style={{ fontSize:32, fontWeight:800, color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#a4a5ac", marginTop:4 }}>{sub}</div>}
    </div>
  );
}
