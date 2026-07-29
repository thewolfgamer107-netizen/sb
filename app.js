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
  version:5,
  settings:{background:"#030915",outline:"#5a6d87",panel:"#071525",group:"#08182a",task:"#0a1d31",inner:"#091a2d",rarities:defaultRarities},
  tabs:{today:[{id:"mining",name:"Mining"},{id:"farming",name:"Farming"},{id:"general",name:"General"}],goals:[{id:"gear",name:"Gear"},{id:"skills",name:"Skills"}]},
  groups:[
    {id:"dwarven",page:"today",tabId:"mining",name:"Dwarven Mines",rarity:"rare",completedRarity:"uncommon",order:0},
    {id:"garden",page:"today",tabId:"farming",name:"Garden",rarity:"uncommon",completedRarity:"uncommon",order:0},
    {id:"daily",page:"today",tabId:"general",name:"Daily",rarity:"common",completedRarity:"uncommon",order:0},
    {id:"first-goal",page:"goals",tabId:"gear",name:"Current Equipment",rarity:"epic",completedRarity:"legendary",order:0}
  ],
  tasks:[
    {id:"daily-commissions",page:"today",tabId:"mining",groupId:"dwarven",name:"Daily Commissions",rarity:"rare",weight:1,parts:[{id:"commission-1",name:"Commission 1",weight:1},{id:"commission-2",name:"Commission 2",weight:1},{id:"commission-3",name:"Commission 3",weight:1},{id:"commission-4",name:"Commission 4",weight:1}],archived:false,order:0},
    {id:"greenhouse",page:"today",tabId:"farming",groupId:"garden",name:"Greenhouse",rarity:"uncommon",weight:1,parts:[{id:"crops",name:"Collect crops",weight:1},{id:"visitors",name:"Check visitors",weight:1},{id:"upgrades",name:"Check upgrades",weight:1}],archived:false,order:0},
    {id:"experimentation-table",page:"today",tabId:"general",groupId:"daily",name:"Experimentation Table",rarity:"common",weight:1,parts:[],archived:false,order:0},
    {id:"starter-goal",page:"goals",tabId:"gear",groupId:"first-goal",name:"Build a long-term item goal",rarity:"epic",weight:1,parts:[{id:"materials",name:"Collect materials",weight:2},{id:"forge",name:"Forge components",weight:4}],archived:false,order:0}
  ],days:{},goals:{},createdAt:new Date().toISOString()
};
let state = loadState();
let active = {today:null,goals:null};

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
  n.version=5;
  n.settings={...clone(defaults.settings),...(n.settings||{})};
  n.settings.rarities=(n.settings.rarities?.length?n.settings.rarities:clone(defaultRarities));
  n.tabs=n.tabs||clone(defaults.tabs);n.tabs.today=n.tabs.today||[];n.tabs.goals=n.tabs.goals||[];
  n.groups=n.groups||[];n.tasks=n.tasks||[];n.days=n.days||{};n.goals=n.goals||{};
  n.tasks.forEach(t=>{t.weight=validWeight(t.weight);t.parts=t.parts||[];t.parts.forEach(p=>p.weight=validWeight(p.weight));t.archived=!!t.archived});
  n.groups.forEach(g=>{g.completedRarity=g.completedRarity||g.rarity||"common"});
  ensureGroupTasks(n);
  return n;
}
function validWeight(v){const x=Number(v);return Number.isFinite(x)&&x>=0?x:1}
function ensureGroupTasks(target=state){
  target.groups.forEach(g=>{
    const any=target.tasks.some(t=>t.page===g.page&&t.groupId===g.id&&!t.archived);
    if(!any)target.tasks.push({id:uid("new-task"),page:g.page,tabId:g.tabId,groupId:g.id,name:"New task",rarity:g.rarity||"common",weight:1,parts:[],archived:false,order:Date.now(),placeholder:true});
  });
}
function tabs(page){return state.tabs[page]||[]}
function groups(page,tabId){return state.groups.filter(g=>g.page===page&&(!tabId||g.tabId===tabId)).sort((a,b)=>(a.order||0)-(b.order||0))}
function tasks(page,tabId,groupId,includeArchived=false){return state.tasks.filter(t=>t.page===page&&(!tabId||t.tabId===tabId)&&(!groupId||t.groupId===groupId)&&(includeArchived||!t.archived)).sort((a,b)=>(a.order||0)-(b.order||0))}
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
  const store=valueStore(task.page,key);const val=store[task.id]||{};
  if(task.parts.length){const completedParts=task.parts.filter(p=>!!val.parts?.[p.id]);return {complete:completedParts.length===task.parts.length,checked:!!val.complete,parts:val.parts||{},completedAt:val.completedAt||null}}
  return {complete:!!val.complete,checked:!!val.complete,parts:{},completedAt:val.completedAt||null};
}
function taskScore(task,key=dateKey()){
  const st=taskStatus(task,key);let earned=0,total=validWeight(task.weight);
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
function taskMarkup(task,key=dateKey(),completedCopy=false){
  const st=taskStatus(task,key),score=taskScore(task,key),color=rarityColor(task.rarity),date=st.completedAt?new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(new Date(st.completedAt)):"";
  const mainChecked=st.complete?"checked":"";const disabled=task.parts.length?"disabled":"";
  return `<article class="task-card" style="--rarity:${color}"><div class="task-row"><label><input type="checkbox" data-check-task="${task.id}" ${mainChecked} ${disabled}><span>${esc(task.name)}</span></label><span class="task-meta">${score.percent.toFixed(0)}% · ${formatWeight(score.total)} wt</span><div class="task-actions"><button class="icon-button" data-add-part="${task.id}" title="Add checklist part">+</button><button class="icon-button" data-edit-task="${task.id}">Edit</button></div></div>${date?`<div class="completed-date">Completed ${esc(date)}</div>`:""}${task.parts.length?`<div class="task-parts">${task.parts.map(p=>`<div class="part-row"><label><input type="checkbox" data-check-task="${task.id}" data-check-part="${p.id}" ${st.parts[p.id]?"checked":""}><span>${esc(p.name)}</span></label><span class="part-weight">${formatWeight(p.weight)} wt</span></div>`).join("")}</div>`:""}</article>`;
}
function groupMarkup(g,page,key=dateKey(),completed=false){
  const list=tasks(page,g.tabId,g.id).filter(t=>completed?taskStatus(t,key).complete:!taskStatus(t,key).complete);
  if(!list.length)return "";const rid=completed&&page==="goals"?g.completedRarity:g.rarity;const title=completed&&page==="goals"?`${g.name} — Completed`:g.name;
  return `<section class="group-card" style="--rarity:${rarityColor(rid)}"><div class="group-head"><h3 class="group-title">${esc(title)}</h3><div class="group-actions">${!completed?`<button class="small-button" data-add-task-page="${page}" data-add-task-group="${g.id}">+ Task</button>`:""}<button class="icon-button" data-edit-group="${g.id}">Edit</button></div></div><div class="task-list">${list.map(t=>taskMarkup(t,key,completed)).join("")}</div></section>`;
}
function renderPage(page){
  ensureGroupTasks();renderTabs(page);const tabId=currentTab(page),score=tabScore(page,tabId),overall=pageScore(page);document.querySelector(`#${page}Overall`).innerHTML=`Overall ${overall.percent.toFixed(1)}%`;
  const tab=tabs(page).find(t=>t.id===tabId);document.querySelector(`#${page}SkillProgress`).innerHTML=progressMarkup(tab?.name||"Folder",score);
  const gs=groups(page,tabId);let html="";
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
  const columns=`125px repeat(${dates.length},19px)`;let html=`<div class="heatmap-grid" style="grid-template-columns:${columns}"><div class="heatmap-corner"></div>`;
  dates.forEach((key,i)=>{const d=parseDate(key);const cls=i&&i%7===0?"week-gap":"";html+=`<div class="heatmap-day ${cls}" title="${key}">${d.toLocaleDateString(undefined,{month:"short",day:"numeric"})}</div>`});
  skills.forEach(skill=>{html+=`<div class="heatmap-label">${esc(skill.name)}</div>`;dates.forEach((key,i)=>{const s=tabScore("today",skill.id,key),rr=rarityForPercent(s.percent),has=!!state.days[key];const cls=`heat-cell ${!has?"no-data":""} ${i&&i%7===0?"week-gap":""}`;html+=`<button class="${cls}" data-history-cell="${key}" style="background:${rr.color}" title="${skill.name} · ${key} · ${s.percent.toFixed(1)}%"></button>`})});
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
function renderManage(){
  document.querySelector("#manageContent").innerHTML=["today","goals"].map(page=>`<section class="manage-page"><h3>${page==="today"?"Today":"Goals"}</h3>${tabs(page).map(tab=>`<div class="manage-tab"><strong>${esc(tab.name)}</strong><button class="danger-button" data-delete-tab-id="${tab.id}" data-delete-tab-page="${page}">Delete tab</button></div>${groups(page,tab.id).map(g=>`<div class="manage-item"><div><strong>${esc(g.name)}</strong><div class="manage-path">${esc(tab.name)} › Group</div></div><div><button class="icon-button" data-edit-group="${g.id}">Edit</button> <button class="danger-button" data-delete-group="${g.id}">Delete</button></div></div>${tasks(page,tab.id,g.id,true).map(t=>`<div class="manage-item"><div><strong style="color:${rarityColor(t.rarity)}">${esc(t.name)}</strong><div class="manage-path">${esc(tab.name)} › ${esc(g.name)} › ${formatWeight(taskScore(t).total)} weight${t.archived?" › archived":""}</div></div><div><button class="icon-button" data-edit-task="${t.id}">Edit</button> <button class="small-button" data-archive-task="${t.id}">${t.archived?"Restore":"Archive"}</button> <button class="danger-button" data-delete-task="${t.id}">Delete</button></div></div>`).join("")}`).join("")}`).join("")}</section>`).join("");
}
function renderAll(){
  setTheme();document.querySelector("#todayLabel").textContent=new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric"}).format(new Date());
  ["background","outline","panel","group","task","inner"].forEach(k=>document.querySelector(`#${k}Color`).value=state.settings[k]);
  renderPage("today");renderPage("goals");renderTodayWeekly();renderHistory();renderRarityEditor();renderManage();save();decorateFrames();
}
function fill(el,items,selected){el.innerHTML=items.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?"selected":""}>${esc(x.name)}</option>`).join("")}
function parseParts(text,oldParts=[]){const byName=new Map(oldParts.map(p=>[p.name,p]));return text.split("\n").map(x=>x.trim()).filter(Boolean).map(line=>{const bits=line.split("|");const name=bits[0].trim();const weight=validWeight(bits[1]?.trim()||1);const old=byName.get(name);return old?{...old,weight}:{id:uid("part"),name,weight}})}
function openTask(task=null,ctx={}){
  const page=task?.page||ctx.page||"today",tabId=task?.tabId||currentTab(page),gs=groups(page,tabId),groupId=task?.groupId||ctx.groupId||gs[0]?.id;
  document.querySelector("#taskDialogTitle").textContent=task?"Edit task":"Add task";document.querySelector("#taskId").value=task?.id||"";document.querySelector("#taskPage").value=page;document.querySelector("#taskName").value=task?.name||"";fill(document.querySelector("#taskTab"),tabs(page),tabId);fill(document.querySelector("#taskGroup"),groups(page,tabId),groupId);document.querySelector("#taskRarity").innerHTML=rarityOptions(task?.rarity||"common");document.querySelector("#taskWeight").value=validWeight(task?.weight);document.querySelector("#taskParts").value=task?.parts?.map(p=>`${p.name} | ${formatWeight(p.weight)}`).join("\n")||"";document.querySelector("#deleteTaskDialog").classList.toggle("hidden",!task);
  const goalField=document.querySelector("#goalCompletionField"),already=document.querySelector("#taskCompletedBeforeCreation"),dateInput=document.querySelector("#taskCompletedDate"),status=task&&page==="goals"?taskStatus(task):null;
  goalField.classList.toggle("hidden",page!=="goals");already.checked=!!status?.complete;dateInput.value=status?.completedAt?dateKey(new Date(status.completedAt)):dateKey();document.querySelector("#taskCompletedDateLabel").classList.toggle("hidden",!already.checked);
  document.querySelector("#taskDialog").showModal();
}
function openGroup(g=null,page="today"){
  page=g?.page||page;document.querySelector("#groupDialogTitle").textContent=g?"Edit group":"Add group";document.querySelector("#groupId").value=g?.id||"";document.querySelector("#groupPage").value=page;document.querySelector("#groupName").value=g?.name||"";fill(document.querySelector("#groupTab"),tabs(page),g?.tabId||currentTab(page));document.querySelector("#groupRarity").innerHTML=rarityOptions(g?.rarity||"common");document.querySelector("#groupCompletedRarity").innerHTML=rarityOptions(g?.completedRarity||"uncommon");document.querySelector("#completedRarityLabel").style.display=page==="goals"?"grid":"none";document.querySelector("#deleteGroupDialog").classList.toggle("hidden",!g);document.querySelector("#groupDialog").showModal();
}
function addPart(task){const name=prompt(`Add a checklist part to “${task.name}”: `);if(!name?.trim())return;const w=prompt("Weight for this part:","1");task.parts.push({id:uid("part"),name:name.trim(),weight:validWeight(w)});save();renderAll();toast("Checklist part added")}
function saveTask(){
  const id=document.querySelector("#taskId").value,page=document.querySelector("#taskPage").value,name=document.querySelector("#taskName").value.trim(),tabId=document.querySelector("#taskTab").value,groupId=document.querySelector("#taskGroup").value,rar=document.querySelector("#taskRarity").value,weight=validWeight(document.querySelector("#taskWeight").value);if(!name||!groupId)return false;
  const old=state.tasks.find(t=>t.id===id),parts=parseParts(document.querySelector("#taskParts").value,old?.parts||[]);let savedTask;
  if(old){Object.assign(old,{name,tabId,groupId,rarity:rar,weight,parts,placeholder:false});savedTask=old}else{savedTask={id:uid(slug(name)),page,tabId,groupId,name,rarity:rar,weight,parts,archived:false,order:Date.now(),placeholder:false};state.tasks.push(savedTask)}
  if(page==="goals"){
    const markComplete=document.querySelector("#taskCompletedBeforeCreation").checked;state.goals[savedTask.id] ||= {parts:{}};const val=state.goals[savedTask.id];val.parts ||= {};
    if(markComplete){savedTask.parts.forEach(part=>val.parts[part.id]=true);val.complete=true;const chosen=document.querySelector("#taskCompletedDate").value||dateKey();val.completedAt=new Date(`${chosen}T12:00:00`).toISOString()}
    else if(val.complete){val.complete=false;val.completedAt=null;savedTask.parts.forEach(part=>val.parts[part.id]=false)}
  }
  active[page]=tabId;save();renderAll();toast(old?"Task updated":"Task added");return true;
}
function saveGroup(){const id=document.querySelector("#groupId").value,page=document.querySelector("#groupPage").value,name=document.querySelector("#groupName").value.trim(),tabId=document.querySelector("#groupTab").value,rar=document.querySelector("#groupRarity").value,done=document.querySelector("#groupCompletedRarity").value;if(!name||!tabId)return false;const g=state.groups.find(x=>x.id===id);if(g)Object.assign(g,{name,tabId,rarity:rar,completedRarity:done});else state.groups.push({id:uid("group"),page,tabId,name,rarity:rar,completedRarity:done,order:Date.now()});active[page]=tabId;ensureGroupTasks();save();renderAll();toast(g?"Group updated":"Group added");return true}
function purgeTask(id){state.tasks=state.tasks.filter(t=>t.id!==id);Object.values(state.days).forEach(day=>delete day[id]);delete state.goals[id]}
function purgeGroup(id){state.tasks.filter(t=>t.groupId===id).forEach(t=>purgeTask(t.id));state.groups=state.groups.filter(g=>g.id!==id)}
function purgeTab(page,id){state.groups.filter(g=>g.page===page&&g.tabId===id).forEach(g=>purgeGroup(g.id));state.tabs[page]=state.tabs[page].filter(t=>t.id!==id)}
function toast(msg){const t=document.querySelector("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),1800)}
function exportBackup(){const b=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`skyblock-task-menu-${dateKey()}.json`;a.click();URL.revokeObjectURL(a.href)}

addEventListener("click",e=>{
  const view=e.target.closest("[data-view]");if(view){document.querySelectorAll(".page-tab,.view").forEach(x=>x.classList.remove("active"));view.classList.add("active");document.querySelector(`#${view.dataset.view}View`).classList.add("active")}
  const tab=e.target.closest("[data-tab-page]");if(tab){active[tab.dataset.tabPage]=tab.dataset.tabId;renderPage(tab.dataset.tabPage)}
  const addTab=e.target.closest("[data-add-tab]");if(addTab){document.querySelector("#tabPage").value=addTab.dataset.addTab;document.querySelector("#tabName").value="";document.querySelector("#tabDialog").showModal()}
  const addGroup=e.target.closest("[data-add-group]");if(addGroup)openGroup(null,addGroup.dataset.addGroup);
  const editGroup=e.target.closest("[data-edit-group]");if(editGroup)openGroup(state.groups.find(g=>g.id===editGroup.dataset.editGroup));
  const addTask=e.target.closest("[data-add-task-page]");if(addTask)openTask(null,{page:addTask.dataset.addTaskPage,groupId:addTask.dataset.addTaskGroup});
  const editTask=e.target.closest("[data-edit-task]");if(editTask)openTask(state.tasks.find(t=>t.id===editTask.dataset.editTask));
  const part=e.target.closest("[data-add-part]");if(part)addPart(state.tasks.find(t=>t.id===part.dataset.addPart));
  if(e.target.matches("input[data-check-task]")){const task=state.tasks.find(t=>t.id===e.target.dataset.checkTask);updateTaskValue(task,e.target.dataset.checkPart,e.target.checked)}
  const arch=e.target.closest("[data-archive-task]");if(arch){const t=state.tasks.find(x=>x.id===arch.dataset.archiveTask);t.archived=!t.archived;ensureGroupTasks();save();renderAll()}
  const delTask=e.target.closest("[data-delete-task]");if(delTask&&confirm("Permanently delete this task and all of its saved history?")){purgeTask(delTask.dataset.deleteTask);ensureGroupTasks();save();renderAll()}
  const delGroup=e.target.closest("[data-delete-group]");if(delGroup&&confirm("Permanently delete this group, its tasks, and their saved history?")){purgeGroup(delGroup.dataset.deleteGroup);save();renderAll()}
  const delTab=e.target.closest("[data-delete-tab-id]");if(delTab&&confirm("Permanently delete this folder tab, its groups, tasks, and their saved history?")){purgeTab(delTab.dataset.deleteTabPage,delTab.dataset.deleteTabId);save();renderAll()}
  const delR=e.target.closest("[data-delete-rarity]");if(delR&&state.settings.rarities.length>1){const id=delR.dataset.deleteRarity,replacement=state.settings.rarities.find(r=>r.id!==id).id;state.tasks.forEach(t=>{if(t.rarity===id)t.rarity=replacement});state.groups.forEach(g=>{if(g.rarity===id)g.rarity=replacement;if(g.completedRarity===id)g.completedRarity=replacement});state.settings.rarities=state.settings.rarities.filter(r=>r.id!==id);renderAll()}
  const cell=e.target.closest("[data-history-cell]");if(cell){document.querySelector("#historyDate").value=cell.dataset.historyCell;renderHistory();document.querySelector('[data-view="history"]').click()}
  if(e.target.closest("[data-close]"))e.target.closest("dialog").close();
});
document.querySelector("#taskTab").onchange=()=>fill(document.querySelector("#taskGroup"),groups(document.querySelector("#taskPage").value,document.querySelector("#taskTab").value),null);
document.querySelector("#taskForm").onsubmit=e=>{if(!saveTask())e.preventDefault()};
document.querySelector("#groupForm").onsubmit=e=>{if(!saveGroup())e.preventDefault()};
document.querySelector("#tabForm").onsubmit=()=>{const page=document.querySelector("#tabPage").value,name=document.querySelector("#tabName").value.trim();if(!name)return false;const id=uid(slug(name));state.tabs[page].push({id,name});active[page]=id;save();renderAll()};
document.querySelector("#deleteTaskDialog").onclick=()=>{const id=document.querySelector("#taskId").value;if(id&&confirm("Permanently delete this task and all saved history?")){purgeTask(id);document.querySelector("#taskDialog").close();ensureGroupTasks();save();renderAll()}};
document.querySelector("#deleteGroupDialog").onclick=()=>{const id=document.querySelector("#groupId").value;if(id&&confirm("Permanently delete this group and all tasks in it?")){purgeGroup(id);document.querySelector("#groupDialog").close();save();renderAll()}};
document.querySelector("#settingsShortcut").onclick=()=>document.querySelector('[data-view="settings"]').click();
document.querySelector("#historyDate").onchange=renderHistory;document.querySelector("#historyRange").onchange=renderHeatmap;
document.querySelector("#openHistoryFromWeek").onclick=()=>document.querySelector('[data-view="history"]').click();
document.querySelector("#taskCompletedBeforeCreation").onchange=e=>document.querySelector("#taskCompletedDateLabel").classList.toggle("hidden",!e.target.checked);
document.querySelector("#resetToday").onclick=()=>{if(confirm("Reset every checkbox for today? Earlier dates remain unchanged.")){state.days[dateKey()]={};save();renderAll()}};
document.querySelector("#saveColors").onclick=()=>{["background","outline","panel","group","task","inner"].forEach(k=>state.settings[k]=document.querySelector(`#${k}Color`).value);save();renderAll();toast("Colors saved")};
document.querySelector("#addRarity").onclick=()=>{state.settings.rarities.push({id:uid("rarity"),name:"CUSTOM",color:"#55ffff"});renderAll()};
document.querySelector("#rarityEditor").addEventListener("change",e=>{const row=e.target.closest("[data-rarity-row]");if(!row)return;const r=state.settings.rarities.find(x=>x.id===row.dataset.rarityRow);r.name=row.querySelector("[data-rarity-name]").value.trim()||"CUSTOM";r.color=row.querySelector("[data-rarity-color]").value;save();renderAll()});
document.querySelector("#exportBackup").onclick=exportBackup;document.querySelector("#importBackup").onclick=()=>document.querySelector("#importFile").click();document.querySelector("#importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{state=migrate(JSON.parse(reader.result));active={today:null,goals:null};save();renderAll();toast("Backup imported")}catch(err){alert("That is not a valid tracker backup.")}};reader.readAsText(f)};
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
      corner.innerHTML='<b class="corner-dot"></b><b class="corner-core"></b><b class="corner-arm-x"></b><b class="corner-arm-y"></b>';
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
