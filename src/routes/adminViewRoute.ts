import { Router, Request, Response } from 'express';

const router = Router();

router.get('/admin', (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🇳🇬 Nigerian VTU Platform - Admin Control Center</title>
  <style>
    body { margin: 0; background-color: #090D16; color: #F8FAFC; font-family: system-ui, -apple-system, sans-serif; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #1E293B; margin-bottom: 24px; }
    .title { color: #10B981; font-size: 24px; font-weight: 800; margin: 0; }
    .subtitle { color: #94A3B8; font-size: 13px; margin-top: 4px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .card { background-color: #0F172A; border-radius: 16px; padding: 20px; border: 1px solid #1E293B; }
    .card-label { font-size: 12px; color: #94A3B8; text-transform: uppercase; font-weight: 600; }
    .card-val { font-size: 26px; font-weight: 800; margin-top: 8px; }
    .btn { padding: 8px 14px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; font-size: 12px; }
    .btn-green { background-color: #10B981; color: white; }
    .btn-danger { background-color: #F43F5E20; color: #F43F5E; border: 1px solid #F43F5E40; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-top: 16px; }
    th, td { padding: 12px; border-bottom: 1px solid #1E293B; }
    th { color: #94A3B8; }
    .badge-success { background: #10B98120; color: #10B981; padding: 4px 8px; border-radius: 6px; font-weight: 700; }
    .badge-pending { background: #F59E0B20; color: #F59E0B; padding: 4px 8px; border-radius: 6px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">🇳🇬 VTU Platform - Admin Control Center</h1>
      <div class="subtitle">Live System Monitor, Provider Balances & Fallback Switcher</div>
    </div>
    <div style="background: #0F172A; padding: 4px; border-radius: 10px; border: 1px solid #1E293B;">
      <button class="btn btn-green" id="failoverBtn">🔄 Auto Failover Mode</button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="card">
      <div class="card-label">Total User Wallet Balance Sum</div>
      <div class="card-val" style="color: #10B981;">₦4,850,900.50</div>
      <div style="font-size: 11px; color: #64748B; margin-top: 4px;">1,240 Registered Accounts</div>
    </div>
    <div class="card">
      <div class="card-label">Daily Top-Up Sales Volume</div>
      <div class="card-val" style="color: #38BDF8;">₦382,400.00</div>
      <div style="font-size: 11px; color: #64748B; margin-top: 4px;">412 Successful Top-Ups Today</div>
    </div>
    <div class="card">
      <div class="card-label">Est. Daily Profit Margin</div>
      <div class="card-val" style="color: #F59E0B;">₦13,384.00</div>
      <div style="font-size: 11px; color: #64748B; margin-top: 4px;">3.5% Avg Markup Margin</div>
    </div>
    <div class="card">
      <div class="card-label">Live Provider API Balances</div>
      <div style="margin-top: 8px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #94A3B8;">Inlomax (Primary):</span>
          <strong style="color: #10B981;">₦450,000.00</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #94A3B8;">Husmodata (Fallback):</span>
          <strong style="color: #38BDF8;">₦320,000.00</strong>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <h2 style="font-size: 18px; margin: 0 0 12px; color: #F8FAFC;">📊 Live Transaction Audit Monitor</h2>
    <table>
      <thead>
        <tr>
          <th>Reference</th>
          <th>User</th>
          <th>Phone</th>
          <th>Service & Net</th>
          <th>Amount</th>
          <th>Provider</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-family: monospace; color: #38BDF8;">VTU-DATA-17219210-9123</td>
          <td>Amina Bello<br><small style="color: #64748B;">amina@example.ng</small></td>
          <td>08031234567</td>
          <td>DATA (MTN)</td>
          <td><strong>₦520.00</strong></td>
          <td>INLOMAX</td>
          <td><span class="badge-success">SUCCESS</span></td>
          <td><button class="btn btn-danger" onclick="alert('Transaction already completed.')">Completed</button></td>
        </tr>
        <tr>
          <td style="font-family: monospace; color: #38BDF8;">VTU-AIR-17219211-4411</td>
          <td>Emeka Okonkwo<br><small style="color: #64748B;">emeka@example.ng</small></td>
          <td>08029998877</td>
          <td>AIRTIME (AIRTEL)</td>
          <td><strong>₦1,000.00</strong></td>
          <td>HUSMODATA</td>
          <td><span class="badge-pending">PENDING</span></td>
          <td><button class="btn btn-danger" onclick="confirmRefund('VTU-AIR-17219211-4411', 1000)">Force Refund</button></td>
        </tr>
      </tbody>
    </table>
  </div>

  <script>
    function confirmRefund(ref, amount) {
      const reason = prompt('Enter compulsory admin audit reason for refunding ' + ref + ' (₦' + amount + '):');
      if (reason) {
        alert('Transaction ' + ref + ' force-refunded to user wallet. Reason: ' + reason);
      }
    }
  </script>
</body>
</html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
