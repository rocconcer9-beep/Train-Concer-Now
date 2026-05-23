import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, set, get } from "firebase/database";

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

const DEFAULT_LIBRARY = [
  {id:"ex_press_banca",name:"Press Banca",category:"Força",muscleGroup:"Pectoral",movementPattern:"Push horitzontal",material:"Barra / Mancuernes",defaultSets:3,defaultReps:"8-10",defaultLoad:"",defaultRest:"90s",instructions:"Controla la baixada i mantén escàpules estables.",observations:"No bloquejar excessivament els colzes.",level:"Intermedi"},
  {id:"ex_press_inclinat",name:"Press Inclinat",category:"Força",muscleGroup:"Pectoral superior",movementPattern:"Push horitzontal inclinat",material:"Barra / Mancuernes",defaultSets:3,defaultReps:"10",defaultLoad:"",defaultRest:"75s",instructions:"Inclinació 30-45 graus.",observations:"",level:"Intermedi"},
  {id:"ex_elevacions",name:"Elevacions laterals",category:"Força",muscleGroup:"Deltoides",movementPattern:"Push lateral",material:"Mancuernes",defaultSets:3,defaultReps:"12-15",defaultLoad:"",defaultRest:"60s",instructions:"Colzes lleugerament flexionats.",observations:"",level:"Principiant"},
  {id:"ex_rem_manc",name:"Rem amb mancuerna",category:"Força",muscleGroup:"Esquena",movementPattern:"Pull horitzontal",material:"Mancuernes",defaultSets:3,defaultReps:"10-12",defaultLoad:"",defaultRest:"75s",instructions:"Esquena recta, tira del colze.",observations:"",level:"Principiant"},
  {id:"ex_jaló",name:"Jaló al pit",category:"Força",muscleGroup:"Dorsal",movementPattern:"Pull vertical",material:"Politja",defaultSets:3,defaultReps:"10-12",defaultLoad:"",defaultRest:"75s",instructions:"Tira fins al pit, escàpules avall.",observations:"",level:"Principiant"},
  {id:"ex_sentadilla",name:"Sentadilla",category:"Força",muscleGroup:"Quàdriceps / Glutis",movementPattern:"Squat",material:"Barra / Pes corporal",defaultSets:3,defaultReps:"8-10",defaultLoad:"",defaultRest:"90s",instructions:"Genolls alineats, esquena recta.",observations:"",level:"Intermedi"},
  {id:"ex_hip_thrust",name:"Hip Thrust",category:"Força",muscleGroup:"Glutis",movementPattern:"Hip hinge",material:"Barra / Mancuernes",defaultSets:3,defaultReps:"10-12",defaultLoad:"",defaultRest:"75s",instructions:"Activa el gluti a dalt.",observations:"",level:"Principiant"},
  {id:"ex_rdl",name:"Pes Mort Romanès",category:"Força",muscleGroup:"Isquiotibials / Glutis",movementPattern:"Hip hinge",material:"Barra / Mancuernes",defaultSets:3,defaultReps:"10",defaultLoad:"",defaultRest:"90s",instructions:"Esquena neutra, baixa controlat.",observations:"",level:"Intermedi"},
  {id:"ex_planxa",name:"Planxa",category:"Core",muscleGroup:"Core",movementPattern:"Antiextensió",material:"Cap",defaultSets:3,defaultReps:"30s",defaultLoad:"",defaultRest:"45s",instructions:"Cos alineat, no elevar malucs.",observations:"",level:"Principiant"},
  {id:"ex_dead_bug",name:"Dead Bug",category:"Core",muscleGroup:"Core",movementPattern:"Antiextensió",material:"Cap",defaultSets:3,defaultReps:"8-10",defaultLoad:"",defaultRest:"45s",instructions:"Esquena enganxada al terra.",observations:"",level:"Principiant"},
];

const DEFAULT_TEMPLATES = [
  {id:"tpl_push",name:"Push",description:"Tren superior empenta",type:"Força",objective:"Força tren superior",estimatedDuration:"45-60 min",exercises:[
    {id:"tex_1",exerciseId:"ex_press_banca",name:"Press Banca",plannedSets:3,plannedReps:"8-10",plannedLoad:"",plannedRest:"90s",observations:"",order:1},
    {id:"tex_2",exerciseId:"ex_press_inclinat",name:"Press Inclinat",plannedSets:3,plannedReps:"10",plannedLoad:"",plannedRest:"75s",observations:"",order:2},
    {id:"tex_3",exerciseId:"ex_elevacions",name:"Elevacions laterals",plannedSets:3,plannedReps:"12-15",plannedLoad:"",plannedRest:"60s",observations:"",order:3},
  ]},
  {id:"tpl_pull",name:"Pull",description:"Tren superior tracció",type:"Força",objective:"Força esquena i bíceps",estimatedDuration:"45-60 min",exercises:[
    {id:"tex_4",exerciseId:"ex_rem_manc",name:"Rem amb mancuerna",plannedSets:3,plannedReps:"10-12",plannedLoad:"",plannedRest:"75s",observations:"",order:1},
    {id:"tex_5",exerciseId:"ex_jaló",name:"Jaló al pit",plannedSets:3,plannedReps:"10-12",plannedLoad:"",plannedRest:"75s",observations:"",order:2},
  ]},
  {id:"tpl_legs",name:"Legs",description:"Tren inferior",type:"Força",objective:"Força tren inferior",estimatedDuration:"50-60 min",exercises:[
    {id:"tex_6",exerciseId:"ex_sentadilla",name:"Sentadilla",plannedSets:3,plannedReps:"8-10",plannedLoad:"",plannedRest:"90s",observations:"",order:1},
    {id:"tex_7",exerciseId:"ex_hip_thrust",name:"Hip Thrust",plannedSets:3,plannedReps:"10-12",plannedLoad:"",plannedRest:"75s",observations:"",order:2},
    {id:"tex_8",exerciseId:"ex_rdl",name:"Pes Mort Romanès",plannedSets:3,plannedReps:"10",plannedLoad:"",plannedRest:"90s",observations:"",order:3},
  ]},
  {id:"tpl_fullbody",name:"Full Body",description:"Cos complet",type:"Força",objective:"Força cos complet",estimatedDuration:"60 min",exercises:[
    {id:"tex_9",exerciseId:"ex_sentadilla",name:"Sentadilla",plannedSets:3,plannedReps:"8-10",plannedLoad:"",plannedRest:"90s",observations:"",order:1},
    {id:"tex_10",exerciseId:"ex_press_banca",name:"Press Banca",plannedSets:3,plannedReps:"8-10",plannedLoad:"",plannedRest:"90s",observations:"",order:2},
    {id:"tex_11",exerciseId:"ex_rem_manc",name:"Rem amb mancuerna",plannedSets:3,plannedReps:"10-12",plannedLoad:"",plannedRest:"75s",observations:"",order:3},
    {id:"tex_12",exerciseId:"ex_planxa",name:"Planxa",plannedSets:3,plannedReps:"30s",plannedLoad:"",plannedRest:"45s",observations:"",order:4},
  ]},
];

const DEFAULT_SCHEDULE = {
  1: {Dilluns:["tpl_push"],Dimarts:[],Dimecres:["tpl_pull"],Dijous:[],Divendres:["tpl_legs","tpl_push","tpl_pull"],Dissabte:[],Diumenge:[]},
  3: {Dilluns:["tpl_push"],Dimarts:[],Dimecres:["tpl_pull"],Dijous:[],Divendres:["tpl_legs"],Dissabte:[],Diumenge:[]},
};
const DEFAULT_DATA = {
  clients:[
    {id:1,name:"Roc Concernau",  goal:"Ús personal",avatar:"RC",routineType:"weekly",templates:[],exerciseLibrary:[],schedule:{Dilluns:[],Dimarts:[],Dimecres:[],Dijous:[],Divendres:[],Dissabte:[],Diumenge:[]}},
    {id:2,name:"Ignasi Concernau",goal:"Entrenament a casa · 3 dies/setmana · 10-15'",avatar:"IC",routineType:"flexible",templates:[],exerciseLibrary:[],schedule:{}},
    {id:3,name:"Marc Perez",     goal:"Rendiment bàsquet",avatar:"MP",routineType:"weekly",templates:[],exerciseLibrary:[],schedule:{Dilluns:[],Dimarts:[],Dimecres:[],Dijous:[],Divendres:[],Dissabte:[],Diumenge:[]}},
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
const [editingClient, setEditingClient] = useState(false);
const [clientDraft, setClientDraft] = useState(null);
  // eslint-disable-next-line no-unused-vars
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
  const [clientViewTab, setClientViewTab] = useState("entrenament");
  // eslint-disable-next-line no-unused-vars
const [selTemplate, setSelTemplate] = useState(null);
const [sessionExercises, setSessionExercises] = useState({});
  const [expandedExercises, setExpandedExercises] = useState({});
  const [showAddExModal, setShowAddExModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
const [finishForm, setFinishForm] = useState({rpe:"",duration:"",feeling:"",notes:""});
  const [adminRoutineTab, setAdminRoutineTab] = useState("rutina");
const [editingTemplate, setEditingTemplate] = useState(null);
const [editingLibEx, setEditingLibEx] = useState(null);
const [showAddTemplate, setShowAddTemplate] = useState(false);
const [showAddLibEx, setShowAddLibEx] = useState(false);
const [newTemplate, setNewTemplate] = useState({name:"",description:"",type:"Força",objective:"",estimatedDuration:"",exercises:[]});
const [newLibEx, setNewLibEx] = useState({name:"",category:"Força",muscleGroup:"",movementPattern:"",material:"",defaultSets:3,defaultReps:"10",defaultLoad:"",defaultRest:"60s",instructions:"",observations:"",level:"Principiant"});

  useEffect(()=>{loadData();},[]);

  const loadData = async () => {
  setLoading(true);
  try {
    const [dr,hr,cr,h1r,h3r] = await Promise.all([
      get(ref(db,"fitcoach-data2")),
      get(ref(db,"history-2")),
      get(ref(db,"fitcoach-completed")),
      get(ref(db,"history-1")),
      get(ref(db,"history-3")),
    ]);
    setData(dr.exists()?dr.val():DEFAULT_DATA);
    setIgnHistory(hr.exists()?Object.values(hr.val()):[]);
    setStdCompleted(cr.exists()?cr.val():{});
    setClientHistories({
      1:h1r.exists()?Object.values(h1r.val()):[],
      2:hr.exists()?Object.values(hr.val()):[],
      3:h3r.exists()?Object.values(h3r.val()):[],
    });
  } catch {setData(DEFAULT_DATA);}
  setLoading(false);
};
  const persist = async (nd) => {setSaving(true);try{await set(ref(db,"fitcoach-data2"),nd);}catch{}setSaving(false);};
  const persistHistory = async (h) => {try{await set(ref(db,"history-2"),h);}catch{}};
  const persistStdCompleted = async (c) => {try{await set(ref(db,"fitcoach-completed"),c);}catch{}};
  const updateData = (d) => {setData(d);persist(d);};

  const loadClientHistory = async (clientId) => {
    if(clientHistories[clientId]!==undefined)return;
    try{const h=await get(ref(db,`history-${clientId}`));setClientHistories(p=>({...p,[clientId]:h.exists()?Object.values(h.val()):[]}));}
    catch{setClientHistories(p=>({...p,[clientId]:[]}));}
  };
  const selectAdminClient = (id) => {setAdminClient(id);setAdminTab("routine");setAdminTab("dades");setEditingClient(false);loadClientHistory(id);};

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
  const saveBlockEdit = () => {const r=getIgnasiRoutine();const blocks=r.blocks.map(b=>b.id===editingBlock.id?{...b,title:editingBlock.title,subtitle:`${parseInt(editingBlock.rounds)||2} voltes`,rounds:parseInt(editingBlock.rounds)||2,rest:editingBlock.rest}:b);updateIgnasiRoutine({...r,blocks});setEditingBlock(null);};

  // Standard helpers
  // eslint-disable-next-line no-unused-vars
  const toggleStdDone = (cid,day,exId) => {const key=`${cid}-${day}-${exId}`;const u={...stdCompleted,[key]:!stdCompleted[key]};setStdCompleted(u);persistStdCompleted(u);};
  const isStdDone = (cid,day,exId) => !!stdCompleted[`${cid}-${day}-${exId}`];
  // eslint-disable-next-line no-unused-vars
  const deleteEx = (exId) => {const r={...data.routines,[adminClient]:{...data.routines[adminClient],[selDay]:data.routines[adminClient][selDay].filter(e=>e.id!==exId)}};updateData({...data,routines:r});};
  // eslint-disable-next-line no-unused-vars
  const saveEdit = () => {const r={...data.routines,[adminClient]:{...data.routines[adminClient],[selDay]:data.routines[adminClient][selDay].map(e=>e.id===editingEx.id?editingEx:e)}};updateData({...data,routines:r});setEditingEx(null);};
  // eslint-disable-next-line no-unused-vars
  const addEx = () => {if(!newEx.name)return;const currentClient=data.routines[adminClient]||DAYS.reduce((a,d)=>({...a,[d]:[]}),{});const currentDay=currentClient[selDay]||[];const r={...data.routines,[adminClient]:{...currentClient,[selDay]:[...currentDay,{...newEx,id:Date.now()}]}};updateData({...data,routines:r});setNewEx({name:"",sets:3,reps:10,unit:"reps",weight:"",notes:"",icon:"dumbbell"});setShowAddEx(false);};
  const addClient = () => {if(!newClient.name)return;const id=Date.now();const avatar=newClient.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();const newC={id,name:newClient.name,goal:newClient.goal,avatar,routineType:"weekly",age:"",level:"principiant",place:"gimnàs",material:"",injuries:"",currentPain:"",avoidEx:"",likes:"",dislikes:"",coachNotes:"",startDate:new Date().toLocaleDateString("ca-ES")};updateData({clients:[...data.clients,newC],routines:{...data.routines,[id]:DAYS.reduce((a,d)=>({...a,[d]:[]}),{})}});setNewClient({name:"",goal:""});setShowAddClient(false);selectAdminClient(id);setAdminTab("dades");};
const saveStdSession = async (clientId, day, exercises, formData) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ca-ES");
  const sessionId = `${clientId}-${day}-${dateStr}-${now.getTime()}`;
  
  // Evitar duplicats: mateix client, dia i data
  const existing = clientHistories[clientId] || [];
  const duplicate = existing.find(s => s.clientId===clientId && s.day===day && s.date===dateStr);
  if(duplicate) return;

  const completedExs = exercises.filter(e => e.sets ? e.sets.every(st=>st.completed) : isStdDone(clientId, day, e.id));
  const record = {
    id: sessionId,
    date: dateStr,
    day,
    clientId,
    sessionTitle: `Entrenament ${day}`,
    completedExercises: completedExs.length,
    totalExercises: exercises.length,
    completionPercentage: Math.round((completedExs.length/exercises.length)*100),
    exercises: exercises.map(e => ({
  name: e.name,
  plannedSets: e.plannedSets||e.sets?.length||0,
  plannedReps: e.plannedReps||e.reps||"",
  sets: (e.sets||[]).map(st=>({
    reps: st.reps||"",
    rest: st.rest||"",
    completed: st.completed||false,
  })),
  completedSets: (e.sets||[]).filter(st=>st.completed).length,
  completed: e.sets ? e.sets.every(st=>st.completed) : isStdDone(clientId, day, e.id),
})),
    rpe: formData.rpe||null,
    durationReal: formData.duration||null,
    feeling: formData.feeling||null,
    clientNotes: formData.notes||"",
    createdAt: now.toISOString(),
  };

  const updated = [record, ...existing].slice(0, 100);
  setClientHistories(p => ({...p, [clientId]: updated}));
  try {
    const obj = updated.reduce((a,s,i) => ({...a,[i]:s}), {});
    await set(ref(db, `history-${clientId}`), obj);
  } catch {}
};
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
            {!esAccesDirecte&&<button style={S.btnSecondary} onClick={()=>setMode("select")}>Sortir</button>}
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
{!esAccesDirecte&&<button style={S.btnSecondary} onClick={()=>setMode("select")}>Sortir</button>}    
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
    // eslint-disable-next-line no-unused-vars
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
          {!esAccesDirecte&&<button style={S.btnSecondary} onClick={()=>setMode("select")}>Sortir</button>}
        </div>

        {/* Modal finalitzar */}
        {showFinishModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div style={{background:T.card,borderRadius:"20px 20px 0 0",padding:"1.5rem 1.25rem",width:"100%",maxWidth:520,border:`1px solid ${T.border}`}}>
              <div style={{fontWeight:500,fontSize:16,color:T.textPrimary,marginBottom:4}}>Finalitzar entrenament</div>
              <div style={{fontSize:13,color:T.textSecondary,marginBottom:20}}>Com ha anat la sessió?</div>
              <div style={{marginBottom:12}}>
                <label style={S.lbl}>RPE — Esforç percebut (1-10)</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                    <button key={n} onClick={()=>setFinishForm(p=>({...p,rpe:n}))}
                      style={{width:38,height:38,borderRadius:10,border:`1px solid ${finishForm.rpe===n?T.accent:T.border}`,background:finishForm.rpe===n?T.accent:T.card2,color:finishForm.rpe===n?T.bg:T.textSecondary,cursor:"pointer",fontSize:13,fontWeight:finishForm.rpe===n?500:400}}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:12}}>
                <label style={S.lbl}>Durada real (minuts)</label>
                <input style={{...S.inp,width:"auto",maxWidth:120}} type="number" placeholder="45" value={finishForm.duration} onChange={e=>setFinishForm(p=>({...p,duration:e.target.value}))}/>
              </div>
              <div style={{marginBottom:12}}>
                <label style={S.lbl}>Sensació</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {[["😄","Molt bé"],["🙂","Bé"],["😐","Normal"],["😓","Cansat"],["😣","Molèsties"]].map(([emoji,label])=>(
                    <button key={label} onClick={()=>setFinishForm(p=>({...p,feeling:label}))}
                      style={{padding:"6px 10px",borderRadius:10,border:`1px solid ${finishForm.feeling===label?T.accent:T.border}`,background:finishForm.feeling===label?T.accent:T.card2,color:finishForm.feeling===label?T.bg:T.textSecondary,cursor:"pointer",fontSize:12}}>
                      {emoji} {label}
                    </button>
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
  const sess = sessionExercises[sessionKey];
  const exsToSave = sess ? sess.exercises : dayExs;
  await saveStdSession(selClient,selDay,exsToSave,finishForm);
  setShowFinishModal(false);
  setFinishForm({rpe:"",duration:"",feeling:"",notes:""});
  setSessionExercises(p=>{const np={...p};delete np[sessionKey];return np;});
}}>Guardar sessió</button>
              </div>
            </div>
          </div>
        )}

        {/* Pestanyes */}
        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,padding:"0 1.25rem"}}>
          {[["entrenament","🏋️ Entrenament"],["perfil","👤 Perfil"],["historial","📋 Historial"]].map(([tab,label])=>(
            <button key={tab} onClick={()=>setClientViewTab(tab)}
              style={{padding:"10px 16px",fontSize:13,cursor:"pointer",background:"none",border:"none",
                borderBottom:`2px solid ${clientViewTab===tab?T.accent:"transparent"}`,
                color:clientViewTab===tab?T.accent:T.textSecondary,
                fontWeight:clientViewTab===tab?500:400,marginBottom:-1,transition:"all 0.15s"}}>
              {label}
            </button>
          ))}
        </div>

        {/* Pestanya Entrenament */}
{clientViewTab==="entrenament"&&(()=>{
  const schedule = data.schedule?.[selClient] || {};
  const templates = data.templates || [];
  const dayTplIds = schedule[selDay] || [];
  const dayTemplates = dayTplIds.map(id=>templates.find(t=>t.id===id)).filter(Boolean);
  const sessionKey = `${selClient}-${selDay}`;
  const currentSession = sessionExercises[sessionKey] || null;
  // eslint-disable-next-line no-unused-vars
  const currentTemplate = currentSession ? templates.find(t=>t.id===currentSession.templateId) : null;

  const startSession = (tpl) => {
  const exs = tpl.exercises.map(ex=>({
    ...ex,
    sets: Array.from({length:ex.plannedSets}, ()=>({
      reps: ex.plannedReps,
      rest: ex.plannedRest||"",
      completed: false,
    })),
  }));
  setSessionExercises(p=>({...p,[sessionKey]:{templateId:tpl.id,templateName:tpl.name,exercises:exs}}));
};

  const updateSessionEx = (exIdx, field, value) => {
    setSessionExercises(p=>{
      const s = {...p[sessionKey]};
      s.exercises = s.exercises.map((e,i)=>i===exIdx?{...e,[field]:value}:e);
      return {...p,[sessionKey]:s};
    });
  };

  // eslint-disable-next-line no-unused-vars
    const toggleSessionEx = (exIdx) => {
    updateSessionEx(exIdx, "completed", !currentSession.exercises[exIdx].completed);
  };

  if(currentSession) {
  const exs = currentSession.exercises;
  const dc = exs.filter(e=>e.sets&&e.sets.every(s=>s.completed)).length;

  const toggleSet = (exIdx, setIdx) => {
    setSessionExercises(p=>{
      const s = {...p[sessionKey]};
      s.exercises = s.exercises.map((e,i)=>i===exIdx?{
        ...e,
        sets: e.sets.map((st,j)=>j===setIdx?{...st,completed:!st.completed}:st)
      }:e);
      return {...p,[sessionKey]:s};
    });
  };

  const updateSet = (exIdx, setIdx, field, value) => {
    setSessionExercises(p=>{
      const s = {...p[sessionKey]};
      s.exercises = s.exercises.map((e,i)=>i===exIdx?{
        ...e,
        sets: e.sets.map((st,j)=>j===setIdx?{...st,[field]:value}:st)
      }:e);
      return {...p,[sessionKey]:s};
    });
  };

  const addSet = (exIdx) => {
    setSessionExercises(p=>{
      const s = {...p[sessionKey]};
      const ex = s.exercises[exIdx];
      const lastSet = ex.sets[ex.sets.length-1];
      s.exercises = s.exercises.map((e,i)=>i===exIdx?{
        ...e,
        sets: [...e.sets, {reps:lastSet?.reps||ex.plannedReps, rest:lastSet?.rest||ex.plannedRest||"", completed:false}]
      }:e);
      return {...p,[sessionKey]:s};
    });
  };

  return (
    <>
      {/* Selector de dies */}
      <div style={{display:"flex",gap:6,padding:"0.85rem 1.25rem 0.5rem",overflowX:"auto"}}>
        {DAYS.map((d,i)=>{
          const hasTpls=(data.schedule?.[selClient]?.[d]?.length||0)>0;
          const active=selDay===d;
          return (
            <div key={d} style={{textAlign:"center",flexShrink:0}}>
              <button onClick={()=>{setSelDay(d);}} style={{width:34,height:34,borderRadius:"50%",border:`1px solid ${active?T.accent:hasTpls?cc.border:T.border}`,background:active?T.accent:T.card,color:active?T.bg:hasTpls?cc.text:T.textMuted,cursor:"pointer",fontSize:12,fontWeight:active?500:400}}>
                {DAYS_SHORT[i]}
              </button>
              {hasTpls&&!active&&<div style={{width:4,height:4,borderRadius:"50%",background:T.accent,margin:"3px auto 0"}}/>}
              {d===TODAY&&<div style={{fontSize:9,color:T.accent,marginTop:2}}>avui</div>}
            </div>
          );
        })}
      </div>
      <div style={S.sec}>
        {/* Capçalera sessió */}
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

        {/* Exercicis */}
        {exs.map((ex,i)=>{
          const allSetsCompleted = ex.sets&&ex.sets.length>0&&ex.sets.every(s=>s.completed);
          const isExpanded = expandedExercises[`${sessionKey}-${i}`]!==false;
          return (
            <div key={i} style={{...S.card,opacity:allSetsCompleted?0.6:1}}>
              {/* Capçalera exercici */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:isExpanded?10:0}}
                onClick={()=>setExpandedExercises(p=>({...p,[`${sessionKey}-${i}`]:!isExpanded}))}>
                <div style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${allSetsCompleted?T.accent:T.border}`,background:allSetsCompleted?T.accent:T.card2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {allSetsCompleted&&<svg viewBox="0 0 16 16" width="14" height="14"><polyline points="3,8 7,12 13,4" fill="none" stroke={T.bg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:500,fontSize:14,color:allSetsCompleted?T.textMuted:T.textPrimary,textDecoration:allSetsCompleted?"line-through":"none"}}>{i+1}. {ex.name}</div>
                  <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>
                    {ex.sets?.filter(s=>s.completed).length||0}/{ex.sets?.length||0} sèries · {ex.plannedReps} reps planificades
                  </div>
                </div>
                <svg viewBox="0 0 12 12" width="14" height="14" style={{transition:"transform 0.2s",transform:isExpanded?"rotate(180deg)":"rotate(0)",flexShrink:0}}>
                  <polyline points="2,4 6,8 10,4" fill="none" stroke={T.textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Sèries desplegables */}
              {isExpanded&&(
                <div style={{paddingLeft:36}}>
                  {ex.observations&&<div style={{fontSize:12,color:T.textSecondary,marginBottom:8}}>💬 {ex.observations}</div>}
                  {(ex.sets||[]).map((st,j)=>(
                    <div key={j} style={{background:T.card2,borderRadius:10,padding:"10px 12px",marginBottom:6,border:`1px solid ${st.completed?T.accent:T.border}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
  <button onClick={()=>toggleSet(i,j)} style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${st.completed?T.accent:T.border}`,background:st.completed?T.accent:T.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
    {st.completed&&<svg viewBox="0 0 16 16" width="12" height="12"><polyline points="3,8 7,12 13,4" fill="none" stroke={T.bg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
  </button>
  <span style={{fontSize:13,fontWeight:500,color:T.textPrimary}}>Sèrie {j+1}</span>
  <button onClick={()=>setSessionExercises(p=>{const s={...p[sessionKey]};s.exercises=s.exercises.map((e,ei)=>ei===i?{...e,sets:e.sets.filter((_,si)=>si!==j)}:e);return {...p,[sessionKey]:s};})} style={{marginLeft:"auto",width:20,height:20,borderRadius:"50%",border:"none",background:T.dangerBg,color:T.danger,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,lineHeight:1}}>×</button>
</div>
                      <div style={{display:"flex",gap:6}}>
                        <div style={{flex:1}}>
                          <label style={S.lbl}>Reps fetes</label>
                          <input style={S.inp} value={st.reps} onChange={e=>updateSet(i,j,"reps",e.target.value)} placeholder={ex.plannedReps}/>
                        </div>
                        <div style={{flex:1}}>
                          <label style={S.lbl}>Descans</label>
                          <input style={S.inp} value={st.rest} onChange={e=>updateSet(i,j,"rest",e.target.value)} placeholder="90s"/>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button style={{...S.btnSecondary,width:"100%",textAlign:"center",fontSize:12,marginTop:4}} onClick={()=>addSet(i)}>
                    + Afegir sèrie
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Completat */}
        {dc===exs.length&&exs.length>0&&(
          <div style={{background:T.greenBg,border:`1px solid ${T.greenBorder}`,borderRadius:14,padding:"1.25rem",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:6}}>🎉</div>
            <div style={{fontWeight:500,color:T.green,marginBottom:12}}>Tots els exercicis completats!</div>
            <button style={{...S.btnPrimary,padding:"12px"}} onClick={()=>{setFinishForm({rpe:"",duration:"",feeling:"",notes:""});setShowFinishModal(true);}}>
              🏁 Finalitzar entrenament
            </button>
          </div>
        )}
        {showAddExModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div style={{background:T.card,borderRadius:"20px 20px 0 0",padding:"1.5rem 1.25rem",width:"100%",maxWidth:520,border:`1px solid ${T.border}`,maxHeight:"70vh",overflowY:"auto"}}>
              <div style={{fontWeight:500,fontSize:16,color:T.textPrimary,marginBottom:4}}>Afegir exercici</div>
              <div style={{fontSize:13,color:T.textSecondary,marginBottom:16}}>Tria un exercici de la biblioteca</div>
              {(data.exerciseLibrary||[]).map(ex=>(
                <div key={ex.id} style={{...S.card,cursor:"pointer"}} onClick={()=>{
                  const newEx={
                    id:`extra_${Date.now()}`,
                    exerciseId:ex.id,
                    name:ex.name,
                    plannedSets:ex.defaultSets,
                    plannedReps:ex.defaultReps,
                    plannedLoad:ex.defaultLoad||"",
                    plannedRest:ex.defaultRest||"",
                    observations:ex.instructions||"",
                    isExtra:true,
                    sets:Array.from({length:ex.defaultSets},()=>({
                      reps:ex.defaultReps,
                      rest:ex.defaultRest||"",
                      completed:false,
                    })),
                  };
                  setSessionExercises(p=>{
                    const s={...p[sessionKey]};
                    s.exercises=[...s.exercises,newEx];
                    return {...p,[sessionKey]:s};
                  });
                  setShowAddExModal(false);
                }}>
                  <div style={{fontWeight:500,fontSize:13,color:T.textPrimary}}>{ex.name}</div>
                  <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{ex.category} · {ex.muscleGroup} · {ex.defaultSets}×{ex.defaultReps}</div>
                </div>
              ))}
              <button style={{...S.btnSecondary,width:"100%",textAlign:"center",marginTop:8}} onClick={()=>setShowAddExModal(false)}>Cancel·lar</button>
            </div>
          </div>
        )}
        <button style={{...S.btnSecondary,marginTop:8,width:"100%",textAlign:"center"}} onClick={()=>setShowAddExModal(true)}>
          + Afegir exercici de la biblioteca
        </button>
        <button style={{...S.btnSecondary,marginTop:8,width:"100%",textAlign:"center"}} onClick={()=>setSessionExercises(p=>{const np={...p};delete np[sessionKey];return np;})}>
          ← Canviar entrenament
        </button>
      </div>
    </>
  );
}
  return (
    <>
      {/* Selector de dies */}
      <div style={{display:"flex",gap:6,padding:"0.85rem 1.25rem 0.5rem",overflowX:"auto"}}>
        {DAYS.map((d,i)=>{
          const hasTpls=(data.schedule?.[selClient]?.[d]?.length||0)>0;
          const active=selDay===d;
          return (
            <div key={d} style={{textAlign:"center",flexShrink:0}}>
              <button onClick={()=>setSelDay(d)} style={{width:34,height:34,borderRadius:"50%",border:`1px solid ${active?T.accent:hasTpls?cc.border:T.border}`,background:active?T.accent:T.card,color:active?T.bg:hasTpls?cc.text:T.textMuted,cursor:"pointer",fontSize:12,fontWeight:active?500:400}}>
                {DAYS_SHORT[i]}
              </button>
              {hasTpls&&!active&&<div style={{width:4,height:4,borderRadius:"50%",background:T.accent,margin:"3px auto 0"}}/>}
              {d===TODAY&&<div style={{fontSize:9,color:T.accent,marginTop:2}}>avui</div>}
            </div>
          );
        })}
      </div>
      <div style={S.sec}>
        <div style={{fontWeight:500,fontSize:16,color:T.textPrimary,marginBottom:4}}>{selDay}</div>
        {selDay===TODAY&&<div style={{fontSize:12,color:T.accent,fontWeight:500,marginBottom:12}}>Avui</div>}
        {dayTemplates.length===0?(
  <div style={{textAlign:"center",padding:"2rem 0",color:T.textSecondary}}>
    <div style={{fontSize:40,marginBottom:12}}>🛋️</div>
    <div style={{fontWeight:500,color:T.textPrimary,marginBottom:4}}>Dia de descans</div>
    <div style={{fontSize:13,marginBottom:16}}>Descansa i recupera energia</div>
    <div style={{textAlign:"left"}}>
      <div style={{fontSize:13,color:T.textSecondary,marginBottom:8}}>O afegeix un entrenament:</div>
      {templates.map(tpl=>(
        <div key={tpl.id} style={{...S.card,cursor:"pointer"}} onClick={()=>startSession(tpl)}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:500,fontSize:14,color:T.textPrimary}}>{tpl.name}</div>
              <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>{tpl.objective} · {tpl.estimatedDuration}</div>
            </div>
            <span style={S.tag("purple")}>{tpl.exercises?.length||0} ex</span>
          </div>
        </div>
      ))}
    </div>
  </div>
        ):(
          <>
            <div style={{fontSize:13,color:T.textSecondary,marginBottom:12}}>Tria l'entrenament d'avui:</div>
            {dayTemplates.map(tpl=>(
              <div key={tpl.id} style={{...S.card,cursor:"pointer",borderColor:T.purple}} onClick={()=>startSession(tpl)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{fontWeight:500,fontSize:15,color:T.textPrimary}}>{tpl.name}</div>
                    <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>{tpl.objective} · {tpl.estimatedDuration}</div>
                  </div>
                  <span style={S.tag("purple")}>{tpl.exercises.length} ex</span>
                </div>
                {tpl.exercises.map((ex,i)=>(
                  <div key={ex.id} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 0",borderBottom:`1px solid ${T.border}`}}>
                    <span style={{fontSize:11,color:T.textMuted,width:16}}>{i+1}.</span>
                    <span style={{fontSize:12,flex:1,color:T.textSecondary}}>{ex.name}</span>
                    <span style={{fontSize:11,color:T.textMuted}}>{ex.plannedSets}×{ex.plannedReps}</span>
                  </div>
                ))}
                <button style={{...S.btnPrimary,marginTop:12,padding:"10px",fontSize:13}}>
                  Començar entrenament →
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
})()}

        {/* Pestanya Perfil */}
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
            {key:"coachNotes",label:"Notes internes",placeholder:"Notes privades de l'entrenador..."},
          ];
          const saveClientData=()=>{
            const nd={...data,clients:data.clients.map(c=>c.id===selClient?{...c,...clientDraft}:c)};
            updateData(nd);setEditingClient(false);
          };
          return (
            <div style={S.sec}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontWeight:500,fontSize:14,color:T.textPrimary}}>El meu perfil</div>
                {!editingClient
                  ?<button style={{...S.btnSecondary,fontSize:12}} onClick={()=>{setClientDraft({...client});setEditingClient(true);}}>Editar</button>
                  :<div style={{display:"flex",gap:8}}>
                    <button style={{...S.btnSecondary,fontSize:12}} onClick={()=>setEditingClient(false)}>Cancel·lar</button>
                    <button style={{...S.btnPrimary,width:"auto",padding:"6px 14px",fontSize:12}} onClick={saveClientData}>Guardar</button>
                  </div>
                }
              </div>
              <div style={{...S.card,marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Dades bàsiques</div>
                <div style={{marginBottom:8}}>
                  <label style={S.lbl}>Nom complet</label>
                  {editingClient?<input style={S.inp} value={clientDraft?.name||""} onChange={e=>setClientDraft(p=>({...p,name:e.target.value}))}/>
                    :<div style={{fontSize:14,color:T.textPrimary,fontWeight:500}}>{client?.name}</div>}
                </div>
                <div style={{marginBottom:8}}>
                  <label style={S.lbl}>Objectiu principal</label>
                  {editingClient?<input style={S.inp} value={clientDraft?.goal||""} onChange={e=>setClientDraft(p=>({...p,goal:e.target.value}))}/>
                    :<div style={{fontSize:13,color:T.textPrimary}}>{client?.goal||"—"}</div>}
                </div>
                {fields.slice(0,5).map(f=>(
                  <div key={f.key} style={{marginBottom:8}}>
                    <label style={S.lbl}>{f.label}</label>
                    {editingClient
                      ?f.type==="select"
                        ?<select style={S.inp} value={clientDraft?.[f.key]||""} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}>
                          {f.options.map(o=><option key={o} value={o}>{o}</option>)}
                        </select>
                        :<input style={S.inp} value={clientDraft?.[f.key]||""} placeholder={f.placeholder} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}/>
                      :<div style={{fontSize:13,color:T.textPrimary}}>{client?.[f.key]||"—"}</div>}
                  </div>
                ))}
              </div>
              <div style={{...S.card,marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Salut i limitacions</div>
                {fields.slice(5,8).map(f=>(
                  <div key={f.key} style={{marginBottom:8}}>
                    <label style={S.lbl}>{f.label}</label>
                    {editingClient?<input style={S.inp} value={clientDraft?.[f.key]||""} placeholder={f.placeholder} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}/>
                      :<div style={{fontSize:13,color:T.textPrimary}}>{client?.[f.key]||"—"}</div>}
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Preferències i notes</div>
                {fields.slice(8).map(f=>(
                  <div key={f.key} style={{marginBottom:8}}>
                    <label style={S.lbl}>{f.label}</label>
                    {editingClient?<textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={clientDraft?.[f.key]||""} placeholder={f.placeholder} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}/>
                      :<div style={{fontSize:13,color:T.textPrimary}}>{client?.[f.key]||"—"}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Pestanya Historial */}
        {clientViewTab==="historial"&&(()=>{
          const history=clientHistories[selClient]||[];
          const totalS=history.length;
          const thisWeek=history.filter(s=>{
            const d=new Date(s.createdAt);
            const now=new Date();
            return (now-d)/(1000*60*60*24)<=7;
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
                      <div key={st.label} style={{background:T.card,borderRadius:12,padding:"0.75rem",textAlign:"center",border:`1px solid ${T.border}`}}>
                        <div style={{fontSize:22,fontWeight:500,color:st.color}}>{st.value}</div>
                        <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{st.label}</div>
                      </div>
                    ))}
                  </div>
                  {history.map((sess,idx)=>{
                    const full=sess.completionPercentage===100;
                    return (
                      <div key={idx} style={S.card}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                          <div>
                            <div style={{fontWeight:500,fontSize:14,color:T.textPrimary}}>{sess.sessionTitle}</div>
                            <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>{sess.date}</div>
                          </div>
                          <span style={full?S.tag("green"):S.tag()}>{sess.completionPercentage}%</span>
                        </div>
                        <div style={{fontSize:12,color:T.textSecondary,marginBottom:8}}>{sess.completedExercises}/{sess.totalExercises} exercicis</div>
                        {(sess.rpe||sess.feeling||sess.durationReal)&&(
                          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                            {sess.rpe&&<span style={S.tag("purple")}>RPE {sess.rpe}</span>}
                            {sess.durationReal&&<span style={S.tag()}>⏱ {sess.durationReal} min</span>}
                            {sess.feeling&&<span style={S.tag()}>{sess.feeling}</span>}
                          </div>
                        )}
                        <ProgressBar value={sess.completedExercises} total={sess.totalExercises} color={full?T.green:T.accent}/>
                        {sess.clientNotes&&<div style={{fontSize:12,color:T.textSecondary,marginTop:8,fontStyle:"italic"}}>💬 {sess.clientNotes}</div>}
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

  // ══════════════════════════════════════════════════════════════════════════
  // ── ADMIN ─────────────────────────────────────────────────────────────────
const routine=getIgnasiRoutine();
  // eslint-disable-next-line no-unused-vars
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
          {(adminClient===2?[["routine","Rutina"],["history","Historial"]]:[["dades","Dades"],["routine","Entrenaments"],["history","Historial"]]).map(([tab,label])=>(
            <button key={tab} onClick={()=>{if(tab==="history"){setAdminTab("history");loadClientHistory(adminClient);}else if(tab==="dades"){setAdminTab("dades");}else{setAdminTab("routine");}}}
              style={{padding:"10px 16px",fontSize:13,cursor:"pointer",background:"none",border:"none",borderBottom:`2px solid ${(adminClient===2?adminTab:adminTab)===tab?T.accent:"transparent"}`,color:(adminClient===2?adminTab:adminTab)===tab?T.accent:T.textSecondary,fontWeight:adminTab===tab?500:400}}>
              {label}
            </button>
          ))}
        </div>

{/* Dades tab */}
{adminTab==="dades"&&adminClient!==2&&(()=>{
  const client=data.clients.find(c=>c.id===adminClient);
  const ci=data.clients.findIndex(c=>c.id===adminClient);
  void cClr(ci);
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
    {key:"coachNotes",label:"Notes internes",placeholder:"Notes privades de l'entrenador..."},
  ];
  const saveClientData=()=>{
    const nd={...data,clients:data.clients.map(c=>c.id===adminClient?{...c,...clientDraft}:c)};
    updateData(nd);setEditingClient(false);
  };
  return (
    <div style={S.sec}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontWeight:500,fontSize:14,color:T.textPrimary}}>Fitxa de {client?.name}</div>
        {!editingClient
          ?<button style={{...S.btnSecondary,fontSize:12}} onClick={()=>{setClientDraft({...client});setEditingClient(true);}}>Editar dades</button>
          :<div style={{display:"flex",gap:8}}>
            <button style={{...S.btnSecondary,fontSize:12}} onClick={()=>setEditingClient(false)}>Cancel·lar</button>
            <button style={{...S.btnPrimary,width:"auto",padding:"6px 14px",fontSize:12}} onClick={saveClientData}>Guardar</button>
          </div>
        }
      </div>

      {/* Nom i objectiu */}
      <div style={{...S.card,marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Dades bàsiques</div>
        <div style={{marginBottom:8}}>
          <label style={S.lbl}>Nom complet</label>
          {editingClient
            ?<input style={S.inp} value={clientDraft?.name||""} onChange={e=>setClientDraft(p=>({...p,name:e.target.value}))}/>
            :<div style={{fontSize:14,color:T.textPrimary,fontWeight:500}}>{client?.name}</div>
          }
        </div>
        <div style={{marginBottom:8}}>
          <label style={S.lbl}>Objectiu principal</label>
          {editingClient
            ?<input style={S.inp} value={clientDraft?.goal||""} onChange={e=>setClientDraft(p=>({...p,goal:e.target.value}))}/>
            :<div style={{fontSize:13,color:T.textPrimary}}>{client?.goal||"—"}</div>
          }
        </div>
        {fields.slice(0,5).map(f=>(
          <div key={f.key} style={{marginBottom:8}}>
            <label style={S.lbl}>{f.label}</label>
            {editingClient
              ?f.type==="select"
                ?<select style={{...S.inp}} value={clientDraft?.[f.key]||""} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}>
                  {f.options.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
                :<input style={S.inp} value={clientDraft?.[f.key]||""} placeholder={f.placeholder} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}/>
              :<div style={{fontSize:13,color:T.textPrimary}}>{client?.[f.key]||"—"}</div>
            }
          </div>
        ))}
      </div>

      {/* Salut */}
      <div style={{...S.card,marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Salut i limitacions</div>
        {fields.slice(5,8).map(f=>(
          <div key={f.key} style={{marginBottom:8}}>
            <label style={S.lbl}>{f.label}</label>
            {editingClient
              ?<input style={S.inp} value={clientDraft?.[f.key]||""} placeholder={f.placeholder} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}/>
              :<div style={{fontSize:13,color:T.textPrimary}}>{client?.[f.key]||"—"}</div>
            }
          </div>
        ))}
      </div>

      {/* Preferències */}
      <div style={S.card}>
        <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Preferències i notes</div>
        {fields.slice(8).map(f=>(
          <div key={f.key} style={{marginBottom:8}}>
            <label style={S.lbl}>{f.label}</label>
            {editingClient
              ?<textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={clientDraft?.[f.key]||""} placeholder={f.placeholder} onChange={e=>setClientDraft(p=>({...p,[f.key]:e.target.value}))}/>
              :<div style={{fontSize:13,color:T.textPrimary}}>{client?.[f.key]||"—"}</div>
            }
          </div>
        ))}
      </div>
    </div>
  );
})()}
      {/* History tab */}
      {adminTab==="history"&&(()=>{
  const history = clientHistories[adminClient] || [];
  const client = data.clients.find(c=>c.id===adminClient);
  const totalS = history.length;
  const fullS = history.filter(s=>s.completionPercentage===100).length;
  const lastS = history[0];
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
              <div key={st.label} style={{background:T.card,borderRadius:12,padding:"0.75rem",textAlign:"center",border:`1px solid ${T.border}`}}>
                <div style={{fontSize:st.label==="Última"?13:20,fontWeight:500,color:st.color}}>{st.value}</div>
                <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>{st.label}</div>
              </div>
            ))}
          </div>
          {history.map((sess,idx)=>{
            const full = sess.completionPercentage===100;
            return (
              <div key={idx} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{fontWeight:500,fontSize:13,color:T.textPrimary}}>{sess.sessionTitle||sess.day}</div>
                    <div style={{fontSize:12,color:T.textSecondary}}>{sess.date}</div>
                  </div>
                  {full?<span style={S.tag("green")}>✓ Complet</span>:<span style={{fontSize:12,color:T.textSecondary}}>{sess.completedExercises}/{sess.totalExercises}</span>}
                </div>
                {(sess.rpe||sess.feeling||sess.durationReal)&&(
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                    {sess.rpe&&<span style={S.tag("purple")}>RPE {sess.rpe}</span>}
                    {sess.durationReal&&<span style={S.tag()}>⏱ {sess.durationReal} min</span>}
                    {sess.feeling&&<span style={S.tag()}>{sess.feeling}</span>}
                  </div>
                )}
                <ProgressBar value={sess.completedExercises} total={sess.totalExercises} color={full?T.green:T.accent}/>
                {sess.clientNotes&&<div style={{fontSize:12,color:T.textSecondary,marginTop:6,fontStyle:"italic"}}>💬 {sess.clientNotes}</div>}
                {sess.exercises&&(
                  <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}`}}>
                    {sess.exercises.map((e,i)=>(
                      <div key={i} style={{fontSize:12,color:e.completed?T.textSecondary:T.textMuted,display:"flex",alignItems:"center",gap:6,padding:"2px 0"}}>
                        <span style={{color:e.completed?T.green:T.textMuted}}>{e.completed?"✓":"○"}</span>
                        {e.name} — {e.completedSets||e.plannedSets||"?"}×{e.plannedReps||e.reps||"?"}{e.weight?` · ${e.weight}`:""}
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

      {/* Routine tab */}
      {adminTab==="routine"&&(
  <div style={S.sec}>
    {adminClient===2?(
      // Ignasi — no tocar
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
                    <div style={{flex:1}}><label style={S.lbl}>Voltes</label><input style={S.inp} type="number" value={editingBlock.rounds} onChange={e=>setEditingBlock(p=>({...p,rounds:parseInt(e.target.value)||1}))}/></div>
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
                  <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.inp} value={editingIgnasiEx.name} onChange={e=>setEditingIgnasiEx(p=>({...p,name:e.target.value}))}/></div>
                  <div style={{...S.row,marginBottom:8}}>
                    <div style={{flex:1}}><label style={S.lbl}>Sèries</label><input style={S.inp} type="number" value={editingIgnasiEx.sets} onChange={e=>setEditingIgnasiEx(p=>({...p,sets:+e.target.value}))}/></div>
                    <div style={{flex:1}}><label style={S.lbl}>Reps</label><input style={S.inp} type="number" value={editingIgnasiEx.reps} onChange={e=>setEditingIgnasiEx(p=>({...p,reps:+e.target.value}))}/></div>
                    <div style={{flex:1}}><label style={S.lbl}>Unitat</label><input style={S.inp} value={editingIgnasiEx.unit} onChange={e=>setEditingIgnasiEx(p=>({...p,unit:e.target.value}))}/></div>
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
                <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.inp} value={newIgnasiEx.name} onChange={e=>setNewIgnasiEx(p=>({...p,name:e.target.value}))} placeholder="Ex. Flexions"/></div>
                <div style={{...S.row,marginBottom:8}}>
                  <div style={{flex:1}}><label style={S.lbl}>Sèries</label><input style={S.inp} type="number" value={newIgnasiEx.sets} onChange={e=>setNewIgnasiEx(p=>({...p,sets:+e.target.value}))}/></div>
                  <div style={{flex:1}}><label style={S.lbl}>Reps</label><input style={S.inp} type="number" value={newIgnasiEx.reps} onChange={e=>setNewIgnasiEx(p=>({...p,reps:+e.target.value}))}/></div>
                  <div style={{flex:1}}><label style={S.lbl}>Unitat</label><input style={S.inp} value={newIgnasiEx.unit} onChange={e=>setNewIgnasiEx(p=>({...p,unit:e.target.value}))} placeholder="reps"/></div>
                </div>
                <div style={{marginBottom:8}}><label style={S.lbl}>Indicacions</label><textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={newIgnasiEx.notes} onChange={e=>setNewIgnasiEx(p=>({...p,notes:e.target.value}))}/></div>
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
      // Clients estàndard — nova estructura
      <div>
        {/* Sub-pestanyes */}
        <div style={{display:"flex",gap:0,marginBottom:16,borderBottom:`1px solid ${T.border}`}}>
          {[["rutina","📅 Rutina"],["plantilles","📋 Plantilles"],["biblioteca","📚 Biblioteca"]].map(([tab,label])=>(
            <button key={tab} onClick={()=>setAdminRoutineTab(tab)}
              style={{padding:"8px 14px",fontSize:12,cursor:"pointer",background:"none",border:"none",
                borderBottom:`2px solid ${adminRoutineTab===tab?T.accent:"transparent"}`,
                color:adminRoutineTab===tab?T.accent:T.textSecondary,
                fontWeight:adminRoutineTab===tab?500:400,marginBottom:-1}}>
              {label}
            </button>
          ))}
        </div>

        {/* Sub-pestanya: Rutina */}
        {adminRoutineTab==="rutina"&&(()=>{
          const schedule = data.schedule?.[adminClient] || DAYS.reduce((a,d)=>({...a,[d]:[]}),{});
          const templates = data.templates || [];
          const updateSchedule = (day, tplIds) => {
            const nd = {...data, schedule:{...data.schedule,[adminClient]:{...schedule,[day]:tplIds}}};
            updateData(nd);
          };
          return (
            <div>
              <div style={{fontSize:12,color:T.textSecondary,marginBottom:16}}>
                Assigna plantilles d'entrenament a cada dia · {data.clients.find(c=>c.id===adminClient)?.name}
              </div>
              {DAYS.map(day=>{
                const dayTpls = schedule[day] || [];
                return (
                  <div key={day} style={{...S.card,marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:dayTpls.length>0?10:0}}>
                      <div style={{fontWeight:500,fontSize:13,color:T.textPrimary}}>{day}</div>
                      {dayTpls.length===0&&<span style={{fontSize:11,color:T.textMuted}}>Descans</span>}
                    </div>
                    {dayTpls.length>0&&(
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                        {dayTpls.map(tplId=>{
                          const tpl = templates.find(t=>t.id===tplId);
                          return tpl?(
                            <div key={tplId} style={{display:"flex",alignItems:"center",gap:4,background:T.purpleBg,border:`1px solid #3A3A60`,borderRadius:20,padding:"3px 10px"}}>
                              <span style={{fontSize:12,color:T.purple}}>{tpl.name}</span>
                              <button onClick={()=>updateSchedule(day,dayTpls.filter(id=>id!==tplId))} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:14,lineHeight:1,padding:"0 2px"}}>×</button>
                            </div>
                          ):null;
                        })}
                      </div>
                    )}
                    <select style={{...S.inp,fontSize:12}} value="" onChange={e=>{
                      if(e.target.value&&!dayTpls.includes(e.target.value))
                        updateSchedule(day,[...dayTpls,e.target.value]);
                    }}>
                      <option value="">+ Afegir plantilla...</option>
                      {templates.filter(t=>!dayTpls.includes(t.id)).map(t=>(
                        <option key={t.id} value={t.id}>{t.name} — {t.objective}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Sub-pestanya: Plantilles */}
        {adminRoutineTab==="plantilles"&&(()=>{
          const templates = data.templates || [];
          const updateTemplates = (tpls) => updateData({...data,templates:tpls});
          const deleteTemplate = (id) => updateTemplates(templates.filter(t=>t.id!==id));
          const duplicateTemplate = (tpl) => {
            const copy = {...tpl, id:`tpl_${Date.now()}`, name:`${tpl.name} (còpia)`,
              exercises: tpl.exercises.map(e=>({...e,id:`tex_${Date.now()}_${Math.random().toString(36).slice(2)}`}))};
            updateTemplates([...templates,copy]);
          };
          return (
            <div>
              {templates.map(tpl=>(
                editingTemplate?.id===tpl.id?(
                  <FormCard key={tpl.id}>
                    <div style={{fontWeight:500,fontSize:13,color:T.textPrimary,marginBottom:12}}>Editar plantilla</div>
                    <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.inp} value={editingTemplate.name} onChange={e=>setEditingTemplate(p=>({...p,name:e.target.value}))}/></div>
                    <div style={{marginBottom:8}}><label style={S.lbl}>Objectiu</label><input style={S.inp} value={editingTemplate.objective} onChange={e=>setEditingTemplate(p=>({...p,objective:e.target.value}))}/></div>
                    <div style={{...S.row,marginBottom:8}}>
                      <div style={{flex:1}}><label style={S.lbl}>Tipus</label><input style={S.inp} value={editingTemplate.type} onChange={e=>setEditingTemplate(p=>({...p,type:e.target.value}))}/></div>
                      <div style={{flex:1}}><label style={S.lbl}>Durada</label><input style={S.inp} value={editingTemplate.estimatedDuration} onChange={e=>setEditingTemplate(p=>({...p,estimatedDuration:e.target.value}))}/></div>
                    </div>
                    <div style={{fontSize:12,fontWeight:500,color:T.textSecondary,marginBottom:8}}>Exercicis</div>
                    {(editingTemplate.exercises||[]).map((ex,i)=>(
                      <div key={ex.id} style={{...S.card,marginBottom:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <span style={{fontSize:13,fontWeight:500,color:T.textPrimary}}>{ex.name}</span>
                          <button style={S.btnDanger} onClick={()=>setEditingTemplate(p=>({...p,exercises:p.exercises.filter((_,j)=>j!==i)}))}>×</button>
                        </div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          <div style={{flex:1,minWidth:60}}><label style={S.lbl}>Sèries</label><input style={S.inp} type="number" value={ex.plannedSets} onChange={e=>setEditingTemplate(p=>({...p,exercises:p.exercises.map((ex2,j)=>j===i?{...ex2,plannedSets:+e.target.value}:ex2)}))}/></div>
                          <div style={{flex:1,minWidth:60}}><label style={S.lbl}>Reps</label><input style={S.inp} value={ex.plannedReps} onChange={e=>setEditingTemplate(p=>({...p,exercises:p.exercises.map((ex2,j)=>j===i?{...ex2,plannedReps:e.target.value}:ex2)}))}/></div>
                          <div style={{flex:1,minWidth:60}}><label style={S.lbl}>Càrrega</label><input style={S.inp} value={ex.plannedLoad} placeholder="40kg" onChange={e=>setEditingTemplate(p=>({...p,exercises:p.exercises.map((ex2,j)=>j===i?{...ex2,plannedLoad:e.target.value}:ex2)}))}/></div>
                          <div style={{flex:1,minWidth:60}}><label style={S.lbl}>Descans</label><input style={S.inp} value={ex.plannedRest} onChange={e=>setEditingTemplate(p=>({...p,exercises:p.exercises.map((ex2,j)=>j===i?{...ex2,plannedRest:e.target.value}:ex2)}))}/></div>
                        </div>
                        <div style={{marginTop:6}}><label style={S.lbl}>Observacions</label><input style={S.inp} value={ex.observations||""} placeholder="Indicacions específiques..." onChange={e=>setEditingTemplate(p=>({...p,exercises:p.exercises.map((ex2,j)=>j===i?{...ex2,observations:e.target.value}:ex2)}))}/></div>
                      </div>
                    ))}
                    <select style={{...S.inp,fontSize:12,marginBottom:12}} value="" onChange={e=>{
                      const lib = data.exerciseLibrary||[];
                      const libEx = lib.find(l=>l.id===e.target.value);
                      if(libEx) setEditingTemplate(p=>({...p,exercises:[...p.exercises,{id:`tex_${Date.now()}`,exerciseId:libEx.id,name:libEx.name,plannedSets:libEx.defaultSets,plannedReps:libEx.defaultReps,plannedLoad:libEx.defaultLoad||"",plannedRest:libEx.defaultRest||"",observations:"",order:p.exercises.length+1}]}));
                    }}>
                      <option value="">+ Afegir exercici de la biblioteca...</option>
                      {(data.exerciseLibrary||[]).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
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
                      <div key={ex.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:`1px solid ${T.border}`}}>
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
                  <div style={{fontWeight:500,fontSize:13,color:T.textPrimary,marginBottom:12}}>Nova plantilla</div>
                  <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.inp} value={newTemplate.name} onChange={e=>setNewTemplate(p=>({...p,name:e.target.value}))} placeholder="Ex. Push"/></div>
                  <div style={{marginBottom:8}}><label style={S.lbl}>Objectiu</label><input style={S.inp} value={newTemplate.objective} onChange={e=>setNewTemplate(p=>({...p,objective:e.target.value}))} placeholder="Ex. Força tren superior"/></div>
                  <div style={{...S.row,marginBottom:12}}>
    <div style={{flex:1}}><label style={S.lbl}>Tipus</label><input style={S.inp} value={newTemplate.type} onChange={e=>setNewTemplate(p=>({...p,type:e.target.value}))}/></div>
    <div style={{flex:1}}><label style={S.lbl}>Durada</label><input style={S.inp} value={newTemplate.estimatedDuration} onChange={e=>setNewTemplate(p=>({...p,estimatedDuration:e.target.value}))} placeholder="45-60 min"/></div>
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
  <select style={{...S.inp,fontSize:12,marginBottom:12}} value="" onChange={e=>{
    const lib=data.exerciseLibrary||[];
    const libEx=lib.find(l=>l.id===e.target.value);
    if(libEx) setNewTemplate(p=>({...p,exercises:[...(p.exercises||[]),{id:`tex_${Date.now()}`,exerciseId:libEx.id,name:libEx.name,plannedSets:libEx.defaultSets,plannedReps:libEx.defaultReps,plannedLoad:libEx.defaultLoad||"",plannedRest:libEx.defaultRest||"",observations:"",order:(p.exercises||[]).length+1}]}));
  }}>
    <option value="">+ Afegir exercici de la biblioteca...</option>
    {(data.exerciseLibrary||[]).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
  </select>
  <div style={{...S.row,justifyContent:"flex-end"}}>
                    <button style={S.btnSecondary} onClick={()=>setShowAddTemplate(false)}>Cancel·lar</button>
                    <button style={{...S.btnPrimary,width:"auto",padding:"7px 16px",fontSize:13,marginLeft:8}} onClick={()=>{
                      if(!newTemplate.name)return;
                      updateTemplates([...templates,{...newTemplate,id:`tpl_${Date.now()}`,exercises:[]}]);
                      setNewTemplate({name:"",description:"",type:"Força",objective:"",estimatedDuration:"",exercises:[]});
                      setShowAddTemplate(false);
                    }}>Crear</button>
                  </div>
                </FormCard>
              ):(
                <button style={{...S.btnSecondary,width:"100%",textAlign:"center",marginTop:4}} onClick={()=>setShowAddTemplate(true)}>+ Nova plantilla</button>
              )}
            </div>
          );
        })()}

        {/* Sub-pestanya: Biblioteca */}
        {adminRoutineTab==="biblioteca"&&(()=>{
          const lib = data.exerciseLibrary||[];
          const updateLib = (l) => updateData({...data,exerciseLibrary:l});
          return (
            <div>
              <div style={{fontSize:12,color:T.textSecondary,marginBottom:12}}>{lib.length} exercicis a la biblioteca</div>
              {lib.map(ex=>(
                editingLibEx?.id===ex.id?(
                  <FormCard key={ex.id}>
                    <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.inp} value={editingLibEx.name} onChange={e=>setEditingLibEx(p=>({...p,name:e.target.value}))}/></div>
                    <div style={{...S.row,marginBottom:8}}>
                      <div style={{flex:1}}><label style={S.lbl}>Categoria</label><input style={S.inp} value={editingLibEx.category} onChange={e=>setEditingLibEx(p=>({...p,category:e.target.value}))}/></div>
                      <div style={{flex:1}}><label style={S.lbl}>Grup muscular</label><input style={S.inp} value={editingLibEx.muscleGroup} onChange={e=>setEditingLibEx(p=>({...p,muscleGroup:e.target.value}))}/></div>
                    </div>
                    <div style={{...S.row,marginBottom:8}}>
                      <div style={{flex:1}}><label style={S.lbl}>Sèries</label><input style={S.inp} type="number" value={editingLibEx.defaultSets} onChange={e=>setEditingLibEx(p=>({...p,defaultSets:+e.target.value}))}/></div>
                      <div style={{flex:1}}><label style={S.lbl}>Reps</label><input style={S.inp} value={editingLibEx.defaultReps} onChange={e=>setEditingLibEx(p=>({...p,defaultReps:e.target.value}))}/></div>
                      <div style={{flex:1}}><label style={S.lbl}>Descans</label><input style={S.inp} value={editingLibEx.defaultRest} onChange={e=>setEditingLibEx(p=>({...p,defaultRest:e.target.value}))}/></div>
                    </div>
                    <div style={{marginBottom:8}}><label style={S.lbl}>Material</label><input style={S.inp} value={editingLibEx.material} onChange={e=>setEditingLibEx(p=>({...p,material:e.target.value}))}/></div>
                    <div style={{marginBottom:8}}><label style={S.lbl}>Indicacions</label><textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={editingLibEx.instructions} onChange={e=>setEditingLibEx(p=>({...p,instructions:e.target.value}))}/></div>
                    <div style={{marginBottom:12}}><label style={S.lbl}>Nivell</label>
                      <select style={S.inp} value={editingLibEx.level} onChange={e=>setEditingLibEx(p=>({...p,level:e.target.value}))}>
                        {["Principiant","Intermedi","Avançat"].map(l=><option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
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
                  <div style={{fontWeight:500,fontSize:13,color:T.textPrimary,marginBottom:12}}>Nou exercici</div>
                  <div style={{marginBottom:8}}><label style={S.lbl}>Nom</label><input style={S.inp} value={newLibEx.name} onChange={e=>setNewLibEx(p=>({...p,name:e.target.value}))} placeholder="Ex. Press Banca"/></div>
                  <div style={{...S.row,marginBottom:8}}>
                    <div style={{flex:1}}><label style={S.lbl}>Categoria</label><input style={S.inp} value={newLibEx.category} onChange={e=>setNewLibEx(p=>({...p,category:e.target.value}))}/></div>
                    <div style={{flex:1}}><label style={S.lbl}>Grup muscular</label><input style={S.inp} value={newLibEx.muscleGroup} onChange={e=>setNewLibEx(p=>({...p,muscleGroup:e.target.value}))}/></div>
                  </div>
                  <div style={{...S.row,marginBottom:8}}>
                    <div style={{flex:1}}><label style={S.lbl}>Sèries</label><input style={S.inp} type="number" value={newLibEx.defaultSets} onChange={e=>setNewLibEx(p=>({...p,defaultSets:+e.target.value}))}/></div>
                    <div style={{flex:1}}><label style={S.lbl}>Reps</label><input style={S.inp} value={newLibEx.defaultReps} onChange={e=>setNewLibEx(p=>({...p,defaultReps:e.target.value}))}/></div>
                    <div style={{flex:1}}><label style={S.lbl}>Descans</label><input style={S.inp} value={newLibEx.defaultRest} onChange={e=>setNewLibEx(p=>({...p,defaultRest:e.target.value}))}/></div>
                  </div>
                  <div style={{marginBottom:8}}><label style={S.lbl}>Material</label><input style={S.inp} value={newLibEx.material} onChange={e=>setNewLibEx(p=>({...p,material:e.target.value}))}/></div>
                  <div style={{marginBottom:8}}><label style={S.lbl}>Indicacions</label><textarea style={{...S.inp,minHeight:60,resize:"vertical"}} value={newLibEx.instructions} onChange={e=>setNewLibEx(p=>({...p,instructions:e.target.value}))}/></div>
                  <div style={{marginBottom:12}}><label style={S.lbl}>Nivell</label>
                    <select style={S.inp} value={newLibEx.level} onChange={e=>setNewLibEx(p=>({...p,level:e.target.value}))}>
                      {["Principiant","Intermedi","Avançat"].map(l=><option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div style={{...S.row,justifyContent:"flex-end"}}>
                    <button style={S.btnSecondary} onClick={()=>setShowAddLibEx(false)}>Cancel·lar</button>
                    <button style={{...S.btnPrimary,width:"auto",padding:"7px 16px",fontSize:13,marginLeft:8}} onClick={()=>{
                      if(!newLibEx.name)return;
                      updateLib([...lib,{...newLibEx,id:`ex_${Date.now()}`}]);
                      setNewLibEx({name:"",category:"Força",muscleGroup:"",movementPattern:"",material:"",defaultSets:3,defaultReps:"10",defaultLoad:"",defaultRest:"60s",instructions:"",observations:"",level:"Principiant"});
                      setShowAddLibEx(false);
                    }}>Afegir</button>
                  </div>
                </FormCard>
              ):(
                <button style={{...S.btnSecondary,width:"100%",textAlign:"center",marginTop:4}} onClick={()=>setShowAddLibEx(true)}>+ Nou exercici</button>
              )}
            </div>
          );
        })()}
      </div>
  )}
    </div>
)}
      </div>
  );
}
