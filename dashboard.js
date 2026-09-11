/* ===== STORAGE ===== */
const USERS_KEY = 'nsfas_users_v3';
const CURRENT_KEY = 'nsfas_current_user_v3';

function getUsers(){try{return JSON.parse(localStorage.getItem(USERS_KEY))||[];}catch(e){return[];}}
function saveUsers(users){localStorage.setItem(USERS_KEY,JSON.stringify(users));}
function getCurrentUser(){try{return JSON.parse(localStorage.getItem(CURRENT_KEY));}catch(e){return null;}}
function setCurrentUser(user){localStorage.setItem(CURRENT_KEY,JSON.stringify(user));}
function clearCurrentUser(){localStorage.removeItem(CURRENT_KEY);}

/* ===== HELPERS ===== */
function isValidAmount(v){const n=parseFloat(v);return !isNaN(n)&&isFinite(n)&&n>0;}
function escapeHtml(s){if(s===null||s===undefined)return'';return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);}
function fmt(n){if(isNaN(n)||n===null)n=0;return 'R'+Number(n).toFixed(2);}
function getInitials(user){if(!user)return'?';const f=(user.firstName||'').charAt(0).toUpperCase();const l=(user.lastName||'').charAt(0).toUpperCase();return(f+l)||'?';}
function showToast(message,type){
    const existing=document.querySelector('.toast');if(existing)existing.remove();
    const toast=document.createElement('div');
    toast.className='toast'+(type?' '+type:'');
    toast.innerHTML=(type==='error'?'<i class="fas fa-exclamation-circle"></i> ':'<i class="fas fa-check-circle"></i> ')+escapeHtml(message);
    document.body.appendChild(toast);
    setTimeout(()=>{toast.style.opacity='0';toast.style.transition='opacity 0.3s';},2400);
    setTimeout(()=>toast.remove(),2800);
}

const FALLBACK_SVGS={
    wallet:`<svg viewBox="0 0 120 80"><rect x="12" y="16" width="96" height="56" rx="10" fill="#0A4DA2"/><rect x="12" y="26" width="96" height="10" fill="#083B7A"/><circle cx="90" cy="46" r="9" fill="#F59E0B"/></svg>`,
    budget:`<svg viewBox="0 0 120 80"><rect x="20" y="12" width="80" height="56" rx="8" fill="#16A34A"/><circle cx="86" cy="22" r="10" fill="#F59E0B"/></svg>`,
    savingsGoal:`<svg viewBox="0 0 120 80"><circle cx="60" cy="40" r="30" fill="#F59E0B" opacity="0.2"/><circle cx="60" cy="40" r="22" fill="#fff" stroke="#F59E0B" stroke-width="4"/><circle cx="60" cy="40" r="12" fill="#16A34A"/></svg>`
};

/* ===== STATE ===== */
let currentUser = null;
let currentTxFilter = 'all';
let dashBar,dashPie,analyticsBar,analyticsPie,reportBar,reportPie,reportLine;
const CHART_COLORS=['#0A4DA2','#16A34A','#F59E0B','#EF4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];
const CATEGORIES=['Food','Transport','Accommodation','Data','Education','Entertainment','Shopping','Other'];

/* ===== INIT ===== */
function initializeApp(user){
    currentUser=user;
    updateAvatarEverywhere(user);
    refreshAll();
    navigateTo('dashboard');
    setTimeout(()=>{initDashCharts();initReportCharts();initAnalyticsCharts();generateAICoach();},200);
    checkBudgetAlerts(user);
}

function navigateTo(page){
    document.querySelectorAll('.page-section').forEach(el=>el.classList.remove('active'));
    const target=document.getElementById('page-'+page);
    if(target)target.classList.add('active');
    document.querySelectorAll('.app-navlinks a[data-page]').forEach(el=>{el.classList.toggle('active',el.dataset.page===page);});
    document.getElementById('appNavLinks').classList.remove('open');
    window.location.hash=page;
    refreshAll();
    if(page==='dashboard')setTimeout(()=>{initDashCharts();generateAICoach();},150);
    if(page==='reports')setTimeout(()=>initReportCharts(),150);
    if(page==='analytics')setTimeout(()=>initAnalyticsCharts(),150);
    if(page==='wallet')refreshWallet();
}

function toggleAppMenu(){document.getElementById('appNavLinks').classList.toggle('open');}

function refreshAll(){
    if(!currentUser)return;
    updateAvatarEverywhere(currentUser);
    refreshDashboard(currentUser);
    refreshExpenses(currentUser);
    refreshBudget(currentUser);
    refreshGoals(currentUser);
    refreshProfile(currentUser);
    refreshWallet(currentUser);
    generateAICoach();
}

/* ===== AVATAR ===== */
function updateAvatarEverywhere(user){
    const initials=getInitials(user);
    const navBtn=document.getElementById('navbarAvatar');
    if(navBtn){if(user&&user.profilePicture){navBtn.innerHTML='<img src="'+user.profilePicture+'" alt="'+initials+'">';}else{navBtn.textContent=initials;}}
    const pAvatar=document.getElementById('profileAvatar');
    if(pAvatar){if(user&&user.profilePicture){pAvatar.innerHTML='<img src="'+user.profilePicture+'" alt="'+initials+'">';}else{pAvatar.textContent=initials;}}
}
function handleProfilePictureUpload(event){
    const file=event.target.files&&event.target.files[0];if(!file)return;
    const allowed=['image/jpeg','image/jpg','image/png','image/webp'];
    if(!allowed.includes(file.type)){showToast('Please choose a JPG, JPEG, PNG or WEBP image.','error');event.target.value='';return;}
    if(file.size>2*1024*1024){showToast('Please choose an image smaller than 2MB.','error');event.target.value='';return;}
    const reader=new FileReader();
    reader.onload=function(e){currentUser.profilePicture=e.target.result;updateUserData(currentUser);updateAvatarEverywhere(currentUser);showToast('Profile picture updated');};
    reader.readAsDataURL(file);
}
function removeProfilePicture(){
    if(!confirm('Remove your profile picture?'))return;
    currentUser.profilePicture=null;updateUserData(currentUser);updateAvatarEverywhere(currentUser);showToast('Profile picture removed');
}

/* ===== COMPUTE ===== */
function computeTotals(user){
    const tx=user.transactions||[];
    const income=tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expenses=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    return {income,expenses,balance:income-expenses,tx};
}

/* ===== DASHBOARD ===== */
function refreshDashboard(user){
    document.getElementById('dashUserName').textContent=user.firstName||'Student';
    const {income,expenses,balance,tx}=computeTotals(user);
    document.getElementById('dashBalance').textContent=fmt(balance);
    document.getElementById('dashAllowance').textContent=fmt(income);
    document.getElementById('dashExpenses').textContent=fmt(expenses);
    document.getElementById('dashSavings').textContent=fmt(user.savings||0);
    const hasData=tx.length>=3;const score=hasData?calculateHealthScore(user):null;
    document.getElementById('dashHealth').textContent=hasData?score+'%':'—';
    const container=document.getElementById('recentTransactions');
    const recent=tx.slice(-5).reverse();
    if(recent.length===0){container.innerHTML=emptyState('No transactions yet',"You haven't recorded any transactions yet.",'Add money','openAddMoneyModal()');return;}
    container.innerHTML=recent.map(t=>txRow(t,false)).join('');
}

function emptyState(title,message,btnLabel,btnAction,iconSvg){
    const svg=iconSvg||FALLBACK_SVGS.wallet;
    return '<div class="empty-state"><div class="empty-visual">'+svg+'</div><h4>'+escapeHtml(title)+'</h4><p>'+escapeHtml(message)+'</p>'+(btnLabel?'<button class="btn btn-primary" onclick="'+btnAction+'"><i class="fas fa-plus"></i> '+escapeHtml(btnLabel)+'</button>':'')+'</div>';
}

function txRow(t,showDelete){
    const sign=t.type==='income'?'+':'−';
    const icon=t.type==='income'?'fa-arrow-down':'fa-arrow-up';
    return '<div class="transaction-item"><div class="icon '+t.type+'"><i class="fas '+icon+'"></i></div><div class="info"><div class="name">'+escapeHtml(t.text)+'</div><div class="meta">'+escapeHtml(t.category||'General')+' • '+new Date(t.date).toLocaleDateString()+'</div></div><div class="amount '+t.type+'">'+sign+fmt(t.amount).slice(1)+'</div>'+(showDelete?'<button class="del" onclick="deleteTransaction(\''+t.id+'\')"><i class="fas fa-trash"></i></button>':'')+'</div>';
}

function calculateHealthScore(user){
    const {income,expenses}=computeTotals(user);
    const budget=user.monthlyBudget||0;
    let score=60;
    if(budget>0){const ratio=expenses/budget;if(ratio<0.5)score+=25;else if(ratio<0.8)score+=15;else if(ratio<1)score+=5;else score-=10;}
    const savingsRate=(user.savings||0)/(income||1);
    if(savingsRate>0.2)score+=15;else if(savingsRate>0.1)score+=8;else if(savingsRate>0.05)score+=4;
    if((user.transactions||[]).length>15)score+=5;
    return Math.max(0,Math.min(100,Math.round(score)));
}

/* ===== AI COACH ===== */
function generateAICoach(){
    if(!currentUser)return;
    const {income,expenses,tx}=computeTotals(currentUser);
    const budget=currentUser.monthlyBudget||0;
    let msg,tip;
    if(tx.length<2){msg='Add some income and expenses to start analysing your finances.';tip="Tip: Once you log a few transactions, you'll get personalised advice here.";}
    else if(budget<=0){msg='Set a monthly budget so I can tell you how you\'re tracking against it.';tip='Tip: Go to the Budget tab and set your monthly allowance.';}
    else{
        const expensesTx=tx.filter(t=>t.type==='expense');
        const cats={};expensesTx.forEach(t=>{cats[t.category]=(cats[t.category]||0)+t.amount;});
        const topCat=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0]||['—',0];
        const pct=Math.round((expenses/budget)*100);
        if(pct<50){msg='You\'ve used '+pct+'% of your budget so far.';tip='Tip: You have room to increase your savings this month.';}
        else if(pct<80){msg='You\'ve used '+pct+'% of your budget.';tip='Tip: Your biggest category is '+topCat[0]+'.';}
        else if(pct<100){msg='You\'ve used '+pct+'% of your budget. Stay careful.';tip='Tip: Pause non-essential spending.';}
        else{msg='You\'ve used '+pct+'% of your budget. You\'re over budget.';tip='Tip: Focus only on essentials.';}
    }
    document.getElementById('coachMessage').textContent=msg;
    document.getElementById('coachTip').textContent=tip;
}

/* ===== WALLET ===== */
function refreshWallet(user){
    if(!user)user=currentUser;if(!user)return;
    const {income,expenses,balance}=computeTotals(user);
    document.getElementById('walletBalance').textContent=fmt(balance);
    document.getElementById('walletReceived').textContent=fmt(income);
    document.getElementById('walletSpent').textContent=fmt(expenses);
    document.getElementById('walletSaved').textContent=fmt(user.savings||0);
    document.getElementById('splitTotal').textContent=income.toFixed(0);
    document.getElementById('splitFood').textContent=fmt(income*0.31);
    document.getElementById('splitTransport').textContent=fmt(income*0.16);
    document.getElementById('splitRent').textContent=fmt(income*0.33);
    document.getElementById('splitSavings').textContent=fmt(income*0.11);
}

/* ===== ADD MONEY ===== */
function openAddMoneyModal(){
    document.getElementById('addMoneyAmount').value='';
    document.getElementById('addMoneyDescription').value='';
    document.getElementById('addMoneyAmountError').classList.remove('show');
    document.querySelector('input[name="moneySource"][value="NSFAS allowance"]').checked=true;
    openModal('addMoneyModal');
    setTimeout(()=>document.getElementById('addMoneyAmount').focus(),200);
}
function submitAddMoney(){
    const amountInput=document.getElementById('addMoneyAmount');
    const errorEl=document.getElementById('addMoneyAmountError');
    const amount=parseFloat(amountInput.value);
    errorEl.classList.remove('show');
    if(!isValidAmount(amount)){errorEl.textContent='Please enter a valid amount greater than 0.';errorEl.classList.add('show');amountInput.classList.add('invalid');return;}
    amountInput.classList.remove('invalid');
    const source=(document.querySelector('input[name="moneySource"]:checked')||{}).value||'Other';
    const description=document.getElementById('addMoneyDescription').value.trim()||source;
    const btn=document.getElementById('addMoneySubmitBtn');
    btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Adding...';
    currentUser.transactions.push({id:'t_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),text:description,amount:amount,category:source,type:'income',date:new Date().toISOString()});
    currentUser.balance=(currentUser.balance||0)+amount;
    currentUser.allowance=(currentUser.allowance||0)+amount;
    updateUserData(currentUser);refreshAll();closeModal('addMoneyModal');showToast('Money added successfully','success');
    setTimeout(()=>{btn.disabled=false;btn.innerHTML='<i class="fas fa-check"></i> Add to wallet';},400);
}

/* ===== EXPENSES ===== */
function setTxFilter(filter,btn){
    currentTxFilter=filter;
    document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
    if(btn)btn.classList.add('active');
    refreshExpenses(currentUser);
}
function refreshExpenses(user){
    if(!user)return;
    const {income,expenses,balance}=computeTotals(user);
    document.getElementById('expBalance').textContent=fmt(balance);
    document.getElementById('expIncome').textContent=fmt(income);
    document.getElementById('expExpense').textContent=fmt(expenses);
    renderExpenseList(user);
}
function renderExpenseList(user){
    const search=(document.getElementById('expSearch').value||'').toLowerCase().trim();
    let tx=(user.transactions||[]).slice();
    if(currentTxFilter!=='all')tx=tx.filter(t=>t.type===currentTxFilter);
    if(search)tx=tx.filter(t=>(t.text||'').toLowerCase().includes(search)||(t.category||'').toLowerCase().includes(search));
    tx.reverse();
    const list=document.getElementById('expenseList');
    if(tx.length===0){
        if(currentTxFilter==='income')list.innerHTML=emptyState('No income yet','Your income transactions will appear here.','Add money','openAddMoneyModal()');
        else if(currentTxFilter==='expense')list.innerHTML=emptyState('No expenses yet',"You haven't recorded any expenses yet.",'Add expense',"openModal('addExpenseModal')");
        else list.innerHTML=emptyState('No transactions yet','Your transactions will appear here.','Add money','openAddMoneyModal()');
        return;
    }
    list.innerHTML=tx.map(t=>txRow(t,true)).join('');
}
function addExpense(){
    const text=document.getElementById('expText').value.trim();
    const amount=parseFloat(document.getElementById('expAmount').value);
    const category=document.getElementById('expCategory').value;
    const type=document.getElementById('expType').value;
    if(!text){showToast('Please enter a description.','error');return;}
    if(!isValidAmount(amount)){showToast('Please enter a valid amount greater than 0.','error');return;}
    currentUser.transactions.push({id:'t_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),text,amount,category,type,date:new Date().toISOString()});
    if(type==='income'){currentUser.balance=(currentUser.balance||0)+amount;currentUser.allowance=(currentUser.allowance||0)+amount;}
    else{currentUser.balance=(currentUser.balance||0)-amount;}
    updateUserData(currentUser);refreshAll();
    document.getElementById('expText').value='';document.getElementById('expAmount').value='';
    showToast('Transaction added','success');checkBudgetAlerts(currentUser);
}
function addExpenseFromModal(){
    const text=document.getElementById('modalExpText').value.trim();
    const amount=parseFloat(document.getElementById('modalExpAmount').value);
    const category=document.getElementById('modalExpCategory').value;
    if(!text){showToast('Please enter a description.','error');return;}
    if(!isValidAmount(amount)){showToast('Please enter a valid amount greater than 0.','error');return;}
    currentUser.transactions.push({id:'t_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),text,amount,category,type:'expense',date:new Date().toISOString()});
    currentUser.balance=(currentUser.balance||0)-amount;
    updateUserData(currentUser);refreshAll();closeModal('addExpenseModal');
    document.getElementById('modalExpText').value='';document.getElementById('modalExpAmount').value='';
    showToast('Expense added','success');checkBudgetAlerts(currentUser);
}
function deleteTransaction(id){
    if(!confirm('Delete this transaction?'))return;
    const tx=currentUser.transactions.find(x=>x.id===id);
    if(tx){if(tx.type==='income'){currentUser.balance=(currentUser.balance||0)-tx.amount;currentUser.allowance=(currentUser.allowance||0)-tx.amount;}else{currentUser.balance=(currentUser.balance||0)+tx.amount;}}
    currentUser.transactions=currentUser.transactions.filter(x=>x.id!==id);
    updateUserData(currentUser);refreshAll();showToast('Transaction deleted');
}

/* ===== BUDGET ===== */
function refreshBudget(user){
    if(!user)return;
    const total=user.monthlyBudget||0;
    const {expenses}=computeTotals(user);
    document.getElementById('budTotal').textContent=fmt(total);
    document.getElementById('budUsed').textContent=fmt(expenses);
    document.getElementById('budRemaining').textContent=fmt(Math.max(0,total-expenses));
    renderBudgetCategories(user);
}
function renderBudgetCategories(user){
    const cats=user.budgetCategories||[];
    const container=document.getElementById('budgetGrid');
    if(cats.length===0){container.innerHTML=emptyState('No budget categories yet','Add a category budget to start tracking spending limits.',null,null,FALLBACK_SVGS.budget);return;}
    const tx=user.transactions||[];
    container.innerHTML=cats.map(cat=>{
        const spent=tx.filter(t=>t.category===cat.name&&t.type==='expense').reduce((s,t)=>s+t.amount,0);
        const pct=cat.amount>0?Math.min((spent/cat.amount)*100,100):0;
        const cls=pct>90?'red':pct>70?'yellow':'green';
        const remain=Math.max(0,cat.amount-spent);
        return '<div class="budget-card"><div class="budget-head"><h4>'+escapeHtml(cat.name)+'</h4><div class="amount">'+fmt(spent)+' / '+fmt(cat.amount)+'</div></div><div class="budget-bar"><div class="fill '+cls+'" style="width:'+pct+'%;"></div></div><div class="budget-foot"><span>'+pct.toFixed(0)+'% used</span><span>'+(pct>=100?'Over budget':fmt(remain)+' left')+'</span></div></div>';
    }).join('');
}
function setMonthlyBudget(){
    const amount=parseFloat(document.getElementById('budMonthlyAmount').value);
    if(!isValidAmount(amount)){showToast('Please enter a valid monthly budget.','error');return;}
    currentUser.monthlyBudget=amount;updateUserData(currentUser);refreshAll();
    document.getElementById('budMonthlyAmount').value='';showToast('Monthly budget set','success');
}
function addBudgetCategory(){
    const name=document.getElementById('budCatName').value.trim();
    const amount=parseFloat(document.getElementById('budCatAmount').value);
    if(!name){showToast('Please enter a category name.','error');return;}
    if(!isValidAmount(amount)){showToast('Please enter a valid amount.','error');return;}
    currentUser.budgetCategories.push({id:'b_'+Date.now(),name,amount});
    updateUserData(currentUser);refreshAll();
    document.getElementById('budCatName').value='';document.getElementById('budCatAmount').value='';
    showToast('Category budget added','success');
}

/* ===== GOALS ===== */
function refreshGoals(user){
    if(!user)return;
    const goals=user.goals||[];
    const container=document.getElementById('goalsGrid');
    if(goals.length===0){container.innerHTML=emptyState('No savings goals yet','Start saving towards something important.',null,null,FALLBACK_SVGS.savingsGoal);return;}
    const saved=user.savings||0;
    container.innerHTML=goals.map(goal=>{
        const pct=goal.target>0?Math.min((saved/goal.target)*100,100):0;
        const circ=2*Math.PI*28;const offset=circ-(pct/100)*circ;
        const remain=Math.max(0,goal.target-saved);
        return '<div class="goal-card"><div class="goal-top"><div class="goal-ring"><svg viewBox="0 0 70 70"><circle class="ring-bg" cx="35" cy="35" r="28"></circle><circle class="ring-fill" cx="35" cy="35" r="28" stroke-dasharray="'+circ+'" stroke-dashoffset="'+offset+'"></circle></svg><div class="ring-pct">'+pct.toFixed(0)+'%</div></div><div class="goal-info"><h4>'+escapeHtml(goal.name)+'</h4><div class="amounts"><strong>'+fmt(Math.min(saved,goal.target))+'</strong> / '+fmt(goal.target)+'</div></div></div><div class="goal-meta"><span>'+(remain>0?fmt(remain)+' to go':'Goal reached')+'</span><span>'+(goal.deadline?new Date(goal.deadline).toLocaleDateString():'No deadline')+'</span></div><button class="btn btn-danger btn-sm" onclick="deleteGoal(\''+goal.id+'\')"><i class="fas fa-trash"></i> Delete</button></div>';
    }).join('');
}
function addGoal(){
    const name=document.getElementById('goalName').value.trim();
    const target=parseFloat(document.getElementById('goalTarget').value);
    const deadline=document.getElementById('goalDeadline').value;
    const icon=document.getElementById('goalIcon').value;
    if(!name){showToast('Please enter a goal name.','error');return;}
    if(!isValidAmount(target)){showToast('Please enter a valid target amount.','error');return;}
    currentUser.goals.push({id:'g_'+Date.now(),name,target,deadline:deadline||null,icon:icon||'🎯'});
    updateUserData(currentUser);refreshAll();
    document.getElementById('goalName').value='';document.getElementById('goalTarget').value='';document.getElementById('goalDeadline').value='';
    showToast('Savings goal created','success');
}
function deleteGoal(id){
    if(!confirm('Delete this savings goal?'))return;
    currentUser.goals=currentUser.goals.filter(g=>g.id!==id);
    updateUserData(currentUser);refreshAll();
}

/* ===== PROFILE ===== */
function refreshProfile(user){
    if(!user)return;
    document.getElementById('profileName').textContent=(user.firstName||'')+' '+(user.lastName||'');
    document.getElementById('profileNumber').textContent=user.studentNumber||'—';
    document.getElementById('profilePhone').textContent=user.phone||'—';
    document.getElementById('profileNsfasStatus').innerHTML='<span class="badge badge-success">'+escapeHtml(user.nsfasStatus||'Active')+'</span>';
    document.getElementById('profileStatusBadge').textContent=user.status||'Active';
    document.getElementById('editFirstName').value=user.firstName||'';
    document.getElementById('editLastName').value=user.lastName||'';
    document.getElementById('editEmail').value=user.email||'';
    document.getElementById('editUniversity').value=(user.university&&user.university!=='Not specified')?user.university:'';
    document.getElementById('editCourse').value=(user.course&&user.course!=='Not specified')?user.course:'';
    updateAvatarEverywhere(user);
}
function saveProfileChanges(){
    const fn=document.getElementById('editFirstName').value.trim();
    const ln=document.getElementById('editLastName').value.trim();
    const em=document.getElementById('editEmail').value.trim();
    const uni=document.getElementById('editUniversity').value.trim();
    const crs=document.getElementById('editCourse').value.trim();
    if(!fn||!ln||!em){showToast('First name, last name and email are required.','error');return;}
    currentUser.firstName=fn;currentUser.lastName=ln;currentUser.email=em;
    currentUser.university=uni||'Not specified';currentUser.course=crs||'Not specified';
    updateUserData(currentUser);refreshAll();showToast('Profile updated','success');
}
function updateUserData(updatedUser){
    const users=getUsers();
    const idx=users.findIndex(u=>u.id===updatedUser.id);
    if(idx!==-1){users[idx]=updatedUser;saveUsers(users);}
    currentUser=updatedUser;setCurrentUser(updatedUser);
}

/* ===== NOTIFICATIONS ===== */
function checkBudgetAlerts(user){
    const cats=user.budgetCategories||[];const tx=user.transactions||[];let count=0;
    cats.forEach(cat=>{const spent=tx.filter(t=>t.category===cat.name&&t.type==='expense').reduce((s,t)=>s+t.amount,0);if(cat.amount>0&&(spent/cat.amount)>=0.9)count++;});
    const badge=document.getElementById('notifCount');
    if(badge){if(count>0){badge.textContent=count;badge.style.display='flex';}else badge.style.display='none';}
}
function showNotifications(){
    const badge=document.getElementById('notifCount');
    if(badge&&badge.style.display!=='none'&&parseInt(badge.textContent)>0)showToast('You have budget alerts. Check your Budget tab.','error');
    else showToast('No new notifications');
}

/* ===== MODALS ===== */
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(m=>{m.addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');});});

/* ===== LOGOUT & DELETE ===== */
function handleLogout(){
    if(!confirm('Log out of NSFAS Money Manager?'))return;
    clearCurrentUser();window.location.href='landing.html';
}
function deleteAccount(){
    const user=currentUser;if(!user)return;
    const users=getUsers().filter(u=>u.id!==user.id);
    saveUsers(users);clearCurrentUser();window.location.href='landing.html';
}

/* ===== DARK MODE ===== */
function toggleDarkMode(){
    document.body.classList.toggle('dark-mode');
    const isDark=document.body.classList.contains('dark-mode');
    const toggle=document.getElementById('darkModeToggle');
    const slider=document.getElementById('darkModeSlider');
    if(toggle)toggle.checked=isDark;
    if(slider)slider.style.background=isDark?'#16A34A':'var(--gray-300)';
    localStorage.setItem('nsfas_dark_mode',isDark?'true':'false');
    setTimeout(()=>{initDashCharts();initReportCharts();initAnalyticsCharts();},100);
}
if(localStorage.getItem('nsfas_dark_mode')==='true'){
    document.body.classList.add('dark-mode');
    const toggle=document.getElementById('darkModeToggle');const slider=document.getElementById('darkModeSlider');
    if(toggle)toggle.checked=true;if(slider)slider.style.background='#16A34A';
}

/* ===== CHARTS ===== */
function getChartTheme(){return{text:document.body.classList.contains('dark-mode')?'#cbd5e1':'#6B7280',grid:document.body.classList.contains('dark-mode')?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)'};}

function initDashCharts(){
    if(!currentUser)return;
    const {tx}=computeTotals(currentUser);
    const expenses=tx.filter(t=>t.type==='expense');
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthData=months.map((_,i)=>expenses.filter(t=>new Date(t.date).getMonth()===i).reduce((s,t)=>s+t.amount,0));
    const theme=getChartTheme();
    if(dashBar)dashBar.destroy();
    dashBar=new Chart(document.getElementById('dashBarChart'),{type:'bar',data:{labels:months,datasets:[{label:'Spending',data:monthData,backgroundColor:'#0A4DA2',borderRadius:6}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:theme.text,font:{size:10}}},y:{grid:{color:theme.grid},ticks:{color:theme.text,font:{size:10}}}}}});
    const catData=CATEGORIES.map(c=>expenses.filter(t=>t.category===c).reduce((s,t)=>s+t.amount,0));
    if(dashPie)dashPie.destroy();
    dashPie=new Chart(document.getElementById('dashPieChart'),{type:'doughnut',data:{labels:CATEGORIES,datasets:[{data:catData,backgroundColor:CHART_COLORS,borderWidth:2,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{position:'right',labels:{color:theme.text,font:{size:10},padding:8,boxWidth:10}}},cutout:'60%'}});
}

function initAnalyticsCharts(){
    if(!currentUser)return;
    const {tx,expenses}=computeTotals(currentUser);
    const expensesTx=tx.filter(t=>t.type==='expense');
    const catData=CATEGORIES.map(c=>expensesTx.filter(t=>t.category===c).reduce((s,t)=>s+t.amount,0));
    const total=expenses;const days=Math.max(1,new Date().getDate());
    document.getElementById('avgDaily').textContent=fmt(total/days);
    document.getElementById('txCount').textContent=tx.length;
    const theme=getChartTheme();
    if(analyticsBar)analyticsBar.destroy();
    analyticsBar=new Chart(document.getElementById('analyticsBarChart'),{type:'bar',data:{labels:CATEGORIES,datasets:[{label:'Spending',data:catData,backgroundColor:CHART_COLORS,borderRadius:8}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:theme.text,font:{size:10}}},y:{grid:{color:theme.grid},ticks:{color:theme.text,font:{size:10}}}}}});
    if(analyticsPie)analyticsPie.destroy();
    analyticsPie=new Chart(document.getElementById('analyticsPieChart'),{type:'doughnut',data:{labels:CATEGORIES,datasets:[{data:catData,backgroundColor:CHART_COLORS,borderWidth:2,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{position:'right',labels:{color:theme.text,font:{size:10},padding:6,boxWidth:10}}},cutout:'60%'}});
    const insights=document.getElementById('spendingInsights');
    if(total===0){insights.innerHTML='<p style="color:var(--gray-500);font-size:0.9rem;">Add transactions to see your spending analytics.</p>';}
    else{
        const sorted=CATEGORIES.map((c,i)=>({name:c,amount:catData[i]})).sort((a,b)=>b.amount-a.amount);
        const top=sorted[0];const pct=Math.round((top.amount/total)*100);
        insights.innerHTML='<p style="color:var(--gray-600);font-size:0.9rem;margin-bottom:6px;">• Top category: <strong>'+top.name+'</strong> ('+pct+'%)</p><p style="color:var(--gray-600);font-size:0.9rem;margin-bottom:6px;">• Total logged: <strong>'+fmt(total)+'</strong></p><p style="color:var(--gray-600);font-size:0.9rem;">• Average per day: <strong>'+fmt(total/days)+'</strong></p>';
    }
}

function initReportCharts(){
    if(!currentUser)return;
    const {tx}=computeTotals(currentUser);
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const expenseData=months.map((_,i)=>tx.filter(t=>t.type==='expense'&&new Date(t.date).getMonth()===i).reduce((s,t)=>s+t.amount,0));
    const incomeData=months.map((_,i)=>tx.filter(t=>t.type==='income'&&new Date(t.date).getMonth()===i).reduce((s,t)=>s+t.amount,0));
    const theme=getChartTheme();
    if(reportBar)reportBar.destroy();
    reportBar=new Chart(document.getElementById('reportBarChart'),{type:'bar',data:{labels:months,datasets:[{label:'Income',data:incomeData,backgroundColor:'#16A34A',borderRadius:6},{label:'Expenses',data:expenseData,backgroundColor:'#EF4444',borderRadius:6}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{position:'top',labels:{color:theme.text,font:{size:11},boxWidth:12}}},scales:{x:{grid:{display:false},ticks:{color:theme.text,font:{size:10}}},y:{grid:{color:theme.grid},ticks:{color:theme.text,font:{size:10}}}}}});
    const catData=CATEGORIES.map(c=>tx.filter(t=>t.type==='expense'&&t.category===c).reduce((s,t)=>s+t.amount,0));
    if(reportPie)reportPie.destroy();
    reportPie=new Chart(document.getElementById('reportPieChart'),{type:'doughnut',data:{labels:CATEGORIES,datasets:[{data:catData,backgroundColor:CHART_COLORS,borderWidth:2,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{position:'right',labels:{color:theme.text,font:{size:10},padding:6,boxWidth:10}}},cutout:'60%'}});
    const sorted=tx.slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
    let running=0;const balanceData=sorted.map(t=>{running+=t.type==='income'?t.amount:-t.amount;return running;});
    const labels=sorted.map(t=>new Date(t.date).toLocaleDateString());
    if(reportLine)reportLine.destroy();
    reportLine=new Chart(document.getElementById('reportLineChart'),{type:'line',data:{labels:labels.length>0?labels:['No data'],datasets:[{label:'Balance',data:balanceData.length>0?balanceData:[0],borderColor:'#0A4DA2',backgroundColor:'rgba(10,77,162,0.1)',fill:true,tension:0.3}]},options:{responsive:true,maintainAspectRatio:true,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:theme.text,font:{size:9}}},y:{grid:{color:theme.grid},ticks:{color:theme.text,font:{size:10}}}}}});
    updateHealthScore(currentUser);
}

function updateHealthScore(user){
    const tx=user.transactions||[];
    const el=document.getElementById('healthScore');const bar=document.getElementById('healthBar');const msg=document.getElementById('healthMessage');
    if(tx.length<3){el.textContent='—';bar.style.width='0%';msg.textContent='Add some income and expenses to start analysing your financial health.';return;}
    const score=calculateHealthScore(user);
    el.textContent=score+'%';bar.style.width=score+'%';
    if(score>=80)msg.textContent='Excellent financial health — keep it up!';
    else if(score>=60)msg.textContent='Good financial health. Consider increasing your savings rate.';
    else if(score>=40)msg.textContent='Fair. Review your spending.';
    else msg.textContent='Needs attention. Start tracking expenses and set a budget.';
}

/* ===== REPORTS ===== */
function generateReport(type){
    if(!currentUser)return;
    const tx=currentUser.transactions||[];
    const period=document.getElementById('reportPeriod').value;
    let filtered=tx;const now=new Date();
    if(period==='monthly'){const start=new Date(now.getFullYear(),now.getMonth(),1);filtered=tx.filter(t=>new Date(t.date)>=start);}
    else if(period==='weekly'){const start=new Date(now);start.setDate(now.getDate()-7);filtered=tx.filter(t=>new Date(t.date)>=start);}
    const income=filtered.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expenses=filtered.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    if(type==='csv'){
        const csv='Date,Description,Category,Type,Amount\n'+filtered.map(t=>new Date(t.date).toLocaleDateString()+',"'+((t.text||'').replace(/"/g,'""'))+'",'+(t.category||'General')+','+t.type+','+t.amount.toFixed(2)).join('\n');
        const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
        const a=document.createElement('a');a.href=url;a.download='nsfas-report-'+period+'.csv';a.click();URL.revokeObjectURL(url);
        showToast('CSV downloaded','success');
    }else{
        const win=window.open('','_blank');
        win.document.write('<html><head><title>NSFAS Money Manager Report</title><style>body{font-family:Inter,Arial,sans-serif;padding:40px;max-width:820px;margin:auto;color:#1e293b;}h1{color:#0A4DA2;font-family:Poppins,sans-serif;}table{width:100%;border-collapse:collapse;margin:20px 0;}th,td{border:1px solid #e2e8f0;padding:10px 14px;text-align:left;font-size:0.9rem;}th{background:#f1f5f9;font-weight:600;color:#0A4DA2;}.summary{background:#f8fafc;padding:20px;border-radius:12px;margin:20px 0;}</style></head><body><h1>NSFAS Money Manager — Financial Report</h1><p><strong>'+escapeHtml(currentUser.firstName)+' '+escapeHtml(currentUser.lastName)+'</strong> — Student no. '+escapeHtml(currentUser.studentNumber)+'</p><p>Period: <strong>'+period+'</strong> · Generated: '+new Date().toLocaleDateString()+'</p><div class="summary"><p><strong>Total income:</strong> R'+income.toFixed(2)+'</p><p><strong>Total expenses:</strong> R'+expenses.toFixed(2)+'</p><p><strong>Net:</strong> R'+(income-expenses).toFixed(2)+'</p></div><h3>Transactions ('+filtered.length+')</h3><table><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th></tr>'+filtered.map(t=>'<tr><td>'+new Date(t.date).toLocaleDateString()+'</td><td>'+escapeHtml(t.text)+'</td><td>'+escapeHtml(t.category||'General')+'</td><td>'+t.type+'</td><td>'+(t.type==='income'?'+':'−')+'R'+t.amount.toFixed(2)+'</td></tr>').join('')+'</table><script>setTimeout(function(){window.print();},500);<\/script></body></html>');
        win.document.close();
    }
}

/* ===== CHATBOT ===== */
function toggleChatbot(){document.getElementById('chatPanel').classList.toggle('open');}
function sendChat(){
    const input=document.getElementById('chatInput');const msg=input.value.trim();if(!msg)return;
    const messages=document.getElementById('chatMessages');
    const userMsg=document.createElement('div');userMsg.className='chat-msg user';userMsg.textContent=msg;messages.appendChild(userMsg);
    input.value='';messages.scrollTop=messages.scrollHeight;
    setTimeout(()=>{
        const botMsg=document.createElement('div');botMsg.className='chat-msg bot';
        const txCount=currentUser?(currentUser.transactions||[]).length:0;
        const lower=msg.toLowerCase();let reply;
        if(txCount===0)reply="I don't see any transactions yet. Add your first income or expense.";
        else if(lower.includes('save')||lower.includes('saving'))reply='A good starting point is to save at least 10% of every income you receive.';
        else if(lower.includes('budget'))reply='Set a monthly budget in the Budget tab, then add category budgets like Food or Transport.';
        else if(lower.includes('spend')||lower.includes('expense'))reply='Log every expense — even small ones. See the breakdown in the Analytics tab.';
        else if(lower.includes('nsfas')||lower.includes('allowance'))reply='When your NSFAS allowance arrives, add it via "Add money" and choose "NSFAS allowance".';
        else reply='I can help with budgeting, saving, expenses, and understanding your NSFAS allowance.';
        botMsg.textContent=reply;messages.appendChild(botMsg);messages.scrollTop=messages.scrollHeight;
    },500);
}

/* ===== INIT ON LOAD ===== */
document.addEventListener('DOMContentLoaded',function(){
    const user=getCurrentUser();
    if(!user){window.location.href='landing.html';return;}
    const users=getUsers();
    const validUser=users.find(u=>u.id===user.id);
    if(!validUser){clearCurrentUser();window.location.href='landing.html';return;}
    initializeApp(validUser);

    document.querySelectorAll('.app-navlinks a[data-page]').forEach(link=>{
        link.addEventListener('click',function(e){e.preventDefault();navigateTo(this.dataset.page);});
    });
    document.getElementById('expSearch').addEventListener('input',()=>refreshExpenses(currentUser));

    // Dark mode toggle
    const dm=document.getElementById('darkModeToggle');
    if(dm)dm.addEventListener('change',toggleDarkMode);

    document.addEventListener('keydown',function(e){
        if(e.key==='Escape'){document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));document.getElementById('chatPanel').classList.remove('open');}
    });
});
