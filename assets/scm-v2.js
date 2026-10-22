/* Smartup SCM v2. Spreadsheet-backed operational demo. Generated from verified Google Sheets snapshot. */
(function bootSCM2(){
"use strict";
const model=window.SCM_V2_DATA;
if(!model||!model.tables){document.getElementById("app").innerHTML="<p>Нет данных SCM v2</p>";return}
const numeric=x=>{if(x===null||x===undefined||x==="")return 0;const n=Number(String(x).replace(/[\s\u00a0\u202f%]/g,"").replace(",","."));return Number.isFinite(n)?n:0};
const h=x=>String(x??"").replace(/[&<>"']/g,z=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[z]));
const fm=x=>new Intl.NumberFormat("ru-RU",{maximumFractionDigits:0}).format(x||0);
const f2=x=>new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(x||0);
const cash=x=>fm(Math.round(x))+" сум";
const recs=name=>{const raw=model.tables[name]||[];return raw.slice(1).filter(r=>r.some(x=>x!==null&&x!=="")).map(r=>Object.fromEntries(raw[0].map((c,i)=>[c,r[i]??""])))};
const prod=recs("products"),purch=recs("purchase"),alloc=recs("allocation"),fore=recs("forecast"),stocks=recs("stocks"),ships=recs("shipments"),cust=recs("customers"),scens=recs("scenarios"),ware=recs("warehouses"),suppliers=recs("suppliers"),offers=recs("offers"),rois=recs("roi");
const prodMap=Object.fromEntries(prod.map(x=>[x["Код товара (SKU)"],x]));
const supMap=Object.fromEntries(suppliers.map(x=>[x["Код поставщика"],x]));
const whMap=Object.fromEntries(ware.map(x=>[x["Код склада"],x]));
const purchMap=Object.fromEntries(purch.map(x=>[x.SKU,x]));
const getProduct=id=>prodMap[id]||{};
const nameOf=id=>getProduct(id)["Наименование товара"]||id;
const days=(s,wh,mo)=>{const v=fore.find(x=>x.SKU===s&&x["Склад"]===wh);return numeric(v?.[["Октябрь 2026, шт.","Ноябрь 2026, шт.","Декабрь 2026, шт."][mo-10]])};
const totalBudget=()=>state.orders.reduce((sum,o)=>sum+o.items.reduce((x,r)=>x+r.qty*numeric(purchMap[r.sku]?.["Цена закупки, сум"]),0),0);
const allocQty=r=>{const key=r.SKU+"|"+r["Региональный склад"];return state.v2Alloc&&Object.prototype.hasOwnProperty.call(state.v2Alloc,key)?state.v2Alloc[key]:numeric(r["Выделить с РЦ, шт."])};
const allocTotal=sku=>alloc.filter(x=>!sku||x.SKU===sku).reduce((a,x)=>a+allocQty(x),0);
const allocAvailable=sku=>numeric(alloc.find(x=>x.SKU===sku)?.["Доступно на РЦ"]);
const allocNeed=sku=>alloc.filter(x=>!sku||x.SKU===sku).reduce((a,x)=>a+numeric(x["Необходимо передать"]),0);
const statusBadge=(x)=>{const risk=String(x||"");return '<span class="status '+(/OOS|РИСК/i.test(risk)?"red":/MAX|избыт/i.test(risk)?"amber":"green")+'">'+h(risk)+'</span>'};
const riskKey={safe:0,shortage:1,overstock:2};
const getScenario=id=>{const row=scens[riskKey[id]??1];const mod=state.v2Scenarios?.[id]||{};const free=numeric(row["Свободно сейчас"]),daily=numeric(row["Спрос/день"]),base=numeric(row["Базовая ETA, дни"]),delay=mod.delay??numeric(row["Задержка, дни"]),qty=mod.qty??numeric(row["Поставка, шт."]),eta=base+delay,before=Math.max(0,free-eta*daily),lost=Math.max(0,eta*daily-free),after=before+qty,max=numeric(row["Max запас, шт."]),over=Math.max(0,after-max);return {id,row,free,daily,base,delay,qty,eta,before,lost,after,max,over,first:lost>0?Math.floor(free/daily)+1:null,impact:qty===0?"Нет поступления":lost>0?"Дефицит до ETA":over>0?"Избыток после ETA":"Без дефицита и избытка"}};
function setup(){
 if(state.v2Version===model.version&&state.v2Alloc&&state.v2Scenarios)return;
 const grp={};
 for(const p of purch){const s=p["ID поставщика"];if(!grp[s])grp[s]=[];grp[s].push({sku:p.SKU,recommended:numeric(p["Рекомендация, шт."]),qty:numeric(p["К утверждению, шт."])})}
 state.orders=Object.entries(grp).map(([s,items],i)=>({id:"SCM-2026-"+String(i+1).padStart(3,"0"),supplier:s,status:"draft",date:"01.10.2026",eta:purch.find(p=>p["ID поставщика"]===s)?.["ETA нового заказа"]||"",owner:"Снабженец",version:1,items,changes:[]}));
 state.orderSelected=state.orders[0]?.id;
 state.v2Version=model.version;state.v2Alloc={};state.v2Scenarios={};
 state.v2SelectedSku="P001";state.v2Search="";state.v2RiskFilter="all";state.v2AllocFilter="all";
 state.v2Events=[];
 state.riskScenario="shortage";
 state.page="overview";state.role="buyer";
 persist();
}
setup();
const navFore=nav.find(x=>x[0]==="forecast");if(navFore)navFore[1]="Прогноз — входные данные";
titles.forecast="Прогноз — входные данные";
const line="01.10.2026 · данные финальной модели · синтетический пример";
const note='<div class="footnote">Демо без соединения с боевой ERP. Базовые числа — финальная Google Sheets-модель на 01.10.2026, пользовательские правки моделируются локально.</div>';
const btn=(caption,act,klass="btn")=>`<button class="${klass}" data-action="${act}">${caption}</button>`;
function metrics(values){return `<div class="kpi-grid">${values.map(x=>`<div class="metric"><div class="metric-top">${h(x[0])}</div><div class="metric-number">${x[1]}</div><div class="metric-meta">${h(x[2]||"")}</div></div>`).join("")}</div>`}
function table(cols,rows){return `<div class="table-wrap"><table class="table"><thead><tr>${cols.map(c=>`<th>${h(c)}</th>`).join("")}</tr></thead><tbody>${rows.join("")||`<tr><td colspan="${cols.length}" class="empty">Нет результатов</td></tr>`}</tbody></table></div>`}
overviewPage=function(){
 const orders=state.orders,review=orders.filter(x=>x.status==="review").length;
 const riskCount=purch.filter(p=>numeric(p["OOS до ETA, шт."])>0).length;
 return header("Центр закупок и распределения","Готовый прогноз отдела продаж → календарный расчёт → решения снабженца и директора.",btn("Перейти к закупкам","go-purchases","btn btn-primary"))+
 metrics([["Рекомендовано закупить",fm(purch.reduce((a,p)=>a+numeric(p["Рекомендация, шт."]),0))+" шт.","3 рассчитанных SKU"],["Бюджет к утверждению",cash(totalBudget()),"Изменения отражаются после правки"],["Распределено с РЦ",fm(allocTotal())+" шт.","70 региональных складов"],["Без покрытия",fm(Math.max(0,allocNeed()-allocTotal()))+" шт.","Потребность, не покрытая РЦ"]])+
 `<div class="chart-grid"><div class="panel"><div class="panel-head"><div><div class="panel-title">Очередь решений</div><div class="panel-desc">Сначала критические исключения</div></div></div>
 <div class="priority-list"><div class="priority-item"><div class="prio-left"><span class="priority-dot"></span><div><div class="prio-name">P001 · OOS до ETA</div><div class="prio-sub">Прогнозные потери: ${fm(numeric(purchMap.P001?.["OOS до ETA, шт."]))} шт. · поставщик MedSupply</div></div></div>${btn("Проверить","go-purchases","btn btn-sm")}</div>
 <div class="priority-item"><div class="prio-left"><span class="priority-dot amber"></span><div><div class="prio-name">План распределения</div><div class="prio-sub">${fm(Math.max(0,allocNeed()-allocTotal()))} шт. не обеспечено · используем только доступный РЦ</div></div></div>${btn("Открыть","go-allocation","btn btn-sm")}</div>
 <div class="priority-item"><div class="prio-left"><span class="priority-dot"></span><div><div class="prio-name">На согласовании: ${review}</div><div class="prio-sub">Изменения снабженца и стоимость проверяет директор</div></div></div>${btn("Перейти","go-approvals","btn btn-sm")}</div></div></div>
 <div class="panel"><div class="panel-head"><div><div class="panel-title">Ожидаемый эффект · условная модель ROI</div><div class="panel-desc">Не фактический результат компании</div></div></div><div class="panel-pad"><div class="small-metric"><div class="s-label">Инвестиция</div><div class="s-num">$100 000</div></div><div class="small-metric mt-16"><div class="s-label">Окупаемость, базовый сценарий</div><div class="s-num">7-й месяц</div></div><div class="insight mt-16">OOS 20% → 5% за 6 месяцев — цель, не гарантия. Высвобожденный капитал $300 000 не считается прибылью. Фиксированная аренда не включена.</div></div></div></div>
 <div class="panel"><div class="panel-head"><div><div class="panel-title">Чем SCM отличается от «Рекомендованных остатков»</div></div></div><div class="panel-pad"><div class="two-col"><div class="tagbox"><b>Уже существует в Smartup</b><p>Поставщики, ТМЦ, остатки/резервы, склад, закупочные документы, рекомендованные остатки и уведомления.</p></div><div class="tagbox"><b>Добавляем модулем SCM</b><p>Календарные решения по заказу, ETA, MOQ, риски OOS/OS, распределение на РЦ, согласование и контроль исполнения.</p></div></div></div></div>`+note;
};
forecastPage=function(){
 const wh=state.warehouse,month=Number(state.month)||10;
 const items=prod.filter(p=>["P001","P002","P003"].includes(p["Код товара (SKU)"]));
 const rows=items.map(p=>{const id=p["Код товара (SKU)"];const avail=numeric(stocks.find(x=>x["Код товара (SKU)"]===id&&x["Код склада"]===wh)?.["Доступный остаток, шт."]);return `<tr><td><strong>${h(id)} · ${h(nameOf(id))}</strong></td><td>${h(whMap[wh]?.["Город"]||wh)}</td><td>${h(["Октябрь","Ноябрь","Декабрь"][month-10])}</td><td class="right"><strong>${fm(days(id,wh,month))}</strong></td><td class="right">${fm(avail)}</td><td>${statusBadge("Из отдела продаж")}</td></tr>`});
 const total=items.reduce((a,p)=>a+days(p["Код товара (SKU)"],wh,month),0);
 return header("Прогноз — входные данные","SCM использует готовый прогноз отдела продаж, а не строит собственную ML-модель.")+
 `<div class="filters"><span>Период</span><select class="select" data-change="month">${[10,11,12].map(m=>`<option value="${m}" ${m===month?"selected":""}>${["Октябрь","Ноябрь","Декабрь"][m-10]} 2026</option>`).join("")}</select><span>Склад</span><select class="select" data-change="warehouse">${ware.filter(x=>x["Код склада"]!=="WH000").map(w=>`<option value="${h(w["Код склада"])}" ${wh===w["Код склада"]?"selected":""}>${h(w["Код склада"])} · ${h(w["Город"])}</option>`).join("")}</select></div>`+
 `<div class="subgrid mb-16"><div class="small-metric"><div class="s-label">Готовый месячный прогноз</div><div class="s-num">${fm(total)} шт.</div></div><div class="small-metric"><div class="s-label">Источников прогноза</div><div class="s-num">1</div><div class="s-sub">Отдел продаж / внешний процесс</div></div><div class="small-metric"><div class="s-label">Срез данных</div><div class="s-num">01.10.2026</div></div></div>`+
 `<div class="panel"><div class="panel-head"><div><div class="panel-title">Прогноз SKU × склад × месяц</div><div class="panel-desc">3 SKU × 70 складов · октябрь–декабрь 2026</div></div></div>${table(["SKU","Регион","Месяц","Прогноз, шт.","Доступно сейчас","Источник"],rows)}</div>`+
 `<div class="insight mt-16">При расчёте календарного спроса сохраняем сумму месячного прогноза. Подтверждённые клиентские заказы не дублируем поверх прогноза, если они уже в нём учтены.</div>`+note;
};
purchasesPage=function(){
 const current=order(),filtered=purch.filter(p=>state.v2Search?([p.SKU,nameOf(p.SKU),p["Поставщик"]].join(" ").toLowerCase().includes(state.v2Search.toLowerCase())):true).filter(p=>state.v2RiskFilter==="risk"?numeric(p["OOS до ETA, шт."])>0:state.v2RiskFilter==="ok"?numeric(p["OOS до ETA, шт."])===0:true);
 const rows=filtered.map(p=>{const so=state.orders.find(o=>o.supplier===p["ID поставщика"]);const item=so?.items.find(x=>x.sku===p.SKU);const qty=item?.qty??numeric(p["Рекомендация, шт."]);const sel=current?.id===so?.id;return `<tr ${sel?'style="background:#f4f9ff"':""}><td><strong>${h(p.SKU)}</strong><div class="note">${h(nameOf(p.SKU))}</div></td><td>${h(p["Поставщик"])}</td><td>${h(p["ETA нового заказа"])}</td><td class="right">${fm(numeric(p["MOQ"]))} / ${fm(numeric(p["Кратность"]))}</td><td class="right">${fm(numeric(p["Рекомендация, шт."]))}</td><td class="right">${sel&&["draft","returned"].includes(so.status)?`<button class="inline-qty" data-edit-qty="${h(p.SKU)}">${fm(qty)} ✎</button>`:`<strong>${fm(qty)}</strong>`}</td><td class="right"><strong>${cash(qty*numeric(p["Цена закупки, сум"]))}</strong></td><td>${statusBadge(p["Риск / проверка"])}</td><td><button class="btn btn-sm" data-open-order="${h(so?.id)}">${sel?"Выбрано":"Открыть"}</button></td></tr>`});
 const detail=purch.filter(p=>p["ID поставщика"]===current?.supplier);
 return header("Закупки","Календарная рекомендация по готовому прогнозу, свободным остаткам, поставкам в пути, MOQ и циклу заказа.",btn("Пересчитать выбранную закупку","recalculate-order","btn btn-primary"))+
 `<div class="subgrid mb-16"><div class="small-metric"><div class="s-label">Рекомендовано, 3 SKU</div><div class="s-num">15 190 шт.</div></div><div class="small-metric"><div class="s-label">Текущий бюджет заявок</div><div class="s-num">${cash(totalBudget())}</div></div><div class="small-metric"><div class="s-label">Риск OOS до ETA</div><div class="s-num">${purch.filter(p=>numeric(p["OOS до ETA, шт."])>0).length} SKU</div></div></div>
 <div class="filters"><input class="input search" data-v2-search placeholder="SKU, товар или поставщик" value="${h(state.v2Search||"")}"/><select class="select" data-v2-filter><option value="all">Все рекомендации</option><option value="risk" ${state.v2RiskFilter==="risk"?"selected":""}>Есть OOS до ETA</option><option value="ok" ${state.v2RiskFilter==="ok"?"selected":""}>Без OOS до ETA</option></select><span class="note">Каталог 15 SKU; расчёт выполнен для 3 SKU. Необработанные SKU не имеют рекомендаций.</span></div>
 <div class="panel"><div class="panel-head"><div><div class="panel-title">Рекомендации к заказу · октябрь 2026</div><div class="panel-desc">Для редактирования выберите заявку поставщика, затем нажмите на синее количество</div></div></div>${table(["SKU","Поставщик","ETA","MOQ / шаг","Рекомендуется","К заказу","Бюджет","Риск","Заявка"],rows)}</div>
 <div class="whitegap"></div><div class="panel"><div class="panel-pad"><div class="flex space-between align-center"><div><div class="eyebrow">ВЫБРАННАЯ ЗАЯВКА · ${h(current?.id)}</div><div class="panel-title">${h(supMap[current?.supplier]?.["Название поставщика"]||current?.supplier||"")} · ${detail.length} SKU</div></div>${statusBadge(statusLabel[current?.status]||"Черновик")}</div>
 <div class="summary-bar mt-16"><div><span>Сумма</span><strong>${cash((current?.items||[]).reduce((a,x)=>a+x.qty*numeric(purchMap[x.sku]?.["Цена закупки, сум"]),0))}</strong></div><div><span>Цикл заказа</span><strong>${h(detail[0]?.["Цикл, дни"]||0)} дн.</strong></div><div><span>Lead Time</span><strong>${h(detail[0]?.["Lead Time, дни"]||0)} дн.</strong></div><div><span>Поставка</span><strong>${h(detail[0]?.["ETA нового заказа"]||"—")}</strong></div></div>
 <div class="panel-title">Почему такой объём?</div><div class="tagbox mt-16">${detail.map(p=>`<div class="kv-row"><span>${h(p.SKU)} · ${h(nameOf(p.SKU))}</span><strong>${fm(numeric(p["Рекомендация, шт."]))} шт.</strong></div><div class="note">До ETA спрос ${f2(numeric(p["Спрос до ETA"]))} шт. · свободно сейчас (сеть) ${fm(numeric(p["Свободно сейчас (сеть)"]))} · спрос после ETA ${f2(numeric(p["Спрос после ETA"]))} · MOQ ${h(p.MOQ||p["MOQ"])} · шаг ${h(p["Кратность"])}. ${h(p["Контроль Max после ETA"]||"")}</div>`).join("<hr class='divider'/>")}</div>
 <div class="insight amber mt-16">Осторожно: текущий расчёт P001 показывает одновременно OOS до ETA и предупреждение «Выше Max». Одним увеличением нового заказа OOS до даты его поступления не исправить.</div>
 <div class="action-row">${btn("Версии и изменения","order-history")}${current?.status==="approved"||current?.status==="exported"||current?.status==="sent"?btn("Скачать XLSX","export-xlsx","btn btn-primary"):btn("Отправить директору","send-review","btn btn-primary")}</div>
 </div></div>`+note;
};
allocationPage=function(){
 if(state.role==="warehouse")return `<div class="page-header"><h1 class="page-title">Задачи склада</h1></div><div class="panel"><div class="panel-pad">На пилоте в интерфейсе снабженца формируются только проекты распределения. Наряды склада показаны как следующая интеграционная точка Smartup.</div></div>`;
 const sku=state.v2SelectedSku||"P001",rows=alloc.filter(r=>r.SKU===sku&&(!state.v2Search||[r["Региональный склад"],whMap[r["Региональный склад"]]?.["Город"]].join(" ").toLowerCase().includes(state.v2Search.toLowerCase()))&&((state.v2AllocFilter||"all")==="all"||((state.v2AllocFilter==="oos")?/OOS/.test(r["Приоритет"]):numeric(r["Не покрыто, шт."])>0)));
 const total=allocTotal(sku),available=allocAvailable(sku),need=allocNeed(sku);
 const output=rows.map(r=>{const id=r["Региональный склад"],qty=allocQty(r),unmet=Math.max(0,numeric(r["Необходимо передать"])-qty);return `<tr><td><strong>${h(id)}</strong><div class="note">${h(whMap[id]?.["Город"]||"")}</div></td><td>${statusBadge(r["Приоритет"])}</td><td class="right">${f2(numeric(r["Дней покрытия без перевода"]))}</td><td class="right">${fm(numeric(r["Необходимо передать"]))}</td><td class="right"><input class="input v2-alloc-input" type="number" min="0" max="${numeric(r["Необходимо передать"])}" data-v2-alloc="${h(sku+"|"+id)}" value="${qty}"/></td><td class="right">${fm(unmet)}</td><td>${unmet===0?statusBadge("Обеспечен"):statusBadge(qty?"Частично":"Не обеспечен")}</td></tr>`});
 return header("Распределение с РЦ","Распределяем только свободный остаток по приоритетам OOS → ниже Min → обеспечен. Все 70 региональных складов.")+
 `<div class="filters"><span>SKU</span><select class="select" data-v2-sku>${["P001","P002","P003"].map(id=>`<option value="${id}" ${sku===id?"selected":""}>${id} · ${h(nameOf(id))}</option>`).join("")}</select><input class="input search" data-v2-search placeholder="Поиск склада или города" value="${h(state.v2Search||"")}"/><select class="select" data-v2-alloc-filter><option value="all">Все склады</option><option value="oos" ${state.v2AllocFilter==="oos"?"selected":""}>Риск OOS</option><option value="unmet" ${state.v2AllocFilter==="unmet"?"selected":""}>Не обеспечены</option></select></div>`+
 `<div class="allocation-top"><div class="small-metric"><div class="s-label">Доступно на РЦ</div><div class="s-num">${fm(available)} шт.</div></div><div class="small-metric"><div class="s-label">Потребность складов</div><div class="s-num">${fm(need)} шт.</div></div><div class="small-metric"><div class="s-label">Выделено</div><div class="s-num">${fm(total)} шт.</div></div><div class="small-metric"><div class="s-label">Не покрыто</div><div class="s-num">${fm(Math.max(0,need-total))} шт.</div></div></div>`+
 `<div class="panel"><div class="panel-head"><div><div class="panel-title">План распределения · ${h(sku)}</div><div class="panel-desc">Поиск, фильтры, приоритеты · ${rows.length} из 70 складов · лимит РЦ ${fm(available)} шт.</div></div>${statusBadge(total>available?"Превышен лимит":"Баланс РЦ соблюдён")}</div>${table(["Склад / регион","Риск","Дней покрытия","Необходимо","Выделить","Без покрытия","Итог"],output)}</div>`+
 `<div class="insight mt-16">Редактирование количества проверяет потребность региона и суммарный ресурс РЦ. После подтверждения план должен создать штатные наряды на перемещение; в демо реальная ERP не изменяется.</div>`+note;
};
risksPage=function(){
 const id=state.riskScenario||"shortage",s=getScenario(id), row=s.row;
 const customers=cust.filter(x=>x["Склад"]===row["Склад"]&&x.SKU===row.SKU);
 const opts=[["safe","A · Задержка без OOS"],["shortage","B · Задержка с OOS"],["overstock","C · Overstock"]];
 return header("Поставки и риски","Меняйте задержку и количество поставки: остаток, потери спроса и превышение Max пересчитываются сразу.")+
 `<div class="scenario-tabs">${opts.map(([v,l])=>`<button class="scenario-tab ${id===v?"active":""}" data-scenario="${v}">${h(l)}</button>`).join("")}</div>`+
 `<div class="panel"><div class="panel-pad"><div class="flex space-between align-center"><div><div class="eyebrow">P001 · WH001 · ОКТЯБРЬ 2026</div><h2 class="page-title">${h(row["Сценарий"])}</h2></div>${statusBadge(s.impact)}</div><div class="form-grid mt-16"><div class="field"><label>Задержка сверх базовой ETA, дней</label><input class="input" data-v2-delay="${id}" type="number" min="0" max="120" value="${s.delay}"/><span class="field-hint">Базовая ETA: через ${s.base} дней</span></div><div class="field"><label>Поступит на склад, шт.</label><input class="input" data-v2-incoming="${id}" type="number" min="0" value="${s.qty}"/><span class="field-hint">Изменение физической поставки требует подтверждения поставщика</span></div></div>
 <div class="subgrid mt-16"><div class="small-metric"><div class="s-label">Новая ETA, через</div><div class="s-num">${fm(s.eta)} дней</div></div><div class="small-metric"><div class="s-label">Остаток до ETA</div><div class="s-num">${f2(s.before)} шт.</div></div><div class="small-metric"><div class="s-label">Потерянный прогнозный спрос</div><div class="s-num ${s.lost>0?"text-red":""}">${f2(s.lost)} шт.</div></div></div>
 <div class="subgrid mt-16"><div class="small-metric"><div class="s-label">Первый день OOS</div><div class="s-num">${s.first??"Нет"}</div></div><div class="small-metric"><div class="s-label">Остаток после прихода</div><div class="s-num">${f2(s.after)} шт.</div></div><div class="small-metric"><div class="s-label">Выше Max ${f2(s.max)} шт.</div><div class="s-num ${s.over>0?"text-amber":""}">${f2(s.over)} шт.</div></div></div>
 <div class="insight ${s.lost>0?"red":s.over>0?"amber":"green"} mt-16"><b>Решение:</b> ${s.lost>0?"OOS до ETA: проверить текущие клиентские заказы, ускорение, допустимое перераспределение. Утерянные прогнозные продажи НЕ переносятся на дни после поставки.":s.over>0?"Overstock: рассмотреть уменьшение будущей закупки или распределение. Уже отправленный товар не отменяем без согласования с поставщиком.":"Задержка безопасна: обновить ETA. Дополнительная экстренная закупка не требуется."}</div>
 </div></div>
 <div class="whitegap"></div><div class="panel"><div class="panel-head"><div><div class="panel-title">Подтверждённые клиентские заказы · проверка обеспеченности</div><div class="panel-desc">Количество без резерва ≠ автоматически признанный дефицит</div></div>${table(["Заказ","Срок","Заказано","Зарезервировано","Без резерва","Учтён в прогнозе"],customers.map(x=>`<tr><td><strong>${h(x["Заказ"])}</strong></td><td>${h(x["Срок исполнения"])}</td><td>${fm(numeric(x["Заказано, шт."]))}</td><td>${fm(numeric(x["Зарезервировано, шт."]))}</td><td>${fm(numeric(x["Без резерва, шт. (НЕ дефицит)"]))}</td><td>${h(x["Учтён в прогнозе"])}</td></tr>`))}</div><div class="notice-bar">Текущие заявки не аннулируются автоматически. Прогноз и подтверждённые обязательства показываются раздельно, без двойного учёта.</div></div>`+note;
};
journalPage=function(){
 const events=state.events||[];
 return header("Уведомления и журнал","История действий и версии рекомендаций. В Production используется существующий аудит и Telegram Smartup.",btn("Сбросить демонстрацию","reset-demo","btn btn-danger"))+
 `<div class="panel"><div class="panel-head"><div><div class="panel-title">История решений</div><div class="panel-desc">Последние ${events.length} событий · локально в браузере</div></div></div>${events.length?events.slice(0,30).map(e=>`<div class="event-row"><div class="event-main"><div class="event-title">${h(e.text)}</div><div class="event-detail">${h(e.details)}</div></div><div class="event-date">${h(e.time)}</div></div>`).join(""):`<div class="empty">Изменений пока нет</div>`}</div>`+
 `<div class="insight mt-16">Источник: Google Sheets · 15 SKU в каталоге · 3 SKU в расчётах · 70 региональных складов · ${h(model.asOf)}. События не отправляются в боевую ERP или Telegram.</div>`+note;
};
settingsPage=function(){
 return header("Настройки SCM","Закупочные политики, источник прогноза и существующие роли Smartup.")+
 `<div class="settings-grid"><div class="panel"><div class="panel-head"><div class="panel-title">Политики страхового запаса · демоданные</div></div>${table(["SKU","Min, дней","Max, дней"],purch.map(p=>`<tr><td><strong>${h(p.SKU)}</strong></td><td>${fm(numeric(p["Min, дни"]))}</td><td>${fm(numeric(p["Max, дни"]))}</td></tr>`))}</div><div class="panel"><div class="panel-head"><div class="panel-title">Условия поставщиков · на пару SKU и поставщик</div></div>${table(["SKU","Поставщик","Lead time","MOQ","Шаг"],purch.map(p=>`<tr><td><strong>${h(p.SKU)}</strong></td><td>${h(p["Поставщик"])}</td><td>${h(p["Lead Time, дни"])} дн.</td><td>${h(p.MOQ)}</td><td>${h(p["Кратность"])}</td></tr>`))}</div></div>
 <div class="panel mt-16"><div class="panel-pad"><div class="panel-title">Интеграционные границы</div><div class="kv-row"><span>ТМЦ, поставщики, склады</span><strong>Существующие справочники Smartup</strong></div><div class="kv-row"><span>Прогноз</span><strong>Готовый от отдела продаж</strong></div><div class="kv-row"><span>SCM — закупочная рекомендация</span><strong>Новый расчёт с календарным остатком</strong></div><div class="kv-row"><span>Согласования, уведомления и аудит</span><strong>Повторное использование возможностей Smartup</strong></div><div class="kv-row"><span>Реальный обмен с ERP</span><strong>В демо не подключён</strong></div></div></div>`+note;
};
const oldRecalc=recommendPurchase;
recommendPurchase=function(sku,sid){
 const p=purchMap[sku];
 if(!p||sid!==p["ID поставщика"])return {qty:0,daily:0,lead:0,horizon:0,safety:0,avail:0,ontime:0,net:0,of:offer(sku,sid)};
 return {qty:numeric(p["Рекомендация, шт."]),daily:0,lead:numeric(p["Lead Time, дни"]),horizon:numeric(p["Цикл, дни"])+numeric(p["Lead Time, дни"]),safety:0,avail:numeric(p["Свободно сейчас (сеть)"]),ontime:numeric(p["Поступит до ETA"]),net:numeric(p["Чистая потребность"]),of:offer(sku,sid)};
};
const originalClickAction=clickAction;
clickAction=function(act){
 if(act==="reset-demo"){try{localStorage.removeItem("smartup-scm-demo-v4")}catch(e){}state=defaultState();setup();persist();render();return showToast("Сброшены исходные значения модели v2")}
 if(act==="recalculate"){event("info","Данные прогноза прочитаны","Источник — отдел продаж, прогноз не строится модулем SCM.");render();return showToast("SCM прочитал актуальный готовый прогноз")}
 return originalClickAction(act);
};
document.addEventListener("change",e=>{
 const el=e.target;
 if(el.matches("[data-v2-sku]")){state.v2SelectedSku=el.value;state.v2Search="";persist();render();return}
 if(el.matches("[data-v2-filter]")){state.v2RiskFilter=el.value;persist();render();return}
 if(el.matches("[data-v2-alloc-filter]")){state.v2AllocFilter=el.value;persist();render();return}
 if(el.matches("[data-v2-search]")){state.v2Search=el.value;persist();render();return}
 if(el.matches("[data-v2-delay],[data-v2-incoming]")){
  const id=el.dataset.v2Delay||el.dataset.v2Incoming;
  const qtyKey=el.hasAttribute("data-v2-delay")?"delay":"qty";
  const x=Number(el.value);
  if(!Number.isInteger(x)||x<0||(qtyKey==="delay"&&x>120)){showToast("Введите допустимое целое число","error");render();return}
  state.v2Scenarios[id]={...(state.v2Scenarios[id]||{}),[qtyKey]:x};
  event("info","Пересчитан сценарий "+id,qtyKey+" = "+x);persist();render();return;
 }
 if(el.matches("[data-v2-alloc]")){
  const [sku,wh]=el.dataset.v2Alloc.split("|");const row=alloc.find(x=>x.SKU===sku&&x["Региональный склад"]===wh);
  if(!row){showToast("Строка распределения не найдена","error");render();return}
  const val=Number(el.value),need=numeric(row["Необходимо передать"]),old=allocQty(row);
  if(!Number.isInteger(val)||val<0||val>need){showToast("Количество должно быть целым, от 0 до потребности склада","error");render();return}
  if(allocTotal(sku)-old+val>allocAvailable(sku)){showToast("Недостаточно товара на РЦ: превышен доступный остаток","error");render();return}
  state.v2Alloc[sku+"|"+wh]=val;event("info","Распределение "+sku+" / "+wh,old+" → "+val+" шт.");persist();render();return;
 }
});
document.addEventListener("input",e=>{
 if(e.target.matches("[data-v2-search]")){
  clearTimeout(window.scmV2SearchTimer);
  const val=e.target.value;
  window.scmV2SearchTimer=setTimeout(()=>{state.v2Search=val;persist();render()},360);
 }
});
const extra=document.createElement("style");extra.textContent=`.v2-alloc-input{width:76px;min-height:29px;text-align:right}.tagbox p{margin:8px 0 0;line-height:1.55}.panel .table{min-width:790px}.form-grid .field input{max-width:240px}.metric-number{font-size:24px}.info-banner{margin-top:12px}`;
document.head.appendChild(extra);
render();
})();
