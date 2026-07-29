const STORAGE_KEY = "skyblockDailyTracker.v1";
const defaultTasks = [
  { id:"daily-commissions", name:"Daily Commissions", category:"Mining", group:"Dwarven Mines", panel:"Daily", type:"group", subtasks:[{id:"commission-1",name:"Commission 1"},{id:"commission-2",name:"Commission 2"},{id:"commission-3",name:"Commission 3"},{id:"commission-4",name:"Commission 4"}], archived:false },
  { id:"greenhouse", name:"Greenhouse", category:"Farming", group:"Garden", panel:"Greenhouse", type:"group", subtasks:[{id:"greenhouse-crops",name:"Collect crops"},{id:"greenhouse-visitors",name:"Check visitors"},{id:"greenhouse-upgrades",name:"Check upgrades"}], archived:false },
  { id:"experimentation-table", name:"Experimentation Table", category:"Enchanting", group:"General", panel:"Daily", type:"single", subtasks:[], archived:false },
  { id:"daily-heavy-pearls", name:"Heavy Pearls", category:"Crimson Isle", group:"General", panel:"Daily", type:"single", subtasks:[], archived:false },
  { id:"daily-rift", name:"Rift Visit", category:"Rift", group:"General", panel:"Daily", type:"single", subtasks:[], archived:false }
];
let state = loadState();
let activeSkill = null;
const activePanels = {};

function loadState(){
  try { const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)); if(parsed?.tasks&&parsed?.days) return migrate(parsed); } catch(_){}
  return {version:2,tasks:structuredClone(defaultTasks),days:{},skills:[],groups:[],panels:[],createdAt:new Date().toISOString()};
}
function migrate(s){
  s.version=2; s.skills ||= []; s.groups ||= []; s.panels ||= [];
  s.tasks.forEach(t=>{ t.group ||= "General"; t.panel ||= "Daily"; t.archived=!!t.archived; });
  return s;
}
function saveState(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
function localDateKey(d=new Date()){ return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-"); }
function dayData(key=localDateKey()){ state.days[key] ||= {}; return state.days[key]; }
function escapeHtml(s=""){ return String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
function slugify(s){ return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"item"; }
function uniqueTaskId(base){ let id=base,n=2; while(state.tasks.some(t=>t.id===id)) id=`${base}-${n++}`; return id; }
function showToast(m){ const t=document.querySelector("#toast");t.textContent=m;t.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove("show"),1800); }
function namedValues(extraKey, taskKey){ return [...new Set([...(state[extraKey]||[]),...state.tasks.map(t=>t[taskKey]).filter(Boolean)])]; }
function skills(){ return namedValues("skills","category"); }
function groupsFor(skill){ return [...new Set([...(state.groups||[]).filter(x=>x.skill===skill).map(x=>x.name),...state.tasks.filter(t=>t.category===skill).map(t=>t.group)])]; }
function panelsFor(skill,group){ return [...new Set([...(state.panels||[]).filter(x=>x.skill===skill&&x.group===group).map(x=>x.name),...state.tasks.filter(t=>t.category===skill&&t.group===group).map(t=>t.panel)])]; }
function taskUnits(t){ return t.type==="group"?t.subtasks.length:1; }
function completedUnits(t,data=dayData()){ const v=data[t.id]; return t.type==="group"?t.subtasks.filter(s=>v?.[s.id]).length:(v?1:0); }

function renderAll(){
  document.querySelector("#todayLabel").textContent=new Intl.DateTimeFormat(undefined,{weekday:"short",month:"short",day:"numeric"}).format(new Date());
  renderSkillTabs(); renderToday(); renderManage(); renderHistory(); saveState();
}
function renderSkillTabs(){
  const list=skills(); if(!activeSkill||!list.includes(activeSkill)) activeSkill=list[0]||null;
  document.querySelector("#skillTabs").innerHTML=list.map(s=>`<button class="folder-tab ${s===activeSkill?"active":""}" data-skill="${escapeHtml(s)}"><span>${escapeHtml(s)}</span></button>`).join("")+`<button class="folder-tab add-tab" data-add-skill title="Add skill folder">+</button>`;
}
function renderToday(){
  const root=document.querySelector("#skillContent");
  if(!activeSkill){ root.innerHTML=`<div class="empty">Click the + folder tab to add your first skill.</div>`; updateProgress(); return; }
  const groups=groupsFor(activeSkill);
  root.innerHTML=groups.map(groupBox).join("")+`<button class="add-group-card" data-add-group="${escapeHtml(activeSkill)}"><span>＋</span>Add group box</button>`;
  updateProgress();
}
function groupBox(group){
  const panels=panelsFor(activeSkill,group); const key=`${activeSkill}::${group}`;
  if(!activePanels[key]||!panels.includes(activePanels[key])) activePanels[key]=panels[0]||null;
  const current=activePanels[key]; const tasks=state.tasks.filter(t=>!t.archived&&t.category===activeSkill&&t.group===group&&t.panel===current);
  const panelTabs=panels.map(p=>`<button class="inner-tab ${p===current?"active":""}" data-panel-skill="${escapeHtml(activeSkill)}" data-panel-group="${escapeHtml(group)}" data-panel="${escapeHtml(p)}">${escapeHtml(p)}</button>`).join("");
  return `<section class="group-box"><div class="group-titlebar"><h2>${escapeHtml(group)}</h2><button class="mini-button" data-quick-task data-skill-context="${escapeHtml(activeSkill)}" data-group-context="${escapeHtml(group)}" data-panel-context="${escapeHtml(current||"")}">+ Task</button></div><div class="inner-tabs">${panelTabs}<button class="inner-tab add-inner" data-add-panel-skill="${escapeHtml(activeSkill)}" data-add-panel-group="${escapeHtml(group)}">+</button></div><div class="panel-content">${current?(tasks.length?tasks.map(t=>taskCard(t)).join(""):`<div class="empty compact">No tasks here yet. Use + Task.</div>`):`<div class="empty compact">Add an inner tab to begin.</div>`}</div></section>`;
}
function taskCard(t,data=dayData(),readonly=false){
  const done=completedUnits(t,data),total=taskUnits(t);
  const rows=t.type==="group"?t.subtasks.map(s=>checkRow(t.id,s.id,s.name,!!data[t.id]?.[s.id],readonly)).join(""):checkRow(t.id,"single","Complete",!!data[t.id],readonly);
  return `<article class="task-card ${done===total&&total?"complete":""}"><div class="task-top"><div class="task-title">${escapeHtml(t.name)}</div><span class="badge">${done} / ${total}</span></div><div>${rows}</div></article>`;
}
function checkRow(taskId,subId,label,checked,readonly){ return `<label class="check-row"><input type="checkbox" data-task="${taskId}" data-subtask="${subId}" ${checked?"checked":""} ${readonly?"disabled":""}><span>${escapeHtml(label)}</span></label>`; }
function updateProgress(){ const all=state.tasks.filter(t=>!t.archived),data=dayData(),total=all.reduce((n,t)=>n+taskUnits(t),0),done=all.reduce((n,t)=>n+completedUnits(t,data),0); document.querySelector("#progressText").textContent=`${done} / ${total}`;document.querySelector("#progressBar").style.width=`${total?done/total*100:0}%`; }

function renderManage(){
  const list=state.tasks;
  document.querySelector("#manageList").innerHTML=list.length?list.map(t=>`<article class="manage-card ${t.archived?"archived":""}"><div><div class="task-title">${escapeHtml(t.name)}</div><div class="task-path">${escapeHtml(t.category)} › ${escapeHtml(t.group)} › ${escapeHtml(t.panel)} · ${t.type==="group"?`${t.subtasks.length} checkboxes`:"Single checkbox"}${t.archived?" · Archived":""}</div></div><div class="manage-actions"><button class="secondary-button" data-edit="${t.id}">Edit</button><button class="${t.archived?"secondary-button":"danger-secondary"}" data-archive="${t.id}">${t.archived?"Restore":"Archive"}</button></div></article>`).join(""):`<div class="empty">No tasks yet.</div>`;
}
function renderHistory(){
  const input=document.querySelector("#historyDate"); if(!input.value) input.value=Object.keys(state.days).sort().reverse()[0]||localDateKey();
  const key=input.value,data=state.days[key]||{},visible=state.tasks.filter(t=>data[t.id]!==undefined||!t.archived); const total=visible.reduce((n,t)=>n+taskUnits(t),0),done=visible.reduce((n,t)=>n+completedUnits(t,data),0);
  document.querySelector("#historySummary").innerHTML=`<span class="muted">${escapeHtml(key)}</span><h2>${done} of ${total} completed</h2><p class="muted">${total?Math.round(done/total*100):0}% completion</p>`;
  document.querySelector("#historyList").innerHTML=visible.length?skills().map(skill=>{const ts=visible.filter(t=>t.category===skill);return ts.length?`<section class="history-section"><h3>${escapeHtml(skill)}</h3>${ts.map(t=>taskCard(t,data,true)).join("")}</section>`:""}).join(""):`<div class="empty">No task data for this date.</div>`;
}
function setCheckbox(taskId,subId,checked){ const t=state.tasks.find(x=>x.id===taskId),data=dayData(); if(!t)return; if(t.type==="group"){data[taskId]||={};data[taskId][subId]=checked;}else data[taskId]=checked; saveState();renderToday(); }

function fillSelect(el,values,selected){ el.innerHTML=values.map(v=>`<option ${v===selected?"selected":""}>${escapeHtml(v)}</option>`).join(""); }
function openTaskDialog(task=null,ctx={}){
  const skill=task?.category||ctx.skill||activeSkill||skills()[0]||"General"; const group=task?.group||ctx.group||groupsFor(skill)[0]||"General"; const panel=task?.panel||ctx.panel||panelsFor(skill,group)[0]||"Daily";
  document.querySelector("#dialogTitle").textContent=task?"Edit task":"Add task";document.querySelector("#taskId").value=task?.id||"";document.querySelector("#taskName").value=task?.name||"";
  fillSelect(document.querySelector("#taskSkill"),skills().length?skills():[skill],skill); updateTaskGroupOptions(group,panel);
  document.querySelector("#taskType").value=task?.type||"single";document.querySelector("#taskSubtasks").value=task?.subtasks?.map(s=>s.name).join("\n")||"";toggleSubtasks();document.querySelector("#taskDialog").showModal();
}
function updateTaskGroupOptions(selectedGroup,selectedPanel){ const skill=document.querySelector("#taskSkill").value; const gs=groupsFor(skill); fillSelect(document.querySelector("#taskGroup"),gs.length?gs:[selectedGroup||"General"],selectedGroup||gs[0]); updateTaskPanelOptions(selectedPanel); }
function updateTaskPanelOptions(selected){ const skill=document.querySelector("#taskSkill").value,group=document.querySelector("#taskGroup").value,ps=panelsFor(skill,group); fillSelect(document.querySelector("#taskPanel"),ps.length?ps:[selected||"Daily"],selected||ps[0]); }
function toggleSubtasks(){ document.querySelector("#subtasksField").classList.toggle("hidden",document.querySelector("#taskType").value!=="group"); }
function uniqueSubId(task,line,i){ const base=slugify(line)||`item-${i+1}`;let id=base,n=2,ids=new Set(task.subtasks.map(s=>s.id));while(ids.has(id))id=`${base}-${n++}`;return id; }
function saveTaskFromForm(){
  const id=document.querySelector("#taskId").value,name=document.querySelector("#taskName").value.trim(),category=document.querySelector("#taskSkill").value,group=document.querySelector("#taskGroup").value,panel=document.querySelector("#taskPanel").value,type=document.querySelector("#taskType").value,lines=document.querySelector("#taskSubtasks").value.split("\n").map(x=>x.trim()).filter(Boolean);
  if(type==="group"&&!lines.length){showToast("Add at least one checklist item");return false;}
  const existing=state.tasks.find(t=>t.id===id);
  if(existing){existing.name=name;existing.category=category;existing.group=group;existing.panel=panel;existing.type=type;existing.subtasks=type==="group"?lines.map((line,i)=>existing.subtasks[i]?.name===line?existing.subtasks[i]:{id:uniqueSubId(existing,line,i),name:line}):[];}
  else state.tasks.push({id:uniqueTaskId(slugify(name)),name,category,group,panel,type,subtasks:type==="group"?lines.map((line,i)=>({id:`${slugify(line)}-${i+1}`,name:line})):[],archived:false});
  activeSkill=category;activePanels[`${category}::${group}`]=panel;saveState();renderAll();showToast(existing?"Task updated":"Task added");return true;
}
function openNameDialog(mode,context=""){
  const titles={skill:"Add skill folder",group:"Add group box",panel:"Add inner tab"};document.querySelector("#nameMode").value=mode;document.querySelector("#nameContext").value=context;document.querySelector("#nameDialogTitle").textContent=titles[mode];document.querySelector("#nameLabel").firstChild.textContent=mode==="skill"?"Skill name":mode==="group"?"Group name":"Tab name";document.querySelector("#newName").value="";document.querySelector("#nameDialog").showModal();
}
function saveName(){ const mode=document.querySelector("#nameMode").value,name=document.querySelector("#newName").value.trim(),context=document.querySelector("#nameContext").value;if(!name)return false;
  if(mode==="skill"){if(!state.skills.includes(name))state.skills.push(name);activeSkill=name;}
  if(mode==="group"){if(!state.groups.some(x=>x.skill===context&&x.name===name))state.groups.push({skill:context,name});}
  if(mode==="panel"){const [skill,group]=context.split("::");if(!state.panels.some(x=>x.skill===skill&&x.group===group&&x.name===name))state.panels.push({skill,group,name});activePanels[context]=name;}
  saveState();renderAll();showToast("Added");return true;
}
function exportBackup(){const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`skyblock-tracker-backup-${localDateKey()}.json`;a.click();URL.revokeObjectURL(a.href);showToast("Backup exported");}
function importBackup(file){const r=new FileReader();r.onload=()=>{try{const p=JSON.parse(r.result);if(!p.tasks||!p.days)throw Error();state=migrate(p);activeSkill=null;saveState();renderAll();showToast("Backup imported");}catch(_){alert("That file is not a valid Skyblock Tracker backup.");}};r.readAsText(file);}

addEventListener("click",e=>{
  const nav=e.target.closest("[data-view]");if(nav){document.querySelectorAll(".nav-button,.view").forEach(x=>x.classList.remove("active"));nav.classList.add("active");document.querySelector(`#${nav.dataset.view}View`).classList.add("active");}
  const skill=e.target.closest("[data-skill]");if(skill){activeSkill=skill.dataset.skill;renderSkillTabs();renderToday();}
  const panel=e.target.closest("[data-panel]");if(panel){activePanels[`${panel.dataset.panelSkill}::${panel.dataset.panelGroup}`]=panel.dataset.panel;renderToday();}
  if(e.target.matches("input[type=checkbox][data-task]"))setCheckbox(e.target.dataset.task,e.target.dataset.subtask,e.target.checked);
  if(e.target.closest("[data-add-skill]"))openNameDialog("skill");
  const ag=e.target.closest("[data-add-group]");if(ag)openNameDialog("group",ag.dataset.addGroup);
  const ap=e.target.closest("[data-add-panel-skill]");if(ap)openNameDialog("panel",`${ap.dataset.addPanelSkill}::${ap.dataset.addPanelGroup}`);
  const qt=e.target.closest("[data-quick-task]");if(qt)openTaskDialog(null,{skill:qt.dataset.skillContext,group:qt.dataset.groupContext,panel:qt.dataset.panelContext});
  const edit=e.target.closest("[data-edit]");if(edit)openTaskDialog(state.tasks.find(t=>t.id===edit.dataset.edit));
  const arch=e.target.closest("[data-archive]");if(arch){const t=state.tasks.find(x=>x.id===arch.dataset.archive);t.archived=!t.archived;saveState();renderAll();showToast(t.archived?"Task archived":"Task restored");}
  if(e.target.closest("[data-close-dialog]"))e.target.closest("dialog").close();
});
document.querySelector("#settingsButton").onclick=()=>document.querySelector('[data-view="manage"]').click();
document.querySelector("#addTaskButton").onclick=()=>openTaskDialog();
document.querySelector("#taskType").onchange=toggleSubtasks;document.querySelector("#taskSkill").onchange=()=>updateTaskGroupOptions();document.querySelector("#taskGroup").onchange=()=>updateTaskPanelOptions();
document.querySelector("#taskForm").onsubmit=e=>{if(!saveTaskFromForm())e.preventDefault();};document.querySelector("#nameForm").onsubmit=e=>{if(!saveName())e.preventDefault();};
document.querySelector("#historyDate").onchange=renderHistory;document.querySelector("#resetTodayButton").onclick=()=>{if(confirm("Reset every checkbox for today? Earlier days will not change.")){state.days[localDateKey()]={};saveState();renderAll();showToast("Today reset");}};
document.querySelector("#exportButton").onclick=exportBackup;document.querySelector("#importButton").onclick=()=>document.querySelector("#importFile").click();document.querySelector("#importFile").onchange=e=>e.target.files[0]&&importBackup(e.target.files[0]);
if("serviceWorker" in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});renderAll();
