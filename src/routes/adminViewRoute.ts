import { Router, Request, Response } from 'express';

const router = Router();

router.get('/admin', (_req: Request, res: Response) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sublyte Operations</title>
  <style>
    :root { --ink:#14201e; --muted:#6b7975; --line:#dbe5df; --paper:#f5f8f4; --card:#fff; --green:#087f5b; --green-soft:#e1f3e9; --amber:#a96a00; --amber-soft:#fff2d5; --red:#b42318; --red-soft:#fee9e7; --blue:#1769aa; --shadow:0 12px 32px rgba(20,32,30,.06); }
    * { box-sizing:border-box; } body { margin:0; color:var(--ink); background:var(--paper); font:14px/1.45 "Segoe UI",sans-serif; }
    button,input,select,textarea { font:inherit; } button { cursor:pointer; } .shell { display:grid; grid-template-columns:240px 1fr; min-height:100vh; }
    aside { background:#10211e; color:#d8e8df; padding:24px 16px; } .brand { display:flex; gap:11px; align-items:center; margin:0 10px 40px; color:#fff; font-weight:800; }
    .brand-mark { display:grid; place-items:center; width:32px; height:32px; border-radius:9px; background:#30b983; color:#10211e; font-weight:900; }
    nav { display:grid; gap:6px; } nav button { border:0; background:transparent; color:#a9c0b5; text-align:left; padding:11px 12px; border-radius:8px; } nav button.active,nav button:hover { background:#1b3931; color:#fff; }
    .side-note { margin:48px 10px 0; padding-top:16px; border-top:1px solid #29463d; color:#82a195; font-size:12px; } main { min-width:0; padding:30px clamp(18px,4vw,48px); }
    .topbar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:28px; } h1,h2,p { margin:0; } h1 { font-size:27px; letter-spacing:-.02em; } .eyebrow { color:var(--green); text-transform:uppercase; font-size:11px; font-weight:800; letter-spacing:.12em; margin-bottom:6px; }
    .top-actions { display:flex; gap:10px; align-items:center; } .ghost,.primary,.danger { border-radius:8px; padding:9px 13px; border:1px solid var(--line); background:#fff; color:var(--ink); font-weight:700; } .primary { color:#fff; background:var(--green); border-color:var(--green); } .danger { color:var(--red); background:var(--red-soft); border-color:#f6c2bd; }
    .grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:22px; } .card { background:var(--card); border:1px solid var(--line); border-radius:12px; box-shadow:var(--shadow); } .metric { padding:18px; } .metric-label { color:var(--muted); font-size:12px; font-weight:700; } .metric-value { margin-top:10px; font-size:25px; font-weight:800; } .metric-foot { margin-top:5px; color:var(--muted); font-size:12px; }
    .layout { display:grid; grid-template-columns:minmax(0,1.7fr) minmax(260px,.8fr); gap:18px; } .panel { padding:20px; } .panel-head { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:16px; } h2 { font-size:17px; } .muted { color:var(--muted); }
    .providers { display:grid; gap:10px; } .provider { display:flex; justify-content:space-between; align-items:center; padding:13px; border:1px solid var(--line); border-radius:9px; } .provider-name { font-weight:800; } .provider-status { color:var(--green); font-size:12px; margin-top:3px; } .provider-balance { font-weight:800; }
    .toolbar { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; } .toolbar input,.toolbar select { min-height:37px; padding:7px 10px; border:1px solid var(--line); border-radius:8px; background:#fff; color:var(--ink); } .toolbar input { flex:1; min-width:180px; }
    .table-wrap { overflow:auto; } table { width:100%; border-collapse:collapse; min-width:760px; } th,td { padding:13px 10px; border-bottom:1px solid var(--line); text-align:left; white-space:nowrap; } th { color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.07em; } td { font-size:13px; } .ref { color:var(--blue); font-family:Consolas,monospace; } .user-name { font-weight:700; } .user-email { color:var(--muted); font-size:11px; margin-top:2px; }
    .badge { display:inline-block; padding:4px 8px; border-radius:99px; font-size:11px; font-weight:800; } .success { color:var(--green); background:var(--green-soft); } .pending { color:var(--amber); background:var(--amber-soft); } .failed { color:var(--red); background:var(--red-soft); }
    .empty { padding:34px 12px; color:var(--muted); text-align:center; } .toast { position:fixed; right:20px; bottom:20px; max-width:360px; padding:13px 16px; border-radius:9px; background:#10211e; color:#fff; box-shadow:var(--shadow); display:none; } .toast.show { display:block; }
    dialog { width:min(440px,calc(100% - 32px)); border:0; border-radius:12px; padding:0; box-shadow:0 24px 80px rgba(0,0,0,.2); } dialog::backdrop { background:rgba(16,33,30,.45); } .dialog-body { padding:22px; } .dialog-body textarea { width:100%; min-height:90px; margin:14px 0; padding:10px; border:1px solid var(--line); border-radius:8px; resize:vertical; } .dialog-actions { display:flex; justify-content:flex-end; gap:8px; }
    @media (max-width:900px) { .shell { grid-template-columns:1fr; } aside { padding:14px 16px; } .brand { margin:0 0 12px; } nav { display:flex; overflow:auto; } nav button { white-space:nowrap; } .side-note { display:none; } .grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .layout { grid-template-columns:1fr; } }
    @media (max-width:560px) { main { padding:22px 14px; } .topbar { display:block; } .top-actions { margin-top:14px; } .grid { grid-template-columns:1fr; } .metric-value { font-size:22px; } }
  </style>
</head>
<body>
  <div class="shell">
    <aside>
      <div class="brand"><img src="/assets/sublyte-logo.png" alt="Sublyte" style="width:132px;height:42px;object-fit:contain;object-position:left center" /><span style="position:absolute;left:-10000px">Sublyte Operations</span></div>
      <nav aria-label="Admin sections"><button class="active" data-view="overview">Overview</button><button data-view="transactions">Transactions</button><button data-view="providers">Providers</button></nav>
      <div class="side-note">Live controls for wallet integrity, provider health, and transaction operations.</div>
    </aside>
    <main>
      <header class="topbar"><div><div class="eyebrow">Operations console</div><h1 id="page-title">System overview</h1><p class="muted" style="margin-top:6px">Live wallet and VTU activity</p></div><div class="top-actions"><span class="muted" id="last-updated">Loading...</span><button class="primary" id="refresh">Refresh data</button></div></header>
      <section class="grid" id="metrics"></section>
      <div class="layout">
        <section class="card panel" id="transactions-panel"><div class="panel-head"><div><h2>Transaction monitor</h2><p class="muted" style="margin-top:4px">Search, filter, and audit recent customer activity.</p></div></div><div class="toolbar"><input id="search" placeholder="Search reference or phone" /><select id="status"><option value="">All statuses</option><option>SUCCESS</option><option>PENDING</option><option>FAILED</option></select></div><div class="table-wrap"><table><thead><tr><th>Reference</th><th>Customer</th><th>Service</th><th>Amount</th><th>Provider</th><th>Status</th><th></th></tr></thead><tbody id="transactions"></tbody></table></div></section>
        <aside class="card panel" id="providers-panel"><div class="panel-head"><div><h2>Provider health</h2><p class="muted" style="margin-top:4px">Current provider balances</p></div></div><div class="providers" id="providers"></div><label class="muted" for="provider-mode" style="display:block;margin:20px 0 6px;font-size:12px;font-weight:700">Purchase routing</label><select id="provider-mode" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px"><option value="AUTO_FAILOVER">Auto failover</option><option value="STROWALLET">StroWallet</option><option value="INLOMAX">Inlomax</option><option value="HUSMODATA">Husmodata</option></select></aside>
      </div>
    </main>
  </div>
  <dialog id="refund-dialog"><div class="dialog-body"><h2>Force refund</h2><p class="muted" id="refund-copy" style="margin-top:5px"></p><textarea id="refund-reason" placeholder="Required audit reason"></textarea><div class="dialog-actions"><button class="ghost" id="cancel-refund">Cancel</button><button class="danger" id="confirm-refund">Confirm refund</button></div></div></dialog>
  <div class="toast" id="toast"></div>
  <script>
    const state = { transactions: [], selected: null };
    const money = (value) => 'N' + Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const toast = (message) => { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3500); };
    const api = async (path, options) => { const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options }); const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.message || 'Request failed'); return body.data; };
    const renderMetrics = (data) => { document.getElementById('metrics').innerHTML = [['Wallet float',money(data.total_wallet_balance_sum),'Across '+data.total_registered_users+' users'],['Today\'s volume',money(data.daily_sales_volume),data.daily_sales_count+' successful transactions'],['Estimated margin',money(data.daily_estimated_profit),'Based on completed volume'],['Routing mode',data.provider_mode.replace('_',' '),'Current purchase strategy']].map(([label,value,foot]) => '<div class="card metric"><div class="metric-label">'+label+'</div><div class="metric-value">'+value+'</div><div class="metric-foot">'+foot+'</div></div>').join(''); document.getElementById('provider-mode').value=data.provider_mode; renderProviders(data.providers_health); };
    const renderProviders = (providers) => { document.getElementById('providers').innerHTML = (providers || []).map((item) => '<div class="provider"><div><div class="provider-name">'+item.provider+'</div><div class="provider-status">'+(item.success?'Operational':'Unavailable')+'</div></div><div class="provider-balance">'+money(item.balance)+'</div></div>').join('') || '<div class="empty">No provider data available.</div>'; };
    const renderTransactions = () => { const query=document.getElementById('search').value.toLowerCase(); const status=document.getElementById('status').value; const rows=state.transactions.filter((tx)=>{const hay=(tx.reference+' '+tx.phone_number).toLowerCase();return (!query||hay.includes(query))&&(!status||tx.status===status);}); document.getElementById('transactions').innerHTML=rows.length?rows.map((tx)=>'<tr><td class="ref">'+tx.reference+'</td><td><div class="user-name">'+(tx.user?.full_name||'Unknown user')+'</div><div class="user-email">'+(tx.user?.email||'')+'</div></td><td>'+tx.service_type+(tx.network?' / '+tx.network:'')+'</td><td><strong>'+money(tx.amount)+'</strong></td><td>'+ (tx.provider_used||'--')+'</td><td><span class="badge '+tx.status.toLowerCase()+'">'+tx.status+'</span></td><td>'+(tx.status!=='FAILED'?'<button class="danger refund" data-id="'+tx.id+'" data-ref="'+tx.reference+'" data-amount="'+tx.amount+'">Refund</button>':'')+'</td></tr>').join(''):'<tr><td colspan="7" class="empty">No transactions match this filter.</td></tr>'; document.querySelectorAll('.refund').forEach((button)=>button.addEventListener('click',()=>openRefund(button.dataset))); };
    const load = async () => { try { const [stats, transactions] = await Promise.all([api('/api/admin/dashboard-stats'), api('/api/admin/transactions?limit=50')]); state.transactions=transactions.transactions||[]; renderMetrics(stats); renderTransactions(); document.getElementById('last-updated').textContent='Updated '+new Date().toLocaleTimeString(); } catch (error) { toast(error.message); } };
    const openRefund = (item) => { state.selected=item; document.getElementById('refund-copy').textContent=item.ref+' - '+money(item.amount); document.getElementById('refund-reason').value=''; document.getElementById('refund-dialog').showModal(); };
    document.getElementById('confirm-refund').addEventListener('click', async () => { const reason=document.getElementById('refund-reason').value.trim(); if(!reason){toast('An audit reason is required.');return;} try { await api('/api/admin/transactions/'+state.selected.id+'/refund',{method:'POST',body:JSON.stringify({admin_reason:reason})}); document.getElementById('refund-dialog').close(); toast('Refund completed.'); await load(); } catch(error){toast(error.message);} });
    document.getElementById('cancel-refund').addEventListener('click',()=>document.getElementById('refund-dialog').close());
    document.getElementById('provider-mode').addEventListener('change',async(event)=>{try{await api('/api/admin/provider-config',{method:'POST',body:JSON.stringify({mode:event.target.value})});toast('Purchase routing updated.');await load();}catch(error){toast(error.message);}});
    document.getElementById('refresh').addEventListener('click',load); document.getElementById('search').addEventListener('input',renderTransactions); document.getElementById('status').addEventListener('change',renderTransactions);
    document.querySelectorAll('[data-view]').forEach((button)=>button.addEventListener('click',()=>{document.querySelectorAll('[data-view]').forEach((item)=>item.classList.remove('active'));button.classList.add('active');document.getElementById('page-title').textContent=button.dataset.view==='overview'?'System overview':button.dataset.view==='transactions'?'Transaction monitor':'Provider health';document.getElementById('transactions-panel').style.display=button.dataset.view==='providers'?'none':'block';document.getElementById('providers-panel').style.display=button.dataset.view==='transactions'?'none':'block';}));
    load();
  </script>
</body>
</html>`);
});

export default router;
