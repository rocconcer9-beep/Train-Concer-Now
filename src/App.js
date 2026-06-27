import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, set, get, remove } from "firebase/database";

const DAYS = ["Dilluns","Dimarts","Dimecres","Dijous","Divendres","Dissabte","Diumenge"];
const DAYS_SHORT = ["L","M","X","J","V","S","D"];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
const TODAY = DAYS[TODAY_IDX];
const PIN = "1234";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  // Global/background
  bg:       "#ffffff",
  card:     "#ffffff",
  card2:    "#ffffff",
  border:   "#e2e8f0",

  // Header / branding
  headerBg: "#1a3a6b",
  headerText: "#ffffff",
  logoDot:  "#e8d800",

  // Typography
  textPrimary: "#0f172a",
  textSecondary: "#8a9bbf",
  textMuted: "#64748b",
  textOnLight: "#1a3a6b",

  // Accent / actions
  accent:   "#e8d800", // primary accent (yellow)
  accentDim: "#93c5fd",
  orange:   "#c2410c",
  orangeBg: "#fff7ed",

  // Stat colors
  statClient: "#e8d800",
  statSession: "#4ade80",
  statAlert: "#fb923c",
  statSubtitle: "#93c5fd",

  // Button / semantic
  danger:   "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fca5a5",
  green:    "#4ade80",
  purple:   "#7c3aed",
  purpleBg: "#f3e8ff",
};

const CLIENT_COLORS = [
  { text: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" },
  { text: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
  { text: "#ea580c", bg: "#fff7ed", border: "#ffedd5" },
  { text: "#7c3aed", bg: "#f3e8ff", border: "#e9d5ff" },
];
const cClr = (i) => CLIENT_COLORS[Math.max(0,i) % CLIENT_COLORS.length];

// ── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  wrap: { fontFamily:"system-ui,sans-serif", maxWidth:920, margin:"0 auto", background:T.bg, minHeight:"100vh", padding:"0 0 3rem", color:T.textPrimary },
  adminWrap: { fontFamily:"system-ui,sans-serif", maxWidth:920, margin:"0 auto", background:T.headerBg, minHeight:"100vh", padding:"0 0 3rem", color:T.headerText },
  hdr: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.25rem 0.75rem", background:T.headerBg, color:T.headerText, boxSizing:"border-box" },
  formHeader: { background:T.headerBg, color:T.headerText, padding:"1.25rem 1.25rem 1rem", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 },
  formSectionTitle: { fontSize:13, fontWeight:700, color:T.headerBg, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12, marginTop:20 },
  adminHeader: { display:"flex", flexDirection:"column", gap:12, padding:"1.5rem 1.25rem", background:T.headerBg, color:T.headerText },
  adminStatCard: { background:"rgba(255,255,255,0.12)", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:10, padding:"0.85rem 1rem", textAlign:"center" },
  adminContent: { background:"#ffffff", borderRadius:20, padding:"1.5rem 1.25rem 2rem", marginTop:-10, color:T.textOnLight },
  detailHeader: { background:T.headerBg, color:T.headerText, padding:"1.5rem 1.25rem", display:"flex", alignItems:"center", gap:16, minHeight:140, borderRadius:12 },
  clientHeader: { background:T.headerBg, color:T.headerText, padding:"1.5rem 1.25rem", display:"flex", alignItems:"center", gap:16, minHeight:140, borderRadius:"0 0 18px 18px" },
  sec: { padding:"1rem 1.25rem", color:T.textOnLight },
  card: { background:T.card, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"0.9rem 1rem", marginBottom:10, boxShadow:"0 1px 4px rgba(26,58,107,0.06)", color:T.textOnLight },
  inp: { padding:"9px 12px", borderRadius:10, border:`1.5px solid ${T.border}`, fontSize:13, width:"100%", background:T.card2, color:T.textPrimary, boxSizing:"border-box", outline:"none" },
  formInp: { padding:"10px 12px", borderRadius:8, border:"1.5px solid #c7d2fe", fontSize:13, width:"100%", background:T.card2, color:T.textPrimary, boxSizing:"border-box", outline:"none" },
  formLbl: { fontSize:12, color:T.headerBg, display:"block", marginBottom:5, fontWeight:500 },
  row: { display:"flex", gap:10 },
  avatar: (c) => ({ width:40, height:40, borderRadius:12, background:c.bg, border:`1.5px solid ${c.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:600, fontSize:13, color:c.text, flexShrink:0 }),
  btnPrimary: { background:T.accent, color:T.headerBg, border:"none", borderRadius:10, fontWeight:500, fontSize:15, padding:"10px 16px", cursor:"pointer", width:"100%" },
  btnSecondary: { background:T.card, color:T.headerBg, border:`1.5px solid #c7d2fe`, borderRadius:10, fontSize:12, padding:"6px 12px", cursor:"pointer" },
  btnDanger: { background:T.dangerBg, color:T.danger, border:`1.5px solid ${T.dangerBorder}`, borderRadius:10, fontSize:12, padding:"6px 12px", cursor:"pointer" },
  btnEdit: { background:"transparent", color:T.textSecondary, border:`1.5px solid ${T.border}`, borderRadius:10, fontSize:11, padding:"4px 9px", cursor:"pointer" },
  lbl: { fontSize:12, color:'#1a3a6b', display:"block", marginBottom:5, fontWeight:500 },
  tag: (variant) => {
    if (variant==="no_activity") return { fontSize:11, padding:"4px 9px", borderRadius:14, background:"#fff7ed", color:"#c2410c", border:`2px solid #fdba74` };
    if (variant==="active") return { fontSize:11, padding:"4px 9px", borderRadius:14, background:"#f0fdf4", color:"#15803d", border:`1.5px solid #86efac` };
    if (variant==="alert") return { fontSize:11, padding:"4px 9px", borderRadius:14, background:"#fef2f2", color:"#991b1b", border:`1.5px solid #fca5a5` };
    if (variant==="new") return { fontSize:11, padding:"4px 9px", borderRadius:14, background:"#eef2ff", color:"#1d4ed8", border:`1.5px solid #c7d2fe` };
    if (variant==="green") return { fontSize:11, padding:"4px 9px", borderRadius:14, background:"#f0fdf4", color:"#4ade80", border:"1.5px solid #86efac" };
    if (variant==="purple") return { fontSize:11, padding:"4px 9px", borderRadius:14, background:"#f3e8ff", color:"#7c3aed", border:"1.5px solid #e9d5ff" };
    if (variant==="accent") return { fontSize:11, padding:"4px 9px", borderRadius:14, background:"#fefce8", color:"#b45309", border:"1.5px solid #fde68a" };
    if (variant==="warning") return { fontSize:11, padding:"4px 9px", borderRadius:14, background:"#fff7ed", color:"#fb923c", border:"2px solid #fdba74" };
    return { fontSize:11, padding:"4px 9px", borderRadius:14, background:T.card2, color:T.textSecondary, border:`1.5px solid ${T.border}` };
  },
  cCard: (active, c) => ({ background: active ? T.card2 : T.card, border:`${active?"2px":"1.5px"} solid ${active ? c.border : T.border}`, borderRadius:14, padding:"0.75rem 1rem", marginBottom:8, cursor:"pointer", display:"flex", alignItems:"center", gap:12 }),
};

// ── Default data ──────────────────────────────────────────────────────────────
const DEFAULT_DATA = {
  clients:[
    {id:1,name:"Roc Concernau",goal:"Ús personal",avatar:"RC",routineType:"weekly",templates:[],exerciseLibrary:[],schedule:{Dilluns:[],Dimarts:[],Dimecres:[],Dijous:[],Divendres:[],Dissabte:[],Diumenge:[]}},
    {id:3,name:"Marc Perez",goal:"Rendiment bàsquet",avatar:"MP",routineType:"weekly",templates:[],exerciseLibrary:[],schedule:{Dilluns:[],Dimarts:[],Dimecres:[],Dijous:[],Divendres:[],Dissabte:[],Diumenge:[]}},
  ],
  routines:{
    1: DAYS.reduce((a,d)=>({...a,[d]:[]}),{}),
    3: DAYS.reduce((a,d)=>({...a,[d]:[]}),{}),
  },
};

// ── Progress bar ───────────────────────────────────────────────────────────────
const ProgressBar = ({value, total, color=T.accent}) => {
  const pct = total>0?Math.round((value/total)*100):0;
  return (
    <div style={{height:6,borderRadius:3,background:T.border,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3,transition:"width 0.4s ease"}}/>
    </div>
  );
};

const FormCard = ({children, style={}}) => (
  <div style={{background:"#ffffff",border:"1.5px solid #c7d2fe",borderRadius:14,padding:"0.9rem 1rem",marginBottom:10,...style}}>{children}</div>
);

// ══════════════════════════════════════════════════════════════════════════════
// ── Access token generator ────────────────────────────────────────────────────
const normalizeClientId = (clientId) => String(clientId);

const generateAccessToken = () => {
  if(window.crypto&&window.crypto.getRandomValues) {
    const array = new Uint8Array(18);
    window.crypto.getRandomValues(array);
    return Array.from(array,b=>b.toString(36).padStart(2,"0")).join("").slice(0,32);
  }
  return Math.random().toString(36).slice(2)+Date.now().toString(36);
};

// ── RPE + Càrrega interna ─────────────────────────────────────────────────────
const calculateInternalLoad = (durationReal, rpe) => {
  const duration = Number(String(durationReal||"").replace(",","."));
  const rpeValue = Number(String(rpe||"").replace(",","."));
  if(!duration||!rpeValue) return null;
  return Math.round(duration * rpeValue);
};

const getRpeColor = (value) => {
  if(value<=2) return {bg:"#0F2A1F",border:"#22543D",text:"#4ADE80"};
  if(value<=4) return {bg:"#1A2A0F",border:"#3A5A1A",text:"#86EFAC"};
  if(value<=6) return {bg:"#1F1F40",border:"#3A3A70",text:"#A78BFA"};
  if(value<=8) return {bg:"#2D1A0A",border:"#7C4A12",text:"#FB923C"};
  return {bg:"#3A1A1A",border:"#7A2020",text:"#F87171"};
};

const getRpeLabel = (value) => {
  if(!value) return "";
  if(value<=2) return "Molt suau";
  if(value<=4) return "Suau";
  if(value<=6) return "Moderat";
  if(value<=8) return "Intens";
  if(value===9) return "Molt intens";
  return "Màxim";
};

const getRpeTagStyle = (rpe, fontSize=11) => {
  const v = Number(rpe);
  const color = v<=3?"#4ade80":v<=5?"#a3e635":v===6?"#e8d800":v===7?"#fb923c":v===8?"#f97316":v===9?"#ef4444":"#dc2626";
  const bg = v<=3?"#f0fdf4":v<=5?"#f7fee7":v===6?"#fefce8":v<=8?"#fff7ed":"#fef2f2";
  return { fontSize, padding:"4px 9px", borderRadius:14, fontWeight:500, background:bg, color, border:`1.5px solid ${color}40` };
};

const getFeelingTagStyle = (feeling, fontSize=11) => {
  const base = { fontSize, padding:"4px 9px", borderRadius:14, fontWeight:500 };
  if(feeling==="Molt bé"||feeling==="Excel·lent") return {...base, background:"#f0fdf4", color:"#4ade80", border:"1.5px solid #86efac"};
  if(feeling==="Bé") return {...base, background:"#f7fef9", color:"#86efac", border:"1.5px solid #bbf7d0"};
  if(feeling==="Normal") return {...base, background:"#f8fafc", color:"#6b7280", border:"1.5px solid #e2e8f0"};
  if(feeling==="Regular") return {...base, background:"#fff7ed", color:"#fb923c", border:"1.5px solid #fdba74"};
  if(feeling==="Cansat"||feeling==="Molt cansat") return {...base, background:"#fef2f2", color:"#ef4444", border:"1.5px solid #fca5a5"};
  if(feeling==="Molèsties") return {...base, background:"#fef2f2", color:"#dc2626", border:"1.5px solid #fca5a5"};
  return {...base, background:"#f8fafc", color:"#6b7280", border:"1.5px solid #e2e8f0"};
};

const getSessionInternalLoad = (sess) =>
  sess.internalLoad ?? calculateInternalLoad(sess.durationReal, sess.rpe);

// ── Calendar ───────────────────────────────────────────────────────────────────
const CAT_MONTHS_FULL = ["Gener","Febrer","Març","Abril","Maig","Juny","Juliol","Agost","Setembre","Octubre","Novembre","Desembre"];
const CAT_MONTHS_SHORT_ARR = ["gen","feb","mar","abr","mai","jun","jul","ago","set","oct","nov","des"];
const calGetMonday = (d) => { const r=new Date(d); r.setHours(0,0,0,0); const w=r.getDay(); r.setDate(r.getDate()-(w===0?6:w-1)); return r; };
const calGetISOWeek = (d) => { const r=new Date(d); r.setHours(0,0,0,0); r.setDate(r.getDate()+4-(r.getDay()||7)); const y1=new Date(r.getFullYear(),0,1); return Math.ceil((((r-y1)/86400000)+1)/7); };
const calDayName = (d) => { const w=d.getDay(); return DAYS[w===0?6:w-1]; };
const calSameDate = (a,b) => a.toISOString().slice(0,10)===b.toISOString().slice(0,10);
const calGetOvEntry = (ov,iso) => { const e=ov[iso]; if(!e) return {ids:[],edits:{}}; if(Array.isArray(e)) return {ids:e,edits:{}}; return {ids:e.ids||[],edits:e.edits||{}}; };

const CalendarComp = ({clientIdx,schedule,scheduleOverrides,templates,history,calView,setCalView,calBase,setCalBase,calDetail,setCalDetail,onStartSession,isAdmin,onAddTemplate,onRemoveTemplate,onAddTemplateOverride,onRemoveTemplateOverride,onEditTemplateOverride}) => {
  const [showAddModal,setShowAddModal] = useState(false);
  const [selectedTpl,setSelectedTpl] = useState(null);
  const [editModalTpl,setEditModalTpl] = useState(null);
  const [editExercises,setEditExercises] = useState([]);
  const today=new Date(); today.setHours(0,0,0,0);
  const cc=CLIENT_COLORS[Math.max(0,clientIdx)%CLIENT_COLORS.length].text;
  const ov=scheduleOverrides||{};
  const getDayTpls=(date)=>{
    const n=calDayName(date);
    const iso=date.toISOString().slice(0,10);
    const recurring=schedule[n]||[];
    const ovEntry=calGetOvEntry(ov,iso);
    const allIds=[...new Set([...recurring,...ovEntry.ids])];
    return allIds.map(id=>{
      const tpl=templates.find(t=>t.id===id);
      if(!tpl) return null;
      if(ovEntry.edits[id]?.exercises) return {...tpl,exercises:ovEntry.edits[id].exercises,_edited:true};
      return tpl;
    }).filter(Boolean);
  };
  const isDone=(date)=>{ const iso=date.toISOString().slice(0,10); return history.some(s=>s.createdAt&&s.createdAt.slice(0,10)===iso); };
  const getDot=(date,other=false)=>isDone(date)?(other?null:cc):(getDayTpls(date).length>0?(other?"rgba(202,138,4,0.32)":"#e8d800"):null);
  const prev=()=>{ const d=new Date(calBase); if(calView==="weekly") d.setDate(d.getDate()-7); else{d.setDate(1);d.setMonth(d.getMonth()-1);} setCalBase(d); };
  const next=()=>{ const d=new Date(calBase); if(calView==="weekly") d.setDate(d.getDate()+7); else{d.setDate(1);d.setMonth(d.getMonth()+1);} setCalBase(d); };
  const closeModal=()=>{ setShowAddModal(false); setSelectedTpl(null); };
  const goToday=()=>{ setCalBase(new Date()); setCalView("weekly"); setCalDetail(null); closeModal(); };
  const calTitle=()=>{
    if(calView==="weekly"){
      const mon=calGetMonday(calBase), sun=new Date(mon); sun.setDate(mon.getDate()+6);
      const wk=calGetISOWeek(mon);
      if(mon.getMonth()===sun.getMonth()) return `${mon.getDate()} – ${sun.getDate()} ${CAT_MONTHS_FULL[sun.getMonth()].toLowerCase()} ${sun.getFullYear()} · Setmana ${wk}`;
      return `${mon.getDate()} ${CAT_MONTHS_SHORT_ARR[mon.getMonth()]} – ${sun.getDate()} ${CAT_MONTHS_SHORT_ARR[sun.getMonth()]} ${sun.getFullYear()} · Setmana ${wk}`;
    }
    return `${CAT_MONTHS_FULL[calBase.getMonth()]} ${calBase.getFullYear()}`;
  };
  const nb={background:"rgba(255,255,255,0.15)",border:"1.5px solid rgba(255,255,255,0.3)",color:"#ffffff",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:18,fontWeight:700,lineHeight:1};
  const vb=(a)=>a?{background:"#ffffff",color:"#1a3a6b",border:"1.5px solid #ffffff",borderRadius:8,padding:"6px 16px",fontSize:12,fontWeight:"600",cursor:"pointer"}:{background:"transparent",color:"#ffffff",border:"1.5px solid rgba(255,255,255,0.5)",borderRadius:8,padding:"6px 16px",fontSize:12,fontWeight:"500",cursor:"pointer"};
  const canEdit=!!(onAddTemplate||onRemoveTemplate);
  const modalInp={padding:"9px 12px",borderRadius:10,border:"1.5px solid #e2e8f0",fontSize:13,width:"100%",background:"#ffffff",color:"#0f172a",boxSizing:"border-box",outline:"none"};

  // ── Pantalla de detall ──────────────────────────────────────────────────────
  if(calDetail) {
    const dayName=calDayName(calDetail);
    const iso=calDetail.toISOString().slice(0,10);
    const dayTpls=getDayTpls(calDetail);
    const done=isDone(calDetail);
    const CAT_DAYS=["Diumenge","Dilluns","Dimarts","Dimecres","Dijous","Divendres","Dissabte"];
    const dayFull=CAT_DAYS[calDetail.getDay()];
    const dateLabel=`${calDetail.getDate()} ${CAT_MONTHS_SHORT_ARR[calDetail.getMonth()]}`;
    const recurringIds=schedule[dayName]||[];
    const ovEntryDay=calGetOvEntry(ov,iso);
    const overrideIdsDay=ovEntryDay.ids;
    const assignedIds=[...new Set([...recurringIds,...overrideIdsDay])];
    const availableTpls=templates.filter(t=>!assignedIds.includes(t.id));
    const handleRemove=(tpl)=>{
      if(!window.confirm(`Eliminar "${tpl.name}" de ${dayFull}?`)) return;
      if(overrideIdsDay.includes(tpl.id)) { onRemoveTemplateOverride&&onRemoveTemplateOverride(iso,tpl.id); }
      else { onRemoveTemplate&&onRemoveTemplate(dayName,tpl.id); }
    };
    const openEditModal=(tpl)=>{ setEditExercises(JSON.parse(JSON.stringify(tpl.exercises||[]))); setEditModalTpl(tpl); };

    return (
      <div>
        {/* Capçalera de detall */}
        <div style={{background:"#1a3a6b",padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
          <button style={{...nb,fontSize:13,padding:"6px 12px"}} onClick={()=>{setCalDetail(null);closeModal();}}>← Tornar al calendari</button>
          <div style={{color:"#ffffff",fontWeight:600,fontSize:15,flex:1}}>{dayFull}, {dateLabel}</div>
          {canEdit&&availableTpls.length>0&&(
            <button style={{background:"#e8d800",color:"#1a3a6b",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontWeight:700,fontSize:13}} onClick={()=>setShowAddModal(true)}>+ Afegir</button>
          )}
        </div>

        {/* Contingut */}
        <div style={{padding:"1rem 1.25rem"}}>
          {dayTpls.length===0?(
            <div style={{textAlign:"center",padding:"2.5rem 0",color:"#9ca3af"}}>
              <div style={{fontSize:36,marginBottom:10}}>🏖️</div>
              <div style={{fontWeight:600,fontSize:15,color:"#64748b",marginBottom:4}}>Dia de descans</div>
              <div style={{fontSize:13,marginBottom:20}}>No hi ha rutina assignada per a {dayFull.toLowerCase()}.</div>
              {canEdit&&availableTpls.length>0&&(
                <button style={{background:"#e8d800",color:"#1a3a6b",border:"none",borderRadius:10,fontWeight:700,fontSize:15,padding:"13px 20px",cursor:"pointer"}} onClick={()=>setShowAddModal(true)}>+ Afegir entrenament</button>
              )}
            </div>
          ):dayTpls.map(tpl=>(
            <div key={tpl.id} style={{background:"#ffffff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"1rem",marginBottom:12,boxShadow:"0 1px 4px rgba(26,58,107,0.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <div>
                  <div style={{fontWeight:700,fontSize:17,color:"#1a3a6b"}}>{tpl.name}</div>
                  <div style={{display:"flex",gap:6,marginTop:2,flexWrap:"wrap"}}>
                    {overrideIdsDay.includes(tpl.id)&&<div style={{fontSize:10,color:"#7c3aed"}}>📅 Només {dateLabel}</div>}
                    {tpl._edited&&<div style={{fontSize:10,color:"#0284c7"}}>✏️ Versió editada</div>}
                  </div>
                </div>
                {canEdit&&(
                  <div style={{display:"flex",gap:5,flexShrink:0,marginLeft:8}}>
                    <button style={{background:"#f0f9ff",color:"#0284c7",border:"1.5px solid #bae6fd",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:500}} onClick={()=>openEditModal(tpl)}>Editar sessió</button>
                    <button style={{background:"#fef2f2",color:"#dc2626",border:"1.5px solid #fca5a5",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:500}} onClick={()=>handleRemove(tpl)}>Eliminar</button>
                  </div>
                )}
              </div>
              {tpl.objective&&<div style={{fontSize:13,color:"#374151",marginBottom:8}}>{tpl.objective}</div>}
              <div style={{display:"flex",gap:12,marginBottom:12,fontSize:12,color:"#64748b"}}>
                {(tpl.exercises||[]).length>0&&<span>📋 {(tpl.exercises||[]).length} exercicis</span>}
                {tpl.estimatedDuration&&<span>⏱ {tpl.estimatedDuration}</span>}
              </div>
              {(tpl.exercises||[]).map((ex,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid #f1f5f9"}}>
                  <span style={{fontSize:11,color:"#94a3b8",width:20,flexShrink:0}}>{i+1}.</span>
                  <span style={{fontSize:13,color:"#0f172a",flex:1}}>{ex.name}</span>
                  <span style={{fontSize:11,color:"#64748b",flexShrink:0}}>{ex.plannedSets}×{ex.plannedReps}{ex.plannedLoad?` · ${ex.plannedLoad}`:""}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Botó afegir altra plantilla */}
          {canEdit&&dayTpls.length>0&&availableTpls.length>0&&(
            <button style={{background:"#f8fafc",color:"#1a3a6b",border:"1.5px solid #c7d2fe",borderRadius:10,padding:"10px 16px",width:"100%",cursor:"pointer",fontWeight:500,fontSize:13,marginBottom:12}} onClick={()=>setShowAddModal(true)}>+ Afegir altra plantilla a {dayFull}</button>
          )}

          {/* Botons sessió (client) */}
          {!isAdmin&&dayTpls.length>0&&(done?(
            <div>
              <div style={{background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:10,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20,lineHeight:1,color:"#4ade80"}}>✓</span>
                <span style={{color:"#16a34a",fontWeight:600,fontSize:14}}>Sessió ja completada</span>
              </div>
              <button style={{background:"#f8fafc",color:"#1a3a6b",border:"1.5px solid #c7d2fe",borderRadius:10,padding:"10px 16px",width:"100%",cursor:"pointer",fontWeight:500,fontSize:13}}>Veure detalls de la sessió</button>
            </div>
          ):(
            <button style={{background:"#e8d800",color:"#1a3a6b",border:"none",borderRadius:10,fontWeight:700,fontSize:15,padding:"13px 16px",cursor:"pointer",width:"100%",marginTop:4}} onClick={()=>onStartSession&&onStartSession(dayTpls[0],iso)}>
              Començar entrenament →
            </button>
          ))}
        </div>

        {/* Modal d'addició de plantilla */}
        {showAddModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={(e)=>{if(e.target===e.currentTarget)closeModal();}}>
            <div style={{background:"#ffffff",borderRadius:"20px 20px 0 0",padding:"1.5rem 1.25rem",maxWidth:520,width:"100%",maxHeight:"70vh",overflowY:"auto"}}>
              {selectedTpl ? (
                <>
                  <div style={{fontWeight:700,fontSize:16,color:"#1a3a6b",marginBottom:4}}>Com vols afegir-la?</div>
                  <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>Plantilla: <strong>{selectedTpl.name}</strong></div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <button style={{background:"#e8d800",color:"#1a3a6b",border:"none",borderRadius:12,padding:"14px 16px",cursor:"pointer",textAlign:"left"}} onClick={()=>{ onAddTemplate&&onAddTemplate(dayName,selectedTpl.id); closeModal(); }}>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>🔁 Tots els {dayFull}s</div>
                      <div style={{fontSize:12,opacity:0.8}}>S'assignarà de manera recurrent cada {dayFull.toLowerCase()}</div>
                    </button>
                    <button style={{background:"#f0f4ff",color:"#1a3a6b",border:"1.5px solid #c7d2fe",borderRadius:12,padding:"14px 16px",cursor:"pointer",textAlign:"left"}} onClick={()=>{ onAddTemplateOverride&&onAddTemplateOverride(iso,selectedTpl.id); closeModal(); }}>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>📅 Només el {dateLabel}</div>
                      <div style={{fontSize:12,color:"#64748b"}}>S'afegirà únicament per a aquesta data concreta</div>
                    </button>
                  </div>
                  <button style={{background:"#f1f5f9",color:"#374151",border:"none",borderRadius:10,padding:"10px 16px",width:"100%",cursor:"pointer",fontWeight:500,fontSize:13,marginTop:14}} onClick={()=>setSelectedTpl(null)}>← Tornar a la llista</button>
                </>
              ) : (
                <>
                  <div style={{fontWeight:700,fontSize:16,color:"#1a3a6b",marginBottom:16}}>Afegir plantilla a {dayFull}</div>
                  {availableTpls.length===0?(
                    <div style={{textAlign:"center",color:"#9ca3af",padding:"1rem 0",fontSize:13}}>No hi ha plantilles disponibles.</div>
                  ):availableTpls.map(tpl=>(
                    <div key={tpl.id} style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"0.85rem 1rem",marginBottom:10,cursor:"pointer"}} onClick={()=>setSelectedTpl(tpl)}>
                      <div style={{fontWeight:600,fontSize:14,color:"#1a3a6b",marginBottom:2}}>{tpl.name}</div>
                      {tpl.objective&&<div style={{fontSize:12,color:"#374151",marginBottom:4}}>{tpl.objective}</div>}
                      {tpl.estimatedDuration&&<div style={{fontSize:11,color:"#64748b"}}>⏱ {tpl.estimatedDuration}</div>}
                    </div>
                  ))}
                  <button style={{background:"#f1f5f9",color:"#374151",border:"none",borderRadius:10,padding:"10px 16px",width:"100%",cursor:"pointer",fontWeight:500,fontSize:13,marginTop:4}} onClick={closeModal}>Cancel·lar</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal d'edició d'exercicis de sessió */}
        {editModalTpl&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:110,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={(e)=>{if(e.target===e.currentTarget){setEditModalTpl(null);setEditExercises([]);}}}>
            <div style={{background:"#ffffff",borderRadius:"20px 20px 0 0",padding:"1.5rem 1.25rem",maxWidth:520,width:"100%",maxHeight:"85vh",overflowY:"auto"}}>
              <div style={{fontWeight:700,fontSize:16,color:"#1a3a6b",marginBottom:4}}>Editar sessió</div>
              <div style={{fontSize:13,color:"#64748b",marginBottom:16}}>{editModalTpl.name} · {dayFull}, {dateLabel}</div>
              {editExercises.map((ex,i)=>(
                <div key={i} style={{background:"#ffffff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"0.85rem 1rem",marginBottom:10}}>
                  <div style={{fontWeight:600,fontSize:13,color:"#1a3a6b",marginBottom:10}}>{i+1}. {ex.name}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                    <div style={{flex:1,minWidth:55}}>
                      <div style={{fontSize:11,color:"#64748b",marginBottom:3}}>Sèries</div>
                      <input style={modalInp} type="number" min="1" value={ex.plannedSets} onChange={e=>{const n=[...editExercises];n[i]={...n[i],plannedSets:+e.target.value||1};setEditExercises(n);}}/>
                    </div>
                    <div style={{flex:1,minWidth:55}}>
                      <div style={{fontSize:11,color:"#64748b",marginBottom:3}}>Reps</div>
                      <input style={modalInp} value={ex.plannedReps||""} onChange={e=>{const n=[...editExercises];n[i]={...n[i],plannedReps:e.target.value};setEditExercises(n);}}/>
                    </div>
                    <div style={{flex:1,minWidth:55}}>
                      <div style={{fontSize:11,color:"#64748b",marginBottom:3}}>Càrrega</div>
                      <input style={modalInp} value={ex.plannedLoad||""} onChange={e=>{const n=[...editExercises];n[i]={...n[i],plannedLoad:e.target.value};setEditExercises(n);}}/>
                    </div>
                    <div style={{flex:1,minWidth:55}}>
                      <div style={{fontSize:11,color:"#64748b",marginBottom:3}}>Descans</div>
                      <input style={modalInp} value={ex.plannedRest||""} onChange={e=>{const n=[...editExercises];n[i]={...n[i],plannedRest:e.target.value};setEditExercises(n);}}/>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:"#64748b",marginBottom:3}}>Observacions</div>
                    <textarea style={{...modalInp,minHeight:50,resize:"vertical"}} value={ex.observations||""} onChange={e=>{const n=[...editExercises];n[i]={...n[i],observations:e.target.value};setEditExercises(n);}}/>
                  </div>
                </div>
              ))}
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button style={{flex:1,background:"#f1f5f9",color:"#374151",border:"none",borderRadius:10,padding:"11px 16px",cursor:"pointer",fontWeight:500,fontSize:13}} onClick={()=>{setEditModalTpl(null);setEditExercises([]);}}>Cancel·lar</button>
                <button style={{flex:2,background:"#e8d800",color:"#1a3a6b",border:"none",borderRadius:10,fontWeight:700,fontSize:14,padding:"11px 16px",cursor:"pointer"}} onClick={()=>{onEditTemplateOverride&&onEditTemplateOverride(iso,editModalTpl.id,editExercises);setEditModalTpl(null);setEditExercises([]);}}>Guardar canvis</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Capçalera compartida ────────────────────────────────────────────────────
  const calHdr=(
    <div style={{background:"#1a3a6b",padding:"12px 16px",display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button style={nb} onClick={prev}>‹</button>
        <div style={{flex:1,textAlign:"center",color:"#ffffff",fontSize:12,fontWeight:600,lineHeight:1.4}}>{calTitle()}</div>
        <button style={nb} onClick={next}>›</button>
      </div>
      <div style={{display:"flex",gap:6,justifyContent:"center"}}>
        <button style={vb(calView==="weekly")} onClick={()=>setCalView("weekly")}>Setmana</button>
        <button style={vb(calView==="monthly")} onClick={()=>setCalView("monthly")}>Mes</button>
        <button style={vb(false)} onClick={goToday}>Avui</button>
      </div>
    </div>
  );

  // ── Vista setmanal ──────────────────────────────────────────────────────────
  if(calView==="weekly") {
    const mon=calGetMonday(calBase);
    const wDays=Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); return d; });
    const isMobile=window.innerWidth<600;
    const wContainerStyle=isMobile?{background:"#f1f5f9",overflowX:"auto",WebkitOverflowScrolling:"touch"}:{background:"#f1f5f9"};
    const wGridStyle=isMobile?{display:"flex",gap:3,padding:"6px 8px",minWidth:"max-content"}:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,padding:"6px 8px"};
    return (
      <div>
        {calHdr}
        <div style={wContainerStyle}>
          <div style={wGridStyle}>
            {wDays.map((date,i)=>{
              const tpls=getDayTpls(date); const d=getDot(date); const isT=calSameDate(date,today); const first=tpls[0];
              const cellBase={padding:"8px 3px",textAlign:"center",cursor:"pointer",border:isT?"1.5px solid #e8d800":"1.5px solid transparent",background:isT?"rgba(232,216,0,0.12)":"transparent",borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",gap:2,minHeight:92};
              const cellStyle=isMobile?{...cellBase,width:50,flexShrink:0}:cellBase;
              return (
                <div key={i} onClick={()=>setCalDetail(date)} style={cellStyle}>
                  <div style={{fontSize:10,color:"#64748b",fontWeight:600}}>{DAYS_SHORT[i]}</div>
                  <div style={{fontSize:21,fontWeight:700,color:isT?"#1a3a6b":"#0f172a",lineHeight:1}}>{date.getDate()}</div>
                  <div style={{fontSize:9,color:"#94a3b8"}}>{CAT_MONTHS_SHORT_ARR[date.getMonth()]}</div>
                  {d?<div style={{width:6,height:6,borderRadius:"50%",background:d,marginTop:1}}/>:<div style={{width:6,height:6,marginTop:1}}/>}
                  <div style={{fontSize:9,color:tpls.length>0?"#374151":"#9ca3af",lineHeight:1.2,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:"0 2px",marginTop:1}}>
                    {tpls.length>0?`${first.name}${first.estimatedDuration?` / ${first.estimatedDuration}`:""}`:"Descans"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Vista mensual ───────────────────────────────────────────────────────────
  const mY=calBase.getFullYear(), mM=calBase.getMonth();
  const mFirst=new Date(mY,mM,1), mLast=new Date(mY,mM+1,0);
  const startDow=mFirst.getDay()===0?6:mFirst.getDay()-1;
  const cells=[];
  for(let i=startDow;i>=1;i--) cells.push({date:new Date(mY,mM,1-i),other:true});
  for(let i=1;i<=mLast.getDate();i++) cells.push({date:new Date(mY,mM,i),other:false});
  const rem=(7-cells.length%7)%7; for(let i=1;i<=rem;i++) cells.push({date:new Date(mY,mM+1,i),other:true});
  return (
    <div>
      {calHdr}
      <div style={{padding:"8px 12px 12px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
          {DAYS_SHORT.map(dl=><div key={dl} style={{textAlign:"center",fontSize:11,color:"#64748b",fontWeight:500,padding:"4px 0"}}>{dl}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {cells.map(({date,other},i)=>{
            const isT=!other&&calSameDate(date,today); const d=getDot(date,other);
            return (
              <div key={i} onClick={()=>!other&&setCalDetail(date)} style={{textAlign:"center",padding:"3px 0",cursor:!other?"pointer":"default",borderRadius:8}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:isT?"#1a3a6b":"transparent",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto"}}>
                  <span style={{fontSize:13,fontWeight:isT?700:400,color:isT?"#ffffff":other?"#9ca3af":"#0f172a"}}>{date.getDate()}</span>
                </div>
                {d?<div style={{width:5,height:5,borderRadius:"50%",background:d,margin:"2px auto 0"}}/>:<div style={{height:7}}/>}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:12,paddingTop:10,borderTop:"1px solid #e2e8f0"}}>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#64748b"}}><div style={{width:7,height:7,borderRadius:"50%",background:cc}}/> Completada</div>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#64748b"}}><div style={{width:7,height:7,borderRadius:"50%",background:"#e8d800"}}/> Assignada</div>
        </div>
      </div>
    </div>
  );
};

const getClientAlerts = (stats) => {
  const alerts = [];
  const lastSession = stats.lastSession;
  const checkIn = lastSession?.checkIn || {};
  const pain = Number(checkIn.pain ?? -1);
  const rpe = Number(lastSession?.rpe || 0);
  const energy = Number(checkIn.energy || 0);
  const sleep = Number(checkIn.sleep || 0);
  const fatigue = Number(checkIn.fatigue || 0);
  const stress = Number(checkIn.stress || 0);

  // Danger
  if(pain >= 5) {
    const detail = checkIn.painZone ? `${checkIn.painZone} · ${pain}/10` : `${pain}/10`;
    alerts.push({type:"pain",label:"Dolor elevat",detail,severity:"danger"});
  }
  if(lastSession?.feeling==="Molèsties") {
    alerts.push({type:"feeling",label:"Molèsties",detail:"Última sessió",severity:"danger"});
  }

  // Warning
  if(rpe >= 8) {
    alerts.push({type:"rpe",label:"RPE alt",detail:`Última sessió: ${rpe}/10`,severity:"warning"});
  } else if(stats.avgRpeRecent != null && stats.avgRpeRecent >= 8) {
    alerts.push({type:"rpe",label:"RPE mitjà alt",detail:`Mitjana recent: ${stats.avgRpeRecent}`,severity:"warning"});
  }
  if(stats.weeklyInternalLoad != null && stats.weeklyInternalLoad >= 1000) {
    alerts.push({type:"load",label:"Càrrega alta",detail:`${stats.weeklyInternalLoad} UA aquesta setmana`,severity:"warning"});
  }
  const recoveryFactors = [];
  if(energy > 0 && energy <= 2) recoveryFactors.push(`energia ${energy}/5`);
  if(sleep > 0 && sleep <= 2) recoveryFactors.push(`son ${sleep}/5`);
  if(fatigue >= 4) recoveryFactors.push(`fatiga ${fatigue}/5`);
  if(stress >= 4) recoveryFactors.push(`estrès ${stress}/5`);
  if(recoveryFactors.length > 0 && lastSession?.checkIn?.completedAt) {
    alerts.push({type:"recovery",label:"Recuperació baixa",detail:recoveryFactors.join(" · "),severity:"warning"});
  }
  if(stats.totalSessions > 0 && stats.sessionsThisWeek === 0) {
    alerts.push({type:"inactive",label:"Sense activitat",detail:"Cap sessió en 7 dies",severity:"warning"});
  }

  // Info
  if(lastSession && (lastSession.completionPercentage ?? 100) < 100) {
    alerts.push({type:"partial",label:"Sessió parcial",detail:`${lastSession.completionPercentage || 0}% completat`,severity:"info"});
  }

  // Ordenar: danger primer, warning segon, info tercer
  const order = {danger:0,warning:1,info:2};
  return alerts.sort((a,b)=>order[a.severity]-order[b.severity]);
};

const getClientTrackingStats = (history) => {
  if(!history||history.length===0) return null;
  const now = new Date();
  const sorted = [...history].sort((a,b)=>{
    const da = a.createdAt||a.updatedAt||a.date||"";
    const db2 = b.createdAt||b.updatedAt||b.date||"";
    return da>db2?-1:1;
  });
  const daysAgo = (n) => new Date(now.getTime()-n*24*60*60*1000);
  const isWithin = (sess,days) => {
    const d = new Date(sess.createdAt||sess.updatedAt||"");
    return !isNaN(d)&&d>=daysAgo(days);
  };
  const thisWeek = sorted.filter(s=>isWithin(s,7));
  const last30 = sorted.filter(s=>isWithin(s,30));
  const safeNum = (v) => { const n=Number(v); return isNaN(n)?null:n; };
  const avg = (arr) => arr.length>0?Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10:null;

  const getLoad = (s) => s.internalLoad??calculateInternalLoad(s.durationReal,s.rpe);

  const weekLoads = thisWeek.map(getLoad).filter(l=>l!=null);
  const last30Loads = last30.map(getLoad).filter(l=>l!=null);
  const recentRpes = sorted.slice(0,5).map(s=>safeNum(s.rpe)).filter(v=>v!=null&&v>0);
  const recentPains = sorted.slice(0,5).map(s=>safeNum(s.checkIn?.pain)).filter(v=>v!=null&&v>=0);
  const recentEnergies = sorted.slice(0,5).map(s=>safeNum(s.checkIn?.energy)).filter(v=>v!=null&&v>0);
  const recentSleep = sorted.slice(0,5).map(s=>safeNum(s.checkIn?.sleep)).filter(v=>v!=null&&v>0);
  const recentStress = sorted.slice(0,5).map(s=>safeNum(s.checkIn?.stress)).filter(v=>v!=null&&v>0);
  const recentFatigue = sorted.slice(0,5).map(s=>safeNum(s.checkIn?.fatigue)).filter(v=>v!=null&&v>0);
  const weekDurations = thisWeek.map(s=>safeNum(s.durationReal)).filter(v=>v!=null&&v>0);
  const last30Durations = last30.map(s=>safeNum(s.durationReal)).filter(v=>v!=null&&v>0);
  const lastSess = sorted[0]||null;
  const lastCheckIn = lastSess?.checkIn||{};

  return {
    totalSessions:sorted.length,
    sessionsThisWeek:thisWeek.length,
    sessionsLast30Days:last30.length,
    weeklyInternalLoad:weekLoads.length>0?weekLoads.reduce((a,b)=>a+b,0):null,
    last30DaysInternalLoad:last30Loads.length>0?last30Loads.reduce((a,b)=>a+b,0):null,
    avgRpeRecent:avg(recentRpes),
    avgPainRecent:avg(recentPains),
    avgEnergyRecent:avg(recentEnergies),
    avgSleepRecent:avg(recentSleep),
    avgStressRecent:avg(recentStress),
    avgFatigueRecent:avg(recentFatigue),
    totalDurationThisWeek:weekDurations.length>0?weekDurations.reduce((a,b)=>a+b,0):null,
    totalDurationLast30Days:last30Durations.length>0?last30Durations.reduce((a,b)=>a+b,0):null,
    lastSession:lastSess,
    lastSessionDate:lastSess?.date||"",
    lastSessionTitle:lastSess?.sessionTitle||lastSess?.day||"",
    lastInternalLoad:lastSess?getLoad(lastSess):null,
    lastRpe:lastSess?.rpe||null,
    lastPain:lastCheckIn.pain!=null&&lastCheckIn.pain!==""?lastCheckIn.pain:null,
    lastPainZone:lastCheckIn.painZone||null,
    recentSessions:sorted.slice(0,5),
  };
};

// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlClient = urlParams.get("client");
  const urlAccess = urlParams.get("access");
  const urlIntake = urlParams.get("intake");
  const urlAdmin = urlParams.get("admin");
  const clienteInicial = urlClient ? parseInt(urlClient) : null;
  const isIntakeMode = urlIntake === "true";

  const storedToken = localStorage.getItem("tcn_access_token");
  const storedClientId = localStorage.getItem("tcn_client_id");
  // clientIdEfectiu s'usa com a fallback si no hi ha token
  const clientIdEfectiu = clienteInicial || (storedClientId ? parseInt(storedClientId) : null);
  // Mode inicial: si hi ha ?access o ?client o localStorage → "client", sinó public
  const hasInitialClient = !!(urlAccess || urlClient || storedToken || storedClientId);

  if(urlAdmin==="true") {
    localStorage.removeItem("tcn_access_token");
    localStorage.removeItem("tcn_client_id");
    localStorage.removeItem("tcn_access_mode");
  }

  const [mode, setMode] = useState(urlAdmin==="true" ? "pin" : hasInitialClient ? "client" : "public");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [selClient, setSelClient] = useState(clientIdEfectiu);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Admin
  const [adminClient, setAdminClient] = useState(null);
  const [adminView, setAdminView] = useState("clients");
  const [adminTab, setAdminTab] = useState("dades");
  const [clientHistories, setClientHistories] = useState({});
  const [selDay, setSelDay] = useState(TODAY);
  const [editingClient, setEditingClient] = useState(false);
  const [clientDraft, setClientDraft] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({name:"",goal:""});
  const [adminRoutineTab, setAdminRoutineTab] = useState("rutina");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingLibEx, setEditingLibEx] = useState(null);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [showAddLibEx, setShowAddLibEx] = useState(false);
  const [newTemplate, setNewTemplate] = useState({name:"",description:"",type:"Força",objective:"",estimatedDuration:"",exercises:[]});
  const [newLibEx, setNewLibEx] = useState({name:"",category:"Força",muscleGroup:"",movementPattern:"",material:"",defaultSets:3,defaultReps:"10",defaultLoad:"",defaultRest:"60s",instructions:"",observations:"",level:"Principiant"});
  const [expandedHistory, setExpandedHistory] = useState({});
  const [expandedClientCards, setExpandedClientCards] = useState({});
  const [clientSearch, setClientSearch] = useState("");
  const [calView, setCalView] = useState("weekly");
  const [calBase, setCalBase] = useState(new Date());
  const [calDetail, setCalDetail] = useState(null);
  const [adminCalView, setAdminCalView] = useState("weekly");
  const [adminCalBase, setAdminCalBase] = useState(new Date());
  const [adminCalDetail, setAdminCalDetail] = useState(null);

  // Client
  const [clientViewTab, setClientViewTab] = useState("entrenament");
  const [sessionExercises, setSessionExercises] = useState({});
  const [expandedExercises, setExpandedExercises] = useState({});
  const [showAddExModal, setShowAddExModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishForm, setFinishForm] = useState({rpe:"",duration:"",feeling:"",notes:""});
  const [addExTab, setAddExTab] = useState("biblioteca");
  const [customExForm, setCustomExForm] = useState({name:"",sets:3,reps:"10",load:"",rest:"60s",notes:""});
  const [checkInForm, setCheckInForm] = useState({energy:"",sleep:"",stress:"",fatigue:"",pain:"",painZone:"",notes:""});
  const [stdCompleted, setStdCompleted] = useState({});

  // Intake
  const [intakeForm, setIntakeForm] = useState({name:"",age:"",email:"",phone:"",profession:"",goal:"",secondaryGoal:"",threeMonthGoal:"",priority:"",sport:"",sportYears:"",sportLevel:"",strengthExperience:"",physicalPreparationExperience:"",currentTraining:"",competitions:"",injuries:"",currentPain:"",painZone:"",avoidEx:"",healthNotes:"",availability:"",sessionDuration:"",place:"",material:"",preferredSchedule:"",matchDays:"",likes:"",dislikes:"",trainingPreferences:"",extraNotes:"",source:"",referredBy:""});
  const [intakeSubmitted, setIntakeSubmitted] = useState(false);
  const [intakeError, setIntakeError] = useState("");
  const [intakeSubmissions, setIntakeSubmissions] = useState([]);
  const [viewingIntake, setViewingIntake] = useState(null);

  const [showRpeInfo, setShowRpeInfo] = useState(false);

  // History edit
  const [editingHistorySession, setEditingHistorySession] = useState(null);
  const [editingHistoryClientId, setEditingHistoryClientId] = useState(null);
  const [editingHistorySessionId, setEditingHistorySessionId] = useState(null);
  const [editHistoryAddEx, setEditHistoryAddEx] = useState(false);
  const [editHistoryNewEx, setEditHistoryNewEx] = useState({name:"",sets:3,reps:"10",load:"",rest:"60s",observations:""});

  const cfStyle = `@keyframes cfPop{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(-60px) rotate(360deg);opacity:0}}`;

  useEffect(()=>{
    if(clienteInicial) {
      localStorage.setItem("tcn_client_id", String(clienteInicial));
      localStorage.setItem("tcn_access_mode", "client");
    }
    loadData();
    loadIntakeSubmissions();
  },[]);// eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{ document.title="TrainConcerNow App"; },[]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{ if(data?.clients) loadAllClientHistories(data.clients); },[data?.clients?.length]);

  // ── Data helpers ──────────────────────────────────────────────────────────
  const IGNASI_NOU_ID = 1779623480215;
  const IGNASI_NOU_LIBRARY = [
    {id:"ign_jj",name:"Jumping jacks",category:"Activació",muscleGroup:"Cos complet",movementPattern:"Cardio",material:"Cap",defaultSets:1,defaultReps:"15",defaultLoad:"",defaultRest:"15s",instructions:"Versió tranquil·la: sense salt, obre braços mentre separes un peu cap al costat.",observations:"",level:"Principiant"},
    {id:"ign_cbf",name:"Cercles de braços endavant",category:"Activació",muscleGroup:"Espatlles",movementPattern:"Mobilitat",material:"Cap",defaultSets:1,defaultReps:"10",defaultLoad:"",defaultRest:"10s",instructions:"Primeres 4 reps lentes amb rang ampli. Últimes 4-6 reps augmenta la velocitat.",observations:"",level:"Principiant"},
    {id:"ign_cba",name:"Cercles de braços enrere",category:"Activació",muscleGroup:"Espatlles",movementPattern:"Mobilitat",material:"Cap",defaultSets:1,defaultReps:"10",defaultLoad:"",defaultRest:"10s",instructions:"Primeres 4 reps lentes amb rang ampli. Últimes 4-6 reps augmenta la velocitat.",observations:"",level:"Principiant"},
    {id:"ign_cm",name:"Cercles de maluc",category:"Activació",muscleGroup:"Maluc",movementPattern:"Mobilitat",material:"Cap",defaultSets:1,defaultReps:"8",defaultLoad:"",defaultRest:"10s",instructions:"8 reps sentit horari + 8 reps antihorari.",observations:"reps/costat",level:"Principiant"},
    {id:"ign_flex",name:"Flexions al llit (amb genolls)",category:"Força",muscleGroup:"Pectoral",movementPattern:"Push horitzontal",material:"Llit",defaultSets:2,defaultReps:"12",defaultLoad:"",defaultRest:"20s",instructions:"Esterilla al terra davant dels peus del llit. Baixa poc a poc fins tocar el pit amb el matalàs.",observations:"",level:"Principiant"},
    {id:"ign_trx",name:"Rem a la cintura (TRX)",category:"Força",muscleGroup:"Esquena",movementPattern:"Pull horitzontal",material:"TRX",defaultSets:2,defaultReps:"12",defaultLoad:"",defaultRest:"20s",instructions:"Cos alineat. Colzes enganxats al cos. Baixa lentament i puja amb força.",observations:"",level:"Principiant"},
    {id:"ign_squat",name:"Squat (sentadilles)",category:"Força",muscleGroup:"Quàdriceps / Glutis",movementPattern:"Squat",material:"Cap",defaultSets:2,defaultReps:"12",defaultLoad:"",defaultRest:"20s",instructions:"Esquena recta. Genolls alineats amb els peus. Baixa controlat.",observations:"",level:"Principiant"},
    {id:"ign_elev",name:"Elevacions alternes amb manuelles",category:"Força",muscleGroup:"Deltoides",movementPattern:"Push lateral",material:"Manuelles",defaultSets:2,defaultReps:"12",defaultLoad:"",defaultRest:"20s",instructions:"Un braç s'eleva lateralment i l'altre frontalment. Alterna a cada rep.",observations:"",level:"Principiant"},
    {id:"ign_pont",name:"Pont de glutis",category:"Força",muscleGroup:"Glutis",movementPattern:"Hip hinge",material:"Cap",defaultSets:2,defaultReps:"10",defaultLoad:"",defaultRest:"20s",instructions:"Estirat a terra, genolls flexionats. Eleva malucs activant bé el gluti.",observations:"",level:"Principiant"},
    {id:"ign_plank",name:'Planxa "Tuki Tuki"',category:"Core",muscleGroup:"Core",movementPattern:"Antiextensió",material:"Cap",defaultSets:2,defaultReps:"20",defaultLoad:"",defaultRest:"20s",instructions:"En planxa, toca l'espatlla contrària alternant mans. Cadera estàtica.",observations:"",level:"Principiant"},
  ];
  const IGNASI_NOU_TEMPLATE = {
    id:"tpl_circuit_ignasi",name:"Circuit Ignasi",description:"Activació + Circuit de Força",type:"Força",
    objective:"Entrenament complet a casa · 10-15'",estimatedDuration:"10-15 min",
    exercises:[
      {id:"tex_ign_1",exerciseId:"ign_jj",name:"Jumping jacks",plannedSets:1,plannedReps:"15",plannedLoad:"",plannedRest:"15s",observations:"Versió tranquil·la: sense salt",order:1},
      {id:"tex_ign_2",exerciseId:"ign_cbf",name:"Cercles de braços endavant",plannedSets:1,plannedReps:"10",plannedLoad:"",plannedRest:"10s",observations:"",order:2},
      {id:"tex_ign_3",exerciseId:"ign_cba",name:"Cercles de braços enrere",plannedSets:1,plannedReps:"10",plannedLoad:"",plannedRest:"10s",observations:"",order:3},
      {id:"tex_ign_4",exerciseId:"ign_cm",name:"Cercles de maluc",plannedSets:1,plannedReps:"8",plannedLoad:"",plannedRest:"10s",observations:"reps/costat",order:4},
      {id:"tex_ign_5",exerciseId:"ign_flex",name:"Flexions al llit (amb genolls)",plannedSets:2,plannedReps:"12",plannedLoad:"",plannedRest:"20s",observations:"",order:5},
      {id:"tex_ign_6",exerciseId:"ign_trx",name:"Rem a la cintura (TRX)",plannedSets:2,plannedReps:"12",plannedLoad:"",plannedRest:"20s",observations:"",order:6},
      {id:"tex_ign_7",exerciseId:"ign_squat",name:"Squat (sentadilles)",plannedSets:2,plannedReps:"12",plannedLoad:"",plannedRest:"20s",observations:"",order:7},
      {id:"tex_ign_8",exerciseId:"ign_elev",name:"Elevacions alternes amb manuelles",plannedSets:2,plannedReps:"12",plannedLoad:"",plannedRest:"20s",observations:"",order:8},
      {id:"tex_ign_9",exerciseId:"ign_pont",name:"Pont de glutis",plannedSets:2,plannedReps:"10",plannedLoad:"",plannedRest:"20s",observations:"",order:9},
      {id:"tex_ign_10",exerciseId:"ign_plank",name:'Planxa "Tuki Tuki"',plannedSets:2,plannedReps:"20",plannedLoad:"",plannedRest:"20s",observations:"",order:10},
    ],
  };

  const seedIgnasiNou = async (currentData) => {
    const ignasi = currentData.clients.find(c=>c.id===IGNASI_NOU_ID);
    if(!ignasi) return null;
    const alreadySeeded = ignasi.exerciseLibrary?.length>0 || ignasi.templates?.length>0;
    if(alreadySeeded) return null;
    const updatedClients = currentData.clients.map(c=>
      c.id===IGNASI_NOU_ID ? {...c, exerciseLibrary:IGNASI_NOU_LIBRARY, templates:[IGNASI_NOU_TEMPLATE]} : c
    );
    const nd = {...currentData, clients:updatedClients};
    try { await set(ref(db,"fitcoach-data2"),nd); } catch {}
    return nd;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dr,cr,asr] = await Promise.all([
        get(ref(db,"fitcoach-data2")),
        get(ref(db,"fitcoach-completed")),
        get(ref(db,"active-sessions")),
      ]);
      const loadedData = dr.exists() ? dr.val() : DEFAULT_DATA;
      const seeded = await seedIgnasiNou(loadedData);
      const finalData = seeded || loadedData;

      // Migrar clients sense accessToken
      let dataUpdated = false;
      const usedTokens = new Set();
      const migratedClients = finalData.clients.map(c=>{
        if(c.accessToken && !usedTokens.has(c.accessToken)) { usedTokens.add(c.accessToken); return c; }
        const token = generateAccessToken();
        usedTokens.add(token);
        dataUpdated = true;
        return {...c, accessToken: token};
      });
      const finalDataWithTokens = dataUpdated ? {...finalData, clients:migratedClients} : finalData;
      if(dataUpdated) { set(ref(db,"fitcoach-data2"),finalDataWithTokens).catch(()=>{}); }
      setData(finalDataWithTokens);

      // Resoldre accés per ?access=TOKEN
      if(urlAccess) {
        const clientByToken = finalDataWithTokens.clients.find(c=>c.accessToken===urlAccess);
        if(clientByToken) {
          localStorage.setItem("tcn_access_token", urlAccess);
          localStorage.setItem("tcn_client_id", String(clientByToken.id));
          localStorage.setItem("tcn_access_mode", "client");
          setSelClient(clientByToken.id);
          setMode("client");
        } else {
          localStorage.removeItem("tcn_access_token");
          localStorage.removeItem("tcn_client_id");
          localStorage.removeItem("tcn_access_mode");
          setSelClient(null);
          setMode("public");
        }
      } else if(storedToken && !clienteInicial) {
        // Resoldre per token guardat
        const clientByToken = finalDataWithTokens.clients.find(c=>c.accessToken===storedToken);
        if(clientByToken) {
          setSelClient(clientByToken.id);
          setMode("client");
        } else {
          localStorage.removeItem("tcn_access_token");
          localStorage.removeItem("tcn_client_id");
          localStorage.removeItem("tcn_access_mode");
          setSelClient(null);
          setMode("public");
        }
      }
      setStdCompleted(cr.exists() ? cr.val() : {});
      if(asr.exists()) {
        const activeSessions = asr.val();
        const today = new Date().toISOString().slice(0,10);
        const recovered = {};
        Object.entries(activeSessions).forEach(([clientId, sessions])=>{
          Object.entries(sessions).forEach(([key, sess])=>{
            if(sess && sess.date===today && sess.status==="in_progress") {
              recovered[`${sess.clientId}-${sess.day}`] = sess;
            }
          });
        });
        if(Object.keys(recovered).length>0) setSessionExercises(recovered);
      }
    } catch { setData(DEFAULT_DATA); }
    setLoading(false);
  };

  const loadIntakeSubmissions = async () => {
    try {
      const snap = await get(ref(db,"intake-submissions"));
      if(snap.exists()) {
        const arr = Object.values(snap.val()).sort((a,b)=>b.createdAt>a.createdAt?1:-1);
        setIntakeSubmissions(arr);
      } else { setIntakeSubmissions([]); }
    } catch { setIntakeSubmissions([]); }
  };

  const loadAllClientHistories = async (clients) => {
    try {
      const entries = await Promise.all(
        clients.map(async (c) => {
          const id = normalizeClientId(c.id);
          try {
            const h = await get(ref(db,`history-${id}`));
            const val = h.exists() ? h.val() : null;
            const arr = val ? (Array.isArray(val) ? val : Object.values(val)) : [];
            return [id, arr];
          } catch { return [id, []]; }
        })
      );
      setClientHistories(p => {
        const updated = {...p};
        entries.forEach(([id, hist]) => { updated[id] = hist; });
        return updated;
      });
    } catch {}
  };

  const persist = async (nd) => { setSaving(true); try { await set(ref(db,"fitcoach-data2"),nd); } catch(err) { console.error("Error guardant a Firebase:", err); } setSaving(false); };
  // eslint-disable-next-line no-unused-vars
  const persistStdCompleted = async (c) => { try { await set(ref(db,"fitcoach-completed"),c); } catch {} };
  const updateData = (d) => { setData(d); persist(d); };

  const isStdDone = (cid,day,exId) => !!stdCompleted[`${cid}-${day}-${exId}`];

  const getTodayISO = () => new Date().toISOString().slice(0,10);
  const saveActiveSession = async (clientId, day, session) => {
    const key = `${getTodayISO()}-${day}`;
    try { await set(ref(db,`active-sessions/${clientId}/${key}`), {...session, updatedAt: new Date().toISOString()}); } catch {}
  };
  const deleteActiveSession = async (clientId, day) => {
    const key = `${getTodayISO()}-${day}`;
    try { await set(ref(db,`active-sessions/${clientId}/${key}`), null); } catch {}
  };

  const persistClientHistory = async (clientId, history) => {
    const id = normalizeClientId(clientId);
    const path = `history-${id}`;
    if(!Array.isArray(history)) history = [];
    try {
      if(history.length===0) {
        await remove(ref(db,path));
      } else {
        const obj = history.reduce((a,s,i)=>({...a,[i]:s}),{});
        await set(ref(db,path),obj);
      }
      console.log("Historial guardat OK per client", id, "sessions:", history.length);
    } catch(err) {
      console.error("Error guardant historial per client", id, err);
      throw err;
    }
  };

  const deleteHistorySession = async (clientId, sessionId) => {
    if(!window.confirm("Segur que vols eliminar aquesta sessió de l'historial?")) return;
    const id = normalizeClientId(clientId);
    const current = clientHistories[id]||[];
    const updated = current.filter((s,idx)=>(s.id||`${id}-${idx}`)!==sessionId);
    setClientHistories(p=>({...p,[id]:updated}));
    await persistClientHistory(id, updated);
  };

  const loadClientHistory = async (clientId) => {
    const id = normalizeClientId(clientId);
    try {
      const h = await get(ref(db,`history-${id}`));
      const val = h.exists() ? h.val() : null;
      const arr = val ? (Array.isArray(val) ? val : Object.values(val)) : [];
      console.log("Historial carregat per client", id, "sessions:", arr.length);
      setClientHistories(p=>({...p,[id]:arr}));
    } catch(err) {
      console.error("Error carregant historial per client", id, err);
      setClientHistories(p=>({...p,[id]:[]}));
    }
  };

  const recalcSession = (session) => {
    const exercises = (session.exercises||[]).map(e=>{
      const sets = Array.isArray(e.sets) ? e.sets : Object.values(e.sets||{});
      const completedSets = sets.filter(st=>st.completed).length;
      const completed = sets.length>0 && completedSets===sets.length;
      return {...e, sets, completedSets, completed};
    });
    const totalExercises = exercises.length;
    const completedExercises = exercises.filter(e=>e.completed).length;
    const completionPercentage = totalExercises>0 ? Math.round((completedExercises/totalExercises)*100) : 0;
    return {...session, exercises, totalExercises, completedExercises, completionPercentage, internalLoad:calculateInternalLoad(session.durationReal, session.rpe), updatedAt: new Date().toISOString()};
  };

  const openEditHistorySession = (clientId, session, sessionId) => {
    setEditingHistoryClientId(clientId);
    setEditingHistorySessionId(sessionId);
    setEditingHistorySession(JSON.parse(JSON.stringify(session)));
    setEditHistoryAddEx(false);
    setEditHistoryNewEx({name:"",sets:3,reps:"10",load:"",rest:"60s",observations:""});
  };

  const saveEditedHistorySession = async () => {
    if(!editingHistoryClientId||!editingHistorySession) return;
    const id = normalizeClientId(editingHistoryClientId);
    const recalculated = recalcSession(editingHistorySession);
    const current = clientHistories[id]||[];
    const updated = current.map((s,idx)=>{
      const sid = s.id||`${id}-${idx}`;
      return sid===editingHistorySessionId ? recalculated : s;
    });
    setClientHistories(p=>({...p,[id]:updated}));
    await persistClientHistory(id, updated);
    setEditingHistorySession(null);
    setEditingHistoryClientId(null);
    setEditingHistorySessionId(null);
  };

  const getClientTemplates = (clientId) => data.clients.find(c=>c.id===clientId)?.templates||[];
  const getClientLibrary = (clientId) => data.clients.find(c=>c.id===clientId)?.exerciseLibrary||[];
  const getClientSchedule = (clientId) => data.clients.find(c=>c.id===clientId)?.schedule||DAYS.reduce((a,d)=>({...a,[d]:[]}),{});
  const updateClientTemplates = (clientId, tpls) => setData(prev => { const nd={...prev,clients:prev.clients.map(c=>c.id===clientId?{...c,templates:tpls}:c)}; persist(nd); return nd; });
  const updateClientLibrary   = (clientId, lib)  => setData(prev => { const nd={...prev,clients:prev.clients.map(c=>c.id===clientId?{...c,exerciseLibrary:lib}:c)}; persist(nd); return nd; });
  const updateClientSchedule  = (clientId, sch)  => setData(prev => { const nd={...prev,clients:prev.clients.map(c=>c.id===clientId?{...c,schedule:sch}:c)}; persist(nd); return nd; });
  const getClientScheduleOverrides = (clientId) => data.clients.find(c=>c.id===clientId)?.scheduleOverrides||{};
  const updateClientScheduleOverrides = (clientId, ov) => setData(prev => { const nd={...prev,clients:prev.clients.map(c=>c.id===clientId?{...c,scheduleOverrides:ov}:c)}; persist(nd); return nd; });

  const selectAdminClient = (id) => {
    const sid = normalizeClientId(id);
    setAdminClient(id);
    setAdminTab("dades");
    setEditingClient(false);
    setAdminView("clientDetail");
    // Forçar recàrrega sempre (eliminar cache per veure sessions noves)
    setClientHistories(p => {
      const np = {...p};
      delete np[sid];
      return np;
    });
    loadClientHistory(sid);
  };

  const getClientDashboardStats = (client) => {
    const history = (clientHistories[client.id]||[]).slice().sort((a,b)=>(a.createdAt||"")>(b.createdAt||"")?-1:1);
    const now = new Date();
    const isThisWeek = (s) => { const d=new Date(s.createdAt||s.updatedAt||""); return !isNaN(d)&&(now-d)/(1000*60*60*24)<=7; };
    const sessionsThisWeek = history.filter(isThisWeek);
    const lastSession = history[0]||null;
    const recentRpes = history.slice(0,5).map(s=>s.rpe).filter(r=>r!=null&&r!=="");
    const avgRpeRecent = recentRpes.length>0 ? Math.round((recentRpes.reduce((a,b)=>a+Number(b),0)/recentRpes.length)*10)/10 : null;
    const totalDurationThisWeek = sessionsThisWeek.reduce((a,s)=>a+(Number(s.durationReal)||0),0);
    const lastCompletion = lastSession?.completionPercentage??100;
    const lastFeeling = lastSession?.feeling||null;
    let status = "Sense historial";
    if(history.length>0) {
      if(lastFeeling==="Molèsties") status="Molèsties";
      else if(avgRpeRecent!=null&&avgRpeRecent>=8) status="RPE alt";
      else if(lastCompletion<100) status="Sessió parcial";
      else if(sessionsThisWeek.length>0) status="Actiu";
      else status="Sense activitat";
    }
    const weeklyLoads = sessionsThisWeek.map(s=>getSessionInternalLoad(s)).filter(l=>l!=null);
    const weeklyInternalLoad = weeklyLoads.length>0 ? weeklyLoads.reduce((a,b)=>a+b,0) : null;
    const recentLoads = history.slice(0,5).map(s=>getSessionInternalLoad(s)).filter(l=>l!=null);
    const avgInternalLoadRecent = recentLoads.length>0 ? Math.round(recentLoads.reduce((a,b)=>a+b,0)/recentLoads.length) : null;
    const lastInternalLoad = lastSession ? getSessionInternalLoad(lastSession) : null;
    return {history,totalSessions:history.length,sessionsThisWeek:sessionsThisWeek.length,lastSession,lastFeeling,avgRpeRecent,lastCompletion,totalDurationThisWeek,weeklyInternalLoad,avgInternalLoadRecent,lastInternalLoad,templatesCount:client.templates?.length||0,libraryCount:client.exerciseLibrary?.length||0,trainingDaysCount:Object.values(client.schedule||{}).filter(d=>Array.isArray(d)&&d.length>0).length,status};
  };

  const saveStdSession = async (clientId, day, exercises, formData) => {
    const id = normalizeClientId(clientId);
    const now = new Date();
    const dateStr = now.toLocaleDateString("ca-ES");
    const sessionId = `completed_${id}_${now.getTime()}`;
    const existing = clientHistories[id]||[];
    if(existing.find(s=>s.id===sessionId)) return;
    const completedExs = exercises.filter(e=>e.sets?e.sets.every(st=>st.completed):isStdDone(clientId,day,e.id));
    const total = exercises.length||1;
    const record = {
      id:sessionId, date:dateStr, day, clientId:id,
      sessionTitle:formData.templateName||`Entrenament ${day}`,
      completedExercises:completedExs.length, totalExercises:exercises.length,
      completionPercentage:Math.round((completedExs.length/total)*100),
      exercises:exercises.map(e=>({
        name:e.name, plannedSets:e.plannedSets||e.sets?.length||0,
        plannedReps:e.plannedReps||e.reps||"", plannedLoad:e.plannedLoad||"",
        sets:(e.sets||[]).map(st=>({reps:st.reps||"",load:st.load||"",rest:st.rest||"",completed:st.completed||false})),
        completedSets:(e.sets||[]).filter(st=>st.completed).length,
        completed:e.sets?e.sets.every(st=>st.completed):isStdDone(clientId,day,e.id),
        isExtra:e.isExtra||false, isCustom:e.isCustom||false, observations:e.observations||"",
      })),
      rpe:formData.rpe||null, durationReal:formData.duration||null,
      internalLoad:calculateInternalLoad(formData.duration, formData.rpe),
      feeling:formData.feeling||null, clientNotes:formData.notes||"",
      checkIn:formData.checkIn||null,
      createdAt:now.toISOString(), updatedAt:now.toISOString(),
    };
    const updated = [record,...existing].slice(0,100);
    setClientHistories(p=>({...p,[id]:updated}));
    await persistClientHistory(id, updated);
    return true;
  };

  // ── Access helpers ────────────────────────────────────────────────────────
  const getClientAccessLink = (client) => {
    if(!client) return window.location.origin+window.location.pathname;
    const token = typeof client === "object" ? client.accessToken : null;
    const id = typeof client === "object" ? client.id : client;
    if(token) return `${window.location.origin}${window.location.pathname}?access=${token}`;
    return `${window.location.origin}${window.location.pathname}?client=${id}`;
  };
  const getClientInviteMessage = (client) => {
    const link = getClientAccessLink(client);
    const firstName = client.name?.split(" ")[0]||"";
    return `Hola ${firstName}! Ja tens activa la teva zona d'entrenament a TrainConcerNow 💪\n\nPots accedir des d'aquest enllaç:\n${link}`;
  };
  const copyToClipboard = async (text, msg="Copiat!") => {
    try { await navigator.clipboard.writeText(text); alert(msg); }
    catch { window.prompt("Copia aquest text:",text); }
  };

  // ── Intake ────────────────────────────────────────────────────────────────
  const submitIntakeForm = async () => {
    if(!intakeForm.name.trim()||!intakeForm.goal.trim()||(!intakeForm.email.trim()&&!intakeForm.phone.trim())) {
      setIntakeError("Completa com a mínim nom, objectiu i una forma de contacte."); return;
    }
    setIntakeError("");
    const id = `intake_${Date.now()}`;
    const now = new Date().toISOString();
    const submission = {id,status:"pending",createdAt:now,updatedAt:now,convertedAt:"",convertedClientId:"",rejectedAt:"",rejectedReason:"",data:intakeForm};
    try { await set(ref(db,`intake-submissions/${id}`),submission); setIntakeSubmitted(true); }
    catch { setIntakeError("Error en enviar. Torna-ho a intentar."); }
  };

  const convertIntakeToClient = async (submission) => {
    const form = submission.data;
    const existing = data.clients.find(c=>(form.email&&c.email===form.email)||(form.phone&&c.phone===form.phone)||(c.name===form.name));
    if(existing&&!window.confirm(`Potser "${existing.name}" ja existeix. Vols crear-lo igualment?`)) return;
    const id = Date.now();
    const avatar = form.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    const newClient = {
      id,name:form.name||"Nou client",goal:form.goal||"",avatar,routineType:"weekly",
      age:form.age||"",email:form.email||"",phone:form.phone||"",profession:form.profession||"",
      secondaryGoal:form.secondaryGoal||"",threeMonthGoal:form.threeMonthGoal||"",
      sport:form.sport||"",sportYears:form.sportYears||"",sportLevel:form.sportLevel||"",
      strengthExperience:form.strengthExperience||"",currentTraining:form.currentTraining||"",
      competitions:form.competitions||"",level:form.sportLevel||"principiant",
      place:form.place||"",material:form.material||"",
      availability:form.availability||"",sessionDuration:form.sessionDuration||"",
      preferredSchedule:form.preferredSchedule||"",matchDays:form.matchDays||"",
      injuries:form.injuries||"",currentPain:form.currentPain||"",painZone:form.painZone||"",
      avoidEx:form.avoidEx||"",healthNotes:form.healthNotes||"",
      likes:form.likes||"",dislikes:form.dislikes||"",trainingPreferences:form.trainingPreferences||"",
      extraNotes:form.extraNotes||"",source:form.source||"",referredBy:form.referredBy||"",
      coachNotes:"",onboardingNotes:form.extraNotes||"",createdFromIntake:true,
      intakeSubmissionId:submission.id,status:"new",
      startDate:new Date().toLocaleDateString("ca-ES"),
      templates:[],exerciseLibrary:[],
      schedule:{Dilluns:[],Dimarts:[],Dimecres:[],Dijous:[],Divendres:[],Dissabte:[],Diumenge:[]},
      accessToken:generateAccessToken(),
    };
    const emptyRoutine = DAYS.reduce((a,d)=>({...a,[d]:[]}),{});
    updateData({...data,clients:[...data.clients,newClient],routines:{...data.routines,[id]:emptyRoutine}});
    const updated = {...submission,status:"converted",convertedAt:new Date().toISOString(),convertedClientId:id,updatedAt:new Date().toISOString()};
    await set(ref(db,`intake-submissions/${submission.id}`),updated);
    setIntakeSubmissions(p=>p.map(s=>s.id===submission.id?updated:s));
    setViewingIntake(null);
    const link = getClientAccessLink(newClient);
    const msg = `Hola ${newClient.name.split(" ")[0]}! Ja tens activa la teva zona d'entrenament a TrainConcerNow 💪\n\nPots accedir des d'aquest enllaç:\n${link}`;
    try { await navigator.clipboard.writeText(msg); } catch {}
    alert(`Client "${newClient.name}" creat correctament!\n\nMissatge d'invitació copiat al portapapers ✓\n\nEnllaç: ${link}`);
  };

  const rejectIntakeSubmission = async (submission) => {
    if(!window.confirm("Segur que vols rebutjar aquesta sol·licitud?")) return;
    const updated = {...submission,status:"rejected",rejectedAt:new Date().toISOString(),rejectedReason:"",updatedAt:new Date().toISOString()};
    await set(ref(db,`intake-submissions/${submission.id}`),updated);
    setIntakeSubmissions(p=>p.map(s=>s.id===submission.id?updated:s));
    setViewingIntake(null);
  };

  const deleteIntakeSubmission = async (submissionId) => {
    if(!window.confirm("Segur que vols eliminar aquesta sol·licitud?")) return;
    await remove(ref(db,`intake-submissions/${submissionId}`));
    setIntakeSubmissions(p=>p.filter(s=>s.id!==submissionId));
  };

  const addClient = () => {
    if(!newClientForm.name) return;
    const id = Date.now();
    const avatar = newClientForm.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
    const newC = {id,name:newClientForm.name,goal:newClientForm.goal,avatar,routineType:"weekly",age:"",level:"principiant",place:"gimnàs",material:"",injuries:"",currentPain:"",avoidEx:"",likes:"",dislikes:"",coachNotes:"",startDate:new Date().toLocaleDateString("ca-ES"),templates:[],exerciseLibrary:[],schedule:DAYS.reduce((a,d)=>({...a,[d]:[]}),{}),accessToken:generateAccessToken()};
    updateData({...data,clients:[...data.clients,newC],routines:{...data.routines,[id]:DAYS.reduce((a,d)=>({...a,[d]:[]}),{})}});
    setNewClientForm({name:"",goal:""});
    setShowAddClient(false);
    selectAdminClient(id);
  };

  // ── INTAKE FORM ──────────────────────────────────────────────────────────
  if(isIntakeMode||mode==="intake") {
    if(intakeSubmitted) return (
      <div style={{...S.wrap,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
        <div style={{textAlign:"center",padding:"2rem 1.25rem"}}>
          <div style={{fontSize:56,marginBottom:16}}>✅</div>
          <div style={{fontWeight:500,fontSize:20,color:T.accent,marginBottom:8}}>Formulari enviat!</div>
          <div style={{fontSize:14,color:T.textSecondary,lineHeight:1.6}}>T'hem rebut correctament la informació. Revisarem les teves respostes i prepararem la teva fitxa.</div>
        </div>
      </div>
    );
    const IF = intakeForm;
    const setIF = (k,v) => setIntakeForm(p=>({...p,[k]:v}));
    const SectionTitle = ({children}) => <div style={S.formSectionTitle}>{children}</div>;
    return (
      <div style={S.wrap}>
        <style>{`input::placeholder, textarea::placeholder { color: #94a3b8 !important; opacity: 1; }`}</style>
        <div style={S.formHeader}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <img src="/logotcn.PNG" alt="TrainConcerNow" style={{width:40,height:40,objectFit:"contain"}}/>
            <div style={{fontWeight:700,fontSize:18,color:T.headerText}}>Formulari inicial</div>
          </div>
        </div>
        <div style={{padding:"1rem 1.25rem 0.5rem"}}>
          <div style={{fontWeight:700,fontSize:13,color:T.headerBg,marginBottom:4}}>Respon aquestes preguntes per poder adaptar millor el teu entrenament.</div>
        <div style={{padding:"0.5rem 1.25rem 3rem"}}>
          <SectionTitle>Dades personals</SectionTitle>
          <div style={{marginBottom:10}}><label style={S.formLbl}>Nom i cognoms *</label><input style={S.formInp} value={IF.name} onChange={e=>setIF("name",e.target.value)} placeholder="Ex. Marc Pérez"/></div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}><label style={S.formLbl}>Edat</label><input style={S.formInp} type="number" value={IF.age} onChange={e=>setIF("age",e.target.value)} placeholder="28"/></div>
            <div style={{flex:2}}><label style={S.formLbl}>Email *</label><input style={S.formInp} type="email" value={IF.email} onChange={e=>setIF("email",e.target.value)} placeholder="correu@email.com"/></div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}><label style={S.formLbl}>Telèfon</label><input style={S.formInp} value={IF.phone} onChange={e=>setIF("phone",e.target.value)} placeholder="600 000 000"/></div>
            <div style={{flex:1}}><label style={S.formLbl}>Professió</label><input style={S.formInp} value={IF.profession} onChange={e=>setIF("profession",e.target.value)} placeholder="Ex. Oficinista"/></div>
          </div>
          <SectionTitle>Objectius</SectionTitle>
          <div style={{marginBottom:10}}>
            <label style={S.formLbl}>Objectiu principal *</label>
            <select style={S.formInp} value={IF.goal} onChange={e=>setIF("goal",e.target.value)}>
              <option value="">Selecciona...</option>
              {["Pèrdua de greix","Guany de massa muscular","Millora de força","Rendiment esportiu","Preparació física per esport","Readaptació / tornada a l'esport","Prevenció de lesions","Salut general","Altres"].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{marginBottom:10}}><label style={S.formLbl}>Objectiu secundari</label><input style={S.formInp} value={IF.secondaryGoal} onChange={e=>setIF("secondaryGoal",e.target.value)} placeholder="Ex. Guanyar força"/></div>
          <div style={{marginBottom:10}}><label style={S.formLbl}>Què t'agradaria aconseguir en 3 mesos?</label><textarea style={{...S.formInp,minHeight:60,resize:"vertical"}} value={IF.threeMonthGoal} onChange={e=>setIF("threeMonthGoal",e.target.value)} placeholder="Descriu el teu objectiu a curt termini..."/></div>
          <SectionTitle>Experiència esportiva</SectionTitle>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:2}}><label style={S.formLbl}>Esport principal</label><input style={S.formInp} value={IF.sport} onChange={e=>setIF("sport",e.target.value)} placeholder="Ex. Pàdel"/></div>
            <div style={{flex:1}}><label style={S.formLbl}>Anys practicant</label><input style={S.formInp} value={IF.sportYears} onChange={e=>setIF("sportYears",e.target.value)} placeholder="10"/></div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}>
              <label style={S.formLbl}>Nivell esportiu</label>
              <select style={S.formInp} value={IF.sportLevel} onChange={e=>setIF("sportLevel",e.target.value)}>
                <option value="">Selecciona...</option>
                {["Principiant","Intermedi","Avançat","Competidor","Professional"].map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={{flex:1}}><label style={S.formLbl}>Anys a gimnàs / força</label><input style={S.formInp} value={IF.strengthExperience} onChange={e=>setIF("strengthExperience",e.target.value)} placeholder="4 anys"/></div>
          </div>
          <div style={{marginBottom:10}}><label style={S.formLbl}>Entrenament actual (descriu una setmana típica)</label><textarea style={{...S.formInp,minHeight:60,resize:"vertical"}} value={IF.currentTraining} onChange={e=>setIF("currentTraining",e.target.value)} placeholder="Ex. 2 partits de pàdel i 2 dies de gimnàs"/></div>
          <div style={{marginBottom:10}}><label style={S.formLbl}>Competicions o partits setmanals</label><input style={S.formInp} value={IF.competitions} onChange={e=>setIF("competitions",e.target.value)} placeholder="Ex. 1-2 partits/setmana"/></div>
          <SectionTitle>Salut i molèsties</SectionTitle>
          <div style={{marginBottom:10}}><label style={S.formLbl}>Lesions prèvies</label><textarea style={{...S.formInp,minHeight:60,resize:"vertical"}} value={IF.injuries} onChange={e=>setIF("injuries",e.target.value)} placeholder="Ex. Esguinç de turmell fa 2 anys"/></div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}><label style={S.formLbl}>Dolor actual</label><input style={S.formInp} value={IF.currentPain} onChange={e=>setIF("currentPain",e.target.value)} placeholder="Ex. Cap / lumbar"/></div>
            <div style={{flex:1}}><label style={S.formLbl}>Zona de dolor</label><input style={S.formInp} value={IF.painZone} onChange={e=>setIF("painZone",e.target.value)} placeholder="Ex. Espatlla dreta"/></div>
          </div>
          <div style={{marginBottom:10}}><label style={S.formLbl}>Exercicis o moviments a evitar</label><input style={S.formInp} value={IF.avoidEx} onChange={e=>setIF("avoidEx",e.target.value)} placeholder="Ex. Sentadilla profunda"/></div>
          <div style={{marginBottom:10}}><label style={S.formLbl}>Altres notes de salut</label><textarea style={{...S.formInp,minHeight:50,resize:"vertical"}} value={IF.healthNotes} onChange={e=>setIF("healthNotes",e.target.value)} placeholder="Qualsevol informació addicional..."/></div>
          <SectionTitle>Logística</SectionTitle>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}><label style={S.formLbl}>Dies per setmana</label><input style={S.formInp} value={IF.availability} onChange={e=>setIF("availability",e.target.value)} placeholder="Ex. 3-4 dies"/></div>
            <div style={{flex:1}}><label style={S.formLbl}>Durada per sessió</label><input style={S.formInp} value={IF.sessionDuration} onChange={e=>setIF("sessionDuration",e.target.value)} placeholder="Ex. 45-60 min"/></div>
          </div>
          <div style={{marginBottom:10}}>
            <label style={S.lbl}>Quins dies tens disponibilitat?</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
              {DAYS.map(d=>{
                const sel=(IF.matchDays||"").split(",").map(s=>s.trim()).filter(Boolean).includes(d);
                return (
                  <button key={d} type="button" onClick={()=>{
                    const current=(IF.matchDays||"").split(",").map(s=>s.trim()).filter(Boolean);
                    const updated=sel?current.filter(x=>x!==d):[...current,d];
                    setIF("matchDays",updated.join(", "));
                  }} style={{padding:"7px 12px",borderRadius:10,fontSize:12,cursor:"pointer",border:`1.5px solid ${sel?T.accent:T.border}`,background:sel?T.accent:T.card2,color:sel?T.bg:T.textSecondary,fontWeight:sel?500:400}}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <label style={S.formLbl}>Lloc d'entrenament</label>
            <select style={S.formInp} value={IF.place} onChange={e=>setIF("place",e.target.value)}>
              <option value="">Selecciona...</option>
              {["Gimnàs","Casa","Exterior","Pista","Altres"].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}><label style={S.formLbl}>Material disponible</label><input style={S.formInp} value={IF.material} onChange={e=>setIF("material",e.target.value)} placeholder="Ex. Mancuernes, gomes..."/></div>
            <div style={{flex:1}}><label style={S.formLbl}>Horaris preferits</label><input style={S.formInp} value={IF.preferredSchedule} onChange={e=>setIF("preferredSchedule",e.target.value)} placeholder="Ex. Matins"/></div>
          </div>
          <SectionTitle>Preferències</SectionTitle>
          <div style={{marginBottom:10}}><label style={S.formLbl}>Exercicis que t'agraden</label><input style={S.formInp} value={IF.likes} onChange={e=>setIF("likes",e.target.value)} placeholder="Ex. Rem, dominades, força..."/></div>
          <div style={{marginBottom:10}}><label style={S.formLbl}>Exercicis que no t'agraden</label><input style={S.formInp} value={IF.dislikes} onChange={e=>setIF("dislikes",e.target.value)} placeholder="Ex. Burpees..."/></div>
          <div style={{marginBottom:10}}><label style={S.formLbl}>Tipus d'entrenament que prefereixes</label><input style={S.formInp} value={IF.trainingPreferences} onChange={e=>setIF("trainingPreferences",e.target.value)} placeholder="Ex. Força, circuits, funcional..."/></div>
          <div style={{marginBottom:10}}><label style={S.formLbl}>Comentaris addicionals</label><textarea style={{...S.formInp,minHeight:60,resize:"vertical"}} value={IF.extraNotes} onChange={e=>setIF("extraNotes",e.target.value)} placeholder="Qualsevol cosa que vulguis afegir..."/></div>
          <SectionTitle>Com ens has trobat?</SectionTitle>
          <div style={{marginBottom:10}}>
            <select style={S.formInp} value={IF.source} onChange={e=>setIF("source",e.target.value)}>
              <option value="">Selecciona...</option>
              {["Recomanació","Instagram","Internet / Google","Club esportiu","Client actual","Amic/familiar","Altres"].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {(IF.source==="Recomanació"||IF.source==="Client actual"||IF.source==="Amic/familiar")&&(
            <div style={{marginBottom:10}}><label style={S.formLbl}>Qui t'ha recomanat?</label><input style={S.formInp} value={IF.referredBy} onChange={e=>setIF("referredBy",e.target.value)} placeholder="Nom de la persona"/></div>
          )}
          {intakeError&&<div style={{background:T.dangerBg,border:`1.5px solid ${T.danger}40`,borderRadius:10,padding:"10px 12px",marginBottom:12,fontSize:13,color:T.danger}}>{intakeError}</div>}
          <button style={{...S.btnPrimary,padding:"14px",marginTop:16}} onClick={submitIntakeForm}>Enviar formulari</button>
        </div>
      </div>
    </div>
    );
  }

  if(loading) return (
    <div style={{...S.wrap,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,border:`3px solid ${T.border}`,borderTop:`3px solid ${T.accent}`,borderRadius:"50%",margin:"0 auto 16px",animation:"spin 0.8s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{color:T.textSecondary,fontSize:13}}>Carregant...</div>
      </div>
    </div>
  );

  // ── EDIT HISTORY SESSION ──────────────────────────────────────────────────
  if(editingHistorySession) {
    const sess = editingHistorySession;
    const updateSess = (field,value) => setEditingHistorySession(p=>({...p,[field]:value}));
    const updateEx = (ei,field,value) => setEditingHistorySession(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,[field]:value}:e)}));
    const updateSt = (ei,si,field,value) => setEditingHistorySession(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:e.sets.map((st,j)=>j===si?{...st,[field]:value}:st)}:e)}));
    const addSt = (ei) => setEditingHistorySession(p=>({...p,exercises:p.exercises.map((e,i)=>{
      if(i!==ei) return e;
      const last=e.sets[e.sets.length-1];
      return {...e,sets:[...e.sets,{reps:last?.reps||e.plannedReps||"",load:last?.load||e.plannedLoad||"",rest:last?.rest||e.plannedRest||"",completed:false}]};
    })}));
    const removeSt = (ei,si) => setEditingHistorySession(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:e.sets.filter((_,j)=>j!==si)}:e)}));
    const removeEx = (ei) => { if(window.confirm("Segur que vols eliminar aquest exercici?")) setEditingHistorySession(p=>({...p,exercises:p.exercises.filter((_,i)=>i!==ei)})); };
    const histLib = getClientLibrary(editingHistoryClientId);
    return (
      <div style={S.wrap}>
        <style>{cfStyle}</style>
        <div style={{position:"sticky",top:0,background:T.card,borderBottom:`1.5px solid ${T.border}`,padding:"1rem 1.25rem",zIndex:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:500,fontSize:16,color:T.textPrimary}}>Editar sessió</div>
          <button style={S.btnSecondary} onClick={()=>{setEditingHistorySession(null);setEditingHistoryClientId(null);setEditingHistorySessionId(null);}}>Cancel·lar</button>
        </div>
        <div style={{padding:"1rem 1.25rem"}}>
          <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Dades generals</div>
          <div style={{marginBottom:8}}><label style={S.lbl}>Títol</label><input style={S.inp} value={sess.sessionTitle||""} onChange={e=>updateSess("sessionTitle",e.target.value)}/></div>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <div style={{flex:1}}><label style={S.lbl}>Data</label><input style={S.inp} value={sess.date||""} onChange={e=>updateSess("date",e.target.value)}/></div>
            <div style={{flex:1}}><label style={S.lbl}>Dia</label><input style={S.inp} value={sess.day||""} onChange={e=>updateSess("day",e.target.value)}/></div>
          </div>
          <div style={{marginBottom:8}}>
            <label style={S.lbl}>RPE (1-10)</label>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[1,2,3,4,5,6,7,8,9,10].map(n=>{
                const c=getRpeColor(n);
                const sel=sess.rpe===n;
                return <button key={n} onClick={()=>updateSess("rpe",n)} style={{width:36,height:36,borderRadius:8,border:`2px solid ${sel?c.text:T.border}`,background:sel?c.bg:T.card2,color:sel?c.text:T.textSecondary,cursor:"pointer",fontSize:12,fontWeight:sel?600:400}}>{n}</button>;
              })}
            </div>
            {sess.rpe&&<div style={{fontSize:11,color:T.textSecondary,marginTop:4}}>{sess.rpe} — {getRpeLabel(sess.rpe)}</div>}
          </div>
          <div style={{marginBottom:8,background:T.card2,borderRadius:8,padding:"8px 12px",fontSize:12,color:T.textSecondary}}>
            Càrrega interna estimada: <span style={{color:T.textPrimary,fontWeight:500}}>{calculateInternalLoad(sess.durationReal,sess.rpe)!=null?`${calculateInternalLoad(sess.durationReal,sess.rpe)} UA`:"—"}</span>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <div style={{flex:1}}><label style={S.lbl}>Durada (min)</label><input style={S.inp} type="number" value={sess.durationReal||""} onChange={e=>updateSess("durationReal",e.target.value)} placeholder="45"/></div>
          </div>
          <div style={{marginBottom:8}}>
            <label style={S.lbl}>Sensació</label>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[["😄","Molt bé"],["🙂","Bé"],["😐","Normal"],["😓","Cansat"],["😣","Molèsties"]].map(([emoji,label])=>(
                <button key={label} onClick={()=>updateSess("feeling",label)} style={{padding:"5px 9px",borderRadius:8,border:`1.5px solid ${sess.feeling===label?T.accent:T.border}`,background:sess.feeling===label?T.accent:T.card2,color:sess.feeling===label?T.bg:T.textSecondary,cursor:"pointer",fontSize:11}}>{emoji} {label}</button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:16}}><label style={S.lbl}>Notes finals</label><textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={sess.clientNotes||""} onChange={e=>updateSess("clientNotes",e.target.value)}/></div>
          <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Check-in inicial</div>
          {[{key:"energy",label:"Energia",max:5},{key:"sleep",label:"Son",max:5},{key:"stress",label:"Estrès",max:5},{key:"fatigue",label:"Fatiga muscular",max:5}].map(({key,label,max})=>(
            <div key={key} style={{marginBottom:10}}>
              <label style={S.lbl}>{label} {(sess.checkIn||{})[key]?`${(sess.checkIn||{})[key]}/${max}`:""}</label>
              <div style={{display:"flex",gap:5}}>
                {Array.from({length:max},(_,i)=>i+1).map(n=>(
                  <button key={n} onClick={()=>updateSess("checkIn",{...(sess.checkIn||{}),[key]:String(n)})} style={{width:34,height:34,borderRadius:8,border:`1.5px solid ${Number((sess.checkIn||{})[key])===n?T.accent:T.border}`,background:Number((sess.checkIn||{})[key])===n?T.accent:T.card2,color:Number((sess.checkIn||{})[key])===n?T.bg:T.textSecondary,cursor:"pointer",fontSize:12}}>{n}</button>
                ))}
              </div>
            </div>
          ))}
          <div style={{marginBottom:10}}>
            <label style={S.lbl}>Dolor actual</label>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {Array.from({length:11},(_,i)=>i).map(n=>(
                <button key={n} onClick={()=>updateSess("checkIn",{...(sess.checkIn||{}),pain:String(n)})} style={{width:32,height:32,borderRadius:8,border:`1.5px solid ${Number((sess.checkIn||{}).pain)===n&&(sess.checkIn||{}).pain!==""?T.accent:T.border}`,background:Number((sess.checkIn||{}).pain)===n&&(sess.checkIn||{}).pain!==""?T.accent:T.card2,color:Number((sess.checkIn||{}).pain)===n&&(sess.checkIn||{}).pain!==""?T.bg:T.textSecondary,cursor:"pointer",fontSize:11}}>{n}</button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:10}}><label style={S.lbl}>Zona de dolor</label><input style={S.inp} value={(sess.checkIn||{}).painZone||""} onChange={e=>updateSess("checkIn",{...(sess.checkIn||{}),painZone:e.target.value})}/></div>
          <div style={{marginBottom:16}}><label style={S.lbl}>Notes inicials</label><textarea style={{...S.inp,minHeight:50,resize:"vertical"}} value={(sess.checkIn||{}).notes||""} onChange={e=>updateSess("checkIn",{...(sess.checkIn||{}),notes:e.target.value})}/></div>
          <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Exercicis</div>
          {(sess.exercises||[]).map((ex,ei)=>(
            <div key={ei} style={{...S.card,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{flex:1}}><input style={{...S.inp,fontWeight:500}} value={ex.name||""} onChange={e=>updateEx(ei,"name",e.target.value)}/></div>
                <button style={{...S.btnDanger,marginLeft:8}} onClick={()=>removeEx(ei)}>×</button>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                <div style={{flex:1}}><label style={S.lbl}>Reps plan.</label><input style={S.inp} value={ex.plannedReps||""} onChange={e=>updateEx(ei,"plannedReps",e.target.value)}/></div>
                <div style={{flex:1}}><label style={S.lbl}>Càrrega plan.</label><input style={S.inp} value={ex.plannedLoad||""} onChange={e=>updateEx(ei,"plannedLoad",e.target.value)}/></div>
                <div style={{flex:1}}><label style={S.lbl}>Descans plan.</label><input style={S.inp} value={ex.plannedRest||""} onChange={e=>updateEx(ei,"plannedRest",e.target.value)}/></div>
              </div>
              <div style={{marginBottom:8}}><label style={S.lbl}>Observacions</label><input style={S.inp} value={ex.observations||""} onChange={e=>updateEx(ei,"observations",e.target.value)}/></div>
              <div style={{fontSize:11,fontWeight:500,color:T.textSecondary,marginBottom:6}}>Sèries</div>
              {(ex.sets||[]).map((st,si)=>(
                <div key={si} style={{background:T.card2,borderRadius:8,padding:"8px 10px",marginBottom:5,border:`1.5px solid ${st.completed?T.accent:T.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                    <button onClick={()=>updateSt(ei,si,"completed",!st.completed)} style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${st.completed?T.accent:T.border}`,background:st.completed?T.accent:T.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {st.completed&&<svg viewBox="0 0 16 16" width="11" height="11"><polyline points="3,8 7,12 13,4" fill="none" stroke={T.bg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <span style={{fontSize:12,color:T.textPrimary,fontWeight:500}}>S{si+1}</span>
                    <button onClick={()=>removeSt(ei,si)} style={{marginLeft:"auto",width:18,height:18,borderRadius:"50%",border:"none",background:T.dangerBg,color:T.danger,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    <div style={{flex:1}}><label style={S.lbl}>Reps</label><input style={S.inp} value={st.reps||""} onChange={e=>updateSt(ei,si,"reps",e.target.value)}/></div>
                    <div style={{flex:1}}><label style={S.lbl}>Càrrega</label><input style={S.inp} value={st.load||""} onChange={e=>updateSt(ei,si,"load",e.target.value)}/></div>
                    <div style={{flex:1}}><label style={S.lbl}>Descans</label><input style={S.inp} value={st.rest||""} onChange={e=>updateSt(ei,si,"rest",e.target.value)}/></div>
                  </div>
                </div>
              ))}
              <button style={{...S.btnSecondary,width:"100%",textAlign:"center",fontSize:11,marginTop:4}} onClick={()=>addSt(ei)}>+ Afegir sèrie</button>
            </div>
          ))}
          {editHistoryAddEx ? (
            <div style={{background:"#1A1A24",border:"1.5px solid #E8FF4740",borderRadius:14,padding:"0.9rem",marginBottom:10}}>
              <div style={{display:"flex",gap:0,marginBottom:12,borderBottom:`1.5px solid ${T.border}`}}>
                {[["biblioteca","📚 Biblioteca"],["custom","✏️ Nou exercici"]].map(([tab,label])=>(
                  <button key={tab} onClick={()=>setEditHistoryNewEx(p=>({...p,_tab:tab}))} style={{padding:"6px 12px",fontSize:11,cursor:"pointer",background:"none",border:"none",borderBottom:`2px solid ${(editHistoryNewEx._tab||"biblioteca")===tab?T.accent:"transparent"}`,color:(editHistoryNewEx._tab||"biblioteca")===tab?T.accent:T.textSecondary,marginBottom:-1}}>{label}</button>
                ))}
              </div>
              {(editHistoryNewEx._tab||"biblioteca")==="biblioteca"&&(
                <>
                  <div style={{fontSize:12,color:T.textSecondary,marginBottom:8}}>Tria un exercici de la biblioteca</div>
                  {histLib.length===0&&<div style={{fontSize:12,color:T.textMuted,textAlign:"center",padding:"1rem 0"}}>La biblioteca està buida</div>}
                  {histLib.map(libEx=>(
                    <div key={libEx.id} style={{...S.card,cursor:"pointer",padding:"0.6rem 0.8rem"}} onClick={()=>{
                      const numSets=libEx.defaultSets||1;
                      const newEx={id:`hist_lib_${Date.now()}`,exerciseId:libEx.id,name:libEx.name,plannedSets:numSets,plannedReps:libEx.defaultReps||"",plannedLoad:libEx.defaultLoad||"",plannedRest:libEx.defaultRest||"",observations:libEx.instructions||"",isExtra:true,isCustom:false,sets:Array.from({length:numSets},()=>({reps:libEx.defaultReps||"",load:libEx.defaultLoad||"",rest:libEx.defaultRest||"",completed:false}))};
                      setEditingHistorySession(p=>({...p,exercises:[...(p.exercises||[]),newEx]}));
                      setEditHistoryAddEx(false);
                      setEditHistoryNewEx({name:"",sets:3,reps:"10",load:"",rest:"60s",observations:""});
                    }}>
                      <div style={{fontWeight:500,fontSize:13,color:T.textPrimary}}>{libEx.name}</div>
                      <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{libEx.category} · {libEx.muscleGroup} · {libEx.defaultSets}×{libEx.defaultReps}</div>
                    </div>
                  ))}
                </>
              )}
              {(editHistoryNewEx._tab||"biblioteca")==="custom"&&(
                <>
                  <div style={{marginBottom:8}}><label style={S.lbl}>Nom *</label><input style={S.inp} value={editHistoryNewEx.name||""} onChange={e=>setEditHistoryNewEx(p=>({...p,name:e.target.value}))}/></div>
                  <div style={{display:"flex",gap:6,marginBottom:8}}>
                    <div style={{flex:1}}><label style={S.lbl}>Sèries</label><input style={S.inp} type="number" value={editHistoryNewEx.sets||3} onChange={e=>setEditHistoryNewEx(p=>({...p,sets:e.target.value}))}/></div>
                    <div style={{flex:1}}><label style={S.lbl}>Reps</label><input style={S.inp} value={editHistoryNewEx.reps||""} onChange={e=>setEditHistoryNewEx(p=>({...p,reps:e.target.value}))}/></div>
                  </div>
                  <div style={{display:"flex",gap:6,marginBottom:8}}>
                    <div style={{flex:1}}><label style={S.lbl}>Càrrega</label><input style={S.inp} value={editHistoryNewEx.load||""} onChange={e=>setEditHistoryNewEx(p=>({...p,load:e.target.value}))}/></div>
                    <div style={{flex:1}}><label style={S.lbl}>Descans</label><input style={S.inp} value={editHistoryNewEx.rest||""} onChange={e=>setEditHistoryNewEx(p=>({...p,rest:e.target.value}))}/></div>
                  </div>
                  <div style={{marginBottom:10}}><label style={S.lbl}>Observacions</label><input style={S.inp} value={editHistoryNewEx.observations||""} onChange={e=>setEditHistoryNewEx(p=>({...p,observations:e.target.value}))}/></div>
                  <button style={{...S.btnPrimary,padding:"10px",fontSize:13}} onClick={()=>{
                    if(!(editHistoryNewEx.name||"").trim()) return;
                    const numSets=Number(editHistoryNewEx.sets)||1;
                    const newEx={id:`hist_custom_${Date.now()}`,exerciseId:null,name:(editHistoryNewEx.name||"").trim(),plannedSets:numSets,plannedReps:editHistoryNewEx.reps||"",plannedLoad:editHistoryNewEx.load||"",plannedRest:editHistoryNewEx.rest||"",observations:editHistoryNewEx.observations||"",isExtra:true,isCustom:true,sets:Array.from({length:numSets},()=>({reps:editHistoryNewEx.reps||"",load:editHistoryNewEx.load||"",rest:editHistoryNewEx.rest||"",completed:false}))};
                    setEditingHistorySession(p=>({...p,exercises:[...(p.exercises||[]),newEx]}));
                    setEditHistoryAddEx(false);
                    setEditHistoryNewEx({name:"",sets:3,reps:"10",load:"",rest:"60s",observations:""});
                  }}>Afegir</button>
                </>
              )}
              <button style={{...S.btnSecondary,width:"100%",textAlign:"center",fontSize:12,marginTop:10}} onClick={()=>{setEditHistoryAddEx(false);setEditHistoryNewEx({name:"",sets:3,reps:"10",load:"",rest:"60s",observations:""});}}>Cancel·lar</button>
            </div>
          ):(
            <button style={{...S.btnSecondary,width:"100%",textAlign:"center",fontSize:12,marginBottom:16}} onClick={()=>setEditHistoryAddEx(true)}>+ Afegir exercici</button>
          )}
          <button style={{...S.btnPrimary,padding:"13px"}} onClick={saveEditedHistorySession}>Guardar canvis</button>
        </div>
      </div>
    );
  }

  // ── VIEWING INTAKE ────────────────────────────────────────────────────────
  if(viewingIntake) {
    const sub = viewingIntake;
    const d = sub.data||{};
    const Row = ({label,value}) => value ? <div style={{marginBottom:8}}><div style={{fontSize:11,color:T.textSecondary}}>{label}</div><div style={{fontSize:13,color:T.textPrimary}}>{value}</div></div> : null;
    const SecT = ({children}) => <div style={{fontSize:11,fontWeight:500,color:T.accent,textTransform:"uppercase",letterSpacing:"0.5px",marginTop:16,marginBottom:8}}>{children}</div>;
    return (
      <div style={S.wrap}>
        <div style={{position:"sticky",top:0,background:T.card,borderBottom:`1.5px solid ${T.border}`,padding:"1rem 1.25rem",zIndex:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:500,fontSize:16,color:T.textPrimary}}>{d.name||"Sol·licitud"}</div>
          <button style={S.btnSecondary} onClick={()=>setViewingIntake(null)}>Tancar</button>
        </div>
        <div style={{padding:"1rem 1.25rem"}}>
          <SecT>Dades personals</SecT>
          <Row label="Nom" value={d.name}/><Row label="Edat" value={d.age}/><Row label="Email" value={d.email}/><Row label="Telèfon" value={d.phone}/><Row label="Professió" value={d.profession}/>
          <SecT>Objectius</SecT>
          <Row label="Objectiu principal" value={d.goal}/><Row label="Objectiu secundari" value={d.secondaryGoal}/><Row label="Objectiu 3 mesos" value={d.threeMonthGoal}/>
          <SecT>Experiència esportiva</SecT>
          <Row label="Esport" value={d.sport}/><Row label="Anys practicant" value={d.sportYears}/><Row label="Nivell" value={d.sportLevel}/><Row label="Experiència força" value={d.strengthExperience}/><Row label="Entrenament actual" value={d.currentTraining}/><Row label="Competicions" value={d.competitions}/>
          <SecT>Salut i molèsties</SecT>
          <Row label="Lesions prèvies" value={d.injuries}/><Row label="Dolor actual" value={d.currentPain}/><Row label="Zona de dolor" value={d.painZone}/><Row label="Exercicis a evitar" value={d.avoidEx}/><Row label="Notes de salut" value={d.healthNotes}/>
          <SecT>Logística</SecT>
          <Row label="Dies disponibles" value={d.availability}/><Row label="Quins dies" value={d.matchDays}/><Row label="Durada sessió" value={d.sessionDuration}/><Row label="Lloc" value={d.place}/><Row label="Material" value={d.material}/><Row label="Horaris" value={d.preferredSchedule}/>
          <SecT>Preferències</SecT>
          <Row label="Li agraden" value={d.likes}/><Row label="No li agraden" value={d.dislikes}/><Row label="Preferències" value={d.trainingPreferences}/><Row label="Notes extra" value={d.extraNotes}/>
          <SecT>Origen</SecT>
          <Row label="Com ens ha trobat" value={d.source}/><Row label="Recomanat per" value={d.referredBy}/>
          <div style={{display:"flex",gap:8,marginTop:20}}>
            <button style={{...S.btnSecondary,flex:1,fontSize:12}} onClick={()=>rejectIntakeSubmission(sub)}>Rebutjar</button>
            <button style={{...S.btnPrimary,flex:2,padding:"12px",fontSize:13}} onClick={()=>convertIntakeToClient(sub)}>✓ Crear client</button>
          </div>
        </div>
      </div>
    );
  }

  // ── SELECT ────────────────────────────────────────────────────────────────
  // Verificar si el client guardat encara existeix
  if(mode==="client" && data && selClient) {
    const clientExisteix = data.clients.find(c=>c.id===selClient);
    if(!clientExisteix) {
      localStorage.removeItem("tcn_client_id");
      localStorage.removeItem("tcn_access_mode");
      return (
        <div style={{...S.wrap,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
          <div style={{textAlign:"center",padding:"2rem 1.25rem"}}>
            <img src="/logotcn.PNG" alt="TrainConcerNow" style={{width:180,maxWidth:"80%",margin:"0 auto 24px",display:"block"}}/>
            <div style={{fontSize:18,fontWeight:500,color:T.danger,marginBottom:8}}>Accés no disponible</div>
            <div style={{fontSize:14,color:T.textSecondary,lineHeight:1.6,marginBottom:24}}>Aquest accés ja no està disponible. Demana un nou enllaç al teu preparador.</div>
            <button style={{...S.btnSecondary,fontSize:13}} onClick={()=>{setSelClient(null);setMode("public");}}>Tornar</button>
          </div>
        </div>
      );
    }
  }

  if(mode==="public"||mode==="select"||!data?.clients) return (
    <div style={{...S.wrap,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:T.headerBg,color:T.headerText}}>
      <style>{cfStyle}</style>
      <div style={{textAlign:"center",padding:"2rem 1.25rem 1.5rem"}}>
        <img src="/logotcn.PNG" alt="TrainConcerNow" style={{width:220,maxWidth:"85%",margin:"0 auto 20px",display:"block"}}/>
        <div style={{fontSize:16,fontWeight:700,color:T.headerText,marginBottom:8}}>Accés no configurat</div>
        <div style={{fontSize:13,color:T.accentDim,lineHeight:1.6,marginBottom:32}}>Obre l'enllaç que t'ha enviat el teu preparador.</div>
        <button style={{...S.btnPrimary,maxWidth:280,margin:"0 auto 12px",background:T.accent,color:T.headerBg}} onClick={()=>setMode("intake")}>📋 Formulari inicial</button>
      </div>
    </div>
  );

  // ── PIN ───────────────────────────────────────────────────────────────────
  if(mode==="pin") return (
    <div style={{...S.wrap,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <style>{cfStyle}</style>
      <div style={{width:"100%",maxWidth:320,padding:"2rem 1.25rem",textAlign:"center"}}>
        <div style={{width:56,height:56,background:T.card,borderRadius:16,margin:"0 auto 20px",display:"flex",alignItems:"center",justifyContent:"center",border:`1.5px solid ${T.border}`}}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke={T.accent} strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="16" r="1.5" fill={T.accent}/></svg>
        </div>
        <div style={{fontWeight:500,fontSize:18,color:T.textPrimary,marginBottom:6}}>Àrea del preparador</div>
        <div style={{fontSize:13,color:T.textSecondary,marginBottom:24}}>Introdueix el teu PIN</div>
        <input type="password" maxLength={6}
          style={{...S.inp,textAlign:"center",fontSize:24,letterSpacing:10,maxWidth:160,margin:"0 auto 12px",display:"block",border:`1.5px solid ${pinError?T.danger:T.border}`}}
          value={pinInput}
          onChange={e=>{setPinInput(e.target.value);setPinError(false);}}
          onKeyDown={e=>{if(e.key==="Enter"){if(pinInput===PIN){setMode("admin");setPinInput("");}else setPinError(true);}}}
          placeholder="····" autoFocus/>
        {pinError&&<div style={{fontSize:12,color:T.danger,marginBottom:10}}>PIN incorrecte</div>}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:4}}>
          <button style={S.btnSecondary} onClick={()=>{setMode("select");setPinInput("");setPinError(false);}}>Tornar</button>
          <button style={{...S.btnPrimary,width:"auto",padding:"8px 20px",fontSize:14}} onClick={()=>{if(pinInput===PIN){setMode("admin");setPinInput("");}else setPinError(true);}}>Entrar</button>
        </div>
        <div style={{width:1}}/>
      </div>
    </div>
  );

  // ── CLIENT ESTÀNDARD ──────────────────────────────────────────────────────
  if(mode==="client") {
    const client = data.clients.find(c=>c.id===selClient);
    if(!client) { setMode("select"); return null; }
    const ci = data.clients.findIndex(c=>c.id===selClient);
    const cc = cClr(ci);

    return (
      <div style={S.wrap}>
        <style>{cfStyle}</style>
        <div style={S.clientHeader}>
          <div style={S.avatar(cc)}>{client.avatar}</div>
          <div>
            <div style={{fontWeight:700,fontSize:22,color:T.headerText}}>{client.name}</div>
            <div style={{fontSize:15,color:T.accentDim,marginTop:4}}>{client.goal}</div>
          </div>
        </div>

        {showFinishModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div style={{background:T.card,borderRadius:"20px 20px 0 0",padding:"1.5rem 1.25rem",width:"100%",maxWidth:520,border:`1.5px solid ${T.border}`}}>
              <div style={{fontWeight:500,fontSize:16,color:T.textPrimary,marginBottom:4}}>Finalitzar entrenament</div>
              <div style={{fontSize:13,color:T.textSecondary,marginBottom:20}}>Com ha anat la sessió?</div>
              <div style={{marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <label style={{...S.lbl,marginBottom:0}}>RPE — Esforç percebut (1-10)</label>
                  <button onClick={()=>setShowRpeInfo(p=>!p)} style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${T.border}`,background:T.card2,color:T.textSecondary,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>i</button>
                </div>
                {showRpeInfo&&(
                  <div style={{background:T.card2,border:`1.5px solid ${T.border}`,borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:12}}>
                    <div style={{fontWeight:500,color:T.textPrimary,marginBottom:6}}>Què és l'RPE?</div>
                    <div style={{color:T.textSecondary,marginBottom:6,lineHeight:1.5}}>Percepció subjectiva de l'esforç de la sessió. "Com de dura t'ha semblat?"</div>
                    <div style={{color:T.textSecondary,lineHeight:1.8,fontSize:11}}>
                      <span style={{color:"#4ADE80"}}>1-2</span> Molt suau &nbsp;·&nbsp; <span style={{color:"#86EFAC"}}>3-4</span> Suau &nbsp;·&nbsp; <span style={{color:"#A78BFA"}}>5-6</span> Moderat<br/>
                      <span style={{color:"#FB923C"}}>7-8</span> Intens &nbsp;·&nbsp; <span style={{color:"#F87171"}}>9-10</span> Molt intens / Màxim
                    </div>
                    <button onClick={()=>setShowRpeInfo(false)} style={{...S.btnSecondary,fontSize:11,padding:"3px 10px",marginTop:8}}>Tancar</button>
                  </div>
                )}
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n=>{
                    const c=getRpeColor(n);
                    const sel=finishForm.rpe===n;
                    return (
                      <button key={n} onClick={()=>setFinishForm(p=>({...p,rpe:n}))} style={{width:38,height:38,borderRadius:10,border:`2px solid ${sel?c.text:T.border}`,background:sel?c.bg:T.card2,color:sel?c.text:T.textSecondary,cursor:"pointer",fontSize:13,fontWeight:sel?600:400,transition:"all 0.15s"}}>{n}</button>
                    );
                  })}
                </div>
                {finishForm.rpe&&<div style={{fontSize:11,color:T.textSecondary,marginTop:5}}>{finishForm.rpe} — {getRpeLabel(finishForm.rpe)}</div>}
                <div style={{fontSize:10,color:T.textMuted,marginTop:4}}>1-2 Molt suau · 3-4 Suau · 5-6 Moderat · 7-8 Intens · 9-10 Màxim</div>
              </div>
              <div style={{marginBottom:12}}>
                <label style={S.lbl}>Durada real (minuts)</label>
                <input style={{...S.inp,width:"auto",maxWidth:120}} type="number" placeholder="45" value={finishForm.duration} onChange={e=>setFinishForm(p=>({...p,duration:e.target.value}))}/>
              </div>
              <div style={{marginBottom:12}}>
                <label style={S.lbl}>Sensació</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[["😄","Molt bé"],["🙂","Bé"],["😐","Normal"],["😓","Cansat"],["😣","Molèsties"]].map(([emoji,label])=>(
                    <button key={label} onClick={()=>setFinishForm(p=>({...p,feeling:label}))} style={{padding:"6px 10px",borderRadius:10,border:`1.5px solid ${finishForm.feeling===label?T.accent:T.border}`,background:finishForm.feeling===label?T.accent:T.card2,color:finishForm.feeling===label?T.bg:T.textSecondary,cursor:"pointer",fontSize:12}}>{emoji} {label}</button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <label style={S.lbl}>Notes (opcional)</label>
                <textarea style={{...S.inp,minHeight:60,resize:"vertical"}} placeholder="Com t'has sentit, molèsties..." value={finishForm.notes} onChange={e=>setFinishForm(p=>({...p,notes:e.target.value}))}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{...S.btnSecondary,flex:1}} onClick={()=>setShowFinishModal(false)}>Cancel·lar</button>
                <button style={{...S.btnPrimary,flex:2,padding:"12px"}} onClick={async()=>{
                  const sessionKey=`${selClient}-${selDay}`;
                  const sess=sessionExercises[sessionKey];
                  const exsToSave=sess?sess.exercises:[];
                  try {
                    await saveStdSession(selClient,selDay,exsToSave,{
                      ...finishForm,
                      checkIn:sess?.checkIn||null,
                      templateName:sess?.templateName||"",
                    });
                    await deleteActiveSession(selClient,selDay);
                    setShowFinishModal(false);
                    setFinishForm({rpe:"",duration:"",feeling:"",notes:""});
                    setSessionExercises(p=>{const np={...p};delete np[sessionKey];return np;});
                  } catch(err) {
                    console.error("Error guardant sessió", err);
                    alert("No s'ha pogut guardar la sessió. Torna-ho a provar.");
                  }
                }}>Guardar sessió</button>
              </div>
            </div>
          </div>
        )}

        <div style={{display:"flex",borderBottom:`1.5px solid ${T.border}`,padding:"0 1.25rem"}}>
          {[["entrenament","🏋️ Entrenament"],["perfil","👤 Perfil"],["historial","📋 Historial"]].map(([tab,label])=>(
            <button key={tab} onClick={()=>setClientViewTab(tab)} style={{padding:"10px 16px",fontSize:13,cursor:"pointer",background:"none",border:"none",borderBottom:`2px solid ${clientViewTab===tab?T.accent:"transparent"}`,color:clientViewTab===tab?T.accent:T.textSecondary,fontWeight:clientViewTab===tab?500:400,marginBottom:-1,transition:"all 0.15s"}}>{label}</button>
          ))}
        </div>

        {clientViewTab==="entrenament"&&(()=>{
          const schedule=getClientSchedule(selClient);
          const templates=getClientTemplates(selClient);
          const sessionKey=`${selClient}-${selDay}`;
          const currentSession=sessionExercises[sessionKey]||null;
          const calHistory=clientHistories[normalizeClientId(selClient)]||[];
          const calClientIdx=data.clients.findIndex(c=>c.id===selClient);

          const startSession=(tpl,dateIso)=>{
            if(sessionExercises[sessionKey]) return;
            const clientOvForStart=getClientScheduleOverrides(selClient);
            const ovEntryStart=calGetOvEntry(clientOvForStart,dateIso||"");
            const editedExs=ovEntryStart.edits?.[tpl.id]?.exercises;
            const exsSource=editedExs||tpl.exercises;
            const exs=exsSource.map(ex=>({...ex,sets:Array.from({length:ex.plannedSets},()=>({reps:ex.plannedReps||"",load:ex.plannedLoad||"",rest:ex.plannedRest||"",completed:false}))}));
            const now=new Date().toISOString();
            const newSession={id:`active_${selClient}_${new Date().toISOString().slice(0,10)}_${selDay}`,clientId:selClient,date:new Date().toISOString().slice(0,10),day:selDay,templateId:tpl.id,templateName:tpl.name,exercises:exs,status:"in_progress",checkIn:{energy:"",sleep:"",stress:"",fatigue:"",pain:"",painZone:"",notes:"",completedAt:""},createdAt:now,updatedAt:now};
            setCheckInForm({energy:"",sleep:"",stress:"",fatigue:"",pain:"",painZone:"",notes:""});
            setSessionExercises(p=>({...p,[sessionKey]:newSession}));
            saveActiveSession(selClient,selDay,newSession);
          };

          if(currentSession) {
            const exs=currentSession.exercises;
            const dc=exs.filter(e=>e.sets&&e.sets.every(s=>s.completed)).length;
            const wasRecovered=currentSession.status==="in_progress"&&currentSession.createdAt!==currentSession.updatedAt;
            const checkInDone=!!currentSession.checkIn?.completedAt;

            if(!checkInDone) {
              const ScaleBtn=({value,selected,onClick})=>(
                <button onClick={onClick} style={{width:36,height:36,borderRadius:8,border:`1.5px solid ${selected?T.accent:T.border}`,background:selected?T.accent:T.card2,color:selected?T.bg:T.textSecondary,cursor:"pointer",fontSize:13,fontWeight:selected?500:400}}>{value}</button>
              );
              const ci2=checkInForm;
              const showPainAlert=ci2.pain!==""&&Number(ci2.pain)>=5;
              const showRecoveryAlert=(ci2.energy!==""&&Number(ci2.energy)<=2)||(ci2.sleep!==""&&Number(ci2.sleep)<=2);
              const saveCheckIn=()=>{
                const updatedSession={...currentSession,checkIn:{...checkInForm,completedAt:new Date().toISOString()},updatedAt:new Date().toISOString()};
                setSessionExercises(p=>({...p,[sessionKey]:updatedSession}));
                saveActiveSession(selClient,selDay,updatedSession);
              };
              return (
                <>
                  <div style={S.sec}>
                    <div style={{fontWeight:500,fontSize:18,color:T.textPrimary,marginBottom:4}}>Com arribes avui?</div>
                    <div style={{fontSize:13,color:T.textSecondary,marginBottom:20}}>Respon ràpid abans de començar l'entrenament.</div>
                    {showPainAlert&&<div style={{background:T.dangerBg,border:`1.5px solid ${T.danger}40`,borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:12,color:T.danger}}>⚠️ Dolor elevat reportat. Ajusta la intensitat o consulta amb l'entrenador.</div>}
                    {showRecoveryAlert&&<div style={{background:T.orangeBg,border:`1.5px solid #7C2D12`,borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:12,color:T.orange}}>⚠️ Recuperació baixa. Considera baixar la intensitat.</div>}
                    {[{key:"energy",label:"Energia",max:5},{key:"sleep",label:"Son",max:5},{key:"stress",label:"Estrès",max:5},{key:"fatigue",label:"Fatiga muscular",max:5}].map(({key,label,max})=>(
                      <div key={key} style={{marginBottom:14}}>
                        <label style={S.lbl}>{label} {checkInForm[key]?`${checkInForm[key]}/${max}`:""}</label>
                        <div style={{display:"flex",gap:6}}>
                          {Array.from({length:max},(_,i)=>i+1).map(n=>(
                            <ScaleBtn key={n} value={n} selected={Number(checkInForm[key])===n} onClick={()=>setCheckInForm(p=>({...p,[key]:String(n)}))}/>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div style={{marginBottom:14}}>
                      <label style={S.lbl}>Dolor actual {checkInForm.pain!==""?`${checkInForm.pain}/10`:""}</label>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        {Array.from({length:11},(_,i)=>i).map(n=>(
                          <ScaleBtn key={n} value={n} selected={Number(checkInForm.pain)===n&&checkInForm.pain!==""} onClick={()=>setCheckInForm(p=>({...p,pain:String(n)}))}/>
                        ))}
                      </div>
                    </div>
                    {(checkInForm.pain!==""&&Number(checkInForm.pain)>0)&&(
                      <div style={{marginBottom:14}}><label style={S.lbl}>Zona de dolor</label><input style={S.inp} value={checkInForm.painZone} onChange={e=>setCheckInForm(p=>({...p,painZone:e.target.value}))} placeholder="Ex. genoll dret, lumbar…"/></div>
                    )}
                    <div style={{marginBottom:20}}><label style={S.lbl}>Comentari inicial (opcional)</label><textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={checkInForm.notes} onChange={e=>setCheckInForm(p=>({...p,notes:e.target.value}))} placeholder="Com et notes avui?"/></div>
                    <button style={{...S.btnPrimary,padding:"13px"}} onClick={saveCheckIn}>Començar entrenament →</button>
                    <button style={{...S.btnSecondary,width:"100%",textAlign:"center",marginTop:8,fontSize:12}} onClick={()=>{
                      const updatedSession={...currentSession,checkIn:{...checkInForm,completedAt:new Date().toISOString()},updatedAt:new Date().toISOString()};
                      setSessionExercises(p=>({...p,[sessionKey]:updatedSession}));
                      saveActiveSession(selClient,selDay,updatedSession);
                    }}>Saltar check-in</button>
                  </div>
                </>
              );
            }

            const toggleSet=(exIdx,setIdx)=>{
              setSessionExercises(p=>{
                const s={...p[sessionKey]};
                s.exercises=s.exercises.map((e,i)=>i===exIdx?{...e,sets:e.sets.map((st,j)=>j===setIdx?{...st,completed:!st.completed}:st)}:e);
                saveActiveSession(selClient,selDay,s);
                return {...p,[sessionKey]:s};
              });
            };
            const updateSet=(exIdx,setIdx,field,value)=>{
              setSessionExercises(p=>{
                const s={...p[sessionKey]};
                s.exercises=s.exercises.map((e,i)=>i===exIdx?{...e,sets:e.sets.map((st,j)=>j===setIdx?{...st,[field]:value}:st)}:e);
                saveActiveSession(selClient,selDay,s);
                return {...p,[sessionKey]:s};
              });
            };
            const addSet=(exIdx)=>{
              setSessionExercises(p=>{
                const s={...p[sessionKey]};
                const ex=s.exercises[exIdx];
                const lastSet=ex.sets[ex.sets.length-1];
                s.exercises=s.exercises.map((e,i)=>i===exIdx?{...e,sets:[...e.sets,{reps:lastSet?.reps||ex.plannedReps||"",load:lastSet?.load||ex.plannedLoad||"",rest:lastSet?.rest||ex.plannedRest||"",completed:false}]}:e);
                saveActiveSession(selClient,selDay,s);
                return {...p,[sessionKey]:s};
              });
            };

            return (
              <>
                <div style={{display:"flex",gap:6,padding:"0.85rem 1.25rem 0.5rem",overflowX:"auto"}}>
                  {DAYS.map((d,i)=>{
                    const active=selDay===d;
                    return (
                      <div key={d} style={{textAlign:"center",flexShrink:0}}>
                        <button onClick={()=>setSelDay(d)} style={{width:34,height:34,borderRadius:"50%",border:`1.5px solid ${active?T.accent:T.border}`,background:active?T.accent:T.card,color:active?T.bg:T.textMuted,cursor:"pointer",fontSize:12,fontWeight:active?500:400}}>{["L","M","X","J","V","S","D"][i]}</button>
                        {d===TODAY&&<div style={{fontSize:9,color:T.accent,marginTop:2}}>avui</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={S.sec}>
                  {currentSession.checkIn?.completedAt&&(currentSession.checkIn.energy||currentSession.checkIn.pain!=="")&&(
                    <div style={{background:T.card2,border:`1.5px solid ${T.border}`,borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:11,color:T.textSecondary}}>
                      <div style={{fontWeight:500,color:T.textPrimary,marginBottom:4,fontSize:12}}>Check-in inicial</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {currentSession.checkIn.energy&&<span>⚡ {currentSession.checkIn.energy}/5</span>}
                        {currentSession.checkIn.sleep&&<span>😴 {currentSession.checkIn.sleep}/5</span>}
                        {currentSession.checkIn.stress&&<span>🧠 {currentSession.checkIn.stress}/5</span>}
                        {currentSession.checkIn.fatigue&&<span>💪 {currentSession.checkIn.fatigue}/5</span>}
                        {currentSession.checkIn.pain!==""&&currentSession.checkIn.pain!==undefined&&<span style={{color:Number(currentSession.checkIn.pain)>=5?T.danger:T.textSecondary}}>🩹 {currentSession.checkIn.pain}/10{currentSession.checkIn.painZone?` · ${currentSession.checkIn.painZone}`:""}</span>}
                      </div>
                      {currentSession.checkIn.notes&&<div style={{marginTop:4,fontStyle:"italic"}}>"{currentSession.checkIn.notes}"</div>}
                    </div>
                  )}
                  {wasRecovered&&<div style={{background:"#1A1A00",border:`1.5px solid ${T.accent}40`,borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:12,color:T.accent}}>⚡ Sessió recuperada — continua on ho vas deixar</div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div>
                      <div style={{fontWeight:500,fontSize:16,color:T.textPrimary}}>{currentSession.templateName}</div>
                      <div style={{fontSize:12,color:T.textSecondary}}>{selDay}{selDay===TODAY?" · Avui":""}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:12,color:T.textSecondary,marginBottom:4}}>{dc}/{exs.length}</div>
                      <ProgressBar value={dc} total={exs.length}/>
                    </div>
                  </div>
                  {exs.map((ex,i)=>{
                    const allSetsCompleted=ex.sets&&ex.sets.length>0&&ex.sets.every(s=>s.completed);
                    const isExpanded=expandedExercises[`${sessionKey}-${i}`]!==false;
                    return (
                      <div key={i} style={{...S.card,opacity:allSetsCompleted?0.6:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:isExpanded?10:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,flex:1,cursor:"pointer"}} onClick={()=>setExpandedExercises(p=>({...p,[`${sessionKey}-${i}`]:!isExpanded}))}>
                            <div style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${allSetsCompleted?T.accent:T.border}`,background:allSetsCompleted?T.accent:T.card2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              {allSetsCompleted&&<svg viewBox="0 0 16 16" width="14" height="14"><polyline points="3,8 7,12 13,4" fill="none" stroke={T.bg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                                <div style={{fontWeight:500,fontSize:14,color:allSetsCompleted?T.textMuted:T.textPrimary,textDecoration:allSetsCompleted?"line-through":"none"}}>{i+1}. {ex.name}</div>
                                {ex.isCustom&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:T.purpleBg,color:T.purple,border:`1.5px solid #3A3A60`}}>Personalitzat</span>}
                                {ex.isExtra&&!ex.isCustom&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:T.card2,color:T.textSecondary,border:`1.5px solid ${T.border}`}}>Extra</span>}
                              </div>
                              <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{ex.sets?.filter(s=>s.completed).length||0}/{ex.sets?.length||0} sèries · {ex.plannedReps} reps{ex.plannedLoad?` · ${ex.plannedLoad}`:""}</div>
                            </div>
                            <svg viewBox="0 0 12 12" width="14" height="14" style={{transition:"transform 0.2s",transform:isExpanded?"rotate(180deg)":"rotate(0)",flexShrink:0}}><polyline points="2,4 6,8 10,4" fill="none" stroke={T.textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                          <button onClick={()=>{setSessionExercises(p=>{const s={...p[sessionKey]};s.exercises=s.exercises.filter((_,ei)=>ei!==i);saveActiveSession(selClient,selDay,s);return {...p,[sessionKey]:s};});}} style={{width:22,height:22,borderRadius:"50%",border:"none",background:T.dangerBg,color:T.danger,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,lineHeight:1,flexShrink:0}}>×</button>
                        </div>
                        {isExpanded&&(
                          <div style={{paddingLeft:36}}>
                            {ex.observations&&<div style={{fontSize:12,color:T.textSecondary,marginBottom:8}}>💬 {ex.observations}</div>}
                            {(ex.sets||[]).map((st,j)=>(
                              <div key={j} style={{background:T.card2,borderRadius:10,padding:"10px 12px",marginBottom:6,border:`1.5px solid ${st.completed?T.accent:T.border}`}}>
                                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                                  <button onClick={()=>toggleSet(i,j)} style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${st.completed?T.accent:T.border}`,background:st.completed?T.accent:T.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                                    {st.completed&&<svg viewBox="0 0 16 16" width="12" height="12"><polyline points="3,8 7,12 13,4" fill="none" stroke={T.bg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                  </button>
                                  <span style={{fontSize:13,fontWeight:500,color:T.textPrimary}}>Sèrie {j+1}</span>
                                  <button onClick={()=>setSessionExercises(p=>{const s={...p[sessionKey]};s.exercises=s.exercises.map((e,ei)=>ei===i?{...e,sets:e.sets.filter((_,si)=>si!==j)}:e);saveActiveSession(selClient,selDay,s);return {...p,[sessionKey]:s};})} style={{marginLeft:"auto",width:20,height:20,borderRadius:"50%",border:"none",background:T.dangerBg,color:T.danger,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,lineHeight:1}}>×</button>
                                </div>
                                <div style={{display:"flex",gap:6}}>
                                  <div style={{flex:1}}><label style={S.lbl}>Reps fetes</label><input style={S.inp} value={st.reps} onChange={e=>updateSet(i,j,"reps",e.target.value)} placeholder={ex.plannedReps||"reps"}/></div>
                                  <div style={{flex:1}}><label style={S.lbl}>Kg / càrrega</label><input style={S.inp} value={st.load||""} onChange={e=>updateSet(i,j,"load",e.target.value)} placeholder={ex.plannedLoad||"kg"}/></div>
                                  <div style={{flex:1}}><label style={S.lbl}>Descans</label><input style={S.inp} value={st.rest} onChange={e=>updateSet(i,j,"rest",e.target.value)} placeholder="90s"/></div>
                                </div>
                              </div>
                            ))}
                            <button style={{...S.btnSecondary,width:"100%",textAlign:"center",fontSize:12,marginTop:4}} onClick={()=>addSet(i)}>+ Afegir sèrie</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {dc===exs.length&&exs.length>0&&(
                    <div style={{background:T.greenBg,border:`1.5px solid ${T.greenBorder}`,borderRadius:14,padding:"1.25rem",textAlign:"center",marginBottom:8}}>
                      <div style={{fontSize:32,marginBottom:6}}>🎉</div>
                      <div style={{fontWeight:500,color:T.green}}>Tots els exercicis completats!</div>
                    </div>
                  )}
                  <button style={{...S.btnPrimary,padding:"12px",marginTop:8}} onClick={()=>{setFinishForm({rpe:"",duration:"",feeling:"",notes:""});setShowFinishModal(true);}}>
                    {dc===exs.length&&exs.length>0?"🏁 Finalitzar entrenament":`🏁 Finalitzar entrenament (${dc}/${exs.length})`}
                  </button>
                  {showAddExModal&&(
                    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
                      <div style={{background:T.card,borderRadius:"20px 20px 0 0",padding:"1.5rem 1.25rem",width:"100%",maxWidth:520,border:`1.5px solid ${T.border}`,maxHeight:"80vh",overflowY:"auto"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                          <div style={{fontWeight:500,fontSize:16,color:T.textPrimary}}>Afegir exercici</div>
                          <button style={{...S.btnSecondary,fontSize:12}} onClick={()=>{setShowAddExModal(false);setAddExTab("biblioteca");setCustomExForm({name:"",sets:3,reps:"10",load:"",rest:"60s",notes:""});}}>Tancar</button>
                        </div>
                        <div style={{display:"flex",gap:0,marginBottom:16,borderBottom:`1.5px solid ${T.border}`}}>
                          {[["biblioteca","📚 Biblioteca"],["custom","✏️ Exercici puntual"]].map(([tab,label])=>(
                            <button key={tab} onClick={()=>setAddExTab(tab)} style={{padding:"8px 14px",fontSize:12,cursor:"pointer",background:"none",border:"none",borderBottom:`2px solid ${addExTab===tab?T.accent:"transparent"}`,color:addExTab===tab?T.accent:T.textSecondary,fontWeight:addExTab===tab?500:400,marginBottom:-1}}>{label}</button>
                          ))}
                        </div>
                        {addExTab==="biblioteca"&&(
                          <>
                            <div style={{fontSize:13,color:T.textSecondary,marginBottom:12}}>Tria un exercici de la biblioteca</div>
                            {getClientLibrary(selClient).length===0&&<div style={{textAlign:"center",padding:"2rem 0",color:T.textSecondary,fontSize:13}}>La biblioteca està buida</div>}
                            {getClientLibrary(selClient).map(ex=>(
                              <div key={ex.id} style={{...S.card,cursor:"pointer"}} onClick={()=>{
                                const newEx={id:`extra_${Date.now()}`,exerciseId:ex.id,name:ex.name,plannedSets:ex.defaultSets,plannedReps:ex.defaultReps,plannedLoad:ex.defaultLoad||"",plannedRest:ex.defaultRest||"",observations:ex.instructions||"",isExtra:true,sets:Array.from({length:ex.defaultSets},()=>({reps:ex.defaultReps||"",load:ex.defaultLoad||"",rest:ex.defaultRest||"",completed:false}))};
                                setSessionExercises(p=>{const s={...p[sessionKey]};s.exercises=[...s.exercises,newEx];saveActiveSession(selClient,selDay,s);return {...p,[sessionKey]:s};});
                                setShowAddExModal(false);setAddExTab("biblioteca");
                              }}>
                                <div style={{fontWeight:500,fontSize:13,color:T.textPrimary}}>{ex.name}</div>
                                <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{ex.category} · {ex.muscleGroup} · {ex.defaultSets}×{ex.defaultReps}</div>
                              </div>
                            ))}
                          </>
                        )}
                        {addExTab==="custom"&&(
                          <>
                            <div style={{fontSize:13,color:T.textSecondary,marginBottom:16}}>Crea un exercici només per a aquesta sessió</div>
                            <div style={{marginBottom:10}}><label style={S.lbl}>Nom de l'exercici *</label><input style={S.inp} value={customExForm.name} onChange={e=>setCustomExForm(p=>({...p,name:e.target.value}))} placeholder="Ex. Press màquina convergent"/></div>
                            <div style={{display:"flex",gap:8,marginBottom:10}}>
                              <div style={{flex:1}}><label style={S.lbl}>Sèries</label><input style={S.inp} type="number" min="1" value={customExForm.sets} onChange={e=>setCustomExForm(p=>({...p,sets:e.target.value}))}/></div>
                              <div style={{flex:1}}><label style={S.lbl}>Reps</label><input style={S.inp} value={customExForm.reps} onChange={e=>setCustomExForm(p=>({...p,reps:e.target.value}))} placeholder="10"/></div>
                            </div>
                            <div style={{display:"flex",gap:8,marginBottom:10}}>
                              <div style={{flex:1}}><label style={S.lbl}>Kg / càrrega</label><input style={S.inp} value={customExForm.load} onChange={e=>setCustomExForm(p=>({...p,load:e.target.value}))} placeholder="kg"/></div>
                              <div style={{flex:1}}><label style={S.lbl}>Descans</label><input style={S.inp} value={customExForm.rest} onChange={e=>setCustomExForm(p=>({...p,rest:e.target.value}))} placeholder="60s"/></div>
                            </div>
                            <div style={{marginBottom:16}}><label style={S.lbl}>Notes (opcional)</label><textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={customExForm.notes} onChange={e=>setCustomExForm(p=>({...p,notes:e.target.value}))}/></div>
                            <button style={{...S.btnPrimary,padding:"12px"}} onClick={()=>{
                              if(!customExForm.name.trim()) return;
                              const numSets=Number(customExForm.sets)||1;
                              const newEx={id:`custom_${Date.now()}`,exerciseId:null,name:customExForm.name.trim(),plannedSets:numSets,plannedReps:customExForm.reps||"",plannedLoad:customExForm.load||"",plannedRest:customExForm.rest||"",observations:customExForm.notes||"",isExtra:true,isCustom:true,sets:Array.from({length:numSets},()=>({reps:customExForm.reps||"",load:customExForm.load||"",rest:customExForm.rest||"",completed:false}))};
                              setSessionExercises(p=>{const s={...p[sessionKey]};s.exercises=[...s.exercises,newEx];saveActiveSession(selClient,selDay,s);return {...p,[sessionKey]:s};});
                              const libEx={id:`ex_${Date.now()}`,name:customExForm.name.trim(),category:"Força",muscleGroup:"",movementPattern:"",material:"",defaultSets:numSets,defaultReps:customExForm.reps||"10",defaultLoad:customExForm.load||"",defaultRest:customExForm.rest||"60s",instructions:customExForm.notes||"",observations:"",level:"Principiant"};
                              updateClientLibrary(selClient,[...getClientLibrary(selClient),libEx]);
                              setShowAddExModal(false);setAddExTab("biblioteca");setCustomExForm({name:"",sets:3,reps:"10",load:"",rest:"60s",notes:""});
                            }}>Afegir a la sessió</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <button style={{...S.btnSecondary,marginTop:8,width:"100%",textAlign:"center"}} onClick={()=>setShowAddExModal(true)}>+ Afegir exercici</button>
                  <button style={{...S.btnSecondary,marginTop:8,width:"100%",textAlign:"center"}} onClick={()=>{
                    if(window.confirm("Segur que vols descartar aquesta sessió en curs?")) {
                      deleteActiveSession(selClient,selDay);
                      setSessionExercises(p=>{const np={...p};delete np[sessionKey];return np;});
                    }
                  }}>← Descartar sessió i canviar entrenament</button>
                </div>
              </>
            );
          }

          const clientSch=schedule;
          const clientOv=getClientScheduleOverrides(selClient);
          return (
            <CalendarComp
              clientIdx={calClientIdx}
              schedule={clientSch}
              scheduleOverrides={clientOv}
              templates={templates}
              history={calHistory}
              calView={calView}
              setCalView={setCalView}
              calBase={calBase}
              setCalBase={setCalBase}
              calDetail={calDetail}
              setCalDetail={(date)=>{ if(date) setSelDay(calDayName(date)); setCalDetail(date); }}
              onStartSession={(tpl,dateIso)=>{ startSession(tpl,dateIso); setCalDetail(null); }}
              isAdmin={false}
              onAddTemplate={(day,tplId)=>updateClientSchedule(selClient,{...clientSch,[day]:[...(clientSch[day]||[]),tplId]})}
              onRemoveTemplate={(day,tplId)=>updateClientSchedule(selClient,{...clientSch,[day]:(clientSch[day]||[]).filter(id=>id!==tplId)})}
              onAddTemplateOverride={(dateIso,tplId)=>{const e=calGetOvEntry(clientOv,dateIso);if(!e.ids.includes(tplId))updateClientScheduleOverrides(selClient,{...clientOv,[dateIso]:{...e,ids:[...e.ids,tplId]}});}}
              onRemoveTemplateOverride={(dateIso,tplId)=>{const e=calGetOvEntry(clientOv,dateIso);const nd={...e,ids:e.ids.filter(id=>id!==tplId),edits:{...e.edits}};delete nd.edits[tplId];updateClientScheduleOverrides(selClient,{...clientOv,[dateIso]:nd});}}
              onEditTemplateOverride={(dateIso,tplId,exercises)=>{const e=calGetOvEntry(clientOv,dateIso);updateClientScheduleOverrides(selClient,{...clientOv,[dateIso]:{...e,edits:{...e.edits,[tplId]:{exercises}}}});}}
            />
          );
        })()}

        {clientViewTab==="perfil"&&(()=>{
          const fields=[
            {key:"age",label:"Edat",placeholder:"Ex. 28"},
            {key:"level",label:"Nivell",type:"select",options:["principiant","intermedi","avançat"]},
            {key:"place",label:"Lloc d'entrenament",type:"select",options:["gimnàs","casa","exterior","pista","altre"]},
            {key:"material",label:"Material disponible",placeholder:"Ex. manuelles, goma..."},
            {key:"startDate",label:"Data d'inici",placeholder:"Ex. 01/01/2025"},
            {key:"injuries",label:"Lesions prèvies",placeholder:"Ex. genoll dret..."},
            {key:"currentPain",label:"Dolor actual",placeholder:"Ex. cap / lumbar..."},
            {key:"avoidEx",label:"Exercicis a evitar",placeholder:"Ex. sentadilla profunda..."},
            {key:"likes",label:"Exercicis que li agraden",placeholder:"Ex. rem, dominades..."},
            {key:"dislikes",label:"Exercicis que no li agraden",placeholder:"Ex. burpees..."},
          ];
          const saveClientData=()=>{
            const nd={...data,clients:data.clients.map(c=>c.id===selClient?{...c,...clientDraft,coachNotes:c.coachNotes}:c)};
            updateData(nd);setEditingClient(false);
          };
          return (
            <div style={S.sec}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontWeight:500,fontSize:14,color:T.textPrimary}}>El meu perfil</div>
                {!editingClient
                  ?<button style={{...S.btnSecondary,fontSize:12}} onClick={()=>{const {coachNotes,...pub}=client;void coachNotes;setClientDraft(pub);setEditingClient(true);}}>Editar</button>
                  :<div style={{display:"flex",gap:8}}>
                    <button style={{...S.btnSecondary,fontSize:12}} onClick={()=>setEditingClient(false)}>Cancel·lar</button>
                    <button style={{...S.btnPrimary,width:"auto",padding:"6px 14px",fontSize:12}} onClick={saveClientData}>Guardar</button>
                  </div>
                }
              </div>
              <div style={{...S.card,marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Dades bàsiques</div>
                <div style={{marginBottom:8}}><label style={S.lbl}>Nom complet</label>{editingClient?<input style={S.inp} value={clientDraft?.name||""} onChange={e=>setClientDraft(p=>({...p,name:e.target.value}))}/>:<div style={{fontSize:14,color:T.textPrimary,fontWeight:500}}>{client?.name}</div>}</div>
                <div style={{marginBottom:8}}><label style={S.lbl}>Objectiu principal</label>{editingClient?<input style={S.inp} value={clientDraft?.goal||""} onChange={e=>setClientDraft(p=>({...p,goal:e.target.value}))}/>:<div style={{fontSize:13,color:T.textPrimary}}>{client?.goal||"—"}</div>}</div>
                {fields.slice(0,5).map(f=>(
                  <div key={f.key} style={{marginBottom:8}}>
                    <label style={S.lbl}>{f.label}</label>
                    {editingClient?f.type==="select"?<select style={S.inp} value={clientDraft?.[f.key]||""} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}>{f.options.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input style={S.inp} value={clientDraft?.[f.key]||""} placeholder={f.placeholder} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}/>:<div style={{fontSize:13,color:T.textPrimary}}>{client?.[f.key]||"—"}</div>}
                  </div>
                ))}
              </div>
              <div style={{...S.card,marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Salut i limitacions</div>
                {fields.slice(5,8).map(f=>(
                  <div key={f.key} style={{marginBottom:8}}>
                    <label style={S.lbl}>{f.label}</label>
                    {editingClient?<input style={S.inp} value={clientDraft?.[f.key]||""} placeholder={f.placeholder} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}/>:<div style={{fontSize:13,color:T.textPrimary}}>{client?.[f.key]||"—"}</div>}
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Preferències i notes</div>
                {fields.slice(8).map(f=>(
                  <div key={f.key} style={{marginBottom:8}}>
                    <label style={S.lbl}>{f.label}</label>
                    {editingClient?<textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={clientDraft?.[f.key]||""} placeholder={f.placeholder} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}/>:<div style={{fontSize:13,color:T.textPrimary}}>{client?.[f.key]||"—"}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {clientViewTab==="historial"&&(()=>{
          const history=clientHistories[normalizeClientId(selClient)]||[];
          const totalS=history.length;
          const thisWeek=history.filter(s=>{
            if(!s.createdAt) return false;
            const d=new Date(s.createdAt);
            if(isNaN(d.getTime())) return false;
            return (new Date()-d)/(1000*60*60*24)<=7;
          }).length;
          return (
            <div style={S.sec}>
              {totalS===0?(
                <div style={{textAlign:"center",padding:"3rem 0",color:T.textSecondary}}>
                  <div style={{fontSize:40,marginBottom:12}}>📋</div>
                  <div style={{fontWeight:500,color:T.textPrimary,marginBottom:4}}>Encara no hi ha sessions</div>
                  <div style={{fontSize:13}}>Completa el primer entrenament per veure l'historial</div>
                </div>
              ):(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8,marginBottom:16}}>
                    {[{label:"Total sessions",value:totalS,color:T.accent},{label:"Aquesta setmana",value:thisWeek,color:T.green}].map(st=>(
                      <div key={st.label} style={{background:T.card,borderRadius:12,padding:"0.75rem",textAlign:"center",border:`1.5px solid ${T.border}`}}>
                        <div style={{fontSize:22,fontWeight:500,color:st.color}}>{st.value}</div>
                        <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{st.label}</div>
                      </div>
                    ))}
                  </div>
                  {history.map((sess,idx)=>{
                    const sessId=sess.id||`${selClient}-${idx}`;
                    const isExpanded=!!expandedHistory[sessId];
                    const full=sess.completionPercentage===100;
                    const exercises=sess.exercises||[];
                    return (
                      <div key={sessId} style={S.card}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:500,fontSize:14,color:'#1a3a6b'}}>{sess.sessionTitle||sess.day||"Sessió"}</div>
                            <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{sess.date}{sess.durationReal&&<span style={{color:'#e8d800',fontWeight:500}}> · {sess.durationReal} min</span>}</div>
                          </div>
                          <button style={{...S.btnDanger,fontSize:11,padding:"3px 8px"}} onClick={()=>deleteHistorySession(selClient,sessId)}>🗑️</button>
                        </div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                          <span style={full?S.tag("green"):S.tag()}>{full?"✓ Complet":`${sess.completionPercentage||0}%`}</span>
                          {sess.rpe&&<span style={getRpeTagStyle(sess.rpe)}>RPE {sess.rpe}</span>}
                          {(()=>{const l=getSessionInternalLoad(sess);return l!=null?<span style={S.tag("accent")}>{l} UA</span>:null;})()}
                          {sess.feeling&&<span style={getFeelingTagStyle(sess.feeling)}>{sess.feeling}</span>}
                          {exercises.filter(e=>e.isExtra&&!e.isCustom).length>0&&<span style={S.tag()}>+{exercises.filter(e=>e.isExtra&&!e.isCustom).length} extra</span>}
                          {exercises.filter(e=>e.isCustom).length>0&&<span style={{...S.tag("purple"),fontSize:10}}>+{exercises.filter(e=>e.isCustom).length} personalitzat</span>}
                        </div>
                        <div style={{fontSize:12,color:'#6b7280',marginBottom:8}}><span style={{color:'#4ade80',fontWeight:500}}>{sess.completedExercises||0}</span>/{sess.totalExercises||0} exercicis</div>
                        <ProgressBar value={sess.completedExercises||0} total={sess.totalExercises||1} color={full?T.green:T.accent}/>
                        <div style={{display:"flex",gap:6,marginTop:10}}>
                          <button onClick={()=>setExpandedHistory(p=>({...p,[sessId]:!p[sessId]}))} style={{...S.btnSecondary,flex:1,textAlign:"center",fontSize:12}}>{isExpanded?"▲ Amagar":"▼ Detalls"}</button>
                          <button style={{...S.btnSecondary,flex:1,textAlign:"center",fontSize:12}} onClick={()=>openEditHistorySession(selClient,sess,sessId)}>✏️ Editar</button>
                        </div>
                        {isExpanded&&(
                          <div style={{marginTop:10,paddingTop:10,borderTop:`1.5px solid ${T.border}`}}>
                            {sess.checkIn?.completedAt&&(
                              <div style={{background:T.card2,borderRadius:8,padding:"8px 10px",marginBottom:10}}>
                                <div style={{fontWeight:500,fontSize:11,color:'#1a3a6b',marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Check-in inicial</div>
                                <div style={{display:"flex",flexWrap:"wrap",gap:8,fontSize:12,color:'#374151'}}>
                                  {sess.checkIn.energy&&<span>⚡ Energia {sess.checkIn.energy}/5</span>}
                                  {sess.checkIn.sleep&&<span>😴 Son {sess.checkIn.sleep}/5</span>}
                                  {sess.checkIn.stress&&<span>🧠 Estrès {sess.checkIn.stress}/5</span>}
                                  {sess.checkIn.fatigue&&<span>💪 Fatiga {sess.checkIn.fatigue}/5</span>}
                                  {sess.checkIn.pain!==""&&sess.checkIn.pain!=null&&<span style={{color:Number(sess.checkIn.pain)>=5?T.danger:'#374151'}}>🩹 Dolor {sess.checkIn.pain}/10{sess.checkIn.painZone?` · ${sess.checkIn.painZone}`:""}</span>}
                                </div>
                                {sess.checkIn.notes&&<div style={{fontSize:11,color:'#6b7280',marginTop:4,fontStyle:"italic"}}>"{sess.checkIn.notes}"</div>}
                              </div>
                            )}
                            {sess.clientNotes&&<div style={{fontSize:12,color:'#6b7280',marginBottom:10,fontStyle:"italic",background:'#f8fafc',borderRadius:8,padding:"6px 10px"}}>💬 {sess.clientNotes}</div>}
                            {exercises.map((e,i)=>(
                              <div key={i} style={{marginBottom:10,paddingBottom:10,borderBottom:`1.5px solid ${T.border}`}}>
                                <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginBottom:4}}>
                                  <span style={{fontSize:13,fontWeight:500,color:e.completed?'#4ade80':'#1a3a6b'}}>{e.completed?"✓":"○"} {e.name}</span>
                                  {e.isCustom&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:'#f3e8ff',color:'#7c3aed',border:'1.5px solid #e9d5ff'}}>Personalitzat</span>}
                                  {e.isExtra&&!e.isCustom&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:'#f1f5f9',color:'#6b7280',border:'1.5px solid #e2e8f0'}}>Extra</span>}
                                </div>
                                <div style={{fontSize:11,color:'#374151',marginBottom:4}}>{e.plannedSets||0} sèries · {e.plannedReps||"?"} reps{e.plannedLoad?` · ${e.plannedLoad}`:""}{e.plannedRest?` · ${e.plannedRest}`:""}</div>
                                {e.observations&&<div style={{fontSize:11,color:'#6b7280',marginBottom:4,fontStyle:"italic"}}>💬 {e.observations}</div>}
                                {Object.values(e.sets||{}).map((st,j)=>{
                                  const parts=[];
                                  if(st.reps) parts.push(`${st.reps} reps`);
                                  if(st.load) parts.push(st.load);
                                  if(st.rest) parts.push(st.rest);
                                  return <div key={j} style={{fontSize:11,color:st.completed?'#4ade80':'#6b7280',padding:"1px 0 1px 10px"}}>S{j+1}: {parts.length>0?parts.join(" · "):"—"} {st.completed?"✓":"○"}</div>;
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })()}
      </div>
    );
  }

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  if(mode==="admin"&&adminView==="clients") {
    const filteredClients=data.clients.filter(c=>c.name?.toLowerCase().includes(clientSearch.toLowerCase())||c.goal?.toLowerCase().includes(clientSearch.toLowerCase()));
    const allStats=data.clients.map(c=>getClientDashboardStats(c));
    const totalSessionsWeek=allStats.reduce((a,s)=>a+s.sessionsThisWeek,0);
    const alertStatuses=["Molèsties","RPE alt","Sense activitat","Sessió parcial"];
    const alertsCount=allStats.filter(s=>alertStatuses.includes(s.status)).length;
    const statusStyle=(status)=>{
      if(status==="Actiu") return S.tag("green");
      if(status==="Molèsties") return {...S.tag(),color:T.danger,background:T.dangerBg,border:`1.5px solid ${T.dangerBg}`};
      if(status==="RPE alt"||status==="Sense activitat"||status==="Sessió parcial") return {...S.tag(),color:T.orange,background:T.orangeBg,border:`2px solid #fdba74`};
      return S.tag();
    };
    return (
      <div style={S.adminWrap}>
        <style>{cfStyle}</style>
        <div style={S.adminHeader}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:T.accent}}/>
              <span style={{fontWeight:700,fontSize:20,color:T.headerText}}>TrainConcerNow</span>
            </div>
            <button style={{...S.btnSecondary,background:"rgba(255,255,255,0.08)",color:T.headerText,border:"1.5px solid rgba(255,255,255,0.2)"}} onClick={()=>setMode("select")}>Sortir</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10}}>
            {[{label:"Clients",value:data.clients.length,color:T.statClient},{label:"Sessió setmana",value:totalSessionsWeek,color:T.statSession},{label:"Alertes",value:alertsCount,color:T.statAlert}].map(st=>(
              <div key={st.label} style={S.adminStatCard}>
                <div style={{fontSize:22,fontWeight:700,color:st.color}}>{st.value}</div>
                <div style={{fontSize:12,color:T.statSubtitle,marginTop:6}}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.adminContent}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontWeight:500,fontSize:16,color:T.textPrimary}}>Clients</div>
            <button style={S.btnSecondary} onClick={()=>setShowAddClient(true)}>+ Afegir</button>
          </div>
          {(()=>{
            const pending=intakeSubmissions.filter(s=>s.status==="pending");
            return (
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:13,fontWeight:500,color:T.textPrimary}}>Sol·licituds pendents{pending.length>0&&<span style={{...S.tag("purple"),marginLeft:6,fontSize:10}}>{pending.length}</span>}</div>
                  <button style={{...S.btnSecondary,fontSize:11}} onClick={loadIntakeSubmissions}>↻ Actualitzar</button>
                </div>
                {pending.length===0?<div style={{fontSize:12,color:T.textMuted,textAlign:"center",padding:"8px 0"}}>Cap sol·licitud pendent</div>:(
                  pending.map(sub=>(
                    <div key={sub.id} style={{background:T.card,border:`1.5px solid ${T.purple}40`,borderRadius:12,padding:"0.75rem",marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                        <div>
                          <div style={{fontWeight:500,fontSize:13,color:T.textPrimary}}>{sub.data?.name||"Sense nom"}</div>
                          <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{sub.data?.goal||"—"}{sub.data?.sport?` · ${sub.data.sport}`:""} · {new Date(sub.createdAt).toLocaleDateString("ca-ES")}</div>
                          {(sub.data?.email||sub.data?.phone)&&<div style={{fontSize:11,color:T.purple,marginTop:2}}>{sub.data?.email||sub.data?.phone}</div>}
                        </div>
                        <span style={S.tag("purple")}>Pendent</span>
                      </div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        <button style={{...S.btnSecondary,fontSize:11}} onClick={()=>setViewingIntake(sub)}>👁 Veure</button>
                        <button style={{...S.btnPrimary,fontSize:11,padding:"4px 10px",width:"auto"}} onClick={()=>convertIntakeToClient(sub)}>✓ Crear client</button>
                        <button style={{...S.btnDanger,fontSize:11}} onClick={()=>rejectIntakeSubmission(sub)}>Rebutjar</button>
                        <button style={{...S.btnDanger,fontSize:11}} onClick={()=>deleteIntakeSubmission(sub.id)}>🗑️</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })()}
          <input style={{...S.inp,marginBottom:14}} value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Cercar client..."/>
          {filteredClients.map((c)=>{
            const cc=cClr(data.clients.findIndex(cl=>cl.id===c.id));
            const stats=getClientDashboardStats(c);
            const alerts=getClientAlerts(stats);
            const hasDanger=alerts.some(a=>a.severity==="danger");
            const hasWarning=alerts.some(a=>a.severity==="warning");
            const computedStatus = alerts.length===0&&stats.totalSessions===0?"Nou":hasDanger?"Alerta":hasWarning?"Revisar":stats.status;
            const isExpanded=!!expandedClientCards[c.id];
            const alertSeverityStyle = (severity) => {
              if(severity==="danger") return {fontSize:11,padding:"2px 8px",borderRadius:20,background:T.dangerBg,color:T.danger,border:`1.5px solid ${T.danger}40`};
              if(severity==="warning") return {fontSize:11,padding:"2px 8px",borderRadius:20,background:T.orangeBg,color:T.orange,border:`2px solid #fdba74`};
              return {fontSize:11,padding:"2px 8px",borderRadius:20,background:T.purpleBg,color:T.purple,border:`1.5px solid #3A3A6040`};
            };
            return (
              <div key={c.id} style={{background:"#ffffff",border:`1.5px solid #e2e8f0`,borderRadius:12,padding:"1rem",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                  <div style={S.avatar(cc)}>{c.avatar}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:500,fontSize:15,color:T.headerBg}}>{c.name}</div>
                    <div style={{fontSize:12,color:cc.text,marginTop:1}}>{c.goal}</div>
                  </div>
                  <span style={statusStyle(computedStatus)}>{computedStatus}</span>
                </div>
                {alerts.length>0&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                    {alerts.slice(0,3).map((a,i)=>(
                      <span key={i} style={alertSeverityStyle(a.severity)}>{a.label}</span>
                    ))}
                    {alerts.length>3&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:T.card2,color:T.textSecondary,border:`1.5px solid ${T.border}`}}>+{alerts.length-3} més</span>}
                  </div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:10}}>
                  {[{label:"Setmana",value:stats.sessionsThisWeek},{label:"RPE mitjà",value:stats.avgRpeRecent??"-"},{label:"Càrrega set.",value:stats.weeklyInternalLoad!=null?`${stats.weeklyInternalLoad} UA`:"—"}].map(st=>(
                    <div key={st.label} style={{background:T.card2,borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                      <div style={{fontSize:13,fontWeight:500,color:T.textPrimary}}>{st.value}</div>
                      <div style={{fontSize:10,color:T.textSecondary}}>{st.label}</div>
                    </div>
                  ))}
                </div>
                {stats.lastSession?<div style={{fontSize:12,color:T.textSecondary,marginBottom:10}}>Última: <span style={{color:T.textPrimary,fontWeight:500}}>{stats.lastSession.sessionTitle||stats.lastSession.day||"Sessió"}</span>{stats.lastSession.date?` · ${stats.lastSession.date}`:""}{stats.lastSession.completionPercentage!=null?` · ${stats.lastSession.completionPercentage}%`:""}</div>:<div style={{fontSize:12,color:T.textMuted,marginBottom:10}}>Sense sessions registrades</div>}
                <div style={{display:"flex",gap:6,marginBottom:6}}>
                  <button style={{...S.btnSecondary,flex:1,fontSize:11,textAlign:"center"}} onClick={()=>setExpandedClientCards(p=>({...p,[c.id]:!p[c.id]}))}>{ isExpanded?"▲ Amagar":"▼ Resum"}</button>
                  <button style={{...S.btnPrimary,flex:2,fontSize:13,padding:"9px"}} onClick={()=>selectAdminClient(c.id)}>Seleccionar →</button>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button style={{...S.btnSecondary,flex:1,fontSize:11,textAlign:"center"}} onClick={()=>copyToClipboard(getClientAccessLink(c),"Enllaç copiat!")}>🔗 Enllaç</button>
                  <button style={{...S.btnSecondary,flex:1,fontSize:11,textAlign:"center"}} onClick={()=>copyToClipboard(getClientInviteMessage(c),"Missatge copiat!")}>✉️ Missatge</button>
                </div>
                {isExpanded&&(
                  <div style={{marginTop:12,paddingTop:12,borderTop:`1.5px solid ${T.border}`}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
                      {[{label:"Total sessions",value:stats.totalSessions},{label:"Dies assignats",value:stats.trainingDaysCount},{label:"Plantilles",value:stats.templatesCount},{label:"Biblioteca",value:`${stats.libraryCount} ex`},{label:"Durada setmana",value:stats.totalDurationThisWeek>0?`${stats.totalDurationThisWeek} min`:"—"},{label:"Última sensació",value:stats.lastFeeling||"—"},{label:"Càrrega setmana",value:stats.weeklyInternalLoad!=null?`${stats.weeklyInternalLoad} UA`:"—"},{label:"Última càrrega",value:stats.lastInternalLoad!=null?`${stats.lastInternalLoad} UA`:"—"},{label:"Mitjana càrrega",value:stats.avgInternalLoadRecent!=null?`${stats.avgInternalLoadRecent} UA`:"—"}].map(item=>(
                        <div key={item.label} style={{background:T.card2,borderRadius:8,padding:"6px 10px"}}>
                          <div style={{fontSize:11,color:T.textSecondary}}>{item.label}</div>
                          <div style={{fontSize:13,fontWeight:500,color:T.textPrimary,marginTop:2}}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {stats.history.slice(0,3).map((sess,idx)=>(
                      <div key={idx} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1.5px solid ${T.border}`}}>
                        <div>
                          <div style={{fontSize:12,color:T.textPrimary,fontWeight:500}}>{sess.sessionTitle||sess.day||"Sessió"}</div>
                          <div style={{fontSize:11,color:T.textSecondary}}>{sess.date||""}</div>
                        </div>
                        <div style={{display:"flex",gap:4,alignItems:"center"}}>
                          {sess.rpe&&<span style={getRpeTagStyle(sess.rpe,10)}>RPE {sess.rpe}</span>}
                          {sess.completionPercentage!=null&&<span style={{...S.tag(sess.completionPercentage===100?"green":""),fontSize:10}}>{sess.completionPercentage}%</span>}
                        </div>
                      </div>
                    ))}
                    {stats.history.length===0&&<div style={{fontSize:12,color:T.textMuted,textAlign:"center",padding:"8px 0"}}>Sense sessions</div>}
                    <div style={{marginTop:10,paddingTop:10,borderTop:`1.5px solid ${T.border}`}}>
                      <div style={{fontSize:11,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>Alertes recents</div>
                      {alerts.length===0?(
                        <div style={{fontSize:12,color:T.textMuted}}>Sense alertes recents.</div>
                      ):(
                        alerts.map((a,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6}}>
                            <span style={{...alertSeverityStyle(a.severity),flexShrink:0}}>{a.label}</span>
                            <span style={{fontSize:11,color:T.textSecondary,paddingTop:2}}>{a.detail}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredClients.length===0&&clientSearch&&<div style={{textAlign:"center",padding:"2rem 0",color:T.textSecondary,fontSize:13}}>Cap client coincideix amb "{clientSearch}"</div>}
          {showAddClient&&(
            <FormCard>
              <div style={{fontWeight:500,fontSize:14,color:'#1a3a6b',marginBottom:12}}>Nou client</div>
              <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.formInp} value={newClientForm.name} onChange={e=>setNewClientForm(p=>({...p,name:e.target.value}))} placeholder="Ex. Ana García"/></div>
              <div style={{marginBottom:12}}><label style={S.lbl}>Objectiu</label><input style={S.formInp} value={newClientForm.goal} onChange={e=>setNewClientForm(p=>({...p,goal:e.target.value}))} placeholder="Ex. Hipertròfia..."/></div>
              <div style={{...S.row,justifyContent:"flex-end"}}>
                <button style={S.btnSecondary} onClick={()=>setShowAddClient(false)}>Cancel·lar</button>
                <button style={{...S.btnPrimary,width:"auto",padding:"8px 18px",fontSize:13,marginLeft:8}} onClick={addClient}>Guardar</button>
              </div>
            </FormCard>
          )}
        </div>
      </div>
    );
  }

  // ── ADMIN DETALL CLIENT ───────────────────────────────────────────────────
  const adminClientData = adminClient ? data.clients.find(c=>c.id===adminClient) : null;
  if(!adminClientData) { setAdminView("clients"); return null; }
  const adminClientIdx = data.clients.findIndex(c=>c.id===adminClient);
  const adminCc = cClr(Math.max(0,adminClientIdx));

  return (
    <div style={S.adminWrap}>
      <style>{cfStyle}</style>
      <div style={S.hdr}>
        <button style={{...S.btnSecondary,display:"flex",alignItems:"center",gap:6,fontSize:13}} onClick={()=>setAdminView("clients")}>← Clients</button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,color:saving?T.textSecondary:T.green}}>{saving?"Guardant...":"✓ Guardat"}</span>
          <button style={{...S.btnDanger,fontSize:11}} onClick={async()=>{
            if(!window.confirm(`Segur que vols eliminar "${adminClientData?.name}"? Aquesta acció eliminarà totes les seves dades, historial i sessions. No es pot desfer.`)) return;
            const nd={...data,clients:data.clients.filter(c=>c.id!==adminClient),routines:Object.fromEntries(Object.entries(data.routines||{}).filter(([k])=>String(k)!==String(adminClient)))};
            setAdminView("clients");
            setData(nd);
            setClientHistories(p=>{const np={...p};delete np[adminClient];return np;});
            persist(nd);
            try { await remove(ref(db,`history-${adminClient}`)); } catch {}
            try { await remove(ref(db,`active-sessions/${adminClient}`)); } catch {}
          }}>🗑️ Eliminar client</button>
        </div>
      </div>
      <div style={S.detailHeader}>
        <div style={S.avatar(adminCc)}>{adminClientData?.avatar}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:20,color:T.headerText}}>{adminClientData?.name}</div>
          <div style={{fontSize:14,color:T.accentDim,marginTop:4}}>{adminClientData?.goal}</div>
        </div>
        <div style={{display:"flex",gap:5,flexShrink:0}}>
          <button style={{...S.btnSecondary,fontSize:11,padding:"4px 8px"}} onClick={()=>copyToClipboard(getClientAccessLink(adminClientData),"Enllaç copiat!")}>🔗</button>
          <button style={{...S.btnSecondary,fontSize:11,padding:"4px 8px"}} onClick={()=>copyToClipboard(getClientInviteMessage(adminClientData),"Missatge copiat!")}>✉️</button>
          <button style={{...S.btnSecondary,fontSize:11,padding:"4px 8px"}} onClick={()=>window.open(getClientAccessLink(adminClientData),"_blank")}>👁</button>
          <button style={{...S.btnSecondary,fontSize:11,padding:"4px 8px",color:T.orange}} onClick={()=>{
            if(!window.confirm("Si regeneres l'accés, l'enllaç anterior deixarà de funcionar. Vols continuar?")) return;
            const newToken = generateAccessToken();
            const nd = {...data,clients:data.clients.map(c=>c.id===adminClient?{...c,accessToken:newToken}:c)};
            updateData(nd);
            alert("Nou accés generat. Copia el nou enllaç i envia'l al client.");
          }}>🔄</button>
        </div>
      </div>
      <div style={{background:"#ffffff",borderRadius:20,marginTop:-10,paddingBottom:"2rem",color:T.textOnLight}}>
      <div style={{display:"flex",borderBottom:`1.5px solid ${T.border}`,padding:"0 1.25rem",overflowX:"auto"}}>
        {[["dades","Dades"],["routine","Entrenaments"],["history","Historial"],["seguiment","Seguiment"]].map(([tab,label])=>(
          <button key={tab} onClick={()=>{if(tab==="history"||tab==="seguiment"){loadClientHistory(adminClient);}setAdminTab(tab);}} style={{padding:"10px 14px",fontSize:13,cursor:"pointer",background:"none",border:"none",borderBottom:`2px solid ${adminTab===tab?T.accent:"transparent"}`,color:adminTab===tab?T.accent:T.textOnLight,fontWeight:adminTab===tab?500:400,marginBottom:-1,whiteSpace:"nowrap",flexShrink:0}}>{label}</button>
        ))}
      </div>

      {adminTab==="dades"&&(()=>{
        const client=data.clients.find(c=>c.id===adminClient);
        const fields=[
          {key:"age",label:"Edat",placeholder:"Ex. 28"},
          {key:"level",label:"Nivell",type:"select",options:["principiant","intermedi","avançat"]},
          {key:"place",label:"Lloc d'entrenament",type:"select",options:["gimnàs","casa","exterior","pista","altre"]},
          {key:"material",label:"Material disponible",placeholder:"Ex. manuelles, goma..."},
          {key:"startDate",label:"Data d'inici",placeholder:"Ex. 01/01/2025"},
          {key:"injuries",label:"Lesions prèvies",placeholder:"Ex. genoll dret..."},
          {key:"currentPain",label:"Dolor actual",placeholder:"Ex. cap / lumbar..."},
          {key:"avoidEx",label:"Exercicis a evitar",placeholder:"Ex. sentadilla profunda..."},
          {key:"likes",label:"Exercicis que li agraden",placeholder:"Ex. rem, dominades..."},
          {key:"dislikes",label:"Exercicis que no li agraden",placeholder:"Ex. burpees..."},
          {key:"email",label:"Email",placeholder:"correu@email.com"},
          {key:"phone",label:"Telèfon",placeholder:"600 000 000"},
          {key:"sport",label:"Esport principal",placeholder:"Ex. Pàdel"},
          {key:"availability",label:"Dies disponibles",placeholder:"Ex. 3 dies/setmana"},
          {key:"matchDays",label:"Quins dies",placeholder:"Ex. Dilluns, Dimecres..."},
          {key:"secondaryGoal",label:"Objectiu secundari",placeholder:""},
          {key:"healthNotes",label:"Notes de salut",placeholder:""},
          {key:"trainingPreferences",label:"Preferències d'entrenament",placeholder:""},
          {key:"source",label:"Com ha trobat el servei",placeholder:""},
          {key:"coachNotes",label:"Notes internes (admin)",placeholder:"Notes privades de l'entrenador..."},
          {key:"onboardingNotes",label:"Notes d'incorporació (admin)",placeholder:""},
        ];
        const saveClientData=()=>{const nd={...data,clients:data.clients.map(c=>c.id===adminClient?{...c,...clientDraft}:c)};updateData(nd);setEditingClient(false);};
        return (
          <div style={S.sec}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontWeight:500,fontSize:14,color:T.textPrimary}}>Fitxa de {client?.name}</div>
              {!editingClient?<button style={{...S.btnSecondary,fontSize:12}} onClick={()=>{setClientDraft({...client});setEditingClient(true);}}>Editar dades</button>:(
                <div style={{display:"flex",gap:8}}>
                  <button style={{...S.btnSecondary,fontSize:12}} onClick={()=>setEditingClient(false)}>Cancel·lar</button>
                  <button style={{...S.btnPrimary,width:"auto",padding:"6px 14px",fontSize:12}} onClick={saveClientData}>Guardar</button>
                </div>
              )}
            </div>
            <div style={{...S.card,marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Dades bàsiques</div>
              <div style={{marginBottom:8}}><label style={S.lbl}>Nom complet</label>{editingClient?<input style={S.inp} value={clientDraft?.name||""} onChange={e=>setClientDraft(p=>({...p,name:e.target.value}))}/>:<div style={{fontSize:14,color:T.textPrimary,fontWeight:500}}>{client?.name}</div>}</div>
              <div style={{marginBottom:8}}><label style={S.lbl}>Objectiu principal</label>{editingClient?<input style={S.inp} value={clientDraft?.goal||""} onChange={e=>setClientDraft(p=>({...p,goal:e.target.value}))}/>:<div style={{fontSize:13,color:T.textPrimary}}>{client?.goal||"—"}</div>}</div>
              {fields.slice(0,5).map(f=>(
                <div key={f.key} style={{marginBottom:8}}>
                  <label style={S.lbl}>{f.label}</label>
                  {editingClient?f.type==="select"?<select style={S.inp} value={clientDraft?.[f.key]||""} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}>{f.options.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input style={S.inp} value={clientDraft?.[f.key]||""} placeholder={f.placeholder} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}/>:<div style={{fontSize:13,color:T.textPrimary}}>{client?.[f.key]||"—"}</div>}
                </div>
              ))}
            </div>
            <div style={{...S.card,marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Salut i limitacions</div>
              {fields.slice(5,8).map(f=>(
                <div key={f.key} style={{marginBottom:8}}>
                  <label style={S.lbl}>{f.label}</label>
                  {editingClient?<input style={S.inp} value={clientDraft?.[f.key]||""} placeholder={f.placeholder} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}/>:<div style={{fontSize:13,color:T.textPrimary}}>{client?.[f.key]||"—"}</div>}
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Preferències i notes</div>
              {fields.slice(8).map(f=>(
                <div key={f.key} style={{marginBottom:8}}>
                  <label style={S.lbl}>{f.label}</label>
                  {editingClient?<textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={clientDraft?.[f.key]||""} placeholder={f.placeholder} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}/>:<div style={{fontSize:13,color:T.textPrimary}}>{client?.[f.key]||"—"}</div>}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {adminTab==="history"&&(()=>{
        const history=clientHistories[normalizeClientId(adminClient)]||[];
        const client=data.clients.find(c=>c.id===adminClient);
        const totalS=history.length;
        const fullS=history.filter(s=>s.completionPercentage===100).length;
        const lastS=history[0];
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
                  {[{label:"Sessions",value:totalS,color:T.accent},{label:"Completes",value:fullS,color:T.green},{label:"Última",value:lastS?.date||"—",color:T.purple}].map(st=>(
                    <div key={st.label} style={{background:T.card,borderRadius:12,padding:"0.75rem",textAlign:"center",border:`1.5px solid ${T.border}`}}>
                      <div style={{fontSize:st.label==="Última"?13:20,fontWeight:500,color:st.color}}>{st.value}</div>
                      <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{st.label}</div>
                    </div>
                  ))}
                </div>
                {history.map((sess,idx)=>{
                  const sessId=sess.id||`${adminClient}-${idx}`;
                  const isExpanded=!!expandedHistory[sessId];
                  const full=sess.completionPercentage===100;
                  const exercises=sess.exercises||[];
                  return (
                    <div key={sessId} style={S.card}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:500,fontSize:13,color:'#1a3a6b'}}>{sess.sessionTitle||sess.day||"Sessió"}</div>
                          <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{sess.date}{sess.durationReal&&<span style={{color:'#e8d800',fontWeight:500}}> · {sess.durationReal} min</span>}</div>
                        </div>
                        <button style={{...S.btnDanger,fontSize:11,padding:"3px 8px"}} onClick={()=>deleteHistorySession(adminClient,sessId)}>🗑️</button>
                      </div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                        <span style={full?S.tag("green"):S.tag()}>{full?"✓ Complet":`${sess.completionPercentage||0}%`}</span>
                        {sess.rpe&&<span style={getRpeTagStyle(sess.rpe)}>RPE {sess.rpe}</span>}
                        {sess.durationReal&&<span style={S.tag("accent")}>⏱ {sess.durationReal} min</span>}
                        {(()=>{const l=getSessionInternalLoad(sess);return l!=null?<span style={S.tag("accent")}>{l} UA</span>:null;})()}
                        {sess.feeling&&<span style={getFeelingTagStyle(sess.feeling)}>{sess.feeling}</span>}
                        {exercises.filter(e=>e.isExtra&&!e.isCustom).length>0&&<span style={S.tag()}>+{exercises.filter(e=>e.isExtra&&!e.isCustom).length} extra</span>}
                        {exercises.filter(e=>e.isCustom).length>0&&<span style={{...S.tag("purple"),fontSize:10}}>+{exercises.filter(e=>e.isCustom).length} personalitzat</span>}
                      </div>
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:8}}><span style={{color:'#4ade80',fontWeight:500}}>{sess.completedExercises||0}</span>/{sess.totalExercises||0} exercicis</div>
                      <ProgressBar value={sess.completedExercises||0} total={sess.totalExercises||1} color={full?T.green:T.accent}/>
                      <div style={{display:"flex",gap:6,marginTop:10}}>
                        <button onClick={()=>setExpandedHistory(p=>({...p,[sessId]:!p[sessId]}))} style={{...S.btnSecondary,flex:1,textAlign:"center",fontSize:12}}>{isExpanded?"▲ Amagar":"▼ Detalls"}</button>
                        <button style={{...S.btnSecondary,flex:1,textAlign:"center",fontSize:12}} onClick={()=>openEditHistorySession(adminClient,sess,sessId)}>✏️ Editar</button>
                      </div>
                      {isExpanded&&(
                        <div style={{marginTop:10,paddingTop:10,borderTop:`1.5px solid ${T.border}`}}>
                          {sess.checkIn?.completedAt&&(
                            <div style={{background:T.card2,borderRadius:8,padding:"8px 10px",marginBottom:10}}>
                              <div style={{fontWeight:500,fontSize:11,color:'#1a3a6b',marginBottom:6,textTransform:"uppercase",letterSpacing:"0.5px"}}>Check-in inicial</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:8,fontSize:12,color:T.textSecondary}}>
                                {sess.checkIn.energy&&<span>⚡ Energia {sess.checkIn.energy}/5</span>}
                                {sess.checkIn.sleep&&<span>😴 Son {sess.checkIn.sleep}/5</span>}
                                {sess.checkIn.stress&&<span>🧠 Estrès {sess.checkIn.stress}/5</span>}
                                {sess.checkIn.fatigue&&<span>💪 Fatiga {sess.checkIn.fatigue}/5</span>}
                                {sess.checkIn.pain!==""&&sess.checkIn.pain!=null&&<span style={{color:Number(sess.checkIn.pain)>=5?T.danger:T.textSecondary}}>🩹 Dolor {sess.checkIn.pain}/10{sess.checkIn.painZone?` · ${sess.checkIn.painZone}`:""}</span>}
                              </div>
                              {sess.checkIn.notes&&<div style={{fontSize:11,color:T.textMuted,marginTop:4,fontStyle:"italic"}}>"{sess.checkIn.notes}"</div>}
                            </div>
                          )}
                          {sess.clientNotes&&<div style={{fontSize:12,color:'#6b7280',marginBottom:10,fontStyle:"italic",background:'#f8fafc',borderRadius:8,padding:"6px 10px"}}>💬 {sess.clientNotes}</div>}
                          {exercises.map((e,i)=>(
                            <div key={i} style={{marginBottom:10,paddingBottom:10,borderBottom:`1.5px solid ${T.border}`}}>
                              <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginBottom:4}}>
                                <span style={{fontSize:13,fontWeight:500,color:e.completed?'#4ade80':'#1a3a6b'}}>{e.completed?"✓":"○"} {e.name}</span>
                                {e.isCustom&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:T.purpleBg,color:T.purple,border:`1.5px solid #3A3A60`}}>Personalitzat</span>}
                                {e.isExtra&&!e.isCustom&&<span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:T.card2,color:T.textSecondary,border:`1.5px solid ${T.border}`}}>Extra</span>}
                              </div>
                              <div style={{fontSize:11,color:'#374151',marginBottom:4}}>{e.plannedSets||0} sèries · {e.plannedReps||"?"} reps{e.plannedLoad?` · ${e.plannedLoad}`:""}{e.plannedRest?` · ${e.plannedRest}`:""}</div>
                              {e.observations&&<div style={{fontSize:11,color:'#6b7280',marginBottom:4,fontStyle:"italic"}}>💬 {e.observations}</div>}
                              {Object.values(e.sets||{}).map((st,j)=>{
                                const parts=[];
                                if(st.reps) parts.push(`${st.reps} reps`);
                                if(st.load) parts.push(st.load);
                                if(st.rest) parts.push(st.rest);
                                return <div key={j} style={{fontSize:11,color:st.completed?'#4ade80':'#6b7280',padding:"1px 0 1px 10px"}}>S{j+1}: {parts.length>0?parts.join(" · "):"—"} {st.completed?"✓":"○"}</div>;
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      })()}

      {adminTab==="seguiment"&&(()=>{
        const history = clientHistories[adminClient]||[];
        const ts = getClientTrackingStats(history);
        const clientData = data.clients.find(c=>c.id===adminClient);
        const alertsForTracking = ts ? getClientAlerts({
          totalSessions:ts.totalSessions, sessionsThisWeek:ts.sessionsThisWeek,
          lastSession:ts.lastSession, avgRpeRecent:ts.avgRpeRecent,
          weeklyInternalLoad:ts.weeklyInternalLoad, lastInternalLoad:ts.lastInternalLoad,
          lastCompletion:ts.lastSession?.completionPercentage??100, lastFeeling:ts.lastSession?.feeling||null,
        }) : [];

        const StatCard = ({label,value,color}) => (
          <div style={{background:T.card2,borderRadius:12,padding:"0.75rem",textAlign:"center",border:`1.5px solid ${T.border}`}}>
            <div style={{fontSize:18,fontWeight:500,color:color||T.accent}}>{value??"-"}</div>
            <div style={{fontSize:10,color:T.textSecondary,marginTop:2}}>{label}</div>
          </div>
        );

        const SectionTitle = ({children}) => (
          <div style={{fontSize:11,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10,marginTop:20}}>{children}</div>
        );

        if(!ts) return (
          <div style={S.sec}>
            <div style={{textAlign:"center",padding:"3rem 0",color:T.textSecondary}}>
              <div style={{fontSize:36,marginBottom:12}}>📊</div>
              <div style={{fontWeight:500,color:T.textPrimary,marginBottom:8}}>Encara no hi ha dades de seguiment</div>
              <div style={{fontSize:13,lineHeight:1.6}}>Quan {clientData?.name} completi entrenaments, aquí apareixeran la càrrega, l'RPE, el check-in i l'evolució.</div>
            </div>
          </div>
        );

        return (
          <div style={S.sec}>
            {/* Resum ràpid */}
            <SectionTitle>Resum</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:4}}>
              <StatCard label="Sessions totals" value={ts.totalSessions} color={T.accent}/>
              <StatCard label="Aquesta setmana" value={ts.sessionsThisWeek} color={T.green}/>
              <StatCard label="Últims 30 dies" value={ts.sessionsLast30Days} color={T.purple}/>
              <StatCard label="Última sessió" value={ts.lastSessionTitle||(ts.lastSessionDate?ts.lastSessionDate:"—")} color={T.textPrimary}/>
            </div>

            {/* Càrrega i entrenament */}
            <SectionTitle>Càrrega i entrenament</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:10}}>
              <StatCard label="Càrrega setmana" value={ts.weeklyInternalLoad!=null?`${ts.weeklyInternalLoad} UA`:"-"} color={T.orange}/>
              <StatCard label="Càrrega 30 dies" value={ts.last30DaysInternalLoad!=null?`${ts.last30DaysInternalLoad} UA`:"-"} color={T.orange}/>
              <StatCard label="Última càrrega" value={ts.lastInternalLoad!=null?`${ts.lastInternalLoad} UA`:"-"} color={T.accent}/>
              <StatCard label="Durada setmana" value={ts.totalDurationThisWeek!=null?`${ts.totalDurationThisWeek} min`:"-"} color={T.green}/>
            </div>
            {ts.recentSessions.filter(s=>getSessionInternalLoad(s)!=null).length>0&&(
              <div style={{...S.card,marginBottom:4}}>
                <div style={{fontSize:11,color:T.textSecondary,marginBottom:8}}>Últimes sessions amb càrrega</div>
                {ts.recentSessions.filter(s=>getSessionInternalLoad(s)!=null).map((s,i)=>{
                  const load=getSessionInternalLoad(s);
                  const maxLoad = Math.max(...ts.recentSessions.map(x=>getSessionInternalLoad(x)||0));
                  const pct = maxLoad>0?Math.round((load/maxLoad)*100):0;
                  return (
                    <div key={i} style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                        <span style={{fontSize:12,color:T.textPrimary}}>{s.sessionTitle||s.day||"Sessió"}</span>
                        <span style={{fontSize:11,color:T.orange,fontWeight:500}}>{load} UA</span>
                      </div>
                      <div style={{height:4,borderRadius:2,background:T.border}}>
                        <div style={{height:"100%",width:`${pct}%`,background:T.orange,borderRadius:2}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* RPE i esforç */}
            <SectionTitle>RPE i esforç</SectionTitle>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:10}}>
              <StatCard label="RPE mitjà recent" value={ts.avgRpeRecent!=null?`${ts.avgRpeRecent}/10`:"-"} color={ts.avgRpeRecent>=8?T.danger:ts.avgRpeRecent>=6?T.orange:T.green}/>
              <StatCard label="Últim RPE" value={ts.lastRpe!=null?`${ts.lastRpe}/10`:"-"} color={Number(ts.lastRpe)>=8?T.danger:Number(ts.lastRpe)>=6?T.orange:T.green}/>
            </div>
            {ts.recentSessions.filter(s=>s.rpe).length>0&&(
              <div style={{...S.card,marginBottom:4}}>
                <div style={{fontSize:11,color:T.textSecondary,marginBottom:8}}>Últims RPE</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {ts.recentSessions.filter(s=>s.rpe).map((s,i)=>{
                    const c=getRpeColor(Number(s.rpe));
                    return (
                      <div key={i} style={{textAlign:"center"}}>
                        <div style={{width:36,height:36,borderRadius:8,border:`2px solid ${c.text}`,background:c.bg,color:c.text,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:14}}>{s.rpe}</div>
                        <div style={{fontSize:9,color:T.textMuted,marginTop:2}}>{s.date?.slice(-5)||""}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Check-in i recuperació */}
            <SectionTitle>Check-in i recuperació</SectionTitle>
            {(ts.avgEnergyRecent||ts.avgSleepRecent||ts.avgStressRecent||ts.avgFatigueRecent||ts.avgPainRecent!=null)?(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
                  {[
                    {label:"Energia",value:ts.avgEnergyRecent!=null?`${ts.avgEnergyRecent}/5`:"-",color:ts.avgEnergyRecent!=null&&ts.avgEnergyRecent<=2?T.danger:T.green},
                    {label:"Son",value:ts.avgSleepRecent!=null?`${ts.avgSleepRecent}/5`:"-",color:ts.avgSleepRecent!=null&&ts.avgSleepRecent<=2?T.danger:T.green},
                    {label:"Estrès",value:ts.avgStressRecent!=null?`${ts.avgStressRecent}/5`:"-",color:ts.avgStressRecent!=null&&ts.avgStressRecent>=4?T.orange:T.textPrimary},
                    {label:"Fatiga",value:ts.avgFatigueRecent!=null?`${ts.avgFatigueRecent}/5`:"-",color:ts.avgFatigueRecent!=null&&ts.avgFatigueRecent>=4?T.orange:T.textPrimary},
                    {label:"Dolor mitjà",value:ts.avgPainRecent!=null?`${ts.avgPainRecent}/10`:"-",color:ts.avgPainRecent!=null&&ts.avgPainRecent>=5?T.danger:T.textPrimary},
                  ].map(st=><StatCard key={st.label} label={st.label} value={st.value} color={st.color}/>)}
                </div>
                {ts.lastPain!=null&&Number(ts.lastPain)>0&&(
                  <div style={{...S.card,background:T.dangerBg,border:`1.5px solid ${T.danger}40`,marginBottom:4}}>
                    <div style={{fontSize:12,color:T.danger,fontWeight:500}}>Últim dolor reportat</div>
                    <div style={{fontSize:13,color:T.textPrimary,marginTop:4}}>{ts.lastPainZone?`${ts.lastPainZone} · `:""}{ts.lastPain}/10</div>
                  </div>
                )}
              </>
            ):(
              <div style={{fontSize:13,color:T.textMuted,padding:"8px 0"}}>Encara no hi ha dades de check-in.</div>
            )}

            {/* Últimes sessions */}
            <SectionTitle>Últimes sessions</SectionTitle>
            <div style={S.card}>
              {ts.recentSessions.map((s,i)=>{
                const load=getSessionInternalLoad(s);
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<ts.recentSessions.length-1?`1.5px solid ${T.border}`:"none"}}>
                    <div style={{fontSize:11,color:T.textMuted,width:42,flexShrink:0}}>{s.date||""}</div>
                    <div style={{flex:1,fontSize:12,color:T.textPrimary}}>{s.sessionTitle||s.day||"Sessió"}</div>
                    <div style={{display:"flex",gap:5,flexShrink:0}}>
                      {s.rpe&&<span style={getRpeTagStyle(s.rpe,10)}>RPE {s.rpe}</span>}
                      {load!=null&&<span style={{...S.tag("accent"),fontSize:10}}>{load} UA</span>}
                      {s.completionPercentage!=null&&<span style={{...S.tag(s.completionPercentage===100?"green":""),fontSize:10}}>{s.completionPercentage}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Alertes recents */}
            <SectionTitle>Alertes recents</SectionTitle>
            <div style={S.card}>
              {alertsForTracking.length===0?(
                <div style={{fontSize:12,color:T.textMuted}}>Sense alertes recents.</div>
              ):(
                alertsForTracking.map((a,i)=>{
                  const col = a.severity==="danger"?T.danger:a.severity==="warning"?T.orange:T.purple;
                  return (
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:i<alertsForTracking.length-1?10:0}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:col,marginTop:5,flexShrink:0}}/>
                      <div>
                        <div style={{fontSize:12,color:col,fontWeight:500}}>{a.label}</div>
                        <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{a.detail}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {adminTab==="routine"&&(()=>{
        return (
          <div style={S.sec}>
            <div style={{display:"flex",gap:0,marginBottom:16,borderBottom:`1.5px solid ${T.border}`}}>
              {[["rutina","📅 Rutina"],["plantilles","📋 Plantilles"],["biblioteca","📚 Biblioteca"]].map(([tab,label])=>(
                <button key={tab} onClick={()=>setAdminRoutineTab(tab)} style={{padding:"8px 14px",fontSize:12,cursor:"pointer",background:"none",border:"none",borderBottom:`2px solid ${adminRoutineTab===tab?T.accent:"transparent"}`,color:adminRoutineTab===tab?T.accent:T.textOnLight,fontWeight:adminRoutineTab===tab?500:400,marginBottom:-1}}>{label}</button>
              ))}
            </div>
            {adminRoutineTab==="rutina"&&(()=>{
              const schedule=getClientSchedule(adminClient);
              const templates=getClientTemplates(adminClient);
              const adminHistory=clientHistories[normalizeClientId(adminClient)]||[];
              const adminClientIdx=data.clients.findIndex(c=>c.id===adminClient);
              const adminOv=getClientScheduleOverrides(adminClient);
              const updateSchedule=(day,tplIds)=>updateClientSchedule(adminClient,{...schedule,[day]:tplIds});
              return (
                <CalendarComp
                  clientIdx={adminClientIdx}
                  schedule={schedule}
                  scheduleOverrides={adminOv}
                  templates={templates}
                  history={adminHistory}
                  calView={adminCalView}
                  setCalView={setAdminCalView}
                  calBase={adminCalBase}
                  setCalBase={setAdminCalBase}
                  calDetail={adminCalDetail}
                  setCalDetail={setAdminCalDetail}
                  onStartSession={null}
                  isAdmin={true}
                  onAddTemplate={(day,tplId)=>updateSchedule(day,[...(schedule[day]||[]),tplId])}
                  onRemoveTemplate={(day,tplId)=>updateSchedule(day,(schedule[day]||[]).filter(id=>id!==tplId))}
                  onAddTemplateOverride={(dateIso,tplId)=>{const e=calGetOvEntry(adminOv,dateIso);if(!e.ids.includes(tplId))updateClientScheduleOverrides(adminClient,{...adminOv,[dateIso]:{...e,ids:[...e.ids,tplId]}});}}
                  onRemoveTemplateOverride={(dateIso,tplId)=>{const e=calGetOvEntry(adminOv,dateIso);const nd={...e,ids:e.ids.filter(id=>id!==tplId),edits:{...e.edits}};delete nd.edits[tplId];updateClientScheduleOverrides(adminClient,{...adminOv,[dateIso]:nd});}}
                  onEditTemplateOverride={(dateIso,tplId,exercises)=>{const e=calGetOvEntry(adminOv,dateIso);updateClientScheduleOverrides(adminClient,{...adminOv,[dateIso]:{...e,edits:{...e.edits,[tplId]:{exercises}}}});}}
                />
              );
            })()}
            {adminRoutineTab==="plantilles"&&(()=>{
              const templates=getClientTemplates(adminClient);
              const updateTemplates=(tpls)=>updateClientTemplates(adminClient,tpls);
              const deleteTemplate=(id)=>updateTemplates(templates.filter(t=>t.id!==id));
              const duplicateTemplate=(tpl)=>{
                const copy={...tpl,id:`tpl_${Date.now()}`,name:`${tpl.name} (còpia)`,exercises:tpl.exercises.map(e=>({...e,id:`tex_${Date.now()}_${Math.random().toString(36).slice(2)}`}))};
                updateTemplates([...templates,copy]);
              };
              return (
                <div>
                  {templates.map(tpl=>(
                    editingTemplate?.id===tpl.id?(
                      <FormCard key={tpl.id} style={{background:'#ffffff',border:'1.5px solid #c7d2fe'}}>
                        <div style={{fontWeight:500,fontSize:13,color:'#1a3a6b',marginBottom:12}}>Editar plantilla</div>
                        <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.formInp} value={editingTemplate.name} onChange={e=>setEditingTemplate(p=>({...p,name:e.target.value}))}/></div>
                        <div style={{marginBottom:8}}><label style={S.lbl}>Objectiu</label><input style={S.formInp} value={editingTemplate.objective} onChange={e=>setEditingTemplate(p=>({...p,objective:e.target.value}))}/></div>
                        <div style={{...S.row,marginBottom:8}}>
                          <div style={{flex:1}}><label style={S.lbl}>Tipus</label><input style={S.formInp} value={editingTemplate.type} onChange={e=>setEditingTemplate(p=>({...p,type:e.target.value}))}/></div>
                          <div style={{flex:1}}><label style={S.lbl}>Durada</label><input style={S.formInp} value={editingTemplate.estimatedDuration} onChange={e=>setEditingTemplate(p=>({...p,estimatedDuration:e.target.value}))}/></div>
                        </div>
                        <div style={{fontSize:12,fontWeight:500,color:'#1a3a6b',marginBottom:8}}>Exercicis</div>
                        {(editingTemplate.exercises||[]).map((ex,i)=>(
                          <div key={ex.id} style={{...S.card,marginBottom:6}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,gap:6}}>
                                <input style={{...S.formInp,fontWeight:500,flex:1}} value={ex.name} onChange={e=>setEditingTemplate(p=>({...p,exercises:p.exercises.map((ex2,j)=>j===i?{...ex2,name:e.target.value}:ex2)}))} placeholder="Nom exercici"/>
                                <div style={{display:"flex",gap:4,flexShrink:0}}>
                                  <button style={{...S.btnSecondary,padding:"4px 7px",fontSize:13}} onClick={()=>setEditingTemplate(p=>{const exs=[...p.exercises];if(i===0)return p;[exs[i-1],exs[i]]=[exs[i],exs[i-1]];return {...p,exercises:exs};})} disabled={i===0}>↑</button>
                                  <button style={{...S.btnSecondary,padding:"4px 7px",fontSize:13}} onClick={()=>setEditingTemplate(p=>{const exs=[...p.exercises];if(i===exs.length-1)return p;[exs[i+1],exs[i]]=[exs[i],exs[i+1]];return {...p,exercises:exs};})} disabled={i===editingTemplate.exercises.length-1}>↓</button>
                                  <button style={S.btnDanger} onClick={()=>setEditingTemplate(p=>({...p,exercises:p.exercises.filter((_,j)=>j!==i)}))}>×</button>
                                </div>
                              </div>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                              <div style={{flex:1,minWidth:60}}><label style={S.lbl}>Sèries</label><input style={S.formInp} type="number" value={ex.plannedSets} onChange={e=>setEditingTemplate(p=>({...p,exercises:p.exercises.map((ex2,j)=>j===i?{...ex2,plannedSets:+e.target.value}:ex2)}))}/></div>
                              <div style={{flex:1,minWidth:60}}><label style={S.lbl}>Reps</label><input style={S.formInp} value={ex.plannedReps} onChange={e=>setEditingTemplate(p=>({...p,exercises:p.exercises.map((ex2,j)=>j===i?{...ex2,plannedReps:e.target.value}:ex2)}))}/></div>
                              <div style={{flex:1,minWidth:60}}><label style={S.lbl}>Càrrega</label><input style={S.formInp} value={ex.plannedLoad} onChange={e=>setEditingTemplate(p=>({...p,exercises:p.exercises.map((ex2,j)=>j===i?{...ex2,plannedLoad:e.target.value}:ex2)}))}/></div>
                              <div style={{flex:1,minWidth:60}}><label style={S.lbl}>Descans</label><input style={S.formInp} value={ex.plannedRest} onChange={e=>setEditingTemplate(p=>({...p,exercises:p.exercises.map((ex2,j)=>j===i?{...ex2,plannedRest:e.target.value}:ex2)}))}/></div>
                            </div>
                            <div style={{marginTop:6}}><label style={S.lbl}>Observacions</label><textarea style={{...S.formInp,minHeight:70,resize:"vertical"}} value={ex.observations||""} placeholder="Indicacions específiques..." onChange={e=>setEditingTemplate(p=>({...p,exercises:p.exercises.map((ex2,j)=>j===i?{...ex2,observations:e.target.value}:ex2)}))}></textarea></div>
                          </div>
                        ))}
                        <select style={{...S.formInp,fontSize:12,marginBottom:12}} value="" onChange={e=>{const libEx=getClientLibrary(adminClient).find(l=>l.id===e.target.value);if(libEx) setEditingTemplate(p=>({...p,exercises:[...p.exercises,{id:`tex_${Date.now()}`,exerciseId:libEx.id,name:libEx.name,plannedSets:libEx.defaultSets,plannedReps:libEx.defaultReps,plannedLoad:libEx.defaultLoad||"",plannedRest:libEx.defaultRest||"",observations:"",order:p.exercises.length+1}]}));}}>
                          <option value="">+ Afegir exercici de la biblioteca...</option>
                          {getClientLibrary(adminClient).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <div style={{...S.row,justifyContent:"flex-end"}}>
                          <button style={S.btnSecondary} onClick={()=>setEditingTemplate(null)}>Cancel·lar</button>
                          <button style={{...S.btnPrimary,width:"auto",padding:"7px 16px",fontSize:13,marginLeft:8}} onClick={()=>{updateTemplates(templates.map(t=>t.id===editingTemplate.id?editingTemplate:t));setEditingTemplate(null);}}>Guardar</button>
                        </div>
                      </FormCard>
                    ):(
                      <div key={tpl.id} style={S.card}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                          <div>
                            <div style={{fontWeight:500,fontSize:14,color:T.textPrimary}}>{tpl.name}</div>
                            <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>{tpl.objective} · {tpl.estimatedDuration}</div>
                          </div>
                          <div style={{display:"flex",gap:4}}>
                            <button style={S.btnEdit} onClick={()=>setEditingTemplate({...tpl,exercises:[...tpl.exercises]})}>Editar</button>
                            <button style={S.btnEdit} onClick={()=>duplicateTemplate(tpl)}>Duplicar</button>
                            <button style={S.btnDanger} onClick={()=>deleteTemplate(tpl.id)}>Eliminar</button>
                          </div>
                        </div>
                        <div style={{fontSize:11,color:T.textSecondary,marginBottom:8}}>{tpl.exercises?.length||0} exercicis</div>
                        {(tpl.exercises||[]).map((ex,i)=>(
                          <div key={ex.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:`1.5px solid ${T.border}`}}>
                            <span style={{fontSize:12,color:T.textMuted,width:16}}>{i+1}.</span>
                            <span style={{fontSize:13,flex:1,color:T.textPrimary}}>{ex.name}</span>
                            <span style={{fontSize:11,color:T.textSecondary}}>{ex.plannedSets}×{ex.plannedReps}{ex.plannedLoad?` · ${ex.plannedLoad}`:""}</span>
                          </div>
                        ))}
                      </div>
                    )
                  ))}
                  {showAddTemplate?(
                    <FormCard>
                      <div style={{fontWeight:500,fontSize:13,color:'#1a3a6b',marginBottom:12}}>Nova plantilla</div>
                      <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.formInp} value={newTemplate.name} onChange={e=>setNewTemplate(p=>({...p,name:e.target.value}))} placeholder="Ex. Push"/></div>
                      <div style={{marginBottom:8}}><label style={S.lbl}>Objectiu</label><input style={S.formInp} value={newTemplate.objective} onChange={e=>setNewTemplate(p=>({...p,objective:e.target.value}))} placeholder="Ex. Força tren superior"/></div>
                      <div style={{...S.row,marginBottom:12}}>
                        <div style={{flex:1}}><label style={S.lbl}>Tipus</label><input style={S.formInp} value={newTemplate.type} onChange={e=>setNewTemplate(p=>({...p,type:e.target.value}))}/></div>
                        <div style={{flex:1}}><label style={S.lbl}>Durada</label><input style={S.formInp} value={newTemplate.estimatedDuration} onChange={e=>setNewTemplate(p=>({...p,estimatedDuration:e.target.value}))} placeholder="45-60 min"/></div>
                      </div>
                      {(newTemplate.exercises||[]).length>0&&(
                        <div style={{marginBottom:8}}>
                          <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,marginBottom:6}}>Exercicis afegits</div>
                          {(newTemplate.exercises||[]).map((ex,i)=>(
                            <div key={i} style={{...S.card,marginBottom:4,padding:"6px 10px"}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                <span style={{fontSize:13,color:T.textPrimary}}>{ex.name}</span>
                                <button style={S.btnDanger} onClick={()=>setNewTemplate(p=>({...p,exercises:p.exercises.filter((_,j)=>j!==i)}))}>×</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <select style={{...S.formInp,fontSize:12,marginBottom:12}} value="" onChange={e=>{const libEx=getClientLibrary(adminClient).find(l=>l.id===e.target.value);if(libEx) setNewTemplate(p=>({...p,exercises:[...(p.exercises||[]),{id:`tex_${Date.now()}`,exerciseId:libEx.id,name:libEx.name,plannedSets:libEx.defaultSets,plannedReps:libEx.defaultReps,plannedLoad:libEx.defaultLoad||"",plannedRest:libEx.defaultRest||"",observations:"",order:(p.exercises||[]).length+1}]}));}}>
                        <option value="">+ Afegir exercici de la biblioteca...</option>
                        {getClientLibrary(adminClient).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                      <div style={{...S.row,justifyContent:"flex-end"}}>
                        <button style={S.btnSecondary} onClick={()=>setShowAddTemplate(false)}>Cancel·lar</button>
                        <button style={{...S.btnPrimary,width:"auto",padding:"7px 16px",fontSize:13,marginLeft:8}} onClick={()=>{if(!newTemplate.name)return;updateTemplates([...templates,{...newTemplate,id:`tpl_${Date.now()}`}]);setNewTemplate({name:"",description:"",type:"Força",objective:"",estimatedDuration:"",exercises:[]});setShowAddTemplate(false);}}>Crear</button>
                      </div>
                    </FormCard>
                  ):(
                    <button style={{...S.btnSecondary,width:"100%",textAlign:"center",marginTop:4}} onClick={()=>setShowAddTemplate(true)}>+ Nova plantilla</button>
                  )}
                </div>
              );
            })()}
            {adminRoutineTab==="biblioteca"&&(()=>{
              const lib=getClientLibrary(adminClient);
              const updateLib=(l)=>updateClientLibrary(adminClient,l);
              return (
                <div>
                  <div style={{fontSize:12,color:T.textSecondary,marginBottom:12}}>{lib.length} exercicis a la biblioteca</div>
                  {lib.map(ex=>(
                    editingLibEx?.id===ex.id?(
                      <FormCard key={ex.id}>
                        <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.formInp} value={editingLibEx.name} onChange={e=>setEditingLibEx(p=>({...p,name:e.target.value}))}/></div>
                        <div style={{...S.row,marginBottom:8}}>
                          <div style={{flex:1}}><label style={S.lbl}>Categoria</label><input style={S.formInp} value={editingLibEx.category} onChange={e=>setEditingLibEx(p=>({...p,category:e.target.value}))}/></div>
                          <div style={{flex:1}}><label style={S.lbl}>Grup muscular</label><input style={S.formInp} value={editingLibEx.muscleGroup} onChange={e=>setEditingLibEx(p=>({...p,muscleGroup:e.target.value}))}/></div>
                        </div>
                        <div style={{...S.row,marginBottom:8}}>
                          <div style={{flex:1}}><label style={S.lbl}>Sèries</label><input style={S.formInp} type="number" value={editingLibEx.defaultSets} onChange={e=>setEditingLibEx(p=>({...p,defaultSets:+e.target.value}))}/></div>
                          <div style={{flex:1}}><label style={S.lbl}>Reps</label><input style={S.formInp} value={editingLibEx.defaultReps} onChange={e=>setEditingLibEx(p=>({...p,defaultReps:e.target.value}))}/></div>
                          <div style={{flex:1}}><label style={S.lbl}>Descans</label><input style={S.formInp} value={editingLibEx.defaultRest} onChange={e=>setEditingLibEx(p=>({...p,defaultRest:e.target.value}))}/></div>
                        </div>
                        <div style={{marginBottom:8}}><label style={S.lbl}>Material</label><input style={S.formInp} value={editingLibEx.material} onChange={e=>setEditingLibEx(p=>({...p,material:e.target.value}))}/></div>
                        <div style={{marginBottom:8}}><label style={S.lbl}>Indicacions</label><textarea style={{...S.formInp,minHeight:60,resize:"vertical"}} value={editingLibEx.instructions} onChange={e=>setEditingLibEx(p=>({...p,instructions:e.target.value}))}/></div>
                        <div style={{marginBottom:12}}><label style={S.lbl}>Nivell</label><select style={S.formInp} value={editingLibEx.level} onChange={e=>setEditingLibEx(p=>({...p,level:e.target.value}))}>{["Principiant","Intermedi","Avançat"].map(l=><option key={l} value={l}>{l}</option>)}</select></div>
                        <div style={{...S.row,justifyContent:"flex-end"}}>
                          <button style={S.btnSecondary} onClick={()=>setEditingLibEx(null)}>Cancel·lar</button>
                          <button style={{...S.btnPrimary,width:"auto",padding:"7px 16px",fontSize:13,marginLeft:8}} onClick={()=>{updateLib(lib.map(e=>e.id===editingLibEx.id?editingLibEx:e));setEditingLibEx(null);}}>Guardar</button>
                        </div>
                      </FormCard>
                    ):(
                      <div key={ex.id} style={S.card}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                          <div>
                            <div style={{fontWeight:500,fontSize:13,color:T.textPrimary}}>{ex.name}</div>
                            <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{ex.category} · {ex.muscleGroup} · {ex.level}</div>
                            <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{ex.defaultSets}×{ex.defaultReps} · {ex.defaultRest}</div>
                          </div>
                          <div style={{display:"flex",gap:4}}>
                            <button style={S.btnEdit} onClick={()=>setEditingLibEx({...ex})}>Editar</button>
                            <button style={S.btnDanger} onClick={()=>updateLib(lib.filter(e=>e.id!==ex.id))}>Eliminar</button>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                  {showAddLibEx?(
                    <FormCard>
                      <div style={{fontWeight:500,fontSize:13,color:'#1a3a6b',marginBottom:12}}>Nou exercici</div>
                      <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.formInp} value={newLibEx.name} onChange={e=>setNewLibEx(p=>({...p,name:e.target.value}))} placeholder="Ex. Press Banca"/></div>
                      <div style={{...S.row,marginBottom:8}}>
                        <div style={{flex:1}}><label style={S.lbl}>Categoria</label><input style={S.formInp} value={newLibEx.category} onChange={e=>setNewLibEx(p=>({...p,category:e.target.value}))}/></div>
                        <div style={{flex:1}}><label style={S.lbl}>Grup muscular</label><input style={S.formInp} value={newLibEx.muscleGroup} onChange={e=>setNewLibEx(p=>({...p,muscleGroup:e.target.value}))}/></div>
                      </div>
                      <div style={{...S.row,marginBottom:8}}>
                        <div style={{flex:1}}><label style={S.lbl}>Sèries</label><input style={S.formInp} type="number" value={newLibEx.defaultSets} onChange={e=>setNewLibEx(p=>({...p,defaultSets:+e.target.value}))}/></div>
                        <div style={{flex:1}}><label style={S.lbl}>Reps</label><input style={S.formInp} value={newLibEx.defaultReps} onChange={e=>setNewLibEx(p=>({...p,defaultReps:e.target.value}))}/></div>
                        <div style={{flex:1}}><label style={S.lbl}>Descans</label><input style={S.formInp} value={newLibEx.defaultRest} onChange={e=>setNewLibEx(p=>({...p,defaultRest:e.target.value}))}/></div>
                      </div>
                      <div style={{marginBottom:8}}><label style={S.lbl}>Material</label><input style={S.formInp} value={newLibEx.material} onChange={e=>setNewLibEx(p=>({...p,material:e.target.value}))}/></div>
                      <div style={{marginBottom:8}}><label style={S.lbl}>Indicacions</label><textarea style={{...S.formInp,minHeight:60,resize:"vertical"}} value={newLibEx.instructions} onChange={e=>setNewLibEx(p=>({...p,instructions:e.target.value}))}/></div>
                      <div style={{marginBottom:12}}><label style={S.lbl}>Nivell</label><select style={S.formInp} value={newLibEx.level} onChange={e=>setNewLibEx(p=>({...p,level:e.target.value}))}>{["Principiant","Intermedi","Avançat"].map(l=><option key={l} value={l}>{l}</option>)}</select></div>
                      <div style={{...S.row,justifyContent:"flex-end"}}>
                        <button style={S.btnSecondary} onClick={()=>setShowAddLibEx(false)}>Cancel·lar</button>
                        <button style={{...S.btnPrimary,width:"auto",padding:"7px 16px",fontSize:13,marginLeft:8}} onClick={()=>{if(!newLibEx.name)return;updateLib([...lib,{...newLibEx,id:`ex_${Date.now()}`}]);setNewLibEx({name:"",category:"Força",muscleGroup:"",movementPattern:"",material:"",defaultSets:3,defaultReps:"10",defaultLoad:"",defaultRest:"60s",instructions:"",observations:"",level:"Principiant"});setShowAddLibEx(false);}}>Afegir</button>
                      </div>
                    </FormCard>
                  ):(
                    <button style={{...S.btnSecondary,width:"100%",textAlign:"center",marginTop:4}} onClick={()=>setShowAddLibEx(true)}>+ Nou exercici</button>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })()}
      </div>
    </div>
  );
}
