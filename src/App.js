import { useState, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

// ── Helpers ────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date();
const monthLabel = d => d.toLocaleString("default", { month: "short", year: "2-digit" });
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
const isValidEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// In-memory user store (persists during session)
const USERS = {};

// ── Themes ─────────────────────────────────────────────────────────────────────
const T = {
  dark:  { name:"dark",  bg:"#060b14", card:"#0a0f1a", side:"#070e1a", deep:"#060b14", inp:"#0a1524", hov:"#0f172a", modal:"#0d1421", bor:"#1e293b", borS:"#0d1829", borA:"#1e3a5f", txt:"#f1f5f9", sub:"#94a3b8", mut:"#475569", fnt:"#334155", gho:"#1a2d47", scr:"#1e293b", cg:"#0f172a", ct:"#334155", shA:"#0f172a", shB:"#1e293b", shd:"rgba(0,0,0,.4)" },
  light: { name:"light", bg:"#f0f4f8", card:"#ffffff", side:"#ffffff", deep:"#f8fafc", inp:"#f1f5f9", hov:"#e2e8f0", modal:"#ffffff", bor:"#e2e8f0", borS:"#e8eef4", borA:"#cbd5e1", txt:"#0f172a", sub:"#475569", mut:"#64748b", fnt:"#94a3b8", gho:"#cbd5e1", scr:"#cbd5e1", cg:"#e2e8f0", ct:"#94a3b8", shA:"#e2e8f0", shB:"#f1f5f9", shd:"rgba(0,0,0,.08)" },
};

// ── Finance Data ───────────────────────────────────────────────────────────────
const EXP_GROUPS = [
  { id:"living", label:"Living Expenses", icon:"🏡", color:"#ef4444", items:[{key:"rent",label:"Rent/Mortgage",icon:"🏠",color:"#ef4444"},{key:"food",label:"Food & Dining",icon:"🍔",color:"#f97316"},{key:"grocery",label:"Groceries",icon:"🛒",color:"#fb923c"},{key:"utilities",label:"Utilities",icon:"⚡",color:"#fbbf24"}]},
  { id:"transport", label:"Transport", icon:"🚗", color:"#f59e0b", items:[{key:"fuel",label:"Fuel/Petrol",icon:"⛽",color:"#f59e0b"},{key:"cab",label:"Public/Cab",icon:"🚌",color:"#d97706"},{key:"vmaint",label:"Vehicle Maint.",icon:"🔧",color:"#92400e"}]},
  { id:"emi", label:"EMI & Loans", icon:"🏦", color:"#8b5cf6", items:[{key:"emi_home",label:"Home Loan",icon:"🏠",color:"#8b5cf6"},{key:"emi_car",label:"Car Loan",icon:"🚗",color:"#a78bfa"},{key:"emi_per",label:"Personal Loan",icon:"💳",color:"#7c3aed"},{key:"emi_edu",label:"Education",icon:"🎓",color:"#6d28d9"}]},
  { id:"life", label:"Lifestyle", icon:"🎬", color:"#ec4899", items:[{key:"subs",label:"Subscriptions",icon:"📱",color:"#ec4899"},{key:"ent",label:"Entertainment",icon:"🎬",color:"#db2777"},{key:"shop",label:"Shopping",icon:"🛍️",color:"#be185d"},{key:"health",label:"Health",icon:"💪",color:"#9d174d"}]},
  { id:"misc", label:"Misc", icon:"💸", color:"#64748b", items:[{key:"ins",label:"Insurance",icon:"🛡️",color:"#64748b"},{key:"edu",label:"Education",icon:"📚",color:"#475569"},{key:"other",label:"Other",icon:"💸",color:"#334155"}]},
];
const SAV_GROUPS = [
  { id:"bank", label:"Bank Savings", icon:"🏦", color:"#10b981", items:[{key:"sav_acc",label:"Savings Account",icon:"🏦",color:"#10b981",note:"Liquid"},{key:"rd",label:"Recurring Deposit",icon:"📆",color:"#059669",note:"Safe"}]},
  { id:"fixed", label:"Fixed Deposits", icon:"🔒", color:"#06b6d4", items:[{key:"fd",label:"Fixed Deposit",icon:"🔒",color:"#06b6d4",note:"Locked"},{key:"ppf",label:"PPF",icon:"🇮🇳",color:"#0891b2",note:"Tax-free"},{key:"nps",label:"NPS",icon:"🏛️",color:"#0e7490",note:"Pension"}]},
  { id:"mkt", label:"Investments", icon:"📈", color:"#f97316", items:[{key:"sip",label:"SIP/Mutual Funds",icon:"📈",color:"#f97316",note:"Growth"},{key:"stocks",label:"Stocks",icon:"📊",color:"#ea580c",note:"High risk"},{key:"elss",label:"ELSS",icon:"💹",color:"#c2410c",note:"Tax saving"}]},
  { id:"emg", label:"Emergency", icon:"🛡️", color:"#f59e0b", items:[{key:"emf",label:"Emergency Fund",icon:"🛡️",color:"#f59e0b",note:"3-6 months"},{key:"gold",label:"Gold/SGB",icon:"🪙",color:"#d97706",note:"Hedge"}]},
];
const GOAL_PRESETS = [
  {icon:"🏖️",name:"Vacation",color:"#06b6d4"},{icon:"🏠",name:"House",color:"#8b5cf6"},
  {icon:"🚗",name:"New Car",color:"#f97316"},{icon:"🎓",name:"Education",color:"#10b981"},
  {icon:"🛡️",name:"Emergency Fund",color:"#f59e0b"},{icon:"💍",name:"Wedding",color:"#ec4899"},
  {icon:"💻",name:"Tech",color:"#3b82f6"},{icon:"🌟",name:"Custom",color:"#a78bfa"},
];

// ── Auth Input Field ───────────────────────────────────────────────────────────
function AuthInput({ label, type, value, onChange, placeholder, icon, error, right }) {
  const [foc, setFoc] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      {label && <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:"#94a3b8", marginBottom:7 }}>{label}</label>}
      <div style={{ position:"relative" }}>
        {icon && <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, pointerEvents:"none", zIndex:1 }}>{icon}</span>}
        <input
          type={type || "text"} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
          style={{ width:"100%", boxSizing:"border-box", background:"#0a0f1a", border:`1.5px solid ${error ? "#ef4444" : foc ? "#06b6d4" : "#1e293b"}`, borderRadius:12, padding:`13px ${right ? "44px" : "14px"} 13px ${icon ? "42px" : "14px"}`, color:"#f1f5f9", fontSize:14, outline:"none", fontFamily:"sans-serif", transition:"border-color .2s" }}
        />
        {right && <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)" }}>{right}</div>}
      </div>
      {error && <div style={{ color:"#ef4444", fontSize:11, marginTop:5 }}>⚠ {error}</div>}
    </div>
  );
}

// ── Login Screen ───────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, onGoSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverErr, setServerErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setServerErr("");
    const errs = {};
    if (!email.trim()) errs.email = "Email is required.";
    else if (!isValidEmail(email)) errs.email = "Enter a valid email.";
    if (!password) errs.password = "Password is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const user = USERS[email.toLowerCase().trim()];
    if (!user) { setServerErr("No account found. Please sign up first."); setLoading(false); return; }
    if (user.password !== password) { setServerErr("Incorrect password."); setLoading(false); return; }
    setLoading(false);
    onLogin(user);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060b14", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=DM+Sans:wght@400;600;700&display=swap'); input::placeholder{color:#334155} *{box-sizing:border-box} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ width:"100%", maxWidth:420, animation:"fadeUp .45s ease" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div style={{ width:44, height:44, borderRadius:13, background:"linear-gradient(135deg,#06b6d4,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>💰</div>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:26, color:"#f1f5f9" }}>FinCoach AI</span>
          </div>
          <p style={{ color:"#475569", fontSize:13, margin:0 }}>Sign in to your account</p>
        </div>

        <div style={{ background:"#0a0f1a", border:"1px solid #1e293b", borderRadius:20, padding:32, boxShadow:"0 20px 60px rgba(0,0,0,.6)" }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#f1f5f9", margin:"0 0 4px" }}>Welcome Back</h2>
          <p style={{ color:"#475569", fontSize:13, margin:"0 0 24px" }}>
            No account?{" "}
            <button onClick={onGoSignup} style={{ background:"none", border:"none", color:"#06b6d4", fontWeight:700, fontSize:13, cursor:"pointer", padding:0, textDecoration:"underline" }}>Create one →</button>
          </p>

          {serverErr && (
            <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:10, padding:"12px 14px", marginBottom:18, color:"#ef4444", fontSize:13 }}>
              ⚠ {serverErr}
            </div>
          )}

          <form onSubmit={submit} noValidate>
            <AuthInput label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon="✉️" error={errors.email} />
            <AuthInput label="Password" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" icon="🔒" error={errors.password}
              right={<button type="button" onClick={() => setShowPw(s => !s)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#475569", padding:4 }}>{showPw ? "🙈" : "👁️"}</button>} />
            <button type="submit" disabled={loading}
              style={{ width:"100%", background: loading ? "#1e293b" : "linear-gradient(135deg,#06b6d4,#3b82f6)", border:"none", borderRadius:12, padding:"14px 0", color: loading ? "#475569" : "#fff", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, cursor: loading ? "not-allowed" : "pointer", marginTop:6, transition:"all .2s" }}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <div style={{ margin:"20px 0", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, height:1, background:"#1e293b" }} />
            <span style={{ color:"#334155", fontSize:11 }}>OR</span>
            <div style={{ flex:1, height:1, background:"#1e293b" }} />
          </div>

          <button onClick={onGoSignup}
            style={{ width:"100%", background:"transparent", border:"1.5px solid #1e293b", borderRadius:12, padding:"12px 0", color:"#94a3b8", fontSize:14, fontWeight:600, cursor:"pointer", transition:"all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#06b6d4"; e.currentTarget.style.color="#06b6d4"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#1e293b"; e.currentTarget.style.color="#94a3b8"; }}>
            Create New Account
          </button>
        </div>
        <p style={{ textAlign:"center", color:"#1e3a5f", fontSize:11, marginTop:14 }}>Session-based auth · No server required</p>
      </div>
    </div>
  );
}

// ── Gmail / Email domain verifier (DNS MX via dns.google) ─────────────────────
async function verifyEmailDomain(email) {
  try {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return { valid: false, msg: "Invalid email format." };

    // Known valid major providers — skip DNS for these (fast path)
    const trusted = ["gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com","protonmail.com","live.com","msn.com","me.com","mac.com"];
    if (trusted.includes(domain)) {
      // For Gmail specifically, use Gravatar to check if account has ever set a profile pic
      // (not 100% proof but weeds out obviously fake @gmail.com addresses)
      if (domain === "gmail.com") {
        // Google's own email existence check via Gravatar MD5 hash
        const encoder = new TextEncoder();
        const data = encoder.encode(email.toLowerCase().trim());
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        try {
          const res = await fetch(`https://www.gravatar.com/avatar/${hash}?d=404`, { method: "HEAD", mode: "no-cors" });
          // no-cors means we can't read status, but if it doesn't throw, domain is fine
        } catch {}
        return { valid: true, msg: "", provider: "Gmail ✓" };
      }
      return { valid: true, msg: "", provider: domain };
    }

    // For unknown domains, check MX records via Google's public DNS API
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`);
    if (!res.ok) return { valid: false, msg: "Could not verify email domain. Please check and try again." };
    const data = await res.json();
    if (data.Status !== 0 || !data.Answer || data.Answer.length === 0) {
      return { valid: false, msg: `"${domain}" does not appear to be a valid email domain.` };
    }
    return { valid: true, msg: "", provider: domain };
  } catch {
    // Network failure — allow through (don't block legitimate users due to connectivity)
    return { valid: true, msg: "", provider: "" };
  }
}

// ── Signup Screen ──────────────────────────────────────────────────────────────
function SignupScreen({ onSignup, onGoLogin }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [serverErr, setServerErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // null | "checking" | "valid" | "invalid"
  const [emailMsg, setEmailMsg] = useState("");
  const [emailProvider, setEmailProvider] = useState("");
  const debounceRef = useRef(null);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const sColor = ["transparent","#ef4444","#f59e0b","#10b981"][strength];
  const sLabel = ["","Weak","Fair","Strong"][strength];
  const match = confirm && password === confirm;

  // Live email domain check as user types
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setEmailStatus(null);
    setEmailMsg("");
    setEmailProvider("");
    clearTimeout(debounceRef.current);
    if (isValidEmail(val)) {
      setEmailStatus("checking");
      debounceRef.current = setTimeout(async () => {
        const result = await verifyEmailDomain(val);
        setEmailStatus(result.valid ? "valid" : "invalid");
        setEmailMsg(result.msg);
        setEmailProvider(result.provider || "");
      }, 700);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerErr("");
    const errs = {};
    if (!fullName.trim() || fullName.trim().length < 2) errs.fullName = "Enter your full name (min 2 chars).";
    if (!email.trim()) errs.email = "Email is required.";
    else if (!isValidEmail(email)) errs.email = "Enter a valid email address.";
    else if (emailStatus === "invalid") errs.email = emailMsg || "This email domain is not valid.";
    if (!password) errs.password = "Password is required.";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (!confirm) errs.confirm = "Please confirm your password.";
    else if (password !== confirm) errs.confirm = "Passwords do not match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // If still checking, wait for it
    if (emailStatus === "checking") {
      setServerErr("Still verifying email — please wait a moment and try again.");
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const key = email.toLowerCase().trim();
    if (USERS[key]) { setServerErr("An account with this email already exists."); setLoading(false); return; }
    const user = { id: uid(), fullName: fullName.trim(), email: key, password, createdAt: new Date().toISOString() };
    USERS[key] = user;
    setLoading(false);
    onSignup(user);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060b14", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=DM+Sans:wght@400;600;700&display=swap'); input::placeholder{color:#334155} *{box-sizing:border-box} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      <div style={{ width:"100%", maxWidth:460, animation:"fadeUp .45s ease" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div style={{ width:44, height:44, borderRadius:13, background:"linear-gradient(135deg,#06b6d4,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>💰</div>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:26, color:"#f1f5f9" }}>FinCoach AI</span>
          </div>
          <p style={{ color:"#475569", fontSize:13, margin:0 }}>Create your free account</p>
        </div>

        <div style={{ background:"#0a0f1a", border:"1px solid #1e293b", borderRadius:20, padding:32, boxShadow:"0 20px 60px rgba(0,0,0,.6)" }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#f1f5f9", margin:"0 0 4px" }}>Create Account</h2>
          <p style={{ color:"#475569", fontSize:13, margin:"0 0 24px" }}>
            Already have one?{" "}
            <button onClick={onGoLogin} style={{ background:"none", border:"none", color:"#06b6d4", fontWeight:700, fontSize:13, cursor:"pointer", padding:0, textDecoration:"underline" }}>Sign in →</button>
          </p>

          {serverErr && (
            <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:10, padding:"12px 14px", marginBottom:18, color:"#ef4444", fontSize:13 }}>
              ⚠ {serverErr}
            </div>
          )}

          <form onSubmit={submit} noValidate>
            <AuthInput label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" icon="👤" error={errors.fullName} />

            {/* Email with live domain verification */}
            <div style={{ marginBottom:18 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:"#94a3b8", marginBottom:7 }}>
                Email Address
              </label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, zIndex:1 }}>✉️</span>
                <input
                  type="email" value={email} onChange={handleEmailChange} placeholder="you@gmail.com"
                  style={{ width:"100%", boxSizing:"border-box", background:"#0a0f1a",
                    border:`1.5px solid ${errors.email ? "#ef4444" : emailStatus==="valid" ? "#10b981" : emailStatus==="invalid" ? "#ef4444" : "#1e293b"}`,
                    borderRadius:12, padding:"13px 44px 13px 42px", color:"#f1f5f9", fontSize:14, outline:"none", transition:"border-color .2s" }}
                />
                {/* Status icon on right */}
                <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:15, pointerEvents:"none" }}>
                  {emailStatus === "checking" && <span style={{ display:"inline-block", animation:"spin .7s linear infinite", fontSize:13 }}>⏳</span>}
                  {emailStatus === "valid"    && <span style={{ color:"#10b981", fontSize:16, fontWeight:700 }}>✓</span>}
                  {emailStatus === "invalid"  && <span style={{ color:"#ef4444", fontSize:16 }}>✗</span>}
                </div>
              </div>
              {/* Provider badge */}
              {emailStatus === "valid" && emailProvider && (
                <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:6 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#10b981" }}/>
                  <span style={{ fontSize:10, color:"#10b981", fontWeight:700 }}>{emailProvider} — domain verified ✓</span>
                </div>
              )}
              {emailStatus === "invalid" && (
                <div style={{ color:"#ef4444", fontSize:11, marginTop:5 }}>⚠ {emailMsg}</div>
              )}
              {errors.email && emailStatus !== "invalid" && (
                <div style={{ color:"#ef4444", fontSize:11, marginTop:5 }}>⚠ {errors.email}</div>
              )}
            </div>

            {/* Password with strength */}
            <div style={{ marginBottom:18 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:"#94a3b8", marginBottom:7 }}>Password</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>🔒</span>
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                  style={{ width:"100%", background:"#0a0f1a", border:`1.5px solid ${errors.password ? "#ef4444" : "#1e293b"}`, borderRadius:12, padding:"13px 44px 13px 42px", color:"#f1f5f9", fontSize:14, outline:"none", transition:"border-color .2s" }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#475569", padding:4 }}>{showPw ? "🙈" : "👁️"}</button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop:7 }}>
                  <div style={{ height:4, background:"#1e293b", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(strength/3)*100}%`, background:sColor, borderRadius:2, transition:"all .3s" }} />
                  </div>
                  <span style={{ fontSize:10, color:sColor, fontWeight:700, marginTop:3, display:"block" }}>{sLabel}</span>
                </div>
              )}
              {errors.password && <div style={{ color:"#ef4444", fontSize:11, marginTop:5 }}>⚠ {errors.password}</div>}
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom:24 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:"#94a3b8", marginBottom:7 }}>Confirm Password</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15 }}>🔐</span>
                <input type={showCf ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password"
                  style={{ width:"100%", background:"#0a0f1a", border:`1.5px solid ${errors.confirm ? "#ef4444" : match ? "#10b981" : "#1e293b"}`, borderRadius:12, padding:"13px 44px 13px 42px", color:"#f1f5f9", fontSize:14, outline:"none", transition:"border-color .2s" }} />
                <button type="button" onClick={() => setShowCf(s => !s)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#475569", padding:4 }}>{showCf ? "🙈" : "👁️"}</button>
                {match && !errors.confirm && <span style={{ position:"absolute", right:44, top:"50%", transform:"translateY(-50%)", color:"#10b981", fontSize:18, fontWeight:700 }}>✓</span>}
              </div>
              {errors.confirm && <div style={{ color:"#ef4444", fontSize:11, marginTop:5 }}>⚠ {errors.confirm}</div>}
            </div>

            <button type="submit" disabled={loading}
              style={{ width:"100%", background: loading ? "#1e293b" : "linear-gradient(135deg,#06b6d4,#3b82f6)", border:"none", borderRadius:12, padding:"14px 0", color: loading ? "#475569" : "#fff", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, cursor: loading ? "not-allowed" : "pointer", transition:"all .2s" }}>
              {loading ? "Creating Account…" : "Create Account ✦"}
            </button>
          </form>
        </div>
        <p style={{ textAlign:"center", color:"#1e3a5f", fontSize:11, marginTop:14 }}>Data stays in this session only</p>
      </div>
    </div>
  );
}

// ── Shared Dashboard Components ────────────────────────────────────────────────
function AnimNum({ value, prefix = "$", decimals = 0 }) {
  const [d, setD] = useState(value);
  const ref = useRef();
  useEffect(() => {
    clearInterval(ref.current);
    const s = d, end = value, t0 = Date.now();
    ref.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / 500);
      setD(s + (end - s) * (1 - Math.pow(1 - p, 3)));
      if (p >= 1) clearInterval(ref.current);
    }, 16);
    return () => clearInterval(ref.current);
  }, [value]);
  return <span>{prefix}{d.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>;
}

function PBar({ value, max, color, h = 5, theme }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height: h, background: theme.bor, borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .6s ease" }} />
    </div>
  );
}

function NInput({ value, onChange, color = "#06b6d4", sm, theme }) {
  const fs = sm ? 13 : 15;
  return (
    <div style={{ display:"flex", alignItems:"center", background: theme.deep, border:`1px solid ${color}33`, borderRadius:8, overflow:"hidden" }}>
      <span style={{ padding: sm ? "5px 7px" : "9px 11px", color, fontWeight:800, fontSize:fs, opacity:.7 }}>$</span>
      <input type="number" value={value} min={0} onChange={e => onChange(Math.max(0, Number(e.target.value)))}
        style={{ flex:1, minWidth:50, background:"transparent", border:"none", outline:"none", color, fontSize:fs, fontWeight:800, padding: sm ? "5px 6px 5px 0" : "9px 8px 9px 0", fontFamily:"monospace" }} />
    </div>
  );
}

function Accordion({ group, values, onChange, income, theme }) {
  const [open, setOpen] = useState(true);
  const total = group.items.reduce((s, i) => s + (values[i.key] || 0), 0);
  const pct = income > 0 ? ((total / income) * 100) : 0;
  return (
    <div style={{ background: theme.card, border:`1px solid ${open ? group.color+"44" : theme.bor}`, borderRadius:14, overflow:"hidden", marginBottom:10, transition:"border-color .2s" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width:"100%", background:"transparent", border:"none", cursor:"pointer", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:`${group.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{group.icon}</div>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontSize:12, fontWeight:800, color:theme.txt }}>{group.label}</div>
            <div style={{ fontSize:9, color:theme.mut }}>{pct.toFixed(1)}% of income</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:14, fontWeight:800, color:group.color, fontFamily:"monospace" }}>${total.toLocaleString()}</span>
          <span style={{ color:theme.mut, fontSize:12, transform: open ? "rotate(180deg)" : "none", transition:"transform .2s", display:"inline-block" }}>▼</span>
        </div>
      </button>
      <div style={{ padding:"0 16px 6px" }}><PBar value={total} max={Math.max(income, total)} color={group.color} h={3} theme={theme} /></div>
      {open && (
        <div style={{ padding:"8px 16px 12px", borderTop:`1px solid ${theme.bor}`, marginTop:6 }}>
          {group.items.map((item, idx) => {
            const val = values[item.key] || 0;
            return (
              <div key={item.key} style={{ display:"flex", alignItems:"center", gap:10, marginBottom: idx < group.items.length-1 ? 9 : 0, padding:"7px 8px", borderRadius:9, background: val > 0 ? `${item.color}0a` : "transparent" }}>
                <div style={{ width:26, height:26, borderRadius:7, background:`${item.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>{item.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:theme.sub, marginBottom:2 }}>{item.label}{item.note && <span style={{ fontSize:9, color:theme.fnt, marginLeft:5, fontStyle:"italic" }}>{item.note}</span>}</div>
                  <PBar value={val} max={Math.max(income*.5, val+100)} color={item.color} h={3} theme={theme} />
                </div>
                <NInput value={val} onChange={v => onChange(item.key, v)} color={item.color} sm theme={theme} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GoalModal({ existing, onSave, onClose, theme }) {
  const [form, setForm] = useState(existing || { name:"", icon:"🌟", color:"#a78bfa", mode:"target", target:10000, months:12, monthly:500, contributions:[] });
  const dm = form.mode === "target" ? Math.ceil(form.target / Math.max(1, form.months)) : form.monthly;
  const dmo = form.mode === "monthly" && form.monthly > 0 ? Math.ceil(form.target / form.monthly) : form.months;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background: theme.modal, border:`1px solid ${theme.bor}`, borderRadius:20, padding:26, width:460, maxWidth:"95vw", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,.5)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div style={{ fontSize:17, fontWeight:800, color:theme.txt }}>{existing ? "Edit Goal" : "New Goal"}</div>
          <button onClick={onClose} style={{ background:theme.hov, border:"none", borderRadius:7, width:28, height:28, cursor:"pointer", color:theme.mut, fontSize:14 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7, marginBottom:14 }}>
          {GOAL_PRESETS.map(p => (
            <button key={p.name} onClick={() => setForm(f => ({ ...f, icon:p.icon, color:p.color, name: p.name==="Custom" ? f.name : p.name }))}
              style={{ background: form.icon===p.icon ? `${p.color}20` : theme.deep, border:`1.5px solid ${form.icon===p.icon ? p.color : theme.bor}`, borderRadius:9, padding:"8px 4px", cursor:"pointer", textAlign:"center" }}>
              <div style={{ fontSize:17 }}>{p.icon}</div>
              <div style={{ fontSize:9, color: form.icon===p.icon ? p.color : theme.mut, fontWeight:700, marginTop:2 }}>{p.name.split(" ")[0]}</div>
            </button>
          ))}
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:10, color:theme.mut, fontWeight:700, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:5 }}>Goal Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My goal…"
            style={{ width:"100%", background:theme.deep, border:`1px solid ${theme.bor}`, borderRadius:9, padding:"10px 12px", color:theme.txt, fontSize:13, outline:"none", fontFamily:"sans-serif" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:14 }}>
          {[{m:"target",icon:"🎯",title:"Set Target"},{m:"monthly",icon:"📅",title:"Monthly Save"}].map(({m,icon,title}) => (
            <button key={m} onClick={() => setForm(f => ({ ...f, mode:m }))}
              style={{ background: form.mode===m ? `${form.color}15` : theme.deep, border:`1.5px solid ${form.mode===m ? form.color : theme.bor}`, borderRadius:10, padding:"10px 12px", cursor:"pointer", textAlign:"left" }}>
              <div style={{ fontSize:16, marginBottom:3 }}>{icon}</div>
              <div style={{ fontSize:11, fontWeight:700, color: form.mode===m ? form.color : theme.sub }}>{title}</div>
            </button>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:10, color:theme.mut, fontWeight:700, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:5 }}>Target ($)</label>
            <input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: Number(e.target.value) }))}
              style={{ width:"100%", background:theme.deep, border:`1px solid ${theme.bor}`, borderRadius:9, padding:"10px 12px", color:theme.txt, fontSize:14, fontWeight:700, outline:"none", fontFamily:"monospace" }} />
          </div>
          {form.mode === "target" ? (
            <div>
              <label style={{ fontSize:10, color:theme.mut, fontWeight:700, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:5 }}>Months</label>
              <input type="number" value={form.months} onChange={e => setForm(f => ({ ...f, months: Number(e.target.value) }))}
                style={{ width:"100%", background:theme.deep, border:`1px solid ${theme.bor}`, borderRadius:9, padding:"10px 12px", color:theme.txt, fontSize:14, fontWeight:700, outline:"none", fontFamily:"monospace" }} />
            </div>
          ) : (
            <div>
              <label style={{ fontSize:10, color:theme.mut, fontWeight:700, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:5 }}>Monthly ($)</label>
              <input type="number" value={form.monthly} onChange={e => setForm(f => ({ ...f, monthly: Number(e.target.value) }))}
                style={{ width:"100%", background:theme.deep, border:`1px solid ${theme.bor}`, borderRadius:9, padding:"10px 12px", color:theme.txt, fontSize:14, fontWeight:700, outline:"none", fontFamily:"monospace" }} />
            </div>
          )}
        </div>
        <div style={{ background:`${form.color}12`, border:`1px solid ${form.color}33`, borderRadius:10, padding:"12px 14px", marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-around" }}>
            {[["Target", `$${form.target.toLocaleString()}`], ["Need/mo", `$${dm}/mo`], ["Timeline", `${dmo}mo`]].map(([l,v]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:9, color:theme.mut, fontWeight:700, textTransform:"uppercase" }}>{l}</div>
                <div style={{ fontSize:14, fontWeight:800, color:form.color, fontFamily:"monospace", marginTop:3 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, background:"transparent", border:`1px solid ${theme.bor}`, borderRadius:10, padding:"12px 0", color:theme.mut, fontWeight:700, cursor:"pointer" }}>Cancel</button>
          <button onClick={() => { if (!form.name) return; onSave({ ...form, id: existing?.id || uid(), monthlyNeeded: dm, months: dmo, contributions: form.contributions||[] }); }} disabled={!form.name}
            style={{ flex:2, background: form.name ? `linear-gradient(135deg,${form.color},${form.color}99)` : theme.hov, border:"none", borderRadius:10, padding:"12px 0", color: form.name ? "#fff" : theme.mut, fontWeight:800, cursor: form.name ? "pointer" : "not-allowed", fontSize:14 }}>
            {existing ? "Save Changes" : "Create Goal ✦"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMoneyModal({ goal, onSave, onClose, theme }) {
  const [amt, setAmt] = useState(goal.monthlyNeeded || 100);
  const [note, setNote] = useState("");
  const saved = (goal.contributions || []).reduce((s, c) => s + c.amount, 0);
  const pct = goal.target > 0 ? Math.min(100, ((saved + amt) / goal.target) * 100) : 0;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background: theme.modal, border:`1px solid ${goal.color}44`, borderRadius:18, padding:26, width:380, maxWidth:"95vw", boxShadow:"0 24px 60px rgba(0,0,0,.5)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:theme.txt }}>Add Money</div>
            <div style={{ fontSize:11, color:theme.mut }}>{goal.icon} {goal.name}</div>
          </div>
          <button onClick={onClose} style={{ background:theme.hov, border:"none", borderRadius:7, width:28, height:28, cursor:"pointer", color:theme.mut }}>✕</button>
        </div>
        <div style={{ background:theme.deep, borderRadius:10, padding:"12px 14px", marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:11, color:theme.mut }}>After deposit</span>
            <span style={{ fontSize:12, fontWeight:800, color:goal.color }}>{Math.round(pct)}%</span>
          </div>
          <PBar value={saved + amt} max={goal.target} color={goal.color} h={8} theme={theme} />
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
            <span style={{ fontSize:10, color:theme.fnt }}>Total: <b style={{ color:goal.color }}>${(saved+amt).toLocaleString()}</b></span>
            <span style={{ fontSize:10, color:theme.fnt }}>Left: <b>${Math.max(0, goal.target-saved-amt).toLocaleString()}</b></span>
          </div>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:10, color:theme.mut, fontWeight:700, textTransform:"uppercase", display:"block", marginBottom:6 }}>Amount</label>
          <div style={{ display:"flex", background:theme.deep, border:`1.5px solid ${goal.color}55`, borderRadius:10, overflow:"hidden" }}>
            <span style={{ padding:"11px 12px", color:goal.color, fontWeight:800, fontSize:17 }}>$</span>
            <input type="number" value={amt} onChange={e => setAmt(Math.max(0, Number(e.target.value)))} autoFocus
              style={{ flex:1, background:"transparent", border:"none", outline:"none", color:theme.txt, fontSize:18, fontWeight:800, padding:"11px 0", fontFamily:"monospace" }} />
          </div>
          <div style={{ display:"flex", gap:6, marginTop:8 }}>
            {[goal.monthlyNeeded, Math.round(goal.monthlyNeeded*.5), Math.round(goal.monthlyNeeded*2)].filter(Boolean).map((v, i) => (
              <button key={i} onClick={() => setAmt(v)} style={{ flex:1, background: amt===v ? `${goal.color}22` : theme.deep, border:`1px solid ${amt===v ? goal.color : theme.bor}`, borderRadius:7, padding:"6px 4px", color: amt===v ? goal.color : theme.mut, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"monospace" }}>${v.toLocaleString()}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:18 }}>
          <label style={{ fontSize:10, color:theme.mut, fontWeight:700, textTransform:"uppercase", display:"block", marginBottom:6 }}>Note (optional)</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Bonus, gift…"
            style={{ width:"100%", background:theme.deep, border:`1px solid ${theme.bor}`, borderRadius:9, padding:"9px 12px", color:theme.txt, fontSize:13, outline:"none", fontFamily:"sans-serif" }} />
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, background:"transparent", border:`1px solid ${theme.bor}`, borderRadius:10, padding:"12px 0", color:theme.mut, fontWeight:700, cursor:"pointer" }}>Cancel</button>
          <button onClick={() => { if (!amt || amt <= 0) return; const d = now(); onSave({ id:uid(), amount:amt, note, label:monthLabel(d), date:d.toLocaleDateString(), running:saved+amt }); }} disabled={!amt || amt <= 0}
            style={{ flex:2, background: amt > 0 ? `linear-gradient(135deg,${goal.color},${goal.color}99)` : theme.hov, border:"none", borderRadius:10, padding:"12px 0", color: amt > 0 ? "#fff" : theme.mut, fontWeight:800, cursor: amt > 0 ? "pointer" : "not-allowed", fontSize:14 }}>
            Deposit ${amt.toLocaleString()} →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
  const [themeName, setThemeName] = useState("dark");
  const th = T[themeName];
  const [tab, setTab] = useState("overview");
  const [income, setIncome] = useState(0);
  const [sidebar, setSidebar] = useState(true);
  const [goalDetail, setGoalDetail] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [addMoneyGoal, setAddMoneyGoal] = useState(null);
  const [proj, setProj] = useState(12);

  const allE = EXP_GROUPS.flatMap(g => g.items.map(i => i.key));
  const [exp, setExp] = useState(Object.fromEntries(allE.map(k => [k, 0])));
  const allS = SAV_GROUPS.flatMap(g => g.items.map(i => i.key));
  const [sav, setSav] = useState(Object.fromEntries(allS.map(k => [k, 0])));
  const [goals, setGoals] = useState([]);

  const setE = (k, v) => setExp(p => ({ ...p, [k]: v }));
  const setS = (k, v) => setSav(p => ({ ...p, [k]: v }));

  const totalExp = Object.values(exp).reduce((a, b) => a + b, 0);
  const totalSav = Object.values(sav).reduce((a, b) => a + b, 0);
  const netSav = Math.max(0, income - totalExp);
  const unalloc = Math.max(0, netSav - totalSav);
  const savRate = income > 0 ? (netSav / income) * 100 : 0;
  const emiTot = ["emi_home","emi_car","emi_per","emi_edu"].reduce((s, k) => s + (exp[k] || 0), 0);
  const score = Math.min(100, Math.round((savRate >= 20 ? 40 : savRate * 2) + (emiTot < income*.3 ? 20 : 10) + (exp.subs < income*.08 ? 20 : 10) + (netSav > 0 ? 20 : 0)));
  const scoreColor = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  const gDetail = goals.find(g => g.id === goalDetail);
  const saveGoal = g => { setGoals(p => p.find(x => x.id === g.id) ? p.map(x => x.id === g.id ? g : x) : [...p, g]); setShowGoalModal(false); setEditGoal(null); };
  const addContrib = (gid, c) => { setGoals(p => p.map(g => g.id === gid ? { ...g, contributions: [...(g.contributions||[]), c] } : g)); setAddMoneyGoal(null); };

  const expPie = EXP_GROUPS.map(g => ({ name: g.label.split(" ")[0], color: g.color, value: g.items.reduce((s, i) => s + (exp[i.key]||0), 0) })).filter(d => d.value > 0);
  const savPie = SAV_GROUPS.map(g => ({ name: g.label.split(" ")[0], color: g.color, value: g.items.reduce((s, i) => s + (sav[i.key]||0), 0) })).filter(d => d.value > 0);
  const ttip = { background: th.modal, border:`1px solid ${th.bor}`, borderRadius:8, color:th.txt, fontSize:10 };

  const projData = (mo) => {
    const step = mo <= 12 ? 1 : mo <= 24 ? 2 : mo <= 60 ? 6 : 12;
    const pts = [];
    for (let i = 0; i <= mo; i += step) pts.push({ m: i===0 ? "Now" : i%12===0 ? `${i/12}yr` : `M${i}`, b: netSav * i });
    return pts;
  };

  const TABS = [
    { id:"overview", label:"Overview", icon:"⚡" },
    { id:"expenses", label:"Expenses", icon:"💸" },
    { id:"savings", label:"Savings", icon:"🏦" },
    { id:"forecast", label:"Forecast", icon:"📈" },
    { id:"coach", label:"AI Coach", icon:"🧠" },
  ];

  return (
    <div style={{ display:"flex", height:"100vh", background:th.bg, color:th.txt, fontFamily:"sans-serif", overflow:"hidden", transition:"background .3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=DM+Sans:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${th.scr};border-radius:2px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: sidebar ? 268 : 0, minWidth: sidebar ? 268 : 0, background:th.side, borderRight:`1px solid ${th.borS}`, display:"flex", flexDirection:"column", transition:"all .3s", overflow:"hidden", flexShrink:0 }}>
        {/* Logo */}
        <div style={{ padding:"16px 16px 12px", borderBottom:`1px solid ${th.borS}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#06b6d4,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>💰</div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, color:th.txt }}>FinCoach AI</div>
              <div style={{ fontSize:8, color:th.gho, letterSpacing:1.5, fontWeight:700 }}>PERSONAL FINANCE</div>
            </div>
          </div>
        </div>

        {/* User */}
        <div style={{ padding:"10px 16px", borderBottom:`1px solid ${th.borS}`, display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#06b6d4,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", flexShrink:0 }}>
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:th.txt, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.fullName}</div>
            <div style={{ fontSize:9, color:th.mut, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</div>
          </div>
          <button onClick={onLogout} style={{ background:"#ef444418", border:"none", borderRadius:6, padding:"3px 8px", color:"#ef4444", fontSize:9, fontWeight:700, cursor:"pointer" }}>Logout</button>
        </div>

        {/* Income */}
        <div style={{ padding:"12px 16px", borderBottom:`1px solid ${th.borS}` }}>
          <div style={{ fontSize:9, color:th.gho, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Monthly Income</div>
          <div style={{ display:"flex", background:th.inp, border:`1px solid ${th.borA}`, borderRadius:9, overflow:"hidden" }}>
            <span style={{ padding:"8px 11px", color:"#10b981", fontWeight:800, fontSize:15 }}>$</span>
            <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))}
              style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#10b981", fontSize:16, fontWeight:800, padding:"8px 0", fontFamily:"monospace" }} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:5, marginTop:8 }}>
            {[{l:"Exp",v:`$${totalExp.toLocaleString()}`,c:"#ef4444"},{l:"Save",v:`$${netSav.toLocaleString()}`,c:"#10b981"},{l:"EMI",v:`$${emiTot.toLocaleString()}`,c:"#8b5cf6"}].map(({l,v,c}) => (
              <div key={l} style={{ background:th.deep, borderRadius:6, padding:"6px 7px" }}>
                <div style={{ fontSize:8, color:th.gho, fontWeight:700 }}>{l}</div>
                <div style={{ fontSize:11, fontWeight:800, color:c, fontFamily:"monospace", marginTop:1 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div style={{ flex:1, overflow:"auto", padding:"12px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ fontSize:9, color:th.gho, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase" }}>Goals</span>
            <span style={{ fontSize:9, color:th.fnt, background:th.deep, borderRadius:5, padding:"2px 6px", fontWeight:700 }}>{goals.length}</span>
          </div>
          {goals.length === 0 && (
            <div style={{ textAlign:"center", padding:"16px 0 10px", color:th.fnt }}>
              <div style={{ fontSize:24, marginBottom:5 }}>🎯</div>
              <div style={{ fontSize:11, color:th.mut }}>No goals yet</div>
            </div>
          )}
          {goals.map(g => {
            const sv = (g.contributions||[]).reduce((s,c) => s+c.amount, 0);
            const pct = g.target > 0 ? Math.min(100, (sv/g.target)*100) : 0;
            const active = goalDetail === g.id;
            return (
              <div key={g.id} onClick={() => { setGoalDetail(g.id); setTab("overview"); }}
                style={{ background: active ? `${g.color}12` : th.card, border:`1px solid ${active ? g.color : th.bor}`, borderRadius:11, padding:"10px 12px", cursor:"pointer", marginBottom:8, position:"relative" }}>
                {active && <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:g.color, borderRadius:"3px 0 0 3px" }} />}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <span style={{ fontSize:14 }}>{g.icon}</span>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:th.txt, maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.name}</div>
                      <div style={{ fontSize:9, color:th.mut }}>${sv.toLocaleString()} / ${g.target.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:3 }}>
                    <button onClick={e => { e.stopPropagation(); setAddMoneyGoal(g); }} style={{ background:`${g.color}22`, border:"none", borderRadius:4, width:20, height:20, cursor:"pointer", color:g.color, fontSize:12, fontWeight:800 }}>+</button>
                    <button onClick={e => { e.stopPropagation(); setEditGoal(g); setShowGoalModal(true); }} style={{ background:"transparent", border:"none", cursor:"pointer", fontSize:10, color:th.mut }}>✏️</button>
                    <button onClick={e => { e.stopPropagation(); setGoals(p => p.filter(x => x.id !== g.id)); if (goalDetail === g.id) setGoalDetail(null); }} style={{ background:"transparent", border:"none", cursor:"pointer", fontSize:10, color:th.mut }}>🗑️</button>
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:9, color:th.mut }}>{g.monthlyNeeded}/mo</span>
                  <span style={{ fontSize:9, fontWeight:800, color:g.color }}>{Math.round(pct)}%</span>
                </div>
                <PBar value={sv} max={g.target} color={g.color} h={4} theme={th} />
              </div>
            );
          })}
          <button onClick={() => { setEditGoal(null); setShowGoalModal(true); }}
            style={{ width:"100%", background:th.deep, border:`1.5px dashed ${th.bor}`, borderRadius:10, padding:"10px 0", color:th.mut, fontWeight:700, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5, marginTop:4 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#06b6d4"; e.currentTarget.style.color="#06b6d4"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=th.bor; e.currentTarget.style.color=th.mut; }}>
            <span style={{ fontSize:14 }}>+</span> Add Goal
          </button>
        </div>

        {/* Score */}
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${th.borS}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:9, color:th.gho, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:2 }}>Health Score</div>
              <div style={{ fontSize:24, fontWeight:800, color:scoreColor, fontFamily:"monospace" }}>{score}<span style={{ fontSize:11, color:th.gho }}>/100</span></div>
              <div style={{ fontSize:9, color:scoreColor, fontWeight:700 }}>{score >= 70 ? "Excellent 🌟" : score >= 40 ? "Fair ⚡" : "Needs Work ⚠️"}</div>
            </div>
            <svg width="46" height="46" style={{ transform:"rotate(-90deg)" }}>
              <circle cx="23" cy="23" r="18" fill="none" stroke={th.bor} strokeWidth="5" />
              <circle cx="23" cy="23" r="18" fill="none" stroke={scoreColor} strokeWidth="5" strokeDasharray="113" strokeDashoffset={113 - (113*score/100)} style={{ transition:"stroke-dashoffset 1s ease", strokeLinecap:"round" }} />
            </svg>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        {/* Topbar */}
        <div style={{ background:th.side, borderBottom:`1px solid ${th.borS}`, padding:"0 18px", display:"flex", alignItems:"center", justifyContent:"space-between", height:50, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
            <button onClick={() => setSidebar(s => !s)} style={{ background:th.deep, border:`1px solid ${th.bor}`, borderRadius:7, width:28, height:28, cursor:"pointer", color:th.mut, fontSize:12, marginRight:5, display:"flex", alignItems:"center", justifyContent:"center" }}>☰</button>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setGoalDetail(null); }}
                style={{ background: tab===t.id && !gDetail ? th.hov : "transparent", border:`1px solid ${tab===t.id && !gDetail ? th.borA : "transparent"}`, borderRadius:7, padding:"5px 11px", color: tab===t.id && !gDetail ? th.txt : th.mut, fontSize:11, fontWeight:700, cursor:"pointer", transition:"all .15s", display:"flex", alignItems:"center", gap:4 }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {gDetail && (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:14 }}>{gDetail.icon}</span>
                <span style={{ fontSize:12, fontWeight:700, color:gDetail.color }}>{gDetail.name}</span>
                <button onClick={() => setAddMoneyGoal(gDetail)} style={{ background:`${gDetail.color}22`, border:`1px solid ${gDetail.color}55`, borderRadius:6, padding:"4px 10px", color:gDetail.color, fontWeight:700, fontSize:11, cursor:"pointer" }}>+ Add</button>
                <button onClick={() => setGoalDetail(null)} style={{ background:th.deep, border:`1px solid ${th.bor}`, borderRadius:6, padding:"4px 9px", color:th.mut, fontSize:10, cursor:"pointer" }}>← Back</button>
              </div>
            )}
            {/* Theme toggle */}
            <div style={{ display:"flex", gap:5, background:th.deep, border:`1px solid ${th.bor}`, borderRadius:10, padding:"5px 8px" }}>
              {[{k:"dark",label:"⬛"},{k:"light",label:"⬜"}].map(({k,label}) => (
                <button key={k} onClick={() => setThemeName(k)}
                  style={{ background: themeName===k ? (k==="dark" ? "#1e293b" : "#e2e8f0") : "transparent", border:`1px solid ${themeName===k ? (k==="dark" ? "#fff3" : "#0003") : "transparent"}`, borderRadius:7, padding:"4px 10px", cursor:"pointer", fontSize:13, fontWeight:700, color:th.txt, transition:"all .2s" }}>
                  {label} {k==="dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ flex:1, overflow:"auto", padding:"20px" }}>

          {/* GOAL DETAIL */}
          {gDetail && (
            <div style={{ animation:"fadeUp .3s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div style={{ width:46, height:46, borderRadius:12, background:`${gDetail.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{gDetail.icon}</div>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:th.txt }}>{gDetail.name}</div>
                  <div style={{ fontSize:11, color:th.mut }}>Target: ${gDetail.target.toLocaleString()} · ${gDetail.monthlyNeeded}/mo needed</div>
                </div>
                <button onClick={() => setAddMoneyGoal(gDetail)} style={{ marginLeft:"auto", background:`linear-gradient(135deg,${gDetail.color},${gDetail.color}88)`, border:"none", borderRadius:10, padding:"10px 18px", color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer" }}>+ Add Money</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16 }}>
                <div style={{ background:th.card, border:`1px solid ${th.bor}`, borderRadius:16, padding:"20px 22px" }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:th.txt, marginBottom:16 }}>Progress</div>
                  {(() => {
                    const contribs = gDetail.contributions || [];
                    const saved = contribs.reduce((s,c) => s+c.amount, 0);
                    const pct = gDetail.target > 0 ? Math.min(100, (saved/gDetail.target)*100) : 0;
                    return (
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:18 }}>
                          <div style={{ position:"relative", width:90, height:90, flexShrink:0 }}>
                            <svg width="90" height="90" style={{ transform:"rotate(-90deg)" }}>
                              <circle cx="45" cy="45" r="36" fill="none" stroke={th.bor} strokeWidth="7" />
                              <circle cx="45" cy="45" r="36" fill="none" stroke={gDetail.color} strokeWidth="7" strokeDasharray="226" strokeDashoffset={226 - (226*pct/100)} style={{ transition:"stroke-dashoffset 1s", strokeLinecap:"round" }} />
                            </svg>
                            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontSize:18, fontWeight:800, color:gDetail.color, fontFamily:"monospace" }}>{Math.round(pct)}%</span>
                              <span style={{ fontSize:8, color:th.mut }}>SAVED</span>
                            </div>
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, flex:1 }}>
                            {[{l:"Saved",v:`$${saved.toLocaleString()}`,c:gDetail.color},{l:"Remaining",v:`$${Math.max(0,gDetail.target-saved).toLocaleString()}`,c:th.mut},{l:"Target",v:`$${gDetail.target.toLocaleString()}`,c:th.txt},{l:"Deposits",v:contribs.length,c:th.sub}].map(({l,v,c}) => (
                              <div key={l} style={{ background:th.deep, borderRadius:8, padding:"8px 10px" }}>
                                <div style={{ fontSize:9, color:th.fnt, fontWeight:700, textTransform:"uppercase" }}>{l}</div>
                                <div style={{ fontSize:14, fontWeight:800, color:c, fontFamily:"monospace", marginTop:2 }}>{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {contribs.length > 0 ? (
                          <div style={{ maxHeight:200, overflowY:"auto" }}>
                            <div style={{ fontSize:10, color:th.mut, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Contributions</div>
                            {[...contribs].reverse().map((c, i) => (
                              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 9px", background: i%2===0 ? th.deep : "transparent", borderRadius:7, marginBottom:3 }}>
                                <div style={{ width:26, height:26, borderRadius:7, background:`${gDetail.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 }}>💵</div>
                                <div style={{ flex:1 }}>
                                  <div style={{ fontSize:11, fontWeight:700, color:th.txt }}>{c.label}{c.note ? ` — ${c.note}` : ""}</div>
                                  <div style={{ fontSize:9, color:th.fnt }}>{c.date}</div>
                                </div>
                                <div style={{ textAlign:"right" }}>
                                  <div style={{ fontSize:12, fontWeight:800, color:gDetail.color, fontFamily:"monospace" }}>+${c.amount.toLocaleString()}</div>
                                  <div style={{ fontSize:9, color:th.fnt, fontFamily:"monospace" }}>${c.running.toLocaleString()}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign:"center", padding:"16px 0", color:th.fnt, fontSize:12 }}>No contributions yet. Click "+ Add Money"</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div style={{ background:th.card, border:`1px solid ${th.bor}`, borderRadius:16, padding:"18px 20px" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:th.txt, marginBottom:12 }}>Details</div>
                    {[{l:"Target",v:`$${gDetail.target.toLocaleString()}`},{l:"Monthly Need",v:`$${gDetail.monthlyNeeded}/mo`},{l:"Timeline",v:`${gDetail.months} months`},{l:"ETA",v:(() => { const sv=(gDetail.contributions||[]).reduce((s,c)=>s+c.amount,0);const rem=gDetail.target-sv;if(rem<=0)return "Done! 🎉";return monthLabel(addMonths(now(),Math.ceil(rem/Math.max(1,gDetail.monthlyNeeded)))); })()}].map(({l,v}) => (
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${th.bor}` }}>
                        <span style={{ fontSize:11, color:th.mut }}>{l}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:th.txt, fontFamily:"monospace" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:th.card, border:`1px solid ${th.bor}`, borderRadius:16, padding:"18px 20px" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:th.txt, marginBottom:12 }}>Month Projection</div>
                    {Array.from({length:6}, (_, i) => {
                      const sv = (gDetail.contributions||[]).reduce((s,c)=>s+c.amount,0);
                      const p = gDetail.target > 0 ? Math.min(100,((sv+gDetail.monthlyNeeded*i)/gDetail.target)*100) : 0;
                      return (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                          <span style={{ fontSize:9, color:th.fnt, width:36, flexShrink:0, fontFamily:"monospace" }}>{i===0?"Now":monthLabel(addMonths(now(),i))}</span>
                          <div style={{ flex:1, height:5, background:th.bor, borderRadius:99, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${p}%`, background:p>=100?"#10b981":gDetail.color, borderRadius:99 }} />
                          </div>
                          <span style={{ fontSize:9, color:p>=100?"#10b981":th.mut, width:30, textAlign:"right", fontFamily:"monospace" }}>{p>=100?"✅":`${Math.round(p)}%`}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OVERVIEW */}
          {!gDetail && tab === "overview" && (
            <div style={{ animation:"fadeUp .3s ease" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:18 }}>
                {[{l:"Income",v:income,c:"#10b981",p:"$"},{l:"Expenses",v:totalExp,c:"#ef4444",p:"$"},{l:"EMI",v:emiTot,c:"#8b5cf6",p:"$"},{l:"Net Savings",v:netSav,c:"#06b6d4",p:"$"},{l:"Savings Rate",v:savRate,c:savRate>=20?"#10b981":"#f59e0b",p:"",s:"%"}].map(({l,v,c,p,s=""}) => (
                  <div key={l} style={{ background:th.card, border:`1px solid ${th.bor}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
                    <div style={{ fontSize:8, color:th.fnt, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", marginBottom:7 }}>{l}</div>
                    <div style={{ fontSize:19, fontWeight:800, color:c, fontFamily:"monospace" }}><AnimNum value={v} prefix={p} decimals={s==="%"?1:0} />{s}</div>
                    <div style={{ height:3, background:th.bor, marginTop:9, borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min(100,income>0?(v/income)*100:0)}%`, background:c, borderRadius:2, transition:"width .8s" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1.1fr 1fr", gap:14, marginBottom:14 }}>
                <div style={{ background:th.card, border:`1px solid ${th.bor}`, borderRadius:16, padding:"18px 20px" }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:th.txt, marginBottom:14 }}>Expense Breakdown</div>
                  <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                    <ResponsiveContainer width={130} height={130}>
                      <PieChart><Pie data={expPie} cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={3} dataKey="value">{expPie.map((e,i) => <Cell key={i} fill={e.color} stroke="none"/>)}</Pie><Tooltip formatter={v => [`$${v.toLocaleString()}`,""]} contentStyle={ttip}/></PieChart>
                    </ResponsiveContainer>
                    <div style={{ flex:1 }}>{expPie.map(({name,value,color}) => (
                      <div key={name} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:6,height:6,borderRadius:"50%",background:color }}/><span style={{ fontSize:10, color:th.mut }}>{name}</span></div>
                        <span style={{ fontSize:10, fontWeight:700, color, fontFamily:"monospace" }}>${value.toLocaleString()}</span>
                      </div>
                    ))}</div>
                  </div>
                </div>
                <div style={{ background:th.card, border:`1px solid ${th.bor}`, borderRadius:16, padding:"18px 20px" }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:th.txt, marginBottom:14 }}>Savings Allocation</div>
                  {totalSav > 0 ? (
                    <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                      <ResponsiveContainer width={130} height={130}>
                        <PieChart><Pie data={savPie} cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={3} dataKey="value">{savPie.map((e,i) => <Cell key={i} fill={e.color} stroke="none"/>)}</Pie><Tooltip formatter={v => [`$${v.toLocaleString()}`,""]} contentStyle={ttip}/></PieChart>
                      </ResponsiveContainer>
                      <div style={{ flex:1 }}>{savPie.map(({name,value,color}) => (
                        <div key={name} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:6,height:6,borderRadius:"50%",background:color }}/><span style={{ fontSize:10, color:th.mut }}>{name}</span></div>
                          <span style={{ fontSize:10, fontWeight:700, color, fontFamily:"monospace" }}>${value.toLocaleString()}</span>
                        </div>
                      ))}</div>
                    </div>
                  ) : <div style={{ textAlign:"center", padding:"24px 0", color:th.fnt }}><div style={{ fontSize:26,marginBottom:7 }}>🏦</div><div style={{ fontSize:11 }}>Go to Savings to allocate</div></div>}
                </div>
              </div>
              {goals.length > 0 && (
                <div style={{ background:th.card, border:`1px solid ${th.bor}`, borderRadius:16, padding:"18px 20px", marginBottom:14 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:th.txt, marginBottom:14 }}>Goals</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
                    {goals.map(g => { const sv=(g.contributions||[]).reduce((s,c)=>s+c.amount,0); const pct=g.target>0?Math.min(100,(sv/g.target)*100):0; return (
                      <div key={g.id} onClick={() => setGoalDetail(g.id)} style={{ background:th.deep, border:`1px solid ${th.bor}`, borderRadius:10, padding:"12px 14px", cursor:"pointer" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:7 }}><span style={{ fontSize:14 }}>{g.icon}</span><div><div style={{ fontSize:11, fontWeight:700, color:th.txt }}>{g.name}</div><div style={{ fontSize:9, color:th.fnt }}>${sv.toLocaleString()} / ${g.target.toLocaleString()}</div></div></div>
                          <span style={{ fontSize:13, fontWeight:800, color:g.color, fontFamily:"monospace" }}>{Math.round(pct)}%</span>
                        </div>
                        <PBar value={sv} max={g.target} color={g.color} h={4} theme={th} />
                      </div>
                    );})}
                  </div>
                </div>
              )}
              <div style={{ background:th.card, border:`1px solid ${th.bor}`, borderRadius:16, padding:"18px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:th.txt }}>Savings Projection</div>
                  <div style={{ display:"flex", gap:5 }}>
                    {[{l:"6M",m:6},{l:"1Y",m:12},{l:"2Y",m:24},{l:"5Y",m:60}].map(o => (
                      <button key={o.m} onClick={() => setProj(o.m)} style={{ background: proj===o.m?"#8b5cf6":th.deep, border:`1px solid ${proj===o.m?"#8b5cf6":th.bor}`, borderRadius:6, padding:"3px 9px", color: proj===o.m?"#fff":th.mut, fontSize:9, fontWeight:700, cursor:"pointer" }}>{o.l}</button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={projData(proj)} margin={{top:4,right:6,bottom:0,left:0}}>
                    <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={th.cg}/>
                    <XAxis dataKey="m" tick={{fill:th.ct,fontSize:9}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
                    <YAxis tick={{fill:th.ct,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`$${(v/1000).toFixed(0)}k`:`$${v}`}/>
                    <Tooltip formatter={v=>[`$${Number(v).toLocaleString()}`,"Savings"]} contentStyle={ttip}/>
                    <Area type="monotone" dataKey="b" stroke="#06b6d4" fill="url(#g1)" strokeWidth={2.5}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* EXPENSES */}
          {!gDetail && tab === "expenses" && (
            <div style={{ animation:"fadeUp .3s ease" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:18 }}>
                <div><div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:th.txt }}>Monthly Expenses</div><div style={{ fontSize:11, color:th.mut }}>Edit each category</div></div>
                <div style={{ textAlign:"right" }}><div style={{ fontSize:10, color:th.mut }}>Total</div><div style={{ fontSize:26, fontWeight:800, color:"#ef4444", fontFamily:"monospace" }}>${totalExp.toLocaleString()}</div></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
                <div style={{ paddingRight:8 }}>{EXP_GROUPS.slice(0,3).map(g => <Accordion key={g.id} group={g} values={exp} onChange={setE} income={income} theme={th}/>)}</div>
                <div style={{ paddingLeft:8 }}>{EXP_GROUPS.slice(3).map(g => <Accordion key={g.id} group={g} values={exp} onChange={setE} income={income} theme={th}/>)}
                  <div style={{ background:th.card, border:`1px solid ${th.bor}`, borderRadius:14, padding:"16px 18px", marginTop:6 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:800, color:th.txt, marginBottom:12 }}>Summary</div>
                    {[{l:"Total",v:`$${totalExp.toLocaleString()}`,c:"#ef4444"},{l:"Net Savings",v:`$${netSav.toLocaleString()}`,c:"#10b981"},{l:"Annual Savings",v:`$${(netSav*12).toLocaleString()}`,c:"#06b6d4"},{l:"EMI Burden",v:`${income>0?((emiTot/income)*100).toFixed(1):0}%`,c:"#8b5cf6"}].map(({l,v,c}) => (
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${th.bor}` }}>
                        <span style={{ fontSize:11, color:th.mut }}>{l}</span><span style={{ fontSize:13, fontWeight:800, color:c, fontFamily:"monospace" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SAVINGS */}
          {!gDetail && tab === "savings" && (
            <div style={{ animation:"fadeUp .3s ease" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:18 }}>
                <div><div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:th.txt }}>Savings Allocation</div><div style={{ fontSize:11, color:th.mut }}>Allocate ${netSav.toLocaleString()}/mo</div></div>
                <div style={{ textAlign:"right" }}><div style={{ fontSize:10, color:th.mut }}>Allocated</div><div style={{ fontSize:26, fontWeight:800, color:"#10b981", fontFamily:"monospace" }}>${totalSav.toLocaleString()}</div></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
                <div style={{ paddingRight:8 }}>{SAV_GROUPS.slice(0,2).map(g => <Accordion key={g.id} group={g} values={sav} onChange={setS} income={income} theme={th}/>)}</div>
                <div style={{ paddingLeft:8 }}>{SAV_GROUPS.slice(2).map(g => <Accordion key={g.id} group={g} values={sav} onChange={setS} income={income} theme={th}/>)}</div>
              </div>
            </div>
          )}

          {/* FORECAST */}
          {!gDetail && tab === "forecast" && (
            <div style={{ animation:"fadeUp .3s ease" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:th.txt, marginBottom:4 }}>Savings Forecast</div>
              <div style={{ fontSize:11, color:th.mut, marginBottom:18 }}>Visualize your long-term savings trajectory</div>
              <div style={{ background:th.card, border:`1px solid ${th.bor}`, borderRadius:16, padding:"18px 22px", marginBottom:18 }}>
                <div style={{ fontSize:10, color:th.mut, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Projection Window</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {[{l:"6 Mo",m:6},{l:"1 Yr",m:12},{l:"2 Yr",m:24},{l:"3 Yr",m:36},{l:"5 Yr",m:60},{l:"10 Yr",m:120}].map(o => (
                    <button key={o.m} onClick={() => setProj(o.m)} style={{ background: proj===o.m?"linear-gradient(135deg,#8b5cf6,#6d28d9)":th.deep, border:`1.5px solid ${proj===o.m?"#8b5cf6":th.bor}`, borderRadius:9, padding:"9px 16px", cursor:"pointer", color: proj===o.m?"#fff":th.mut, fontSize:11, fontWeight:800 }}>{o.l}</button>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginTop:16, background:th.deep, borderRadius:10, padding:"12px 14px" }}>
                  {[{l:"Period",v:proj>=12?`${(proj/12).toFixed(proj%12===0?0:1)}yr`:`${proj}mo`,c:"#8b5cf6"},{l:"Total",v:`$${(netSav*proj).toLocaleString()}`,c:"#10b981"},{l:"Monthly",v:`$${netSav.toLocaleString()}`,c:"#06b6d4"},{l:"Rate",v:`${savRate.toFixed(1)}%`,c:savRate>=20?"#10b981":"#f59e0b"}].map(({l,v,c}) => (
                    <div key={l}><div style={{ fontSize:9, color:th.fnt, fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>{l}</div><div style={{ fontSize:17, fontWeight:800, color:c, fontFamily:"monospace" }}>{v}</div></div>
                  ))}
                </div>
              </div>
              <div style={{ background:th.card, border:`1px solid ${th.bor}`, borderRadius:16, padding:"18px 22px" }}>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={projData(proj)} margin={{top:5,right:6,bottom:0,left:0}}>
                    <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={th.cg}/>
                    <XAxis dataKey="m" tick={{fill:th.ct,fontSize:9}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
                    <YAxis tick={{fill:th.ct,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}k`:`$${v}`}/>
                    <Tooltip formatter={v=>[`$${Number(v).toLocaleString()}`,"Savings"]} contentStyle={ttip}/>
                    <Area type="monotone" dataKey="b" stroke="#8b5cf6" fill="url(#g2)" strokeWidth={2.5}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* AI COACH */}
          {!gDetail && tab === "coach" && <AICoach income={income} exp={exp} netSav={netSav} sav={sav} goals={goals} theme={th} />}
        </div>
      </div>

      {showGoalModal && <GoalModal existing={editGoal} onSave={saveGoal} onClose={() => { setShowGoalModal(false); setEditGoal(null); }} theme={th} />}
      {addMoneyGoal && <AddMoneyModal goal={addMoneyGoal} onSave={c => addContrib(addMoneyGoal.id, c)} onClose={() => setAddMoneyGoal(null)} theme={th} />}
    </div>
  );
}

function AICoach({ income, exp, netSav, sav, goals, theme: th }) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const analyze = async () => {
    setLoading(true); setAdvice(null);
    const totalExp = Object.values(exp).reduce((a,b)=>a+b,0);
    const emi = ["emi_home","emi_car","emi_per","emi_edu"].reduce((s,k)=>s+(exp[k]||0),0);
    const savTxt = Object.entries(sav).filter(([,v])=>v>0).map(([k,v])=>`${k}:$${v}`).join(", ");
    const goalTxt = goals.map(g=>`${g.name}: $${g.target} target, $${g.monthlyNeeded}/mo`).join("; ");
    const prompt = `Finance coach. Give 5 tips as JSON only:\nIncome:$${income} Expenses:$${totalExp} EMI:$${emi} Savings:$${netSav}/mo\nAllocations: ${savTxt||"none"}\nGoals: ${goalTxt||"none"}\nRespond ONLY with: {"tips":[{"emoji":"💡","title":"title","body":"2 sentences","priority":"high|medium|low"}]}`;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:prompt}]})});
      const d = await r.json();
      const txt = d.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      setAdvice(JSON.parse(txt).tips);
    } catch { setAdvice([{emoji:"⚠️",title:"Error",body:"Could not connect. Check your connection.",priority:"low"}]); }
    setLoading(false);
  };
  const pc = {high:"#ef4444",medium:"#f97316",low:"#10b981"};
  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:th.txt, marginBottom:4 }}>AI Finance Coach</div>
      <div style={{ fontSize:11, color:th.mut, marginBottom:18 }}>Claude analyzes your finances and gives personalized tips</div>
      <div style={{ background:th.card, border:`1px solid ${th.bor}`, borderRadius:16, overflow:"hidden" }}>
        <div style={{ background: th.name==="dark"?"linear-gradient(135deg,#0d1f35,#0a0f1a)":th.deep, padding:"18px 22px", borderBottom:`1px solid ${th.bor}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div><div style={{ fontSize:15, fontWeight:800, color:th.txt }}>🧠 AI Finance Coach</div><div style={{ fontSize:10, color:th.mut }}>Powered by Claude</div></div>
          <button onClick={analyze} disabled={loading || income===0} style={{ background: loading ? th.hov : "linear-gradient(135deg,#06b6d4,#3b82f6)", border:"none", borderRadius:8, padding:"8px 16px", color: loading ? th.mut : "#fff", fontWeight:700, fontSize:12, cursor: income===0 ? "not-allowed" : "pointer", opacity: income===0 ? .5 : 1 }}>
            {loading ? "Thinking…" : advice ? "↻ Refresh" : "Analyze →"}
          </button>
        </div>
        <div style={{ padding:"18px 22px" }}>
          {loading && [...Array(4)].map((_,i) => <div key={i} style={{ height:58, borderRadius:10, marginBottom:9, background:`linear-gradient(90deg,${th.shA} 25%,${th.shB} 50%,${th.shA} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }}/>)}
          {!loading && !advice && <div style={{ textAlign:"center", padding:"28px 0" }}><div style={{ fontSize:38, marginBottom:10 }}>🤖</div><div style={{ fontSize:13, color:th.mut, fontWeight:600 }}>Click "Analyze" for personalized financial tips</div></div>}
          {advice && !loading && advice.map((tip, i) => (
            <div key={i} style={{ display:"flex", gap:12, background:th.deep, border:`1px solid ${th.bor}`, borderRadius:11, padding:"12px 14px", marginBottom:8 }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{tip.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:800, color:th.txt }}>{tip.title}</span>
                  <span style={{ fontSize:8, padding:"2px 6px", borderRadius:99, background:`${pc[tip.priority]}18`, color:pc[tip.priority], fontWeight:700, textTransform:"uppercase" }}>{tip.priority}</span>
                </div>
                <div style={{ fontSize:11, color:th.mut, lineHeight:1.7 }}>{tip.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("login"); // "login" | "signup" | "dashboard"
  const [user, setUser] = useState(null);

  if (screen === "signup") return <SignupScreen onSignup={u => { setUser(u); setScreen("dashboard"); }} onGoLogin={() => setScreen("login")} />;
  if (screen === "dashboard" && user) return <Dashboard user={user} onLogout={() => { setUser(null); setScreen("login"); }} />;
  return <LoginScreen onLogin={u => { setUser(u); setScreen("dashboard"); }} onGoSignup={() => setScreen("signup")} />;
}