const STORAGE_KEY = "skyblockDailyTracker.v1";
const defaultRarities = [
  {id:"common",name:"COMMON",color:"#ffffff"},
  {id:"uncommon",name:"UNCOMMON",color:"#55ff55"},
  {id:"rare",name:"RARE",color:"#5555ff"},
  {id:"epic",name:"EPIC",color:"#aa00aa"},
  {id:"legendary",name:"LEGENDARY",color:"#ffaa00"},
  {id:"mythic",name:"MYTHIC",color:"#ff55ff"},
  {id:"divine",name:"DIVINE",color:"#55ffff"},
  {id:"special",name:"SPECIAL",color:"#ff5555"}
];
const defaults = {
  version:6,
  settings:{profileUsername:"",profileApiKey:"",profileSelected:"",manageOpen:{},background:"#030915",outline:"#5a6d87",panel:"#071525",group:"#08182a",task:"#0a1d31",inner:"#091a2d",rarities:defaultRarities},
  tabs:{today:[{id:"mining",name:"Mining"},{id:"farming",name:"Farming"},{id:"general",name:"General"}],goals:[{id:"gear",name:"Gear"},{id:"skills",name:"Skills"}]},
  goalSubtabs:[{id:"gear-general",tabId:"gear",name:"General",order:0},{id:"skills-general",tabId:"skills",name:"General",order:0}],
  groups:[
    {id:"dwarven",page:"today",tabId:"mining",name:"Dwarven Mines",rarity:"rare",completedRarity:"uncommon",order:0},
    {id:"garden",page:"today",tabId:"farming",name:"Garden",rarity:"uncommon",completedRarity:"uncommon",order:0},
    {id:"daily",page:"today",tabId:"general",name:"Daily",rarity:"common",completedRarity:"uncommon",order:0},
    {id:"first-goal",page:"goals",tabId:"gear",subtabId:"gear-general",name:"Current Equipment",rarity:"epic",completedRarity:"legendary",order:0}
  ],
  tasks:[
    {id:"daily-commissions",page:"today",tabId:"mining",groupId:"dwarven",name:"Daily Commissions",rarity:"rare",weight:1,parts:[{id:"commission-1",name:"Commission 1",weight:1},{id:"commission-2",name:"Commission 2",weight:1},{id:"commission-3",name:"Commission 3",weight:1},{id:"commission-4",name:"Commission 4",weight:1}],archived:false,order:0},
    {id:"greenhouse",page:"today",tabId:"farming",groupId:"garden",name:"Greenhouse",rarity:"uncommon",weight:1,parts:[{id:"crops",name:"Collect crops",weight:1},{id:"visitors",name:"Check visitors",weight:1},{id:"upgrades",name:"Check upgrades",weight:1}],archived:false,order:0},
    {id:"experimentation-table",page:"today",tabId:"general",groupId:"daily",name:"Experimentation Table",rarity:"common",weight:1,parts:[],archived:false,order:0},
    {id:"starter-goal",page:"goals",tabId:"gear",subtabId:"gear-general",groupId:"first-goal",name:"Build a long-term item goal",rarity:"epic",weight:1,goalType:"progression",stages:[{name:"Not started",rarity:"common"},{name:"Materials",rarity:"rare"},{name:"Forged",rarity:"epic"},{name:"Complete",rarity:"legendary"}],parts:[{id:"materials",name:"Collect materials",weight:2,rarity:"rare"},{id:"forge",name:"Forge components",weight:4,rarity:"epic"}],archived:false,order:0}
  ],days:{},goals:{},profileCache:null,createdAt:new Date().toISOString()
};
let state = loadState();
let active = {today:null,goals:null,goalSubtab:null};

function clone(v){return JSON.parse(JSON.stringify(v))}
function uid(prefix="item"){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`}
function slug(s){return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"item"}
function esc(s=""){return String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function parseDate(key){const [y,m,d]=key.split("-").map(Number);return new Date(y,m-1,d)}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function loadState(){try{const p=JSON.parse(localStorage.getItem(STORAGE_KEY));if(p?.tasks&&p?.days)return migrate(p)}catch(e){}return clone(defaults)}
function migrate(s){
  const n=s;
  n.version=6;
  n.settings={...clone(defaults.settings),...(n.settings||{})};
  n.settings.rarities=(n.settings.rarities?.length?n.settings.rarities:clone(defaultRarities));
  n.settings.manageOpen=n.settings.manageOpen||{};n.settings.profileApiKey=n.settings.profileApiKey||"";n.settings.profileSelected=n.settings.profileSelected||"";
  n.tabs=n.tabs||clone(defaults.tabs);n.tabs.today=n.tabs.today||[];n.tabs.goals=n.tabs.goals||[];
  n.goalSubtabs=n.goalSubtabs||[];
  n.tabs.goals.forEach(tab=>{if(!n.goalSubtabs.some(x=>x.tabId===tab.id))n.goalSubtabs.push({id:uid("subtab"),tabId:tab.id,name:"General",order:0})});
  n.groups=n.groups||[];n.tasks=n.tasks||[];n.days=n.days||{};n.goals=n.goals||{};
  n.groups.filter(g=>g.page==="goals").forEach(g=>{g.subtabId=g.subtabId||n.goalSubtabs.find(x=>x.tabId===g.tabId)?.id});
  n.tasks.forEach(t=>{t.weight=validWeight(t.weight);t.parts=t.parts||[];t.parts.forEach(p=>{p.weight=validWeight(p.weight);p.rarity=p.rarity||t.rarity||"common"});t.archived=!!t.archived;if(t.page==="goals"){t.subtabId=t.subtabId||n.groups.find(g=>g.id===t.groupId)?.subtabId||n.goalSubtabs.find(x=>x.tabId===t.tabId)?.id;t.goalType=t.goalType||"checklist";t.stages=t.stages||[];t.target=Math.max(1,Number(t.target)||100);t.suffix=t.suffix||""}});
  n.groups.forEach(g=>{g.completedRarity=g.completedRarity||g.rarity||"common"});
  ensureGroupTasks(n);
  return n;
}
function validWeight(v){const x=Number(v);return Number.isFinite(x)&&x>=0?x:1}
function ensureGroupTasks(target=state){
  target.groups.forEach(g=>{
    const any=target.tasks.some(t=>t.page===g.page&&t.groupId===g.id&&!t.archived);
    if(!any)target.tasks.push({id:uid("new-task"),page:g.page,tabId:g.tabId,groupId:g.id,name:"New task",rarity:g.rarity||"common",weight:1,parts:[],subtabId:g.subtabId||null,goalType:"checklist",archived:false,order:Date.now(),placeholder:true});
  });
}
function tabs(page){return state.tabs[page]||[]}
function goalSubtabs(tabId){return (state.goalSubtabs||[]).filter(x=>x.tabId===tabId).sort((a,b)=>(a.order||0)-(b.order||0))}
function currentGoalSubtab(tabId){const list=goalSubtabs(tabId);if(!list.some(x=>x.id===active.goalSubtab))active.goalSubtab=list[0]?.id||null;return active.goalSubtab}
function groups(page,tabId,subtabId){return state.groups.filter(g=>g.page===page&&(!tabId||g.tabId===tabId)&&(!subtabId||g.subtabId===subtabId)).sort((a,b)=>(a.order||0)-(b.order||0))}
function tasks(page,tabId,groupId,includeArchived=false,subtabId=null){return state.tasks.filter(t=>t.page===page&&(!tabId||t.tabId===tabId)&&(!groupId||t.groupId===groupId)&&(!subtabId||t.subtabId===subtabId)&&(includeArchived||!t.archived)).sort((a,b)=>(a.order||0)-(b.order||0))}
function currentTab(page){const ts=tabs(page);if(!ts.some(t=>t.id===active[page]))active[page]=ts[0]?.id||null;return active[page]}
function rarity(id){return state.settings.rarities.find(r=>r.id===id)||state.settings.rarities[0]}
function rarityColor(id){return rarity(id)?.color||state.settings.outline}
function rarityOptions(selected){return state.settings.rarities.map(r=>`<option value="${esc(r.id)}" ${r.id===selected?"selected":""}>${esc(r.name)}</option>`).join("")}
function rarityForPercent(percent){const rs=state.settings.rarities;if(!rs.length)return null;const p=Math.max(0,Math.min(100,Number(percent)||0));const index=p>=100?rs.length-1:Math.floor((p/100)*rs.length);return rs[Math.min(rs.length-1,index)]}
function setTheme(){const s=state.settings;const root=document.documentElement.style;root.setProperty("--background",s.background);root.setProperty("--outline",s.outline);root.setProperty("--panel",s.panel);root.setProperty("--group",s.group);root.setProperty("--task",s.task);root.setProperty("--inner",s.inner)}

function valueStore(page,key=dateKey()){
  if(page==="today"){state.days[key] ||= {};return state.days[key]}
  return state.goals;
}
function taskStatus(task,key=dateKey()){
  const store=valueStore(task.page,key);const val=store[task.id]||{};const type=task.page==="goals"?(task.goalType||"checklist"):"checklist";
  if(type==="progression"){const max=Math.max(0,(task.stages||[]).length-1),index=Math.max(0,Math.min(max,Number(val.stageIndex)||0));return {complete:max>0&&index>=max,checked:max>0&&index>=max,parts:val.parts||{},completedAt:val.completedAt||null,stageIndex:index}}
  if(type==="counter"||type==="percentage"||type==="stars"){const target=Math.max(1,Number(task.target)||100),value=Math.max(0,Number(val.value)||0);return {complete:value>=target,checked:value>=target,parts:val.parts||{},completedAt:val.completedAt||null,value,target}}
  if(task.parts.length){const completedParts=task.parts.filter(p=>!!val.parts?.[p.id]);return {complete:completedParts.length===task.parts.length,checked:!!val.complete,parts:val.parts||{},completedAt:val.completedAt||null}}
  return {complete:!!val.complete,checked:!!val.complete,parts:{},completedAt:val.completedAt||null};
}
function taskScore(task,key=dateKey()){
  const st=taskStatus(task,key),type=task.page==="goals"?(task.goalType||"checklist"):"checklist";let earned=0,total=validWeight(task.weight);
  if(type==="progression"){const max=Math.max(1,(task.stages||[]).length-1);return {earned:validWeight(task.weight)*(st.stageIndex/max),total:validWeight(task.weight),percent:st.stageIndex/max*100}}
  if(type==="counter"||type==="percentage"||type==="stars"){const ratio=Math.min(1,(st.value||0)/(st.target||1));return {earned:validWeight(task.weight)*ratio,total:validWeight(task.weight),percent:ratio*100}}
  if(task.parts.length){for(const p of task.parts){const w=validWeight(p.weight);total+=w;if(st.parts[p.id])earned+=w}if(st.complete)earned+=validWeight(task.weight)}else if(st.complete)earned+=validWeight(task.weight);
  return {earned,total,percent:total?earned/total*100:st.complete?100:0};
}
function tabScore(page,tabId,key=dateKey()){
  const list=tasks(page,tabId);let earned=0,total=0;list.forEach(t=>{const s=taskScore(t,key);earned+=s.earned;total+=s.total});return {earned,total,percent:total?earned/total*100:0};
}
function pageScore(page,key=dateKey()){
  const list=tasks(page);let earned=0,total=0;list.forEach(t=>{const s=taskScore(t,key);earned+=s.earned;total+=s.total});return {earned,total,percent:total?earned/total*100:0};
}
function updateTaskValue(task,partId,checked){
  const store=valueStore(task.page);store[task.id] ||= {parts:{}};const val=store[task.id];val.parts ||= {};
  if(partId)val.parts[partId]=checked;else val.complete=checked;
  const nowComplete=task.parts.length?task.parts.every(p=>!!val.parts[p.id]):!!val.complete;
  val.complete=nowComplete;
  if(task.page==="goals"){if(nowComplete&&!val.completedAt)val.completedAt=new Date().toISOString();if(!nowComplete)val.completedAt=null}
  save();renderAll();
}
function formatWeight(v){return Number(v)%1===0?String(Number(v)):Number(v).toFixed(2).replace(/0+$/,"").replace(/\.$/,"")}
function progressMarkup(label,score){const rr=rarityForPercent(score.percent);return `<div><strong style="color:${rr.color}">${esc(label)}: ${score.percent.toFixed(1)}%</strong><span class="muted"> · ${formatWeight(score.earned)} / ${formatWeight(score.total)} weight</span></div><div class="progress-line" style="--progress-color:${rr.color}"><span style="width:${score.percent}%"></span></div>`}

function renderTabs(page){
  const el=document.querySelector(`#${page}Tabs`);const key=page==="today"?dateKey():dateKey();
  el.innerHTML=tabs(page).map(t=>{const score=tabScore(page,t.id,key);let rr=rarityForPercent(score.percent);if(page==="goals"){
    const completed=tasks("goals",t.id).filter(x=>taskStatus(x).complete);if(completed.length){const max=Math.max(...completed.map(x=>state.settings.rarities.findIndex(r=>r.id===x.rarity)));rr=state.settings.rarities[Math.max(0,max)]||rr}
  }
  return `<button class="folder-tab ${currentTab(page)===t.id?"active":""}" data-tab-page="${page}" data-tab-id="${t.id}" style="--rarity:${rr.color}" title="${score.percent.toFixed(1)}% complete">${esc(t.name)}</button>`}).join("")+`<button class="folder-tab add" data-add-tab="${page}" style="--rarity:#55ffff">+</button>`;
}
function goalDisplayRarity(task,st){
  if(task.page!=="goals")return task.rarity;
  if((task.goalType||"checklist")==="progression")return task.stages?.[st.stageIndex]?.rarity||task.rarity;
  if(task.parts?.length){let best=-1,bestId=task.rarity;task.parts.forEach(p=>{if(st.parts?.[p.id]){const i=state.settings.rarities.findIndex(r=>r.id===(p.rarity||task.rarity));if(i>best){best=i;bestId=p.rarity||task.rarity}}});return st.complete?task.rarity:best>=0?bestId:task.rarity}
  return task.rarity;
}
function goalSubtabsMarkup(){const tabId=currentTab("goals"),items=goalSubtabs(tabId);return items.map(x=>`<button class="goal-subtab ${currentGoalSubtab(tabId)===x.id?"active":""}" data-goal-subtab="${x.id}">${esc(x.name)}</button>`).join("")+`<button class="goal-subtab add" data-add-goal-subtab="${tabId}">+</button>`}
function setGoalStage(task,direction){const val=valueStore("goals")[task.id] ||= {parts:{}};const max=Math.max(0,(task.stages||[]).length-1);val.stageIndex=Math.max(0,Math.min(max,(Number(val.stageIndex)||0)+direction));val.complete=max>0&&val.stageIndex>=max;if(val.complete&&!val.completedAt)val.completedAt=new Date().toISOString();if(!val.complete)val.completedAt=null;save();renderAll()}
function changeGoalValue(task,delta){const val=valueStore("goals")[task.id] ||= {parts:{}};val.value=Math.max(0,Math.min(Number(task.target)||100,(Number(val.value)||0)+delta));val.complete=val.value>=Number(task.target||100);if(val.complete&&!val.completedAt)val.completedAt=new Date().toISOString();if(!val.complete)val.completedAt=null;save();renderAll()}
function taskMarkup(task,key=dateKey(),completedCopy=false){
  const st=taskStatus(task,key),score=taskScore(task,key),rid=goalDisplayRarity(task,st),color=rarityColor(rid),date=st.completedAt?new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(new Date(st.completedAt)):"";
  const type=task.page==="goals"?(task.goalType||"checklist"):"checklist";let control="";
  if(type==="progression"){const stage=task.stages?.[st.stageIndex]||{name:"No tiers",rarity:task.rarity};control=`<div class="goal-stage-control"><button class="icon-button" data-goal-stage="${task.id}" data-goal-dir="-1">◀</button><strong style="color:${color}">${esc(stage.name)}</strong><button class="icon-button" data-goal-stage="${task.id}" data-goal-dir="1">▶</button></div>`}
  else if(type==="counter"||type==="percentage"||type==="stars"){const suffix=task.suffix||({percentage:"%",stars:"★"}[type]||"");control=`<div class="goal-number-control"><button class="icon-button" data-goal-value="${task.id}" data-goal-delta="-1">−</button><strong style="color:${color}">${formatWeight(st.value||0)} / ${formatWeight(st.target||task.target)} ${esc(suffix)}</strong><button class="icon-button" data-goal-value="${task.id}" data-goal-delta="1">+</button></div>`}
  const mainChecked=st.complete?"checked":"",disabled=(task.parts.length||type!=="checklist")?"disabled":"";
  return `<article class="task-card goal-type-${type}" style="--rarity:${color}"><div class="task-row"><label><input type="checkbox" data-check-task="${task.id}" ${mainChecked} ${disabled}><span style="color:${color}">${esc(task.name)}</span></label><span class="task-meta">${score.percent.toFixed(0)}% · ${formatWeight(score.total)} wt</span><div class="task-actions"><button class="icon-button" data-add-part="${task.id}" title="Add checklist part">+</button><button class="icon-button" data-edit-task="${task.id}">Edit</button></div></div>${control}${date?`<div class="completed-date" style="color:${color}">Completed ${esc(date)}</div>`:""}${task.parts.length?`<div class="task-parts">${task.parts.map(p=>`<div class="part-row"><label><input type="checkbox" data-check-task="${task.id}" data-check-part="${p.id}" ${st.parts[p.id]?"checked":""}><span style="color:${st.parts[p.id]?rarityColor(p.rarity||task.rarity):"inherit"}">${esc(p.name)}</span></label><span class="part-weight">${formatWeight(p.weight)} wt · ${esc(rarity(p.rarity||task.rarity).name)}</span></div>`).join("")}</div>`:""}</article>`;
}
function groupMarkup(g,page,key=dateKey(),completed=false){
  const allTasks=tasks(page,g.tabId,g.id);
  // Today is a persistent checklist: completed tasks remain visible so every
  // checkbox can be corrected without resetting the entire day. Goals keeps
  // its separate active/completed group behavior.
  const list=page==="today"
    ? allTasks
    : allTasks.filter(t=>completed?taskStatus(t,key).complete:!taskStatus(t,key).complete);
  if(!list.length)return "";const rid=completed&&page==="goals"?g.completedRarity:g.rarity;const title=completed&&page==="goals"?`${g.name} — Completed`:g.name;
  return `<section class="group-card" style="--rarity:${rarityColor(rid)}"><div class="group-head"><h3 class="group-title">${esc(title)}</h3><div class="group-actions">${!completed?`<button class="small-button" data-add-task-page="${page}" data-add-task-group="${g.id}">+ Task</button>`:""}<button class="icon-button" data-edit-group="${g.id}">Edit</button></div></div><div class="task-list">${list.map(t=>taskMarkup(t,key,completed)).join("")}</div></section>`;
}
function renderPage(page){
  ensureGroupTasks();renderTabs(page);const tabId=currentTab(page),subtabId=page==="goals"?currentGoalSubtab(tabId):null,score=tabScore(page,tabId),overall=pageScore(page);
  if(page==="goals")document.querySelector("#goalSubtabs").innerHTML=goalSubtabsMarkup();document.querySelector(`#${page}Overall`).innerHTML=`Overall ${overall.percent.toFixed(1)}%`;
  const tab=tabs(page).find(t=>t.id===tabId);document.querySelector(`#${page}SkillProgress`).innerHTML=progressMarkup(tab?.name||"Folder",score);
  const gs=groups(page,tabId,subtabId);let html="";
  if(page==="goals"){
    html+=gs.map(g=>groupMarkup(g,page,dateKey(),false)).join("");
    html+=gs.map(g=>groupMarkup(g,page,dateKey(),true)).join("");
  }else html=gs.map(g=>groupMarkup(g,page)).join("");
  document.querySelector(`#${page}Content`).innerHTML=html||`<div class="empty-state">No groups yet. Add one above.</div>`;
}

function datesForRange(count){const out=[];const today=new Date();for(let i=count-1;i>=0;i--){const d=new Date(today);d.setDate(today.getDate()-i);out.push(dateKey(d))}return out}
function renderTodayWeekly(){
  const dates=datesForRange(7),skills=tabs("today");let html='<div class="weekly-grid"><div></div>';
  dates.forEach(key=>{const d=parseDate(key);html+=`<div class="week-label"><strong>${d.toLocaleDateString(undefined,{weekday:"short"})}</strong><br>${d.toLocaleDateString(undefined,{month:"numeric",day:"numeric"})}</div>`});
  skills.forEach(skill=>{const todayScore=tabScore("today",skill.id,dateKey()),skillRarity=rarityForPercent(todayScore.percent);html+=`<div class="week-skill" style="--skill-color:${skillRarity.color};color:${skillRarity.color}">${esc(skill.name)}</div>`;dates.forEach(key=>{const score=tabScore("today",skill.id,key),rr=rarityForPercent(score.percent),has=!!state.days[key];html+=`<button class="weekly-cell ${has?"":"no-data"}" data-history-cell="${key}" style="--cell-color:${rr.color}" title="${esc(skill.name)} · ${key} · ${score.percent.toFixed(1)}%">${score.percent.toFixed(0)}%</button>`})});
  html+='</div>';document.querySelector("#todayWeeklyOverview").innerHTML=html;
  document.querySelector("#todayWeeklyLegend").innerHTML=state.settings.rarities.map((r,i)=>{const low=Math.round(i/state.settings.rarities.length*100),high=i===state.settings.rarities.length-1?100:Math.round((i+1)/state.settings.rarities.length*100)-1;return `<div class="legend-chip" style="color:${r.color}"><span class="legend-swatch"></span><span>${low}–${high}%</span></div>`}).join("");
}
function renderHeatmap(){
  const count=Number(document.querySelector("#historyRange").value||7),dates=datesForRange(count),skills=tabs("today");
  const gridItems=[];dates.forEach((key,i)=>{if(i&&i%7===0)gridItems.push({spacer:true});gridItems.push({key})});
  const columns=`125px ${gridItems.map(x=>x.spacer?"9px":"19px").join(" ")}`;let html=`<div class="heatmap-grid" style="grid-template-columns:${columns}"><div class="heatmap-corner"></div>`;
  gridItems.forEach(item=>{if(item.spacer){html+=`<div class="heatmap-spacer" aria-hidden="true"></div>`;return}const d=parseDate(item.key);html+=`<div class="heatmap-day" title="${item.key}">${d.toLocaleDateString(undefined,{month:"short",day:"numeric"})}</div>`});
  skills.forEach(skill=>{html+=`<div class="heatmap-label">${esc(skill.name)}</div>`;gridItems.forEach(item=>{if(item.spacer){html+=`<div class="heatmap-spacer" aria-hidden="true"></div>`;return}const s=tabScore("today",skill.id,item.key),rr=rarityForPercent(s.percent),has=!!state.days[item.key];html+=`<button class="heat-cell ${!has?"no-data":""}" data-history-cell="${item.key}" style="background:${rr.color}" title="${skill.name} · ${item.key} · ${s.percent.toFixed(1)}%"></button>`})});
  html+=`</div>`;document.querySelector("#historyHeatmap").innerHTML=html;
  document.querySelector("#historyLegend").innerHTML=state.settings.rarities.map((r,i)=>{const low=Math.round(i/state.settings.rarities.length*100),high=i===state.settings.rarities.length-1?100:Math.round((i+1)/state.settings.rarities.length*100)-1;return `<div class="legend-chip" style="color:${r.color}"><span class="legend-swatch"></span><span>${esc(r.name)} ${low}–${high}%</span></div>`}).join("");
}
function renderHistory(){
  const input=document.querySelector("#historyDate");if(!input.value)input.value=dateKey();const key=input.value;const overall=pageScore("today",key);const rr=rarityForPercent(overall.percent);
  document.querySelector("#historySummary").innerHTML=`<strong style="color:${rr.color}">${key}: ${overall.percent.toFixed(1)}%</strong> weighted completion · ${formatWeight(overall.earned)} / ${formatWeight(overall.total)} weight`;
  document.querySelector("#historyContent").innerHTML=tabs("today").map(tab=>{const s=tabScore("today",tab.id,key),r=rarityForPercent(s.percent);return `<section class="history-skill"><strong style="color:${r.color}">${esc(tab.name)} — ${s.percent.toFixed(1)}%</strong><div class="progress-line" style="--progress-color:${r.color}"><span style="width:${s.percent}%"></span></div></section>`}).join("");
  renderHeatmap();
}
function renderRarityEditor(){document.querySelector("#rarityEditor").innerHTML=state.settings.rarities.map(r=>`<div class="rarity-row" data-rarity-row="${r.id}"><input data-rarity-name value="${esc(r.name)}"><input data-rarity-color type="color" value="${r.color}"><button class="danger-button" data-delete-rarity="${r.id}">Delete</button></div>`).join("")}
function manageIsOpen(key,defaultOpen=false){const saved=state.settings.manageOpen?.[key];return saved===undefined?defaultOpen:!!saved}
function openAttr(key,defaultOpen=false){return manageIsOpen(key,defaultOpen)?" open":""}
function moveItem(type,page,id,direction){
  let list=[];
  if(type==="tab") list=state.tabs[page];
  if(type==="group"){const item=state.groups.find(x=>x.id===id);list=groups(page,item?.tabId);}
  if(type==="task"){const item=state.tasks.find(x=>x.id===id);list=tasks(page,item?.tabId,item?.groupId,true);}
  const index=list.findIndex(x=>x.id===id),next=index+direction;if(index<0||next<0||next>=list.length)return;
  const a=list[index],b=list[next],ao=a.order??index,bo=b.order??next;a.order=bo;b.order=ao;
  if(type==="tab"){const raw=state.tabs[page],ia=raw.findIndex(x=>x.id===a.id),ib=raw.findIndex(x=>x.id===b.id);[raw[ia],raw[ib]]=[raw[ib],raw[ia]];}
  save();renderAll();
}
function arrowButtons(type,page,id){return `<button class="icon-button" data-move-type="${type}" data-move-page="${page}" data-move-id="${id}" data-move-dir="-1" title="Move up">↑</button><button class="icon-button" data-move-type="${type}" data-move-page="${page}" data-move-id="${id}" data-move-dir="1" title="Move down">↓</button>`}
function goalSubtabManageMarkup(tab){return `<div class="manage-subtabs"><strong>Goal subtabs</strong>${goalSubtabs(tab.id).map(x=>`<div class="manage-item"><input class="manage-name-input" value="${esc(x.name)}" data-subtab-name="${x.id}"><div><button class="small-button" data-save-subtab="${x.id}">Save</button><button class="danger-button" data-delete-subtab="${x.id}">Delete</button></div></div>`).join("")}</div>`}
function renderManage(){
  document.querySelector("#manageContent").innerHTML=["today","goals"].map(page=>{const pageKey=`page:${page}`;return `<details class="manage-page manage-${page}" data-manage-key="${pageKey}"${openAttr(pageKey,true)}><summary><h3>${page==="today"?"Today":"Goals"}</h3></summary>${tabs(page).map(tab=>{const tabKey=`tab:${page}:${tab.id}`;return `<details class="manage-skill" data-manage-key="${tabKey}"${openAttr(tabKey,false)}><summary><div class="manage-tab"><input class="manage-name-input" data-rename-tab="${tab.id}" data-rename-page="${page}" value="${esc(tab.name)}" aria-label="Skill tab name"><div>${arrowButtons("tab",page,tab.id)}<button class="small-button" data-save-tab-name="${tab.id}" data-save-tab-page="${page}">Save name</button><button class="danger-button" data-delete-tab-id="${tab.id}" data-delete-tab-page="${page}">Delete tab</button></div></div></summary>${page==="goals"?goalSubtabManageMarkup(tab):""}${groups(page,tab.id).map(g=>{const groupKey=`group:${page}:${g.id}`;return `<details class="manage-group" data-manage-key="${groupKey}"${openAttr(groupKey,false)}><summary><div class="manage-item"><div><strong>${esc(g.name)}</strong><div class="manage-path">${esc(tab.name)} › Group</div></div><div>${arrowButtons("group",page,g.id)}<button class="icon-button" data-edit-group="${g.id}">Edit</button><button class="danger-button" data-delete-group="${g.id}">Delete</button></div></div></summary>${tasks(page,tab.id,g.id,true).map(t=>`<div class="manage-item manage-task"><div><strong style="color:${rarityColor(t.rarity)}">${esc(t.name)}</strong><div class="manage-path">${formatWeight(taskScore(t).total)} weight${t.archived?" › archived":""}</div></div><div>${arrowButtons("task",page,t.id)}<button class="icon-button" data-edit-task="${t.id}">Edit</button><button class="small-button" data-archive-task="${t.id}">${t.archived?"Restore":"Archive"}</button><button class="danger-button" data-delete-task="${t.id}">Delete</button></div></div>`).join("")}</details>`}).join("")}</details>`}).join("")}</details>`}).join("");
}
let activeProfileCategory="trophy-fish";
function humanizeKey(key){return String(key).replace(/[_-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
function flattenMatching(obj,terms,path="",out=[],depth=0){
  if(obj==null||depth>9||out.length>180)return out;
  if(Array.isArray(obj)){obj.forEach((v,i)=>flattenMatching(v,terms,`${path}[${i}]`,out,depth+1));return out}
  if(typeof obj!=="object")return out;
  for(const [key,val] of Object.entries(obj)){
    const next=path?`${path}.${key}`:key,matched=terms.some(term=>key.toLowerCase().includes(term));
    if(matched){
      if(val&&typeof val==="object"&&!Array.isArray(val)){for(const [sub,v] of Object.entries(val)){if(typeof v!=="object")out.push({key:humanizeKey(sub),value:v,path:`${next}.${sub}`})}}
      else if(typeof val!=="object")out.push({key:humanizeKey(key),value:val,path:next});
    }
    if(val&&typeof val==="object")flattenMatching(val,terms,next,out,depth+1);
  }
  return out;
}
function selectedProfile(){const profiles=state.profileCache?.profiles||[];return profiles.find(p=>p.profile_id===state.settings.profileSelected)||profiles[0]||null}
function profileMember(){const profile=selectedProfile(),uuid=state.profileCache?.uuid;if(!profile||!uuid)return null;return profile.members?.[uuid]||profile.members?.[uuid.replace(/-/g,"")]||null}
function categoryTerms(id){return {"trophy-fish":["trophy_fish","trophyfish"],"trophy-frogs":["trophy_frog","trophyfrog","frog"],mutations:["mutation"],shards:["shard"]}[id]||[id]}
function renderProfile(){
  const status=document.querySelector("#profileStatus"),select=document.querySelector("#profileSelect"),content=document.querySelector("#profileContent"),cache=state.profileCache;
  document.querySelectorAll("[data-profile-category]").forEach(b=>b.classList.toggle("active",b.dataset.profileCategory===activeProfileCategory));
  if(!cache?.profiles?.length){status.textContent="Enter a username and Hypixel API key in Settings, then press Refresh.";select.innerHTML='<option>No profile loaded</option>';select.disabled=true;content.innerHTML='<div class="profile-placeholder"><strong>No API data cached yet</strong><p>After a successful refresh, the most recent data remains available in this browser.</p></div>';return}
  select.disabled=false;select.innerHTML=cache.profiles.map(p=>`<option value="${esc(p.profile_id)}" ${p.profile_id===state.settings.profileSelected?"selected":""}>${esc(p.cute_name||p.profile_id)}</option>`).join("");
  const fetched=new Date(cache.fetchedAt);status.textContent=`${cache.username} · updated ${fetched.toLocaleString()}`;
  const member=profileMember(),entries=flattenMatching(member,categoryTerms(activeProfileCategory));
  const unique=[];const seen=new Set();for(const x of entries){const k=`${x.path}:${x.value}`;if(!seen.has(k)){seen.add(k);unique.push(x)}}
  content.innerHTML=unique.length?`<div class="profile-data-grid">${unique.slice(0,120).map(x=>`<div class="profile-data-row"><span>${esc(x.key)}</span><strong>${esc(typeof x.value==="number"?x.value.toLocaleString():String(x.value))}</strong><small title="${esc(x.path)}">${esc(x.path)}</small></div>`).join("")}</div>`:`<div class="profile-placeholder"><strong>No matching ${esc(humanizeKey(activeProfileCategory))} fields found</strong><p>The API response for this profile may not expose this collection yet, or its field name may have changed.</p></div>`;
}
async function resolveMinecraftUuid(username){
  const r=await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);if(!r.ok)throw new Error("Minecraft username was not found");const data=await r.json();return data.id;
}
async function refreshProfile(){
  const username=state.settings.profileUsername?.trim(),key=state.settings.profileApiKey?.trim();if(!username||!key){toast("Add username and API key in Settings");document.querySelector('[data-view="settings"]').click();return}
  const button=document.querySelector("#profileRefresh");button.disabled=true;button.textContent="Refreshing…";
  try{
    const uuid=await resolveMinecraftUuid(username);let r=await fetch(`https://api.hypixel.net/v2/skyblock/profiles?uuid=${encodeURIComponent(uuid)}`,{headers:{"API-Key":key}});
    if(!r.ok)r=await fetch(`https://api.hypixel.net/v2/skyblock/profiles?uuid=${encodeURIComponent(uuid)}&key=${encodeURIComponent(key)}`);
    const data=await r.json();if(!r.ok||data.success===false)throw new Error(data.cause||`Hypixel API error ${r.status}`);
    const profiles=data.profiles||[];state.profileCache={username,uuid,profiles,fetchedAt:new Date().toISOString()};if(!profiles.some(p=>p.profile_id===state.settings.profileSelected))state.settings.profileSelected=profiles[0]?.profile_id||"";save();renderProfile();toast("Profile refreshed")
  }catch(err){console.error(err);alert(`Profile refresh failed: ${err.message}`)}finally{button.disabled=false;button.textContent="Refresh"}
}
function renderAll(){
  setTheme();document.querySelector("#todayLabel").textContent=new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric"}).format(new Date());
  ["background","outline","panel","group","task","inner"].forEach(k=>document.querySelector(`#${k}Color`).value=state.settings[k]);
  renderPage("today");renderPage("goals");document.querySelector("#profileUsername").value=state.settings.profileUsername||"";document.querySelector("#profileApiKey").value=state.settings.profileApiKey||"";renderTodayWeekly();renderHistory();renderRarityEditor();renderManage();renderProfile();save();decorateFrames();
}
function fill(el,items,selected){el.innerHTML=items.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?"selected":""}>${esc(x.name)}</option>`).join("")}
function parseParts(text,oldParts=[]){const byName=new Map(oldParts.map(p=>[p.name,p]));return text.split("\n").map(x=>x.trim()).filter(Boolean).map(line=>{const bits=line.split("|");const name=bits[0].trim();const weight=validWeight(bits[1]?.trim()||1);const partRarity=(bits[2]?.trim()||"common").toLowerCase();const validRarity=state.settings.rarities.some(r=>r.id===partRarity)?partRarity:"common";const old=byName.get(name);return old?{...old,weight,rarity:validRarity}:{id:uid("part"),name,weight,rarity:validRarity}})}
function parseStages(text){return text.split("\n").map(x=>x.trim()).filter(Boolean).map(line=>{const [nameRaw,rarRaw]=line.split("|");const name=nameRaw.trim(),candidate=(rarRaw||"common").trim().toLowerCase();return {name,rarity:state.settings.rarities.some(r=>r.id===candidate)?candidate:"common"}})}
function openTask(task=null,ctx={}){
  const page=task?.page||ctx.page||"today",tabId=task?.tabId||currentTab(page),gs=groups(page,tabId),groupId=task?.groupId||ctx.groupId||gs[0]?.id;
  document.querySelector("#taskDialogTitle").textContent=task?"Edit task":"Add task";document.querySelector("#taskId").value=task?.id||"";document.querySelector("#taskPage").value=page;document.querySelector("#taskName").value=task?.name||"";fill(document.querySelector("#taskTab"),tabs(page),tabId);fill(document.querySelector("#taskGroup"),groups(page,tabId),groupId);document.querySelector("#taskRarity").innerHTML=rarityOptions(task?.rarity||"common");document.querySelector("#taskWeight").value=validWeight(task?.weight);document.querySelector("#taskParts").value=task?.parts?.map(p=>`${p.name} | ${formatWeight(p.weight)} | ${p.rarity||task?.rarity||"common"}`).join("\n")||"";document.querySelector("#deleteTaskDialog").classList.toggle("hidden",!task);
  const goalTypes=document.querySelector("#goalTypeFields");goalTypes.classList.toggle("hidden",page!=="goals");document.querySelector("#goalType").value=task?.goalType||"checklist";fill(document.querySelector("#taskSubtab"),goalSubtabs(tabId),task?.subtabId||currentGoalSubtab(tabId));document.querySelector("#goalStages").value=task?.stages?.map(x=>`${x.name} | ${x.rarity}`).join("\n")||"";document.querySelector("#goalTarget").value=task?.target||100;document.querySelector("#goalSuffix").value=task?.suffix||"";syncGoalTypeFields();
  const goalField=document.querySelector("#goalCompletionField"),already=document.querySelector("#taskCompletedBeforeCreation"),dateInput=document.querySelector("#taskCompletedDate"),status=task&&page==="goals"?taskStatus(task):null;
  goalField.classList.toggle("hidden",page!=="goals");already.checked=!!status?.complete;dateInput.value=status?.completedAt?dateKey(new Date(status.completedAt)):dateKey();document.querySelector("#taskCompletedDateLabel").classList.toggle("hidden",!already.checked);
  document.querySelector("#taskDialog").showModal();
}
function openGroup(g=null,page="today"){
  page=g?.page||page;document.querySelector("#groupDialogTitle").textContent=g?"Edit group":"Add group";document.querySelector("#groupId").value=g?.id||"";document.querySelector("#groupPage").value=page;document.querySelector("#groupName").value=g?.name||"";const selectedTab=g?.tabId||currentTab(page);fill(document.querySelector("#groupTab"),tabs(page),selectedTab);document.querySelectorAll(".goal-group-subtab").forEach(x=>x.classList.toggle("hidden",page!=="goals"));if(page==="goals")fill(document.querySelector("#groupSubtab"),goalSubtabs(selectedTab),g?.subtabId||currentGoalSubtab(selectedTab));document.querySelector("#groupRarity").innerHTML=rarityOptions(g?.rarity||"common");document.querySelector("#groupCompletedRarity").innerHTML=rarityOptions(g?.completedRarity||"uncommon");document.querySelector("#completedRarityLabel").style.display=page==="goals"?"grid":"none";document.querySelector("#deleteGroupDialog").classList.toggle("hidden",!g);document.querySelector("#groupDialog").showModal();
}
function addPart(task){const name=prompt(`Add a checklist part to “${task.name}”: `);if(!name?.trim())return;const w=prompt("Weight for this part:","1");task.parts.push({id:uid("part"),name:name.trim(),weight:validWeight(w)});save();renderAll();toast("Checklist part added")}
function saveTask(){
  const id=document.querySelector("#taskId").value,page=document.querySelector("#taskPage").value,name=document.querySelector("#taskName").value.trim(),tabId=document.querySelector("#taskTab").value,groupId=document.querySelector("#taskGroup").value,rar=document.querySelector("#taskRarity").value,weight=validWeight(document.querySelector("#taskWeight").value);if(!name||!groupId)return false;
  const old=state.tasks.find(t=>t.id===id),parts=parseParts(document.querySelector("#taskParts").value,old?.parts||[]),goalType=page==="goals"?document.querySelector("#goalType").value:"checklist",subtabId=page==="goals"?document.querySelector("#taskSubtab").value:null,stages=page==="goals"?parseStages(document.querySelector("#goalStages").value):[],target=Math.max(1,Number(document.querySelector("#goalTarget").value)||100),suffix=document.querySelector("#goalSuffix").value.trim();let savedTask;
  if(old){Object.assign(old,{name,tabId,subtabId,groupId,rarity:rar,weight,parts,goalType,stages,target,suffix,placeholder:false});savedTask=old}else{savedTask={id:uid(slug(name)),page,tabId,subtabId,groupId,name,rarity:rar,weight,parts,goalType,stages,target,suffix,archived:false,order:Date.now(),placeholder:false};state.tasks.push(savedTask)}
  if(page==="goals"){
    const markComplete=document.querySelector("#taskCompletedBeforeCreation").checked;state.goals[savedTask.id] ||= {parts:{}};const val=state.goals[savedTask.id];val.parts ||= {};
    if(markComplete){savedTask.parts.forEach(part=>val.parts[part.id]=true);val.complete=true;const chosen=document.querySelector("#taskCompletedDate").value||dateKey();val.completedAt=new Date(`${chosen}T12:00:00`).toISOString()}
    else if(val.complete){val.complete=false;val.completedAt=null;savedTask.parts.forEach(part=>val.parts[part.id]=false)}
  }
  active[page]=tabId;save();renderAll();toast(old?"Task updated":"Task added");return true;
}
function saveGroup(){const id=document.querySelector("#groupId").value,page=document.querySelector("#groupPage").value,name=document.querySelector("#groupName").value.trim(),tabId=document.querySelector("#groupTab").value,subtabId=page==="goals"?document.querySelector("#groupSubtab").value:null,rar=document.querySelector("#groupRarity").value,done=document.querySelector("#groupCompletedRarity").value;if(!name||!tabId)return false;const g=state.groups.find(x=>x.id===id);if(g){Object.assign(g,{name,tabId,subtabId,rarity:rar,completedRarity:done});state.tasks.filter(t=>t.groupId===g.id).forEach(t=>{t.tabId=tabId;t.subtabId=subtabId})}else state.groups.push({id:uid("group"),page,tabId,subtabId,name,rarity:rar,completedRarity:done,order:Date.now()});active[page]=tabId;ensureGroupTasks();save();renderAll();toast(g?"Group updated":"Group added");return true}
function purgeTask(id){state.tasks=state.tasks.filter(t=>t.id!==id);Object.values(state.days).forEach(day=>delete day[id]);delete state.goals[id]}
function purgeGroup(id){state.tasks.filter(t=>t.groupId===id).forEach(t=>purgeTask(t.id));state.groups=state.groups.filter(g=>g.id!==id)}
function purgeTab(page,id){state.groups.filter(g=>g.page===page&&g.tabId===id).forEach(g=>purgeGroup(g.id));state.tabs[page]=state.tabs[page].filter(t=>t.id!==id);if(page==="goals")state.goalSubtabs=state.goalSubtabs.filter(x=>x.tabId!==id)}
function toast(msg){const t=document.querySelector("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),1800)}
function exportBackup(){const b=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`skyblock-task-menu-${dateKey()}.json`;a.click();URL.revokeObjectURL(a.href)}

addEventListener("click",e=>{
  if(e.target.closest("summary button")){e.preventDefault();e.stopPropagation();}
  const view=e.target.closest("[data-view]");if(view){document.querySelectorAll(".page-tab,.view").forEach(x=>x.classList.remove("active"));view.classList.add("active");document.querySelector(`#${view.dataset.view}View`).classList.add("active")}
  const tab=e.target.closest("[data-tab-page]");if(tab){active[tab.dataset.tabPage]=tab.dataset.tabId;if(tab.dataset.tabPage==="goals")active.goalSubtab=null;renderPage(tab.dataset.tabPage)}
  const subtab=e.target.closest("[data-goal-subtab]");if(subtab){active.goalSubtab=subtab.dataset.goalSubtab;renderPage("goals")}
  const addSub=e.target.closest("[data-add-goal-subtab]");if(addSub){document.querySelector("#subtabParent").value=addSub.dataset.addGoalSubtab;document.querySelector("#subtabName").value="";document.querySelector("#subtabDialog").showModal()}
  const stageBtn=e.target.closest("[data-goal-stage]");if(stageBtn)setGoalStage(state.tasks.find(t=>t.id===stageBtn.dataset.goalStage),Number(stageBtn.dataset.goalDir));
  const valueBtn=e.target.closest("[data-goal-value]");if(valueBtn)changeGoalValue(state.tasks.find(t=>t.id===valueBtn.dataset.goalValue),Number(valueBtn.dataset.goalDelta));
  const addTab=e.target.closest("[data-add-tab]");if(addTab){document.querySelector("#tabPage").value=addTab.dataset.addTab;document.querySelector("#tabName").value="";document.querySelector("#tabDialog").showModal()}
  const addGroup=e.target.closest("[data-add-group]");if(addGroup)openGroup(null,addGroup.dataset.addGroup);
  const editGroup=e.target.closest("[data-edit-group]");if(editGroup)openGroup(state.groups.find(g=>g.id===editGroup.dataset.editGroup));
  const addTask=e.target.closest("[data-add-task-page]");if(addTask)openTask(null,{page:addTask.dataset.addTaskPage,groupId:addTask.dataset.addTaskGroup});
  const editTask=e.target.closest("[data-edit-task]");if(editTask)openTask(state.tasks.find(t=>t.id===editTask.dataset.editTask));
  const part=e.target.closest("[data-add-part]");if(part)addPart(state.tasks.find(t=>t.id===part.dataset.addPart));
  if(e.target.matches("input[data-check-task]")){const task=state.tasks.find(t=>t.id===e.target.dataset.checkTask);updateTaskValue(task,e.target.dataset.checkPart,e.target.checked)}
  const arch=e.target.closest("[data-archive-task]");if(arch){const t=state.tasks.find(x=>x.id===arch.dataset.archiveTask);t.archived=!t.archived;ensureGroupTasks();save();renderAll()}
  const move=e.target.closest("[data-move-type]");if(move)moveItem(move.dataset.moveType,move.dataset.movePage,move.dataset.moveId,Number(move.dataset.moveDir));
  const saveTab=e.target.closest("[data-save-tab-name]");if(saveTab){const input=document.querySelector(`[data-rename-tab="${saveTab.dataset.saveTabName}"][data-rename-page="${saveTab.dataset.saveTabPage}"]`),tab=state.tabs[saveTab.dataset.saveTabPage].find(x=>x.id===saveTab.dataset.saveTabName);if(tab&&input?.value.trim()){tab.name=input.value.trim();save();renderAll();toast("Tab renamed")}}
  const saveSub=e.target.closest("[data-save-subtab]");if(saveSub){const sub=state.goalSubtabs.find(x=>x.id===saveSub.dataset.saveSubtab),input=document.querySelector(`[data-subtab-name="${saveSub.dataset.saveSubtab}"]`);if(sub&&input?.value.trim()){sub.name=input.value.trim();save();renderAll();toast("Subtab renamed")}}
  const delSub=e.target.closest("[data-delete-subtab]");if(delSub){const id=delSub.dataset.deleteSubtab,sub=state.goalSubtabs.find(x=>x.id===id),siblings=goalSubtabs(sub?.tabId);if(siblings.length<=1){alert("Each Goals tab needs at least one subtab.")}else if(confirm("Delete this subtab and all groups inside it?")){state.groups.filter(g=>g.subtabId===id).forEach(g=>purgeGroup(g.id));state.goalSubtabs=state.goalSubtabs.filter(x=>x.id!==id);active.goalSubtab=null;save();renderAll()}}
  const delTask=e.target.closest("[data-delete-task]");if(delTask&&confirm("Permanently delete this task and all of its saved history?")){purgeTask(delTask.dataset.deleteTask);ensureGroupTasks();save();renderAll()}
  const delGroup=e.target.closest("[data-delete-group]");if(delGroup&&confirm("Permanently delete this group, its tasks, and their saved history?")){purgeGroup(delGroup.dataset.deleteGroup);save();renderAll()}
  const delTab=e.target.closest("[data-delete-tab-id]");if(delTab&&confirm("Permanently delete this folder tab, its groups, tasks, and their saved history?")){purgeTab(delTab.dataset.deleteTabPage,delTab.dataset.deleteTabId);save();renderAll()}
  const delR=e.target.closest("[data-delete-rarity]");if(delR&&state.settings.rarities.length>1){const id=delR.dataset.deleteRarity,replacement=state.settings.rarities.find(r=>r.id!==id).id;state.tasks.forEach(t=>{if(t.rarity===id)t.rarity=replacement});state.groups.forEach(g=>{if(g.rarity===id)g.rarity=replacement;if(g.completedRarity===id)g.completedRarity=replacement});state.settings.rarities=state.settings.rarities.filter(r=>r.id!==id);renderAll()}
  const cell=e.target.closest("[data-history-cell]");if(cell){document.querySelector("#historyDate").value=cell.dataset.historyCell;renderHistory();document.querySelector('[data-view="history"]').click()}
  if(e.target.closest("[data-close]"))e.target.closest("dialog").close();
});
document.querySelector("#taskTab").onchange=()=>{const page=document.querySelector("#taskPage").value,tabId=document.querySelector("#taskTab").value;if(page==="goals")fill(document.querySelector("#taskSubtab"),goalSubtabs(tabId),null);fill(document.querySelector("#taskGroup"),groups(page,tabId,page==="goals"?document.querySelector("#taskSubtab").value:null),null)};
document.querySelector("#groupTab").onchange=()=>{if(document.querySelector("#groupPage").value==="goals")fill(document.querySelector("#groupSubtab"),goalSubtabs(document.querySelector("#groupTab").value),null)};
document.querySelector("#taskSubtab").onchange=()=>fill(document.querySelector("#taskGroup"),groups("goals",document.querySelector("#taskTab").value,document.querySelector("#taskSubtab").value),null);
function syncGoalTypeFields(){const type=document.querySelector("#goalType").value;document.querySelectorAll(".progression-only").forEach(x=>x.classList.toggle("hidden",type!=="progression"));document.querySelectorAll(".numeric-goal-only").forEach(x=>x.classList.toggle("hidden",!["counter","percentage","stars"].includes(type)))}
document.querySelector("#goalType").onchange=syncGoalTypeFields;
document.querySelector("#taskForm").onsubmit=e=>{if(!saveTask())e.preventDefault()};
document.querySelector("#groupForm").onsubmit=e=>{if(!saveGroup())e.preventDefault()};
document.querySelector("#subtabForm").onsubmit=()=>{const tabId=document.querySelector("#subtabParent").value,name=document.querySelector("#subtabName").value.trim();if(!name)return false;const id=uid("subtab");state.goalSubtabs.push({id,tabId,name,order:Date.now()});active.goalSubtab=id;save();renderAll()};
document.querySelector("#tabForm").onsubmit=()=>{const page=document.querySelector("#tabPage").value,name=document.querySelector("#tabName").value.trim();if(!name)return false;const id=uid(slug(name));state.tabs[page].push({id,name});if(page==="goals"){const sid=uid("subtab");state.goalSubtabs.push({id:sid,tabId:id,name:"General",order:0});active.goalSubtab=sid}active[page]=id;save();renderAll()};
document.querySelector("#deleteTaskDialog").onclick=()=>{const id=document.querySelector("#taskId").value;if(id&&confirm("Permanently delete this task and all saved history?")){purgeTask(id);document.querySelector("#taskDialog").close();ensureGroupTasks();save();renderAll()}};
document.querySelector("#deleteGroupDialog").onclick=()=>{const id=document.querySelector("#groupId").value;if(id&&confirm("Permanently delete this group and all tasks in it?")){purgeGroup(id);document.querySelector("#groupDialog").close();save();renderAll()}};
document.querySelector("#saveProfileSettings").onclick=()=>{state.settings.profileUsername=document.querySelector("#profileUsername").value.trim();state.settings.profileApiKey=document.querySelector("#profileApiKey").value.trim();save();toast("Profile settings saved locally")};
document.querySelector("#profileRefresh").onclick=refreshProfile;
document.querySelector("#profileSelect").onchange=e=>{state.settings.profileSelected=e.target.value;save();renderProfile()};
document.querySelectorAll("[data-profile-category]").forEach(button=>button.onclick=()=>{activeProfileCategory=button.dataset.profileCategory;renderProfile()});
document.querySelector("#manageContent").addEventListener("toggle",e=>{const d=e.target.closest("details[data-manage-key]");if(!d)return;state.settings.manageOpen[d.dataset.manageKey]=d.open;save()},true);
document.querySelector("#settingsShortcut").onclick=()=>document.querySelector('[data-view="settings"]').click();
document.querySelector("#historyDate").onchange=renderHistory;document.querySelector("#historyRange").onchange=renderHeatmap;
document.querySelector("#openHistoryFromWeek").onclick=()=>document.querySelector('[data-view="history"]').click();
document.querySelector("#taskCompletedBeforeCreation").onchange=e=>document.querySelector("#taskCompletedDateLabel").classList.toggle("hidden",!e.target.checked);
document.querySelector("#resetToday").onclick=()=>{if(confirm("Reset every checkbox for today? Earlier dates remain unchanged.")){state.days[dateKey()]={};save();renderAll()}};
document.querySelector("#saveColors").onclick=()=>{["background","outline","panel","group","task","inner"].forEach(k=>state.settings[k]=document.querySelector(`#${k}Color`).value);save();renderAll();toast("Colors saved")};
document.querySelector("#addRarity").onclick=()=>{state.settings.rarities.push({id:uid("rarity"),name:"CUSTOM",color:"#55ffff"});renderAll()};
document.querySelector("#rarityEditor").addEventListener("change",e=>{const row=e.target.closest("[data-rarity-row]");if(!row)return;const r=state.settings.rarities.find(x=>x.id===row.dataset.rarityRow);r.name=row.querySelector("[data-rarity-name]").value.trim()||"CUSTOM";r.color=row.querySelector("[data-rarity-color]").value;save();renderAll()});
document.querySelector("#exportBackup").onclick=exportBackup;document.querySelector("#importBackup").onclick=()=>document.querySelector("#importFile").click();document.querySelector("#importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{state=migrate(JSON.parse(reader.result));active={today:null,goals:null,goalSubtab:null};save();renderAll();toast("Backup imported")}catch(err){alert("That is not a valid tracker backup.")}};reader.readAsText(f)};
if("serviceWorker" in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
renderAll();

/* Attach the reusable four-corner frame ornament to every framed surface. */
function decorateFrames(root=document){
  const selector='.pixel-panel,.group-card,.task-card,.settings-card,.summary-box,.history-skill,.folder-tab,.page-tab';
  const elements=[];if(root.nodeType===1&&root.matches(selector))elements.push(root);elements.push(...root.querySelectorAll(selector));
  elements.forEach(el=>{
    if(el.dataset.cornerFrame==='1')return;
    el.dataset.cornerFrame='1';
    for(const pos of ['tl','tr','br','bl']){
      const corner=document.createElement('i');
      corner.className=`frame-corner ${pos}`;
      corner.setAttribute('aria-hidden','true');
      corner.innerHTML='<b class="corner-dot"></b><b class="corner-arm-x"></b><b class="corner-arm-y"></b>';
      el.appendChild(corner);
    }
  });
}
const frameObserver=new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes){if(node.nodeType===1)decorateFrames(node)}
  }
});
frameObserver.observe(document.body,{childList:true,subtree:true});
decorateFrames();
