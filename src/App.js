import { useState, useEffect } from "react";

const DAYS = ["Dilluns","Dimarts","Dimecres","Dijous","Divendres","Dissabte","Diumenge"];
const DAYS_SHORT = ["L","M","X","J","V","S","D"];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
const TODAY = DAYS[TODAY_IDX];
const PIN = "1234";
const ICON_OPTIONS = ["jumping","arm-circles","arm-circles-back","hip-circles","pushup","row","squat","lateral-raise","bridge","plank","run","stretch","lunge","dumbbell","core"];

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:       "#0F0F14",
  card:     "#1A1A24",
  card2:    "#1F1F2E",
  border:   "#2A2A38",
  accent:   "#E8FF47",
  accentDim:"#B8CC30",
  textPrimary: "#E0E0FF",
  textSecondary: "#6060A0",
  textMuted: "#3A3A5A",
  green:    "#4ADE80",
  greenBg:  "#0F2A1F",
  greenBorder:"#22543D",
  orange:   "#FB923C",
  orangeBg: "#2D1A0A",
  purple:   "#7F77DD",
  purpleBg: "#1F1F40",
  danger:   "#E05050",
  dangerBg: "#3A1A1A",
};

const CLIENT_COLORS = [
  { text: T.purple, bg: T.purpleBg, border: "#3A3A60" },
  { text: T.green,  bg: T.greenBg,  border: T.greenBorder },
  { text: T.orange, bg: T.orangeBg, border: "#7C2D12" },
];
const cClr = (i) => CLIENT_COLORS[i % 3];

// ── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  wrap: { fontFamily:"system-ui,sans-serif", maxWidth:520, margin:"0 auto", background:T.bg, minHeight:"100vh", padding:"0 0 3rem", color:T.textPrimary },
  hdr: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.25rem 0.75rem", borderBottom:`1px solid ${T.border}` },
  sec: { padding:"1rem 1.25rem" },
  card: { background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"0.9rem 1rem", marginBottom:10 },
  inp: { padding:"9px 12px", borderRadius:10, border:`1px solid ${T.border}`, fontSize:13, width:"100%", background:T.card2, color:T.textPrimary, boxSizing:"border-box", outline:"none" },
  lbl: { fontSize:12, color:T.textSecondary, display:"block", marginBottom:5 },
  row: { display:"flex", gap:10 },
  avatar: (c) => ({ width:40, height:40, borderRadius:12, background:c.bg, border:`1px solid ${c.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:500, fontSize:13, color:c.text, flexShrink:0 }),
  btnPrimary: { background:T.accent, color:T.bg, border:"none", borderRadius:12, fontWeight:500, fontSize:15, padding:"13px 20px", cursor:"pointer", width:"100%" },
  btnSecondary: { background:"transparent", color:T.textSecondary, border:`1px solid ${T.border}`, borderRadius:10, fontSize:12, padding:"6px 12px", cursor:"pointer" },
  btnDanger: { background:"transparent", color:T.danger, border:`1px solid ${T.dangerBg}`, borderRadius:10, fontSize:11, padding:"4px 9px", cursor:"pointer" },
  btnEdit: { background:"transparent", color:T.textSecondary, border:`1px solid ${T.border}`, borderRadius:10, fontSize:11, padding:"4px 9px", cursor:"pointer" },
  tag: (variant) => {
    if (variant==="accent") return { fontSize:11, padding:"2px 9px", borderRadius:20, background:"#2D2A00", color:T.accent, border:`1px solid #4D4700` };
    if (variant==="green") return { fontSize:11, padding:"2px 9px", borderRadius:20, background:T.greenBg, color:T.green, border:`1px solid ${T.greenBorder}` };
    if (variant==="purple") return { fontSize:11, padding:"2px 9px", borderRadius:20, background:T.purpleBg, color:T.purple, border:`1px solid #3A3A60` };
    return { fontSize:11, padding:"2px 9px", borderRadius:20, background:T.card2, color:T.textSecondary, border:`1px solid ${T.border}` };
  },
  cCard: (active, c) => ({ background: active ? T.card2 : T.card, border:`${active?"2px":"1px"} solid ${active ? c.border : T.border}`, borderRadius:14, padding:"0.75rem 1rem", marginBottom:8, cursor:"pointer", display:"flex", alignItems:"center", gap:12 }),
};

// ── Default data ──────────────────────────────────────────────────────────────
const DEFAULT_IGNASI = {
  blocks:[
    { id:"activacio", title:"Activació", subtitle:"1 minut", type:"warmup",
      color:T.green, bg:T.greenBg, border:T.greenBorder,
      exercises:[
        {id:"jj",  name:"Jumping jacks",              sets:1,reps:15,unit:"reps",        notes:"Versió tranquil·la: sense salt, obre braços mentre separes un peu cap al costat. Alterna peu dret/esquerra.",icon:"jumping"},
        {id:"cbf", name:"Cercles de braços endavant",  sets:1,reps:10,unit:"reps",        notes:"Primeres 4 reps lentes amb rang ampli. Últimes 4-6 reps augmenta la velocitat.",icon:"arm-circles"},
        {id:"cba", name:"Cercles de braços enrere",    sets:1,reps:10,unit:"reps",        notes:"Primeres 4 reps lentes amb rang ampli. Últimes 4-6 reps augmenta la velocitat.",icon:"arm-circles-back"},
        {id:"cm",  name:"Cercles de maluc",            sets:1,reps:8, unit:"reps/costat", notes:"8 reps sentit horari + 8 reps antihorari. Primeres 4 lentes, últimes 4 més ràpides.",icon:"hip-circles"},
      ]},
    { id:"circuit", title:"Circuit de Força", subtitle:"2 voltes", type:"circuit", rounds:2, rest:"15-20\"",
      color:T.purple, bg:T.purpleBg, border:"#3A3A60",
      exercises:[
        {id:"flex", name:"Flexions al llit (amb genolls)",      sets:2,reps:12,unit:"reps",notes:"Esterilla al terra davant dels peus del llit. Mans separades una mica més d'amplada d'espatlles. Baixa poc a poc fins tocar el pit amb el matalàs. Puja ràpid.",icon:"pushup"},
        {id:"trx",  name:"Rem a la cintura (TRX)",             sets:2,reps:12,unit:"reps",notes:"Cos alineat (cap, esquena i malucs). Pensa en portar el pit cap al TRX. Colzes enganxats al cos. Baixa lentament i puja amb força.",icon:"row"},
        {id:"squat",name:"Squat (sentadilles)",                sets:2,reps:12,unit:"reps",notes:"Esquena recta. Genolls alineats amb els peus. Baixa controlat. Empeny amb els talons.",icon:"squat"},
        {id:"elev", name:"Elevacions alternes amb manuelles",  sets:2,reps:12,unit:"reps",notes:"Un braç s'eleva lateralment i l'altre frontalment. A cada rep alternes l'elevació. Baixa lentament els braços.",icon:"lateral-raise"},
        {id:"pont", name:"Pont de glutis",                     sets:2,reps:10,unit:"reps",notes:"Estirat a terra, genolls flexionats. Eleva malucs activant bé el gluti. Puja 1\" → aguanta 2\" → baixa 1\".",icon:"bridge"},
        {id:"plank",name:'Planxa "Tuki Tuki"',                 sets:2,reps:20,unit:"reps",notes:"Col·loca't en planxa (cos alineat). Amb una mà, toca l'espatlla contrària. Alterna el toc de mans mantenint la cadera estàtica. QUE NO BALLI!",icon:"plank"},
      ]},
  ]
};

const DEFAULT_DATA = {
  clients:[
    {id:1,name:"Roc Concernau",  goal:"Ús personal",                                 avatar:"RC",routineType:"weekly"},
    {id:2,name:"Ignasi Concernau",goal:"Entrenament a casa · 3 dies/setmana · 10-15'",avatar:"IC",routineType:"flexible"},
    {id:3,name:"Marc Perez",     goal:"Rendiment bàsquet",                            avatar:"MP",routineType:"weekly"},
  ],
  routines:{
    1: DAYS.reduce((a,d)=>({...a,[d]:[]}),{}),
    2: {flexible:true, ignasi:DEFAULT_IGNASI},
    3: DAYS.reduce((a,d)=>({...a,[d]:[]}),{}),
  },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const ExIcon = ({type, size=36, color="#534AB7"}) => {
  const c = color;
  const icons = {
    "jumping":        <><circle cx="24" cy="8" r="4" fill={c}/><line x1="24" y1="12" x2="24" y2="28" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="28" x2="14" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="28" x2="34" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="18" x2="10" y2="12" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="18" x2="38" y2="12" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></>,
    "arm-circles":    <><circle cx="24" cy="8" r="4" fill={c}/><line x1="24" y1="12" x2="24" y2="28" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="28" x2="16" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="28" x2="32" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><path d="M10 18 A14 14 0 0 1 24 10" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"/><polygon points="10,14 8,20 14,19" fill={c}/></>,
    "arm-circles-back":<><circle cx="24" cy="8" r="4" fill={c}/><line x1="24" y1="12" x2="24" y2="28" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="28" x2="16" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="28" x2="32" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><path d="M38 18 A14 14 0 0 1 24 10" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"/><polygon points="38,14 40,20 34,19" fill={c}/></>,
    "hip-circles":    <><circle cx="24" cy="8" r="4" fill={c}/><line x1="24" y1="12" x2="24" y2="26" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="26" x2="16" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="26" x2="32" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><ellipse cx="24" cy="26" rx="8" ry="4" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="4,2"/><polygon points="32,24 34,30 28,28" fill={c}/></>,
    "pushup":         <><circle cx="38" cy="10" r="4" fill={c}/><line x1="35" y1="13" x2="24" y2="24" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="24" x2="10" y2="28" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="24" x2="26" y2="36" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="10" y1="28" x2="8" y2="36" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="26" y1="36" x2="8" y2="36" stroke={c} strokeWidth="2" strokeLinecap="round"/></>,
    "row":            <><circle cx="38" cy="12" r="4" fill={c}/><line x1="35" y1="15" x2="26" y2="24" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="26" y1="24" x2="10" y2="20" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="26" y1="24" x2="28" y2="36" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="28" y1="36" x2="14" y2="38" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="6" y1="10" x2="6" y2="40" stroke="#555" strokeWidth="2" strokeLinecap="round"/></>,
    "squat":          <><circle cx="24" cy="6" r="4" fill={c}/><line x1="24" y1="10" x2="24" y2="22" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="14" x2="12" y2="18" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="14" x2="36" y2="18" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="22" x2="14" y2="34" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="22" x2="34" y2="34" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="14" y1="34" x2="12" y2="44" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="34" y1="34" x2="36" y2="44" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></>,
    "lateral-raise":  <><circle cx="24" cy="7" r="4" fill={c}/><line x1="24" y1="11" x2="24" y2="28" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="18" x2="8" y2="14" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="18" x2="40" y2="22" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><circle cx="6" cy="14" r="3" fill={c}/><circle cx="42" cy="22" r="3" fill={c}/><line x1="24" y1="28" x2="16" y2="42" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="28" x2="32" y2="42" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></>,
    "bridge":         <><circle cx="38" cy="16" r="4" fill={c}/><line x1="38" y1="20" x2="30" y2="30" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="30" y1="30" x2="14" y2="26" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="30" y1="30" x2="28" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="14" y1="26" x2="10" y2="38" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="14" y1="26" x2="6" y2="24" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></>,
    "plank":          <><circle cx="40" cy="16" r="4" fill={c}/><line x1="37" y1="19" x2="10" y2="26" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="10" y1="26" x2="8" y2="36" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="26" y1="22" x2="28" y2="32" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="20" y1="29" x2="14" y2="22" stroke={c} strokeWidth="2" strokeLinecap="round" strokeDasharray="2,2"/></>,
    "lunge":          <><circle cx="24" cy="6" r="4" fill={c}/><line x1="24" y1="10" x2="24" y2="24" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="14" x2="14" y2="18" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="14" x2="34" y2="18" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="24" x2="32" y2="38" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="24" x2="14" y2="30" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="14" y1="30" x2="10" y2="44" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></>,
    "dumbbell":       <><rect x="4" y="20" width="8" height="8" rx="2" fill={c}/><rect x="36" y="20" width="8" height="8" rx="2" fill={c}/><line x1="12" y1="24" x2="36" y2="24" stroke={c} strokeWidth="4" strokeLinecap="round"/><rect x="14" y="18" width="6" height="12" rx="2" fill={c}/><rect x="28" y="18" width="6" height="12" rx="2" fill={c}/></>,
    "run":            <><circle cx="30" cy="8" r="4" fill={c}/><line x1="28" y1="12" x2="20" y2="24" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="20" y1="24" x2="10" y2="20" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="20" y1="24" x2="24" y2="36" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="36" x2="14" y2="44" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="36" x2="34" y2="42" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></>,
    "stretch":        <><circle cx="24" cy="8" r="4" fill={c}/><line x1="24" y1="12" x2="24" y2="26" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="20" x2="8" y2="28" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="20" x2="40" y2="28" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="26" x2="18" y2="44" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="26" x2="30" y2="44" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></>,
    "core":           <><circle cx="24" cy="8" r="4" fill={c}/><line x1="24" y1="12" x2="24" y2="30" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="30" x2="14" y2="44" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><line x1="24" y1="30" x2="34" y2="44" stroke={c} strokeWidth="2.5" strokeLinecap="round"/><ellipse cx="24" cy="22" rx="10" ry="5" fill="none" stroke={c} strokeWidth="1.5"/></>,
  };
  return <svg viewBox="0 0 48 48" width={size} height={size}>{icons[type]||icons["dumbbell"]}</svg>;
};

const IconPicker = ({value, onChange}) => (
  <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"8px 0"}}>
    {ICON_OPTIONS.map(ic=>(
      <div key={ic} onClick={()=>onChange(ic)} style={{width:42,height:42,borderRadius:10,border:`${value===ic?"2px":"1px"} solid ${value===ic?T.accent:T.border}`,background:value===ic?"#2D2A00":T.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        <ExIcon type={ic} size={26} color={value===ic?T.accent:T.textSecondary}/>
      </div>
    ))}
  </div>
);

function Confetti() {
  const colors=[T.accent,T.green,T.orange,T.purple,"#fff"];
  return Array.from({length:20},(_,i)=>(
    <div key={i} style={{position:"absolute",width:7,height:7,borderRadius:"50%",background:colors[i%colors.length],left:`${15+Math.random()*70}%`,top:`${20+Math.random()*40}%`,animation:`cfPop ${0.6+Math.random()*0.5}s ease ${Math.random()*0.4}s forwards`,pointerEvents:"none"}}/>
  ));
}

// ── Reusable section divider ───────────────────────────────────────────────────
const BlockDivider = ({block}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,margin:"4px 0 10px"}}>
    <div style={{flex:1,height:1,background:T.border}}/>
    <div style={{fontSize:11,fontWeight:500,color:block.color,background:block.bg,padding:"3px 12px",borderRadius:20,border:`1px solid ${block.border}`}}>
      {block.title} · {block.subtitle}
    </div>
    <div style={{flex:1,height:1,background:T.border}}/>
  </div>
);

// ── Progress bar ───────────────────────────────────────────────────────────────
const ProgressBar = ({value, total, color=T.accent}) => {
  const pct = total>0?Math.round((value/total)*100):0;
  return (
    <div style={{height:6,borderRadius:3,background:T.border,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3,transition:"width 0.4s ease"}}/>
    </div>
  );
};

// ── Form card (fora del component per evitar re-renders) ──────────────────────
const FormCard = ({children, style={}}) => (
  <div style={{background:"#1A1A24",border:"1px solid #E8FF4740",borderRadius:14,padding:"0.9rem 1rem",marginBottom:10,...style}}>{children}</div>
);

// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlClient = urlParams.get("client");
  const clienteInicial = urlClient ? parseInt(urlClient) : null;
const esAccesDirecte = !!urlClient; // eslint-disable-line no-unused-vars
  const [mode, setMode] = useState(clienteInicial ? "client" : "select");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [selClient, setSelClient] = useState(clienteInicial);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Admin
  const [adminClient, setAdminClient] = useState(1);
  const [adminTab, setAdminTab] = useState("routine");
  const [clientHistories, setClientHistories] = useState({});
  const [selDay, setSelDay] = useState(TODAY);
  const [editingEx, setEditingEx] = useState(null);
  const [showAddEx, setShowAddEx] = useState(false);
  const [newEx, setNewEx] = useState({name:"",sets:3,reps:10,unit:"reps",weight:"",notes:"",icon:"dumbbell"});
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({name:"",goal:""});
  const [editingIgnasiEx, setEditingIgnasiEx] = useState(null);
  const [showAddIgnasiEx, setShowAddIgnasiEx] = useState(null);
  const [newIgnasiEx, setNewIgnasiEx] = useState({name:"",sets:2,reps:10,unit:"reps",notes:"",icon:"dumbbell"});
  const [editingBlock, setEditingBlock] = useState(null);

  // Ignasi client
  const [ignView, setIgnView] = useState("home");
  const [trainingDay, setTrainingDay] = useState(null);
  const [completed, setCompleted] = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});
  const [ignHistory, setIgnHistory] = useState([]);
  const [finished, setFinished] = useState(false);
  const [finishedAt, setFinishedAt] = useState(null);
  const [doneCountAtFinish, setDoneCountAtFinish] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [allDoneToast, setAllDoneToast] = useState(false);

  // Standard client
  const [stdCompleted, setStdCompleted] = useState({});

  useEffect(()=>{loadData();},[]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dr,hr,cr] = await Promise.allSettled([
        window.storage.get("fitcoach-data2",true),
        window.storage.get("history-2",true),
        window.storage.get("fitcoach-completed",true),
      ]);
      setData(dr.status==="fulfilled"&&dr.value?JSON.parse(dr.value.value):DEFAULT_DATA);
      setIgnHistory(hr.status==="fulfilled"&&hr.value?JSON.parse(hr.value.value):[]);
      setStdCompleted(cr.status==="fulfilled"&&cr.value?JSON.parse(cr.value.value):{});
      try { const h1=await window.storage.get("history-1",true); setClientHistories({1:h1?JSON.parse(h1.value):[]});} catch {setClientHistories({1:[]});}
    } catch {setData(DEFAULT_DATA);}
    setLoading(false);
  };

  const persist = async (nd) => {setSaving(true);try{await window.storage.set("fitcoach-data2",JSON.stringify(nd),true);}catch{}setSaving(false);};
  const persistHistory = async (h) => {try{await window.storage.set("history-2",JSON.stringify(h),true);}catch{}};
  const persistStdCompleted = async (c) => {try{await window.storage.set("fitcoach-completed",JSON.stringify(c),true);}catch{}};
  const updateData = (d) => {setData(d);persist(d);};

  const loadClientHistory = async (clientId) => {
    if(clientHistories[clientId]!==undefined)return;
    try{const h=await window.storage.get(`history-${clientId}`,true);setClientHistories(p=>({...p,[clientId]:h?JSON.parse(h.value):[]}));}
    catch{setClientHistories(p=>({...p,[clientId]:[]}));}
  };
  const selectAdminClient = (id) => {setAdminClient(id);setAdminTab("routine");loadClientHistory(id);};

  // Ignasi helpers
  const getIgnasiRoutine = () => data?.routines?.[2]?.ignasi||DEFAULT_IGNASI;
  const getAllExs = () => getIgnasiRoutine().blocks.flatMap(b=>b.exercises);
  const totalExs = getAllExs().length;
  const isDone = (exId) => !!completed[exId];
  const doneCount = () => getAllExs().filter(e=>isDone(e.id)).length;

  const toggleDone = (exId) => {
    const wasAll = doneCount()===totalExs;
    const u = {...completed,[exId]:!completed[exId]};
    setCompleted(u);
    if(!wasAll&&Object.values(u).filter(Boolean).length===totalExs){setAllDoneToast(true);setTimeout(()=>setAllDoneToast(false),2500);}
  };

  const startTraining = (day) => {setTrainingDay(day);setCompleted({});setExpandedNotes({});setFinished(false);setFinishedAt(null);setDoneCountAtFinish(0);setShowConfetti(false);setIgnView("training");};

  const finishTraining = async () => {
    const dc=doneCount();
    const now=new Date();
    const record={day:trainingDay,date:now.toLocaleDateString("ca-ES"),time:now.toLocaleTimeString("ca-ES",{hour:"2-digit",minute:"2-digit"}),doneCount:dc,total:totalExs,finishedAt:now.toISOString()};
    const h=[record,...ignHistory].slice(0,50);
    setIgnHistory(h);await persistHistory(h);
    setClientHistories(p=>({...p,2:h}));
    setDoneCountAtFinish(dc);setFinishedAt(record.time);setFinished(true);setShowConfetti(true);
    setTimeout(()=>setShowConfetti(false),1200);
  };

  const resetToHome = () => {setIgnView("home");setTrainingDay(null);setCompleted({});setExpandedNotes({});setFinished(false);setFinishedAt(null);setDoneCountAtFinish(0);setShowConfetti(false);};

  // Ignasi admin helpers
  const updateIgnasiRoutine = (routine) => {const nd={...data,routines:{...data.routines,2:{...data.routines[2],ignasi:routine}}};updateData(nd);};
  const saveIgnasiExEdit = () => {const r=getIgnasiRoutine();const blocks=r.blocks.map(b=>({...b,exercises:b.exercises.map(e=>e.id===editingIgnasiEx.id?editingIgnasiEx:e)}));updateIgnasiRoutine({...r,blocks});setEditingIgnasiEx(null);};
  const deleteIgnasiEx = (blockId,exId) => {const r=getIgnasiRoutine();const blocks=r.blocks.map(b=>b.id===blockId?{...b,exercises:b.exercises.filter(e=>e.id!==exId)}:b);updateIgnasiRoutine({...r,blocks});};
  const addIgnasiEx = (blockId) => {if(!newIgnasiEx.name)return;const r=getIgnasiRoutine();const blocks=r.blocks.map(b=>b.id===blockId?{...b,exercises:[...b.exercises,{...newIgnasiEx,id:Date.now().toString()}]}:b);updateIgnasiRoutine({...r,blocks});setNewIgnasiEx({name:"",sets:2,reps:10,unit:"reps",notes:"",icon:"dumbbell"});setShowAddIgnasiEx(null);};
  const saveBlockEdit = () => {const r=getIgnasiRoutine();const blocks=r.blocks.map(b=>b.id===editingBlock.id?{...b,title:editingBlock.title,rounds:editingBlock.rounds,rest:editingBlock.rest}:b);updateIgnasiRoutine({...r,blocks});setEditingBlock(null);};

  // Standard helpers
  const toggleStdDone = (cid,day,exId) => {const key=`${cid}-${day}-${exId}`;const u={...stdCompleted,[key]:!stdCompleted[key]};setStdCompleted(u);persistStdCompleted(u);};
  const isStdDone = (cid,day,exId) => !!stdCompleted[`${cid}-${day}-${exId}`];
  const deleteEx = (exId) => {const r={...data.routines,[adminClient]:{...data.routines[adminClient],[selDay]:data.routines[adminClient][selDay].filter(e=>e.id!==exId)}};updateData({...data,routines:r});};
  const saveEdit = () => {const r={...data.routines,[adminClient]:{...data.routines[adminClient],[selDay]:data.routines[adminClient][selDay].map(e=>e.id===editingEx.id?editingEx:e)}};updateData({...data,routines:r});setEditingEx(null);};
  const addEx = () => {if(!newEx.name)return;const r={...data.routines,[adminClient]:{...data.routines[adminClient],[selDay]:[...(data.routines[adminClient][selDay]||[]),{...newEx,id:Date.now()}]}};updateData({...data,routines:r});setNewEx({name:"",sets:3,reps:10,unit:"reps",weight:"",notes:"",icon:"dumbbell"});setShowAddEx(false);};
  const addClient = () => {if(!newClient.name)return;const id=Date.now();const avatar=newClient.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();updateData({clients:[...data.clients,{id,name:newClient.name,goal:newClient.goal,avatar,routineType:"weekly"}],routines:{...data.routines,[id]:DAYS.reduce((a,d)=>({...a,[d]:[]}),{})}});setNewClient({name:"",goal:""});setShowAddClient(false);selectAdminClient(id);};

  // ── keyframes injected once ───────────────────────────────────────────────
  const cfStyle = `@keyframes cfPop{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(-60px) rotate(360deg);opacity:0}}`;

  if(loading) return (
    <div style={{...S.wrap,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,border:`3px solid ${T.border}`,borderTop:`3px solid ${T.accent}`,borderRadius:"50%",margin:"0 auto 16px",animation:"spin 0.8s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{color:T.textSecondary,fontSize:13}}>Carregant...</div>
      </div>
    </div>
  );

  // ── Shared form styles ────────────────────────────────────────────────────

  // ══════════════════════════════════════════════════════════════════════════
  // ── SELECT ────────────────────────────────────────────────────────────────
  if(mode==="select") return (
    <div style={S.wrap}>
      <style>{cfStyle}</style>
      <div style={{padding:"2.5rem 1.25rem 1.5rem",textAlign:"center"}}>
        <img src="/logotcn.PNG" alt="Train Concer Now" style={{width:220,maxWidth:"85%",margin:"0 auto 16px",display:"block"}}/>
        <div style={{fontSize:13,color:T.textSecondary}}>Qui ets avui?</div>
      </div>
      <div style={{padding:"0 1.25rem 2rem"}}>
        <button style={S.btnPrimary} onClick={()=>setMode("pin")}>Soc el preparador</button>
        <div style={{fontSize:12,color:T.textMuted,textAlign:"center",margin:"16px 0"}}>— o selecciona el teu perfil —</div>
        {data.clients.map((c,i)=>{
          const cc=cClr(i);
          return (
            <div key={c.id} style={S.cCard(false,cc)} onClick={()=>{setSelClient(c.id);resetToHome();setMode("client");}}>
              <div style={S.avatar(cc)}>{c.avatar}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:500,fontSize:14,color:T.textPrimary}}>{c.name}</div>
                <div style={{fontSize:12,color:cc.text,marginTop:2}}>{c.goal}</div>
              </div>
              <svg viewBox="0 0 16 16" width="14" height="14"><polyline points="5,3 11,8 5,13" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── PIN ───────────────────────────────────────────────────────────────────
  if(mode==="pin") return (
    <div style={{...S.wrap,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <style>{cfStyle}</style>
      <div style={{width:"100%",maxWidth:320,padding:"2rem 1.25rem",textAlign:"center"}}>
        <div style={{width:56,height:56,background:T.card,borderRadius:16,margin:"0 auto 20px",display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${T.border}`}}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke={T.accent} strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="16" r="1.5" fill={T.accent}/></svg>
        </div>
        <div style={{fontWeight:500,fontSize:18,color:T.textPrimary,marginBottom:6}}>Àrea del preparador</div>
        <div style={{fontSize:13,color:T.textSecondary,marginBottom:24}}>Introdueix el teu PIN</div>
        <input type="password" maxLength={6}
          style={{...S.inp,textAlign:"center",fontSize:24,letterSpacing:10,maxWidth:160,margin:"0 auto 12px",display:"block",border:`1px solid ${pinError?T.danger:T.border}`}}
          value={pinInput}
          onChange={e=>{setPinInput(e.target.value);setPinError(false);}}
          onKeyDown={e=>{if(e.key==="Enter"){if(pinInput===PIN){setMode("admin");setPinInput("");}else setPinError(true);}}}
          placeholder="····" autoFocus/>
        {pinError&&<div style={{fontSize:12,color:T.danger,marginBottom:10}}>PIN incorrecte</div>}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:4}}>
          <button style={S.btnSecondary} onClick={()=>{setMode("select");setPinInput("");setPinError(false);}}>Tornar</button>
          <button style={{...S.btnPrimary,width:"auto",padding:"8px 20px",fontSize:14}} onClick={()=>{if(pinInput===PIN){setMode("admin");setPinInput("");}else setPinError(true);}}>Entrar</button>
        </div>
        <div style={{fontSize:11,color:T.textMuted,marginTop:20}}>PIN per defecte: 1234</div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ── CLIENT IGNASI ─────────────────────────────────────────────────────────
  if(mode==="client"&&selClient===2){
    const routine=getIgnasiRoutine();
    const dc=doneCount();
    const pct=Math.round((dc/totalExs)*100);
    const allDone=dc===totalExs;
    const lastSession=ignHistory[0]||null;

    const IgnasiHeader = ({right}) => (
      <div style={S.hdr}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={S.avatar(cClr(1))}>IC</div>
          <div>
            <div style={{fontWeight:500,fontSize:14,color:T.textPrimary}}>Ignasi Concernau</div>
            <div style={{fontSize:11,color:T.green}}>Entrenament a casa · 10-15'</div>
          </div>
        </div>
        {right}
      </div>
    );

    // History view
    if(ignView==="history"){
      const totalS=ignHistory.length;
      const fullS=ignHistory.filter(s=>s.doneCount===s.total).length;
      return (
        <div style={S.wrap}>
          <style>{cfStyle}</style>
          <IgnasiHeader right={<button style={S.btnSecondary} onClick={()=>setIgnView("home")}>← Tornar</button>}/>
          <div style={S.sec}>
            <div style={{fontWeight:500,fontSize:15,color:T.textPrimary,marginBottom:16}}>Historial d'entrenaments</div>
            {totalS===0?(
              <div style={{textAlign:"center",padding:"3rem 0",color:T.textSecondary}}>
                <div style={{fontSize:40,marginBottom:12}}>🏃</div>
                <div style={{fontWeight:500,color:T.textPrimary,marginBottom:4}}>Sense entrenaments encara</div>
                <div style={{fontSize:13}}>Completa el primer per veure l'historial</div>
              </div>
            ):(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8,marginBottom:16}}>
                  <div style={{background:T.card,borderRadius:12,padding:"0.9rem",textAlign:"center",border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:26,fontWeight:500,color:T.accent}}>{totalS}</div>
                    <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>Entrenaments</div>
                  </div>
                  <div style={{background:T.card,borderRadius:12,padding:"0.9rem",textAlign:"center",border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:26,fontWeight:500,color:T.green}}>{fullS}</div>
                    <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>Completats al 100%</div>
                  </div>
                </div>
                {ignHistory.map((sess,idx)=>{
                  const full=sess.doneCount===sess.total;
                  return (
                    <div key={idx} style={S.card}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <div>
                          <div style={{fontWeight:500,fontSize:14,color:T.textPrimary}}>{sess.day}</div>
                          <div style={{fontSize:12,color:T.textSecondary}}>{sess.date}{sess.time?" · "+sess.time:""}</div>
                        </div>
                        {full
                          ?<span style={{...S.tag("green"),fontSize:11}}>✓ Complet</span>
                          :<span style={{fontSize:12,color:T.textSecondary}}>{sess.doneCount}/{sess.total}</span>
                        }
                      </div>
                      <ProgressBar value={sess.doneCount} total={sess.total} color={full?T.green:T.accent}/>
                    </div>
                  );
                })}
              </>
            )}
          </div>
          <div style={{padding:"0 1.25rem"}}>
            <button style={S.btnSecondary} onClick={()=>setMode("select")}>Sortir de l'app</button>
          </div>
        </div>
      );
    }

    // Home view
    if(ignView==="home") return (
      <div style={S.wrap}>
        <style>{cfStyle}</style>
        <IgnasiHeader right={
          <div style={{display:"flex",gap:8}}>
            <button style={{...S.btnSecondary,display:"flex",alignItems:"center",gap:4}} onClick={()=>setIgnView("history")}>
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none"><path stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" d="M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8zm6-3v3l2 2"/></svg>
              Historial
            </button>
            <button style={S.btnSecondary} onClick={()=>setMode("select")}>Sortir</button>
          </div>
        }/>
        <div style={S.sec}>
          {lastSession&&(
            <div style={{...S.card,display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none"><path stroke={T.accent} strokeWidth="1.4" strokeLinecap="round" d="M3 10a7 7 0 1 0 14 0A7 7 0 0 0 3 10zm7-4v4l2.5 2.5"/></svg>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:T.textSecondary}}>Últim entrenament</div>
                <div style={{fontSize:13,fontWeight:500,color:T.textPrimary}}>{lastSession.day} · {lastSession.date} · {lastSession.doneCount}/{lastSession.total} exercicis</div>
              </div>
            </div>
          )}
          <div style={{background:T.card,borderRadius:16,padding:"1.25rem",border:`1px solid ${T.border}`,marginBottom:20}}>
            <div style={{fontWeight:500,fontSize:15,color:T.textPrimary,marginBottom:4}}>Avui entrenes?</div>
            <div style={{fontSize:13,color:T.textSecondary,marginBottom:14}}>Tria el dia per començar</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {DAYS.map(d=>(
                <button key={d} onClick={()=>startTraining(d)} style={{padding:"8px 14px",borderRadius:10,cursor:"pointer",fontSize:13,border:`1px solid ${d===TODAY?T.accent:T.border}`,background:d===TODAY?T.accent:T.card2,color:d===TODAY?T.bg:T.textSecondary,fontWeight:d===TODAY?500:400,transition:"all 0.15s"}}>
                  {d}{d===TODAY?" · Avui":""}
                </button>
              ))}
            </div>
          </div>
          <div style={{fontSize:11,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Resum de la rutina</div>
          {routine.blocks.map(block=>(
            <div key={block.id} style={S.card}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:block.color}}/>
                <span style={{fontSize:13,fontWeight:500,color:block.color}}>{block.title}</span>
                <span style={{fontSize:12,color:T.textSecondary}}>· {block.subtitle}</span>
              </div>
              {block.exercises.map(ex=>(
                <div key={ex.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${T.border}`}}>
                  <ExIcon type={ex.icon} size={20} color={block.color}/>
                  <span style={{fontSize:13,flex:1,color:T.textPrimary}}>{ex.name}</span>
                  <span style={{fontSize:12,color:T.textSecondary}}>{ex.sets>1?`${ex.sets}×`:""}{ex.reps} {ex.unit}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );

    // Training view
    if(ignView==="training"){
      if(finished) return (
        <div style={S.wrap}>
          <style>{cfStyle}</style>
          <IgnasiHeader right={null}/>
          <div style={{padding:"2.5rem 1.25rem",textAlign:"center",position:"relative",overflow:"hidden"}}>
            {showConfetti&&<Confetti/>}
            <div style={{fontSize:56,marginBottom:12}}>🎉</div>
            <div style={{fontWeight:500,fontSize:22,color:T.accent,marginBottom:6}}>Entrenament finalitzat!</div>
            <div style={{fontSize:14,color:T.textSecondary,marginBottom:4}}>
              {doneCountAtFinish===totalExs?"Excel·lent feina, Ignasi 💪":`Has completat ${doneCountAtFinish} de ${totalExs} exercicis · Bona feina!`}
            </div>
            <div style={{fontSize:12,color:T.textMuted,marginBottom:32}}>Registrat a les {finishedAt}</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button style={S.btnSecondary} onClick={()=>setIgnView("history")}>Veure historial</button>
              <button style={{...S.btnPrimary,width:"auto",padding:"10px 20px",fontSize:14}} onClick={resetToHome}>Tornar a l'inici</button>
            </div>
          </div>
        </div>
      );

      return (
        <div style={S.wrap}>
          <style>{cfStyle}</style>
          {allDoneToast&&(
            <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:T.accent,color:T.bg,padding:"10px 20px",borderRadius:20,fontSize:13,fontWeight:500,zIndex:999,whiteSpace:"nowrap"}}>
              Tots els exercicis completats! 💪
            </div>
          )}
          <IgnasiHeader right={<button style={S.btnSecondary} onClick={()=>setIgnView("home")}>← Canviar dia</button>}/>

          {/* Progress strip */}
          <div style={{padding:"10px 1.25rem 10px",background:T.card,borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:500,color:T.textPrimary}}>{trainingDay}{trainingDay===TODAY?" · Avui":""}</span>
              <span style={{fontSize:13,fontWeight:500,color:allDone?T.green:T.accent}}>{dc}/{totalExs} · {pct}%</span>
            </div>
            <ProgressBar value={dc} total={totalExs} color={allDone?T.green:T.accent}/>
          </div>

          <div style={S.sec}>
            {routine.blocks.map(block=>(
              <div key={block.id} style={{marginBottom:20}}>
                <BlockDivider block={block}/>
                {block.type==="circuit"&&block.rest&&(
                  <div style={{fontSize:12,color:T.textSecondary,textAlign:"center",marginBottom:10}}>Descans {block.rest} entre exercicis</div>
                )}
                {block.exercises.map((ex,i)=>{
                  const done=isDone(ex.id);
                  const nKey=`${trainingDay}-${ex.id}`;
                  const noteOpen=!!expandedNotes[nKey];
                  return (
                    <div key={ex.id} style={{
                      background:done?T.card2:T.card,
                      border:`1px solid ${done?T.border:T.border}`,
                      borderLeft:`3px solid ${done?T.border:block.color}`,
                      borderRadius:"0 14px 14px 0",
                      padding:"0.85rem 1rem",marginBottom:8,
                      opacity:done?0.5:1,transition:"all 0.25s ease",
                    }}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{background:done?T.card2:block.bg,borderRadius:12,padding:8,flexShrink:0}}>
                          <ExIcon type={ex.icon} size={30} color={done?T.textMuted:block.color}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:500,fontSize:14,textDecoration:done?"line-through":"none",color:done?T.textMuted:T.textPrimary,marginBottom:4}}>
                            {i+1}. {ex.name}
                          </div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            {block.type==="circuit"&&<span style={S.tag("purple")}>{ex.sets} sèries</span>}
                            <span style={S.tag("green")}>{ex.reps} {ex.unit}</span>
                          </div>
                        </div>
                        <button onClick={()=>toggleDone(ex.id)} style={{width:34,height:34,borderRadius:"50%",flexShrink:0,cursor:"pointer",background:done?T.accent:T.card2,border:`2px solid ${done?T.accent:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                          {done&&<svg viewBox="0 0 16 16" width="16" height="16"><polyline points="3,8 7,12 13,4" fill="none" stroke={T.bg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>
                      </div>
                      {ex.notes&&(
                        <div style={{marginTop:8,paddingLeft:58}}>
                          <button onClick={()=>setExpandedNotes(p=>({...p,[nKey]:!p[nKey]}))} style={{fontSize:12,color:T.accent,background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:3}}>
                            <svg viewBox="0 0 12 12" width="12" height="12" style={{transition:"transform 0.2s",transform:noteOpen?"rotate(180deg)":"rotate(0)"}}>
                              <polyline points="2,4 6,8 10,4" fill="none" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {noteOpen?"Amagar indicacions":"Veure indicacions"}
                          </button>
                          {noteOpen&&<div style={{marginTop:7,fontSize:12,color:T.textSecondary,background:T.card2,borderRadius:8,padding:"8px 10px",lineHeight:1.6,borderLeft:`2px solid ${block.border}`}}>{ex.notes}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {allDone&&(
              <div style={{background:T.greenBg,border:`1px solid ${T.greenBorder}`,borderRadius:12,padding:"1rem",textAlign:"center",marginBottom:12}}>
                <div style={{fontSize:22,marginBottom:4}}>✅</div>
                <div style={{fontSize:13,fontWeight:500,color:T.green}}>Tots els exercicis completats!</div>
              </div>
            )}
            <button onClick={finishTraining} style={S.btnPrimary}>
              {allDone?"🏁 Finalitzar entrenament":`🏁 Finalitzar entrenament (${dc}/${totalExs})`}
            </button>
            {!allDone&&<div style={{fontSize:11,color:T.textMuted,textAlign:"center",marginTop:6}}>Pots finalitzar en qualsevol moment</div>}
          </div>
        </div>
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── CLIENT ESTÀNDARD ──────────────────────────────────────────────────────
  if(mode==="client"){
    const client=data.clients.find(c=>c.id===selClient);
    const ci=data.clients.findIndex(c=>c.id===selClient);
    const cc=cClr(ci);
    const dayExs=data.routines[selClient]?.[selDay]||[];
    const dc=dayExs.filter(e=>isStdDone(selClient,selDay,e.id)).length;
    return (
      <div style={S.wrap}>
        <style>{cfStyle}</style>
        <div style={S.hdr}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={S.avatar(cc)}>{client?.avatar}</div>
            <div>
              <div style={{fontWeight:500,fontSize:14,color:T.textPrimary}}>{client?.name}</div>
              <div style={{fontSize:11,color:cc.text}}>{client?.goal}</div>
            </div>
          </div>
          <button style={S.btnSecondary} onClick={()=>setMode("select")}>Sortir</button>
        </div>
        {/* Day selector */}
        <div style={{display:"flex",gap:6,padding:"0.85rem 1.25rem 0.5rem",overflowX:"auto"}}>
          {DAYS.map((d,i)=>{
            const hasEx=(data.routines[selClient]?.[d]?.length||0)>0;
            const active=selDay===d;
            return (
              <div key={d} style={{textAlign:"center",flexShrink:0}}>
                <button onClick={()=>setSelDay(d)} style={{width:34,height:34,borderRadius:"50%",border:`1px solid ${active?T.accent:hasEx?cc.border:T.border}`,background:active?T.accent:T.card,color:active?T.bg:hasEx?cc.text:T.textMuted,cursor:"pointer",fontSize:12,fontWeight:active?500:400}}>
                  {DAYS_SHORT[i]}
                </button>
                {hasEx&&!active&&<div style={{width:4,height:4,borderRadius:"50%",background:T.accent,margin:"3px auto 0"}}/>}
                {d===TODAY&&<div style={{fontSize:9,color:T.accent,marginTop:2}}>avui</div>}
              </div>
            );
          })}
        </div>
        <div style={S.sec}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontWeight:500,fontSize:16,color:T.textPrimary}}>{selDay}</div>
              {selDay===TODAY&&<div style={{fontSize:12,color:T.accent,fontWeight:500}}>Avui</div>}
            </div>
            {dayExs.length>0&&(
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:12,color:T.textSecondary,marginBottom:4}}>{dc}/{dayExs.length}</div>
                <ProgressBar value={dc} total={dayExs.length}/>
              </div>
            )}
          </div>
          {dayExs.length===0?(
            <div style={{textAlign:"center",padding:"3rem 0",color:T.textSecondary}}>
              <div style={{fontSize:40,marginBottom:12}}>🛋️</div>
              <div style={{fontWeight:500,color:T.textPrimary,marginBottom:4}}>Dia de descans</div>
              <div style={{fontSize:13}}>Descansa i recupera energia</div>
            </div>
          ):(
            <>
              {dayExs.map((ex,i)=>{
                const done=isStdDone(selClient,selDay,ex.id);
                return (
                  <div key={ex.id} style={{...S.card,opacity:done?0.5:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                      <button onClick={()=>toggleStdDone(selClient,selDay,ex.id)} style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${done?T.accent:T.border}`,background:done?T.accent:T.card2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                        {done&&<svg viewBox="0 0 16 16" width="14" height="14"><polyline points="3,8 7,12 13,4" fill="none" stroke={T.bg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </button>
                      <div style={{fontWeight:500,fontSize:14,color:done?T.textMuted:T.textPrimary,textDecoration:done?"line-through":"none"}}>{i+1}. {ex.name}</div>
                    </div>
                    <div style={{paddingLeft:36,display:"flex",gap:5,flexWrap:"wrap"}}>
                      <span style={S.tag("purple")}>{ex.sets} sèries</span>
                      <span style={S.tag("green")}>{ex.reps} reps</span>
                      {ex.weight&&<span style={S.tag()}>{ex.weight}</span>}
                      {ex.notes&&<div style={{fontSize:12,color:T.textSecondary,marginTop:6,width:"100%"}}>💬 {ex.notes}</div>}
                    </div>
                  </div>
                );
              })}
              {dc===dayExs.length&&dayExs.length>0&&(
                <div style={{background:T.greenBg,border:`1px solid ${T.greenBorder}`,borderRadius:14,padding:"1.25rem",textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:6}}>🎉</div>
                  <div style={{fontWeight:500,color:T.green}}>Entrenament completat!</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── ADMIN ─────────────────────────────────────────────────────────────────
  const routine=getIgnasiRoutine();
  const dayExercises=data.routines[adminClient]?.[selDay]||[];

  return (
    <div style={S.wrap}>
      <style>{cfStyle}</style>
      <div style={S.hdr}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:T.accent}}/>
          <span style={{fontWeight:500,fontSize:15,color:T.textPrimary}}>FitCoach</span>
          <span style={{fontSize:11,color:saving?T.textSecondary:T.green}}>{saving?"Guardant...":"✓ Guardat"}</span>
        </div>
        <button style={S.btnSecondary} onClick={()=>setMode("select")}>Sortir</button>
      </div>

      {/* Client list */}
      <div style={S.sec}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:11,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px"}}>Clients</span>
          <button style={S.btnSecondary} onClick={()=>setShowAddClient(true)}>+ Afegir</button>
        </div>
        {data.clients.map((c,i)=>{
          const cc=cClr(i);
          const active=adminClient===c.id;
          return (
            <div key={c.id} style={S.cCard(active,cc)} onClick={()=>selectAdminClient(c.id)}>
              <div style={S.avatar(cc)}>{c.avatar}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:500,fontSize:14,color:T.textPrimary}}>{c.name}</div>
                <div style={{fontSize:12,color:cc.text,marginTop:2}}>{c.goal}</div>
              </div>
              {active&&<span style={{...S.tag("accent"),fontSize:10}}>Seleccionat</span>}
            </div>
          );
        })}
        {showAddClient&&(
          <FormCard>
            <div style={{fontWeight:500,fontSize:14,color:T.textPrimary,marginBottom:12}}>Nou client</div>
            <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.inp} value={newClient.name} onChange={e=>setNewClient(p=>({...p,name:e.target.value}))} placeholder="Ex. Ana García"/></div>
            <div style={{marginBottom:12}}><label style={S.lbl}>Objectiu</label><input style={S.inp} value={newClient.goal} onChange={e=>setNewClient(p=>({...p,goal:e.target.value}))} placeholder="Ex. Hipertròfia..."/></div>
            <div style={{...S.row,justifyContent:"flex-end"}}><button style={S.btnSecondary} onClick={()=>setShowAddClient(false)}>Cancel·lar</button><button style={{...S.btnPrimary,width:"auto",padding:"8px 18px",fontSize:13,marginLeft:8}} onClick={addClient}>Guardar</button></div>
          </FormCard>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,padding:"0 1.25rem"}}>
        {["routine","history"].map(tab=>(
          <button key={tab} onClick={()=>{setAdminTab(tab);if(tab==="history")loadClientHistory(adminClient);}}
            style={{padding:"10px 16px",fontSize:13,cursor:"pointer",background:"none",border:"none",borderBottom:`2px solid ${adminTab===tab?T.accent:"transparent"}`,color:adminTab===tab?T.accent:T.textSecondary,fontWeight:adminTab===tab?500:400,marginBottom:-1,transition:"all 0.15s"}}>
            {tab==="routine"?"Rutina":"Historial"}
          </button>
        ))}
      </div>

      {/* History tab */}
      {adminTab==="history"&&(()=>{
        const history=clientHistories[adminClient];
        const client=data.clients.find(c=>c.id===adminClient);
        const ci=data.clients.findIndex(c=>c.id===adminClient);
        void ci;
        if(!history) return <div style={S.sec}><div style={{textAlign:"center",padding:"2rem",color:T.textSecondary,fontSize:13}}>Carregant historial...</div></div>;
        const totalS=history.length;
        const fullS=history.filter(s=>s.doneCount===s.total).length;
        const avgPct=totalS>0?Math.round(history.reduce((a,s)=>a+(s.doneCount/s.total)*100,0)/totalS):0;
        return (
          <div style={S.sec}>
            {totalS===0?(
              <div style={{textAlign:"center",padding:"2.5rem 0",color:T.textSecondary}}>
                <div style={{fontSize:36,marginBottom:10}}>📋</div>
                <div style={{fontWeight:500,color:T.textPrimary,marginBottom:4}}>{client?.name} encara no té sessions</div>
                <div style={{fontSize:13}}>Apareixeran aquí quan el client finalitzi entrenaments</div>
              </div>
            ):(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8,marginBottom:16}}>
                  {[{label:"Sessions",value:totalS,color:T.accent},{label:"Completes",value:fullS,color:T.green},{label:"% mitjà",value:`${avgPct}%`,color:T.purple}].map(st=>(
                    <div key={st.label} style={{background:T.card,borderRadius:12,padding:"0.75rem",textAlign:"center",border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:20,fontWeight:500,color:st.color}}>{st.value}</div>
                      <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{st.label}</div>
                    </div>
                  ))}
                </div>
                {history.map((sess,idx)=>{
                  const p=Math.round((sess.doneCount/sess.total)*100);
                  const full=sess.doneCount===sess.total;
                  return (
                    <div key={idx} style={S.card}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <div>
                          <div style={{fontWeight:500,fontSize:13,color:T.textPrimary}}>{sess.day}</div>
                          <div style={{fontSize:12,color:T.textSecondary}}>{sess.date}{sess.time?" · "+sess.time:""}</div>
                        </div>
                        {full?<span style={S.tag("green")}>✓ Complet</span>:<span style={{fontSize:12,color:T.textSecondary}}>{sess.doneCount}/{sess.total} · {p}%</span>}
                      </div>
                      <ProgressBar value={sess.doneCount} total={sess.total} color={full?T.green:T.accent}/>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      })()}

      {/* Routine tab */}
      {adminTab==="routine"&&(
        <div style={S.sec}>
          {adminClient===2?(
            // Ignasi editor
            <div>
              <div style={{fontWeight:500,fontSize:14,color:T.textPrimary,marginBottom:4}}>Rutina — Ignasi Concernau</div>
              <div style={{fontSize:12,color:T.textSecondary,marginBottom:16}}>Rutina flexible · mateixa cada dia que entreni</div>
              {routine.blocks.map(block=>(
                <div key={block.id} style={{marginBottom:22}}>
                  {editingBlock?.id===block.id?(
                    <FormCard style={{marginBottom:10}}>
                      <div style={{marginBottom:8}}><label style={S.lbl}>Títol del bloc</label><input style={S.inp} value={editingBlock.title} onChange={e=>setEditingBlock(p=>({...p,title:e.target.value}))}/></div>
                      {block.type==="circuit"&&(
                        <div style={{...S.row,marginBottom:8}}>
                          <div style={{flex:1}}><label style={S.lbl}>Voltes</label><input style={S.inp} type="number" value={editingBlock.rounds} onChange={e=>setEditingBlock(p=>({...p,rounds:+e.target.value}))}/></div>
                          <div style={{flex:1}}><label style={S.lbl}>Descans</label><input style={S.inp} value={editingBlock.rest} onChange={e=>setEditingBlock(p=>({...p,rest:e.target.value}))}/></div>
                        </div>
                      )}
                      <div style={{...S.row,justifyContent:"flex-end"}}><button style={S.btnSecondary} onClick={()=>setEditingBlock(null)}>Cancel·lar</button><button style={{...S.btnPrimary,width:"auto",padding:"7px 16px",fontSize:13,marginLeft:8}} onClick={saveBlockEdit}>Guardar</button></div>
                    </FormCard>
                  ):(
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                      <div style={{fontSize:12,fontWeight:500,color:block.color,background:block.bg,padding:"3px 12px",borderRadius:20,border:`1px solid ${block.border}`}}>{block.title} · {block.subtitle}</div>
                      <button style={S.btnEdit} onClick={()=>setEditingBlock({...block})}>Editar bloc</button>
                    </div>
                  )}
                  {block.exercises.map((ex,i)=>(
                    editingIgnasiEx?.id===ex.id?(
                      <FormCard key={ex.id}>
                        <div style={{marginBottom:8}}><label style={S.lbl}>Nom de l'exercici</label><input style={S.inp} value={editingIgnasiEx.name} onChange={e=>setEditingIgnasiEx(p=>({...p,name:e.target.value}))}/></div>
                        <div style={{...S.row,marginBottom:8}}>
                          <div style={{flex:1}}><label style={S.lbl}>Sèries</label><input style={S.inp} type="number" value={editingIgnasiEx.sets} onChange={e=>setEditingIgnasiEx(p=>({...p,sets:+e.target.value}))}/></div>
                          <div style={{flex:1}}><label style={S.lbl}>Reps</label><input style={S.inp} type="number" value={editingIgnasiEx.reps} onChange={e=>setEditingIgnasiEx(p=>({...p,reps:+e.target.value}))}/></div>
                          <div style={{flex:1}}><label style={S.lbl}>Unitat</label><input style={S.inp} value={editingIgnasiEx.unit} onChange={e=>setEditingIgnasiEx(p=>({...p,unit:e.target.value}))} placeholder="reps..."/></div>
                        </div>
                        <div style={{marginBottom:8}}><label style={S.lbl}>Indicacions</label><textarea style={{...S.inp,minHeight:70,resize:"vertical"}} value={editingIgnasiEx.notes} onChange={e=>setEditingIgnasiEx(p=>({...p,notes:e.target.value}))}/></div>
                        <div style={{marginBottom:12}}><label style={S.lbl}>Icona</label><IconPicker value={editingIgnasiEx.icon} onChange={v=>setEditingIgnasiEx(p=>({...p,icon:v}))}/></div>
                        <div style={{...S.row,justifyContent:"flex-end"}}><button style={S.btnSecondary} onClick={()=>setEditingIgnasiEx(null)}>Cancel·lar</button><button style={{...S.btnPrimary,width:"auto",padding:"7px 16px",fontSize:13,marginLeft:8}} onClick={saveIgnasiExEdit}>Guardar</button></div>
                      </FormCard>
                    ):(
                      <div key={ex.id} style={S.card}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{background:block.bg,borderRadius:10,padding:6,flexShrink:0}}><ExIcon type={ex.icon} size={28} color={block.color}/></div>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:500,fontSize:13,color:T.textPrimary}}>{i+1}. {ex.name}</div>
                            <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>{ex.sets>1?`${ex.sets} sèries · `:""}{ex.reps} {ex.unit}</div>
                          </div>
                          <div style={{display:"flex",gap:4}}>
                            <button style={S.btnEdit} onClick={()=>setEditingIgnasiEx({...ex})}>Editar</button>
                            <button style={S.btnDanger} onClick={()=>deleteIgnasiEx(block.id,ex.id)}>Eliminar</button>
                          </div>
                        </div>
                        {ex.notes&&<div style={{fontSize:11,color:T.textSecondary,marginTop:6,paddingLeft:46,fontStyle:"italic"}}>{ex.notes.slice(0,80)}{ex.notes.length>80?"...":""}</div>}
                      </div>
                    )
                  ))}
                  {showAddIgnasiEx===block.id?(
                    <FormCard>
                      <div style={{fontWeight:500,fontSize:13,color:T.textPrimary,marginBottom:12}}>Nou exercici</div>
                      <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.inp} value={newIgnasiEx.name} onChange={e=>setNewIgnasiEx(p=>({...p,name:e.target.value}))} placeholder="Ex. Flexions al terra"/></div>
                      <div style={{...S.row,marginBottom:8}}>
                        <div style={{flex:1}}><label style={S.lbl}>Sèries</label><input style={S.inp} type="number" value={newIgnasiEx.sets} onChange={e=>setNewIgnasiEx(p=>({...p,sets:+e.target.value}))}/></div>
                        <div style={{flex:1}}><label style={S.lbl}>Reps</label><input style={S.inp} type="number" value={newIgnasiEx.reps} onChange={e=>setNewIgnasiEx(p=>({...p,reps:+e.target.value}))}/></div>
                        <div style={{flex:1}}><label style={S.lbl}>Unitat</label><input style={S.inp} value={newIgnasiEx.unit} onChange={e=>setNewIgnasiEx(p=>({...p,unit:e.target.value}))} placeholder="reps"/></div>
                      </div>
                      <div style={{marginBottom:8}}><label style={S.lbl}>Indicacions</label><textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={newIgnasiEx.notes} onChange={e=>setNewIgnasiEx(p=>({...p,notes:e.target.value}))} placeholder="Com executar l'exercici..."/></div>
                      <div style={{marginBottom:12}}><label style={S.lbl}>Icona</label><IconPicker value={newIgnasiEx.icon} onChange={v=>setNewIgnasiEx(p=>({...p,icon:v}))}/></div>
                      <div style={{...S.row,justifyContent:"flex-end"}}><button style={S.btnSecondary} onClick={()=>setShowAddIgnasiEx(null)}>Cancel·lar</button><button style={{...S.btnPrimary,width:"auto",padding:"7px 16px",fontSize:13,marginLeft:8}} onClick={()=>addIgnasiEx(block.id)}>Afegir</button></div>
                    </FormCard>
                  ):(
                    <button style={{...S.btnSecondary,width:"100%",textAlign:"center",fontSize:12,marginTop:4}} onClick={()=>setShowAddIgnasiEx(block.id)}>+ Afegir exercici</button>
                  )}
                </div>
              ))}
            </div>
          ):(
            // Standard editor
            <div>
              <div style={{fontWeight:500,fontSize:14,color:T.textPrimary,marginBottom:12}}>Rutina — {data.clients.find(c=>c.id===adminClient)?.name}</div>
              <div style={{display:"flex",gap:6,marginBottom:16}}>
                {DAYS.map((d,i)=>(
                  <button key={d} onClick={()=>setSelDay(d)} style={{width:34,height:34,borderRadius:"50%",border:`1px solid ${selDay===d?T.accent:T.border}`,background:selDay===d?T.accent:T.card,color:selDay===d?T.bg:T.textSecondary,cursor:"pointer",fontSize:12,fontWeight:selDay===d?500:400}} title={d}>{DAYS_SHORT[i]}</button>
                ))}
              </div>
              <div style={{fontSize:13,color:T.textSecondary,marginBottom:12}}>{selDay}</div>
              {dayExercises.length===0&&!showAddEx&&<div style={{textAlign:"center",padding:"1.5rem 0",color:T.textSecondary,fontSize:13}}>Dia de descans — sense exercicis</div>}
              {dayExercises.map(ex=>(
                editingEx?.id===ex.id?(
                  <FormCard key={ex.id}>
                    <div style={{marginBottom:8}}><label style={S.lbl}>Exercici</label><input style={S.inp} value={editingEx.name} onChange={e=>setEditingEx(p=>({...p,name:e.target.value}))}/></div>
                    <div style={{...S.row,marginBottom:8}}>
                      <div style={{flex:1}}><label style={S.lbl}>Sèries</label><input style={S.inp} type="number" value={editingEx.sets} onChange={e=>setEditingEx(p=>({...p,sets:+e.target.value}))}/></div>
                      <div style={{flex:1}}><label style={S.lbl}>Reps</label><input style={S.inp} type="number" value={editingEx.reps} onChange={e=>setEditingEx(p=>({...p,reps:+e.target.value}))}/></div>
                      <div style={{flex:1}}><label style={S.lbl}>Pes/Temps</label><input style={S.inp} value={editingEx.weight} onChange={e=>setEditingEx(p=>({...p,weight:e.target.value}))}/></div>
                    </div>
                    <div style={{marginBottom:12}}><label style={S.lbl}>Notes</label><input style={S.inp} value={editingEx.notes} onChange={e=>setEditingEx(p=>({...p,notes:e.target.value}))}/></div>
                    <div style={{...S.row,justifyContent:"flex-end"}}><button style={S.btnSecondary} onClick={()=>setEditingEx(null)}>Cancel·lar</button><button style={{...S.btnPrimary,width:"auto",padding:"7px 16px",fontSize:13,marginLeft:8}} onClick={saveEdit}>Guardar</button></div>
                  </FormCard>
                ):(
                  <div key={ex.id} style={S.card}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div style={{fontWeight:500,fontSize:14,color:T.textPrimary,marginBottom:6}}>{ex.name}</div>
                      <div style={{display:"flex",gap:4}}>
                        <button style={S.btnEdit} onClick={()=>setEditingEx(ex)}>Editar</button>
                        <button style={S.btnDanger} onClick={()=>deleteEx(ex.id)}>Eliminar</button>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      <span style={S.tag("purple")}>{ex.sets} sèries</span>
                      <span style={S.tag("green")}>{ex.reps} reps</span>
                      {ex.weight&&<span style={S.tag()}>{ex.weight}</span>}
                      {ex.notes&&<div style={{fontSize:12,color:T.textSecondary,marginTop:6,width:"100%"}}>{ex.notes}</div>}
                    </div>
                  </div>
                )
              ))}
              {showAddEx?(
                <FormCard>
                  <div style={{fontWeight:500,fontSize:14,color:T.textPrimary,marginBottom:12}}>Nou exercici</div>
                  <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.inp} value={newEx.name} onChange={e=>setNewEx(p=>({...p,name:e.target.value}))} placeholder="Ex. Sentadilla"/></div>
                  <div style={{...S.row,marginBottom:8}}>
                    <div style={{flex:1}}><label style={S.lbl}>Sèries</label><input style={S.inp} type="number" value={newEx.sets} onChange={e=>setNewEx(p=>({...p,sets:+e.target.value}))}/></div>
                    <div style={{flex:1}}><label style={S.lbl}>Reps</label><input style={S.inp} type="number" value={newEx.reps} onChange={e=>setNewEx(p=>({...p,reps:+e.target.value}))}/></div>
                    <div style={{flex:1}}><label style={S.lbl}>Pes/Temps</label><input style={S.inp} value={newEx.weight} onChange={e=>setNewEx(p=>({...p,weight:e.target.value}))} placeholder="20kg"/></div>
                  </div>
                  <div style={{marginBottom:12}}><label style={S.lbl}>Notes</label><input style={S.inp} value={newEx.notes} onChange={e=>setNewEx(p=>({...p,notes:e.target.value}))} placeholder="Indicacions..."/></div>
                  <div style={{...S.row,justifyContent:"flex-end"}}><button style={S.btnSecondary} onClick={()=>setShowAddEx(false)}>Cancel·lar</button><button style={{...S.btnPrimary,width:"auto",padding:"7px 16px",fontSize:13,marginLeft:8}} onClick={addEx}>Afegir</button></div>
                </FormCard>
              ):(
                <button style={{...S.btnSecondary,width:"100%",textAlign:"center",marginTop:4}} onClick={()=>setShowAddEx(true)}>+ Afegir exercici</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
