/* University Computer Centre – Linux Server Infrastructure portal
   Minimal Premium Enterprise SaaS Interface
   Vanilla JS with Refined Three.js 3D Server Digital Twin */
'use strict';

/* ============ 1. CONFIG ============ */
const CONFIG = {
  USE_DEMO: false,
  API_BASE: '/api/v1',
  ENDPOINTS: {
    overview: '/overview', users: '/users', departments: '/departments',
    storage: '/storage', backups: '/backups', monitoring: '/monitoring', security: '/security'
  },
  DEMO_LATENCY_MS: 450,
  REFRESH_MS: 30000
};

/* ============ 2. DEMONSTRATION DATA (Fallback Only) ============ */
const DEMO = (() => {
  const first = ['Aarav','Diya','Rohan','Ananya','Karthik','Meera','Vikram','Sneha','Arjun','Priya','Rahul','Kavya','Nikhil','Isha','Sanjay','Lakshmi','Harsh','Pooja','Manoj','Nandini'];
  const last = ['Sharma','Iyer','Reddy','Nair','Patel','Gowda','Rao','Menon','Kulkarni','Das','Bhat','Joshi','Verma','Shetty','Hegde'];
  const D = [
    {id:'it',name:'Information Technology',short:'IT',group:'grp_it',lv:'lv_it',mount:'/srv/dept/it',allocGB:600,usedGB:312,students:50,faculty:8},
    {id:'cse',name:'Computer Science and Engineering',short:'CSE',group:'grp_cse',lv:'lv_cse',mount:'/srv/dept/cse',allocGB:700,usedGB:441,students:50,faculty:9},
    {id:'aiml',name:'Artificial Intelligence and Machine Learning',short:'AIML',group:'grp_aiml',lv:'lv_aiml',mount:'/srv/dept/aiml',allocGB:500,usedGB:388,students:50,faculty:8}
  ];
  const users = [];
  const statuses = ['active','active','active','active','active','active','active','active','locked','suspended'];
  let i = 0;
  D.forEach(d => {
    for (let n=1;n<=d.students;n++,i++) users.push({
      username:`${d.id}_s${String(n).padStart(3,'0')}`,
      name:`${first[(i*7)%20]} ${last[(i*11)%15]}`,
      role:'student',dept:d.id,group:`${d.group}, students`,
      home:`/home/${d.id}_s${String(n).padStart(3,'0')}`,
      status:statuses[(i*3)%10],
      lastLogin:`2025-0${1+(i%9)}-${String(1+(i*5)%27).padStart(2,'0')}`
    });
    for (let n=1;n<=d.faculty;n++,i++) users.push({
      username:`${d.id}_f${String(n).padStart(2,'0')}`,
      name:`Dr. ${first[(i*3)%20]} ${last[(i*4)%15]}`,
      role:'faculty',dept:d.id,group:`${d.group}, faculty, sudoers-limited`,
      home:`/home/${d.id}_f${String(n).padStart(2,'0')}`,
      status:n%9===0?'suspended':'active',
      lastLogin:`2025-0${1+(i%9)}-${String(1+(i*7)%27).padStart(2,'0')}`
    });
  });
  D.forEach(d => d.access = [
    `${d.group} (read/write, ${d.students} students)`,
    `faculty group (read/write/admin, ${d.faculty} faculty)`,
    'root and sysadmin (full)',
    'Other departments (no access)'
  ]);
  const backups = [
    ['BK-0412','full','2025-09-14 02:00',412,'38m 12s','success',true],
    ['BK-0413','incremental','2025-09-15 02:00',9.4,'3m 02s','success',true],
    ['BK-0414','incremental','2025-09-16 02:00',11.1,'3m 40s','success',true],
    ['BK-0415','incremental','2025-09-17 02:00',8.7,'2m 51s','success',true],
    ['BK-0416','incremental','2025-09-18 02:00',10.2,'3m 18s','warning',false],
    ['BK-0417','incremental','2025-09-19 02:00',12.6,'4m 05s','success',true],
    ['BK-0418','incremental','2025-09-20 02:00',7.9,'2m 33s','success',true]
  ].map(b=>({id:b[0],type:b[1],time:b[2],sizeGB:b[3],duration:b[4],status:b[5],verified:b[6]})).reverse();

  return {
    overview:{
      students:150,faculty:25,departments:3,
      server:{hostname:'ucc-srv01',os:'Ubuntu Server 22.04 LTS',kernel:'5.15.0-sample',ip:'10.10.0.10',uptime:'41 days, 6 hours'},
      cpu:34,ram:{usedGB:9.6,totalGB:16},disk:{usedGB:1141,totalGB:1800},
      activities:[
        {time:'10:42',level:'ok',text:'Incremental backup BK-0418 completed'},
        {time:'10:15',level:'info',text:'User cse_s014 added to group grp_cse'},
        {time:'09:58',level:'warn',text:'3 failed SSH logins from 203.0.113.45 (sample)'},
        {time:'09:30',level:'info',text:'Apache reloaded after virtual host update'},
        {time:'08:05',level:'ok',text:'LVM volume lv_aiml extended by 50 GB'},
        {time:'07:40',level:'info',text:'Faculty account it_f03 password reset'}
      ]
    },
    users,
    departments:D,
    storage:{
      vg:'vg_university',pv:['/dev/sdb (1 TB)','/dev/sdc (1 TB)'],
      fs:'ext4',totalGB:2000,extentMB:4,
      lvs:D.map(d=>({name:d.lv,dept:d.id,mount:d.mount,allocGB:d.allocGB,usedGB:d.usedGB})),
      unallocatedGB:200,
      commands:['sudo lvextend -L +50G /dev/vg_university/lv_aiml','sudo resize2fs /dev/vg_university/lv_aiml']
    },
    backups:{
      schedule:{
        full:'Sunday 02:00 (rsync + tar, weekly)',
        incremental:'Mon–Sat 02:00 (rsync --link-dest)',
        retention:'4 full sets, 30 incrementals',
        target:'/backup/university (separate volume)'
      },
      history:backups,
      recovery:{
        rto:'Under 2 hours (target)',rpo:'24 hours',
        steps:[
          'Identify the backup ID from the history table',
          'Mount the backup volume read-only',
          'Restore the last full backup, then apply incrementals in order',
          'Verify ownership and permissions, then remount the department volume'
        ]
      }
    },
    monitoring:{
      cores:8,load:[0.82,0.74,0.69],
      cpuHistory:[34],memHistory:[60],diskIO:[0],
      uptime:'41 days, 6 hours',
      health:{score:96,label:'Healthy',notes:['All critical services running','Disk usage below 80% threshold','1 pending security update']},
      services:[
        {name:'sshd',desc:'Remote administration',port:22,status:'running'},
        {name:'apache2',desc:'Web server',port:80,status:'running'},
        {name:'ufw',desc:'Firewall',port:'-',status:'running'},
        {name:'cron',desc:'Scheduled backups',port:'-',status:'running'},
        {name:'rsyslog',desc:'System logging',port:'-',status:'running'},
        {name:'fail2ban',desc:'Brute-force protection',port:'-',status:'running'},
        {name:'smbd',desc:'File sharing (not deployed)',port:445,status:'stopped'}
      ]
    },
    security:{
      ssh:{status:'running',port:22,rootLogin:'disabled',passwordAuth:'enabled (keys recommended)',version:'OpenSSH 8.9'},
      apache:{status:'running',version:'2.4.52',ssl:'Not configured (sample)',vhosts:'ucc.local'},
      firewall:{
        status:'active',policy:'default deny incoming',
        rules:[
          {port:'22/tcp',action:'ALLOW',from:'10.10.0.0/24',note:'SSH from campus LAN'},
          {port:'80/tcp',action:'ALLOW',from:'Anywhere',note:'Apache HTTP'},
          {port:'443/tcp',action:'ALLOW',from:'Anywhere',note:'Apache HTTPS'},
          {port:'3306/tcp',action:'DENY',from:'Anywhere',note:'Database not exposed'}
        ]
      },
      permissions:[
        {path:'/srv/dept/it',owner:'root',group:'grp_it',mode:'2770',meaning:'IT group only; new files inherit group'},
        {path:'/srv/dept/cse',owner:'root',group:'grp_cse',mode:'2770',meaning:'CSE group only; new files inherit group'},
        {path:'/srv/dept/aiml',owner:'root',group:'grp_aiml',mode:'2770',meaning:'AIML group only; new files inherit group'},
        {path:'/var/www/html',owner:'www-data',group:'www-data',mode:'755',meaning:'Public website content'},
        {path:'/backup/university',owner:'root',group:'root',mode:'700',meaning:'Backups readable by root only'}
      ],
      events:[
        {time:'09:58',level:'warn',text:'Failed SSH login for invalid user admin (sample)'},
        {time:'09:12',level:'ok',text:'Fail2ban banned 203.0.113.45 for 1 hour (sample)'},
        {time:'08:30',level:'info',text:'sudo used by sysadmin: apt update'},
        {time:'Yesterday',level:'info',text:'Firewall rule added: 443/tcp'}
      ]
    }
  };
})();

/* ============ 3. API LAYER ============ */
const api = {
  cache:{},
  async get(name,force) {
    if (!force && this.cache[name]) return this.cache[name];
    let data;
    if (CONFIG.USE_DEMO) {
      await new Promise(r=>setTimeout(r,CONFIG.DEMO_LATENCY_MS));
      data=DEMO[name];
    } else {
      const res=await fetch(CONFIG.API_BASE+CONFIG.ENDPOINTS[name],{headers:{Accept:'application/json'}});
      if (!res.ok) throw new Error(`API ${res.status} for ${CONFIG.ENDPOINTS[name]}`);
      data=await res.json();
    }
    return (this.cache[name]=data);
  }
};

/* ============ 4. HELPERS & UTILITIES ============ */
const $ = (s,r=document)=>r.querySelector(s);
const esc = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct = (a,b)=>Math.round((a/b)*100) || 0;
const lvl = p=>p>=90?'bad':p>=75?'warn':'';
const gb = v => {
  if (v === null || v === undefined || isNaN(v)) return '0 B';
  const num = Number(v);
  if (num <= 0) return '0 B';
  if (num >= 1000) return (num / 1000).toFixed(2) + ' TB';
  if (num >= 1) return num.toFixed(2) + ' GB';
  const mb = num * 1024;
  if (mb >= 1) return mb.toFixed(2) + ' MB';
  const kb = mb * 1024;
  if (kb >= 1) return kb.toFixed(1) + ' KB';
  const bytes = Math.round(kb * 1024);
  if (bytes > 0) return bytes + (bytes === 1 ? ' byte' : ' bytes');
  return '0 B';
};
const deptName = id=>({it:'IT',cse:'CSE',aiml:'AIML'}[id]||String(id).toUpperCase());
const badge = s=>({active:'ok',running:'ok',success:'ok',healthy:'ok',locked:'warn',warning:'warn',suspended:'bad',stopped:'bad',failed:'bad',ok:'ok',warn:'warn',bad:'bad'}[s]||'');
const pill = s=>`<span class="badge ${badge(s)}">${esc(s)}</span>`;
const meter = (label,p,detail)=>`<div class="meter"><div class="row"><span>${label}</span><span>${detail||p+'%'}</span></div><div class="bar"><i class="${lvl(p)}" data-w="${p}"></i></div></div>`;
const skeletons = n=>`<div class="grid g4">${'<div class="skeleton"></div>'.repeat(n)}</div>`;
const empty = (t,d)=>`<div class="empty"><strong>${t}</strong>${d}</div>`;
const COLORS = ['#3b82f6','#06b6d4','#8b5cf6','#10b981'];

function toast(m) {
  const t=$('#toast');
  if(!t)return;
  t.textContent=m;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>t.classList.remove('show'),2400);
}

function copyText(text, label) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(()=>{
      toast(`Copied ${label || text}`);
    }).catch(()=>{
      toast(`Value: ${text}`);
    });
  } else {
    toast(`Value: ${text}`);
  }
}
window.copyText = copyText;

const ic = p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICONS = {
  home:ic('<path d="M3 11l9-8 9 8M5 10v10h14V10"/>'),
  dash:ic('<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>'),
  users:ic('<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6M17 4.5a3.5 3.5 0 010 7M22 20c0-3-2-5-5-5.7"/>'),
  dept:ic('<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>'),
  disk:ic('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
  backup:ic('<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>'),
  mon:ic('<path d="M3 12h4l3-8 4 16 3-8h4"/>'),
  shield:ic('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>')
};

/* ---------- SVG Charts & Live Session Telemetry Buffer ---------- */
const sessionTelemetry = [];

function recordTelemetry(cpu, mem) {
  const now = new Date();
  const time = now.toTimeString().split(' ')[0]; // 'HH:MM:SS'
  const c = Math.max(0, Math.min(100, Math.round(Number(cpu) * 10) / 10 || 0));
  const m = Math.max(0, Math.min(100, Math.round(Number(mem) * 10) / 10 || 0));
  const last = sessionTelemetry[sessionTelemetry.length - 1];
  if (!last || last.cpu !== c || last.mem !== m || (Date.now() - last.ts >= 3000)) {
    sessionTelemetry.push({ time, cpu: c, mem: m, ts: Date.now() });
    if (sessionTelemetry.length > 25) sessionTelemetry.shift();
  }
}

function perfChart(currentCpu, currentMem) {
  if (sessionTelemetry.length === 0) {
    recordTelemetry(currentCpu, currentMem);
  }
  const buf = sessionTelemetry;
  const W = 1000, H = 145, L = 42, R = 48, T = 12, B = 22;
  const x = i => buf.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (buf.length - 1);
  const y = v => T + (100 - Math.max(0, Math.min(100, v))) * (H - T - B) / 100;

  let g = '';

  // 1. Subtle horizontal gridlines & clean Y-axis labels
  [0, 25, 50, 75, 100].forEach(v => {
    const yPos = y(v);
    const isBound = (v === 0 || v === 100);
    g += `<line x1="${L}" x2="${W - R}" y1="${yPos}" y2="${yPos}" stroke="rgba(255,255,255,${isBound ? '0.08' : '0.04'})" stroke-width="1" stroke-dasharray="${isBound ? 'none' : '3,4'}"/>`;
    g += `<text x="${L - 8}" y="${yPos + 3.5}" text-anchor="end" font-family="var(--mono)" font-size="10" fill="#64748b">${v}%</text>`;
  });

  const cpuColor = '#3b82f6';
  const memColor = '#06b6d4';

  if (buf.length === 1) {
    // Single live sample: draw clean reference baseline and live sample marker
    const s = buf[0];
    const xPos = (L + W - R) / 2;

    // CPU baseline & live marker
    g += `<line x1="${L}" x2="${W - R}" y1="${y(s.cpu)}" y2="${y(s.cpu)}" stroke="${cpuColor}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.45"/>`;
    g += `<circle cx="${xPos}" cy="${y(s.cpu)}" r="4.5" fill="${cpuColor}"/>`;
    g += `<circle cx="${xPos}" cy="${y(s.cpu)}" r="8" fill="none" stroke="${cpuColor}" stroke-width="1.2" opacity="0.35"/>`;

    // Memory baseline & live marker
    g += `<line x1="${L}" x2="${W - R}" y1="${y(s.mem)}" y2="${y(s.mem)}" stroke="${memColor}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.45"/>`;
    g += `<circle cx="${xPos}" cy="${y(s.mem)}" r="4.5" fill="${memColor}"/>`;
    g += `<circle cx="${xPos}" cy="${y(s.mem)}" r="8" fill="none" stroke="${memColor}" stroke-width="1.2" opacity="0.35"/>`;

    // Vertical time tick
    g += `<line x1="${xPos}" x2="${xPos}" y1="${T}" y2="${H - B}" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="2,2"/>`;

    // Time labels (guaranteed unclipped)
    g += `<text x="${L}" y="${H - 5}" text-anchor="start" font-family="var(--mono)" font-size="10" fill="#526380">Session Start</text>`;
    g += `<text x="${xPos}" y="${H - 5}" text-anchor="middle" font-family="var(--mono)" font-size="10.5" fill="#cbd5e1" font-weight="500">${s.time}</text>`;
    g += `<text x="${W - R}" y="${H - 5}" text-anchor="end" font-family="var(--mono)" font-size="10" fill="#526380">Live Reading</text>`;
  } else {
    // Multiple real samples collected during active browser session
    const tickIndices = [];
    if (buf.length <= 5) {
      for (let i = 0; i < buf.length; i++) tickIndices.push(i);
    } else {
      tickIndices.push(0);
      const step = Math.max(1, Math.floor(buf.length / 4));
      for (let i = step; i < buf.length - 1; i += step) {
        if (!tickIndices.includes(i)) tickIndices.push(i);
      }
      if (!tickIndices.includes(buf.length - 1)) tickIndices.push(buf.length - 1);
    }

    tickIndices.forEach(idx => {
      const xPos = x(idx);
      g += `<line x1="${xPos}" x2="${xPos}" y1="${T}" y2="${H - B}" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;
      const anchor = idx === 0 ? 'start' : (idx === buf.length - 1 ? 'end' : 'middle');
      g += `<text x="${xPos}" y="${H - 5}" text-anchor="${anchor}" font-family="var(--mono)" font-size="10" fill="#64748b">${buf[idx].time}</text>`;
    });

    // Draw memory polyline & dots
    const memPts = buf.map((s, i) => `${x(i)},${y(s.mem)}`).join(' ');
    g += `<polyline points="${memPts}" fill="none" stroke="${memColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    buf.forEach((s, i) => {
      const isLast = i === buf.length - 1;
      g += `<circle cx="${x(i)}" cy="${y(s.mem)}" r="${isLast ? 4 : 2.5}" fill="${memColor}"/>`;
      if (isLast) g += `<circle cx="${x(i)}" cy="${y(s.mem)}" r="7.5" fill="none" stroke="${memColor}" stroke-width="1.2" opacity="0.45"/>`;
    });

    // Draw CPU polyline & dots
    const cpuPts = buf.map((s, i) => `${x(i)},${y(s.cpu)}`).join(' ');
    g += `<polyline points="${cpuPts}" fill="none" stroke="${cpuColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    buf.forEach((s, i) => {
      const isLast = i === buf.length - 1;
      g += `<circle cx="${x(i)}" cy="${y(s.cpu)}" r="${isLast ? 4 : 2.5}" fill="${cpuColor}"/>`;
      if (isLast) g += `<circle cx="${x(i)}" cy="${y(s.cpu)}" r="7.5" fill="none" stroke="${cpuColor}" stroke-width="1.2" opacity="0.45"/>`;
    });
  }

  const latestSample = buf[buf.length - 1] || { cpu: currentCpu, mem: currentMem };

  return `
    <div class="perf-chart-wrap">
      <svg class="perf-chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Live Session Telemetry: CPU ${latestSample.cpu}%, Memory ${latestSample.mem}%">${g}</svg>
    </div>
    <div class="perf-legend">
      <div class="perf-legend-items">
        <span class="leg-pill"><i style="background:${cpuColor}"></i>CPU: <strong>${latestSample.cpu}%</strong></span>
        <span class="leg-pill"><i style="background:${memColor}"></i>Memory: <strong>${latestSample.mem}%</strong></span>
      </div>
      <div class="perf-legend-info">
        <span class="sys-chip-dot" style="background:var(--ok)"></span>
        <span>Session Buffer (${buf.length} sample${buf.length > 1 ? 's' : ''}) · 24h host daemon not configured</span>
      </div>
    </div>`;
}

function lineChart(series, names) {
  const s0 = series && series[0] ? series[0][series[0].length - 1] : 0;
  const s1 = series && series[1] ? series[1][series[1].length - 1] : 0;
  return perfChart(s0, s1);
}

function donut(segs, centre) {
  const R = 64, C = 2 * Math.PI * R;
  const tot = segs.reduce((a, s) => a + (Number(s.v) || 0), 0) || 1;
  let off = 0, g = '';
  segs.forEach(s => {
    const val = Number(s.v) || 0;
    if (val <= 0) return;
    const rawLen = (val / tot) * C;
    // Tiny non-zero slices get a clean 1.5px marker so they appear on the ring without distorting the visual proportions
    const len = rawLen < 0.05 ? 1.5 : rawLen;
    const clampedLen = Math.min(C - off, len);
    if (clampedLen > 0) {
      g += `<circle r="${R}" cx="90" cy="90" fill="none" stroke="${s.c}" stroke-width="18" stroke-dasharray="${clampedLen.toFixed(2)} ${(C - clampedLen).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 90 90)"/>`;
      off += clampedLen;
    }
  });
  return `<svg class="chart" viewBox="0 0 180 180" style="max-width:180px;margin:auto" role="img" aria-label="Storage distribution">${g}<text x="90" y="88" text-anchor="middle" style="font-size:18px;font-weight:700;fill:#ffffff">${centre[0]}</text><text x="90" y="104" text-anchor="middle" style="font-size:11.5px;fill:#8494b2">${centre[1]}</text></svg>
  <div class="legend" style="justify-content:center">${segs.map(s => `<span><i style="background:${s.c}"></i>${s.l}: <strong>${gb(s.v)}</strong></span>`).join('')}</div>`;
}

const activityList = a => `<ul class="list">${a.map(x => `<li><time>${esc(x.time)}</time><span>${pill(x.level)} ${esc(x.text)}</span></li>`).join('')}</ul>`;
const table = (heads, rows, emptyMsg, extraClass = '') => rows.length
  ? `<div class="table-wrap ${extraClass}"><table><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`
  : empty('Nothing to show', emptyMsg || 'No records match.');

/* ============ 5. VIRTUAL SERVER BLADES METADATA ============ */
const RACK_BLADES = [
  { id: 'gateway', bay: 1, name: 'Blade 01: Gateway', subsystem: 'Reverse Proxy', hash: '#dashboard', desc: 'Apache reverse proxy on port 80/8000.' },
  { id: 'it_dept', bay: 2, name: 'Blade 02: IT Dept', subsystem: 'Computing Partition', hash: '#departments', desc: 'IT shared directory and user accounts.' },
  { id: 'cse_dept', bay: 3, name: 'Blade 03: CSE Dept', subsystem: 'Computing Partition', hash: '#departments', desc: 'CSE shared filesystem and faculty data.' },
  { id: 'aiml_dept', bay: 4, name: 'Blade 04: AIML Dept', subsystem: 'Computing Partition', hash: '#departments', desc: 'AIML programs compute workspace.' },
  { id: 'storage', bay: 5, name: 'Blade 05: Storage', subsystem: 'Virtual Filesystem', hash: '#storage', desc: 'Linux shared root filesystem partition.' },
  { id: 'backup', bay: 6, name: 'Blade 06: Backup', subsystem: 'Disaster Recovery', hash: '#backup', desc: 'Nightly incremental & weekly full archives.' },
  { id: 'security', bay: 7, name: 'Blade 07: Security', subsystem: 'Access & Firewall', hash: '#security', desc: 'OpenSSH server and UFW firewall.' }
];

/* ============ 6. REFINED THREE.JS 3D SERVER RACK ENGINE ============ */

class ServerRack3D {
  constructor(container, blades, onSelectBlade) {
    this.container = container;
    this.blades = blades;
    this.onSelectBlade = onSelectBlade;
    this.hoveredIndex = -1;
    this.animId = null;
    this.mouse = { x: 0, y: 0 };
    this.raycaster = null;
    this.bladeMeshes = [];
    this.isDisposed = false;

    // View camera presets (proportional framing, zero cropping)
    this.viewMode = 'iso';
    this.camIso = { x: 4.2, y: 2.2, z: 7.0 };
    this.camFront = { x: 0.0, y: 0.05, z: 7.6 };

    if (typeof THREE !== 'undefined') {
      this.initThree();
    } else {
      this.initCanvasFallback();
    }
  }

  initThree() {
    const W = this.container.clientWidth || 540;
    const H = this.container.clientHeight || 310;

    this.scene = new THREE.Scene();
    // FOV 32 deg gives generous margins and prevents vertical stretching/cropping
    this.camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
    this.camera.position.set(this.camIso.x, this.camIso.y, this.camIso.z);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.container.appendChild(this.renderer.domElement);

    // Realistic Three-Point Enterprise Lighting
    const amb = new THREE.AmbientLight(0x0e1726, 2.2);
    this.scene.add(amb);

    const dirKey = new THREE.DirectionalLight(0xf1f5f9, 2.2);
    dirKey.position.set(4.5, 6.0, 5.5);
    this.scene.add(dirKey);

    const dirFill = new THREE.DirectionalLight(0x38bdf8, 1.0);
    dirFill.position.set(-4.5, -1.0, 3.5);
    this.scene.add(dirFill);

    const dirRim = new THREE.DirectionalLight(0x3b82f6, 1.4);
    dirRim.position.set(0, 4.0, -4.5);
    this.scene.add(dirRim);

    this.buildRackModel();

    this.raycaster = new THREE.Raycaster();
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnClick = this.onClick.bind(this);
    this.boundOnResize = this.onResize.bind(this);

    this.container.addEventListener('mousemove', this.boundOnMouseMove);
    this.container.addEventListener('click', this.boundOnClick);
    window.addEventListener('resize', this.boundOnResize);

    const animate = () => {
      if (this.isDisposed) return;
      this.animId = requestAnimationFrame(animate);
      this.updateAnimation();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  buildRackModel() {
    this.rackGroup = new THREE.Group();
    this.scene.add(this.rackGroup);

    // 1. Cabinet Main Enclosure (Dark Metallic Matte Finish)
    const cabGeo = new THREE.BoxGeometry(2.0, 3.4, 1.3);
    const cabMat = new THREE.MeshStandardMaterial({
      color: 0x0c111a,
      metalness: 0.85,
      roughness: 0.35
    });
    this.cabinet = new THREE.Mesh(cabGeo, cabMat);
    this.rackGroup.add(this.cabinet);

    // 2. Corner Metallic Pillars (4 vertical columns)
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.92,
      roughness: 0.2
    });
    const postGeo = new THREE.BoxGeometry(0.06, 3.42, 0.06);
    [[-1.0, 0.65], [1.0, 0.65], [-1.0, -0.65], [1.0, -0.65]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, 0, pz);
      this.rackGroup.add(post);
    });

    // 3. Top and Bottom Trim Caps
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x182234,
      metalness: 0.88,
      roughness: 0.25
    });
    const capGeo = new THREE.BoxGeometry(2.04, 0.03, 1.34);
    const topCap = new THREE.Mesh(capGeo, trimMat);
    topCap.position.set(0, 1.71, 0);
    this.rackGroup.add(topCap);

    const botCap = new THREE.Mesh(capGeo, trimMat);
    botCap.position.set(0, -1.71, 0);
    this.rackGroup.add(botCap);

    // 4. Seven Individual Server Blades (Symmetrically Centered)
    const bladeGeo = new THREE.BoxGeometry(1.82, 0.36, 1.15);
    const ventGeo = new THREE.BoxGeometry(1.1, 0.18, 0.02);
    const ventMat = new THREE.MeshStandardMaterial({ color: 0x070b12, metalness: 0.4, roughness: 0.8 });
    const ledGeo = new THREE.SphereGeometry(0.026, 10, 10);
    const pwrMat = new THREE.MeshBasicMaterial({ color: 0x10b981 }); // Emerald
    const actMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 }); // Cyan
    const trimGeo = new THREE.BoxGeometry(1.68, 0.018, 0.015);
    const trimBarMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 }); // Laser Blue
    const handleGeo = new THREE.BoxGeometry(0.04, 0.22, 0.025);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x27354d, metalness: 0.9, roughness: 0.2 });

    const stepY = 0.42;

    this.blades.forEach((b, idx) => {
      const bGroup = new THREE.Group();
      // Center idx 3 at y = 0
      const posY = (3 - idx) * stepY;
      bGroup.position.set(0, posY, 0.06);

      // Chassis Faceplate
      const faceMat = new THREE.MeshStandardMaterial({
        color: 0x121a28,
        metalness: 0.75,
        roughness: 0.35
      });
      const chassis = new THREE.Mesh(bladeGeo, faceMat);
      chassis.userData = { bladeIndex: idx, blade: b };
      bGroup.add(chassis);

      // Ventilation Grille Inset
      const vent = new THREE.Mesh(ventGeo, ventMat);
      vent.position.set(0.12, 0, 0.58);
      bGroup.add(vent);

      // Left & Right Latch Handles
      const hLeft = new THREE.Mesh(handleGeo, handleMat);
      hLeft.position.set(-0.83, 0, 0.585);
      bGroup.add(hLeft);

      const hRight = new THREE.Mesh(handleGeo, handleMat);
      hRight.position.set(0.83, 0, 0.585);
      bGroup.add(hRight);

      // Power / Health LED (Emerald Green)
      const pwrLed = new THREE.Mesh(ledGeo, pwrMat);
      pwrLed.position.set(-0.72, 0.07, 0.585);
      bGroup.add(pwrLed);

      // Activity / Network LED (Cyan)
      const actLed = new THREE.Mesh(ledGeo, actMat);
      actLed.position.set(-0.62, 0.07, 0.585);
      bGroup.add(actLed);

      // Laser Blue Bottom Trim
      const bar = new THREE.Mesh(trimGeo, trimBarMat);
      bar.position.set(0, -0.15, 0.585);
      bGroup.add(bar);

      this.rackGroup.add(bGroup);
      this.bladeMeshes.push({
        group: bGroup,
        chassis: chassis,
        targetZ: 0.06,
        data: b
      });
    });
  }

  onMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (!this.raycaster) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.bladeMeshes.map(m => m.chassis));

    if (hits.length > 0) {
      const idx = hits[0].object.userData.bladeIndex;
      this.setHoveredBlade(idx);
      this.container.style.cursor = 'pointer';
    } else {
      this.setHoveredBlade(-1);
      this.container.style.cursor = 'default';
    }
  }

  onClick(e) {
    if (!this.raycaster) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.bladeMeshes.map(m => m.chassis));
    if (hits.length > 0) {
      const idx = hits[0].object.userData.bladeIndex;
      const b = this.blades[idx];
      if (this.onSelectBlade) this.onSelectBlade(b);
      if (b.hash) location.hash = b.hash;
    }
  }

  setHoveredBlade(idx) {
    if (this.hoveredIndex === idx) return;
    this.hoveredIndex = idx;

    this.bladeMeshes.forEach((bm, i) => {
      const isHover = (i === idx);
      bm.targetZ = isHover ? 0.24 : 0.06;
      bm.chassis.material.color.setHex(isHover ? 0x1e2b44 : 0x121a28);
    });

    const overlay = $('#rackHoverOverlay');
    if (overlay) {
      if (idx >= 0) {
        const b = this.blades[idx];
        overlay.innerHTML = `<strong>${esc(b.name)}</strong> · <span style="color:var(--muted)">${esc(b.desc)}</span> <a href="${b.hash}" style="color:var(--blue);margin-left:8px;text-decoration:none;font-weight:500">Open →</a>`;
      } else {
        overlay.innerHTML = `<span style="color:var(--muted)">Hover a server blade to view subsystem details · Click to open module</span>`;
      }
    }
  }

  setViewMode(mode) {
    this.viewMode = mode;
    const btnIso = $('#btnViewIso');
    const btnFront = $('#btnViewFront');
    if (btnIso) btnIso.classList.toggle('active', mode === 'iso');
    if (btnFront) btnFront.classList.toggle('active', mode === 'front');
  }

  updateAnimation() {
    this.bladeMeshes.forEach(bm => {
      bm.group.position.z += (bm.targetZ - bm.group.position.z) * 0.22;
    });

    let targetX, targetY, targetZ;
    if (this.viewMode === 'front') {
      targetX = this.camFront.x + this.mouse.x * 0.15;
      targetY = this.camFront.y + this.mouse.y * 0.15;
      targetZ = this.camFront.z;
    } else {
      targetX = this.camIso.x + this.mouse.x * 0.35;
      targetY = this.camIso.y + this.mouse.y * 0.25;
      targetZ = this.camIso.z;
    }

    this.camera.position.x += (targetX - this.camera.position.x) * 0.08;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.08;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.08;
    this.camera.lookAt(0, 0, 0);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const W = this.container.clientWidth;
    const H = this.container.clientHeight;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H);
  }

  initCanvasFallback() {
    const canvas = document.createElement('canvas');
    canvas.width = this.container.clientWidth || 540;
    canvas.height = this.container.clientHeight || 310;
    canvas.className = 'rack-canvas';
    this.container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const draw = () => {
      if (this.isDisposed) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2;

      // Cabinet Shell
      ctx.fillStyle = '#0c111a';
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(cx - 105, cy - 135, 210, 270);
      ctx.strokeRect(cx - 105, cy - 135, 210, 270);

      // Metallic Side Rails
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 105, cy - 135, 8, 270);
      ctx.fillRect(cx + 97, cy - 135, 8, 270);

      this.blades.forEach((b, i) => {
        const by = cy - 118 + i * 34;
        const isH = (i === this.hoveredIndex);
        const bx = cx - 93 + (isH ? 6 : 0);

        // Blade Chassis
        ctx.fillStyle = isH ? '#1e2b44' : '#121a28';
        ctx.strokeStyle = isH ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.fillRect(bx, by, 186, 28);
        ctx.strokeRect(bx, by, 186, 28);

        // Ventilation Inset
        ctx.fillStyle = '#070b12';
        ctx.fillRect(bx + 75, by + 6, 85, 16);

        // Emerald Power LED
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(bx + 14, by + 14, 3, 0, Math.PI * 2);
        ctx.fill();

        // Cyan Activity LED
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(bx + 26, by + 14, 3, 0, Math.PI * 2);
        ctx.fill();

        // Blue Accent Line
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(bx, by + 26, 186, 2);

        // Blade Name
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '11.5px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(b.name, bx + 36, by + 18);
      });

      this.animId = requestAnimationFrame(draw);
    };
    draw();

    this.boundOnMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const my = e.clientY - rect.top;
      const cy = canvas.height / 2;
      let hit = -1;
      for (let i = 0; i < 7; i++) {
        const by = cy - 118 + i * 34;
        if (my >= by && my <= by + 28) {
          hit = i;
          break;
        }
      }
      this.setHoveredBlade(hit);
      this.container.style.cursor = hit >= 0 ? 'pointer' : 'default';
    };

    this.boundOnClick = () => {
      if (this.hoveredIndex >= 0) {
        const b = this.blades[this.hoveredIndex];
        if (this.onSelectBlade) this.onSelectBlade(b);
        if (b.hash) location.hash = b.hash;
      }
    };

    this.container.addEventListener('mousemove', this.boundOnMouseMove);
    this.container.addEventListener('click', this.boundOnClick);
  }

  destroy() {
    this.isDisposed = true;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.boundOnMouseMove) this.container.removeEventListener('mousemove', this.boundOnMouseMove);
    if (this.boundOnClick) this.container.removeEventListener('click', this.boundOnClick);
    if (this.boundOnResize) window.removeEventListener('resize', this.boundOnResize);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}

/* ============ 7. PAGES MODULES ============ */
const NAV = [
  {id:'home',t:'University Home',i:'home'},
  {sep:'Administration'},
  {id:'dashboard',t:'Dashboard',i:'dash'},
  {id:'users',t:'User Management',i:'users'},
  {id:'departments',t:'Departments',i:'dept'},
  {id:'storage',t:'Storage Management',i:'disk'},
  {id:'backup',t:'Backup and Recovery',i:'backup'},
  {id:'monitoring',t:'Server Monitoring',i:'mon'},
  {id:'security',t:'Security and Administration',i:'shield'}
];
const PAGES = {};

/* -------------------------------------------------------------
   MODULE 0: University Home (Concise Hero, 3 KPIs, 6 Services)
   ------------------------------------------------------------- */
PAGES.home = {
  title:'University Computer Centre',
  load:async()=>({}),
  render:()=>`
    <!-- Concise Hero Section -->
    <section class="hero">
      <h2>Linux Server Infrastructure</h2>
      <p>Centralized computing platform for the Departments of Information Technology, Computer Science & Engineering, and Artificial Intelligence & Machine Learning.</p>
      <div>
        <a class="btn" href="#dashboard">Open Dashboard</a>
        <a class="btn ghost" href="#departments">View Departments</a>
      </div>
    </section>

    <!-- 3 Essential Statistics -->
    <div class="grid g3" style="margin-bottom:20px">
      <div class="card stat"><div class="n">150</div><div class="l">Students Enrolled</div></div>
      <div class="card stat"><div class="n">25</div><div class="l">Faculty Accounts</div></div>
      <div class="card stat"><div class="n">3</div><div class="l">Departments Configured</div></div>
    </div>

    <!-- Clean Services Grid -->
    <h2 class="sec-h">Infrastructure Services</h2>
    <div class="grid g3">${[
      ['users','User Management','Inspect user accounts, group memberships and status across all departments.','users'],
      ['dept','Department Partitions','Shared storage trees, SGID permissions and faculty ratios.','departments'],
      ['disk','Storage Management','Root filesystem allocation, directory quotas and volume status.','storage'],
      ['backup','Backup & Recovery','Automated nightly incrementals and weekly full backups with SHA-256 checks.','backup'],
      ['mon','Server Monitoring','Real-time CPU, RAM, disk utilization and systemd services.','monitoring'],
      ['shield','Security & Admin','SSH daemon configuration, UFW firewall rules and POSIX permissions.','security']
    ].map(s=>`
      <a class="svc-card" href="#${s[3]}">
        <div class="ico">${ICONS[s[0]]}</div>
        <h3>${s[1]}</h3>
        <p>${s[2]}</p>
      </a>
    `).join('')}</div>

    <div class="card" style="margin-top:20px">
      <h2>Contact & Help Desk</h2>
      <p class="sub">University Computer Centre · Main Technology Block, Level 2</p>
      <dl class="kv">
        <dt>Email</dt><dd><code>helpdesk@ucc.local</code></dd>
        <dt>Hours</dt><dd>Monday to Saturday, 08:30 – 17:30 IST</dd>
      </dl>
    </div>`
};

/* -------------------------------------------------------------
   MODULE 1: Dashboard (Essential KPIs, 3D Rack, Resource Specs)
   ------------------------------------------------------------- */
PAGES.dashboard = {
  title:'Dashboard',
  load:async()=>{
    const res=await Promise.all([api.get('overview'),api.get('departments')]);
    if(res[0]&&res[0].cpu!==undefined) {
      recordTelemetry(res[0].cpu, pct(res[0].ram.usedGB, res[0].ram.totalGB));
    }
    return res;
  },
  render:([o])=>{
    const rp=pct(o.ram.usedGB,o.ram.totalGB), dp=pct(o.disk.usedGB,o.disk.totalGB);
    return `
      <!-- 4 Essential Server KPIs -->
      <div class="grid g4" style="margin-bottom:18px">
        <div class="card stat"><div class="n">${o.cpu}%</div><div class="l">CPU Utilization</div></div>
        <div class="card stat"><div class="n">${rp}%</div><div class="l">Memory (${o.ram.usedGB} / ${o.ram.totalGB} GB)</div></div>
        <div class="card stat"><div class="n">${dp}%</div><div class="l">Disk (${gb(o.disk.usedGB)} / ${gb(o.disk.totalGB)})</div></div>
        <div class="card stat"><div class="n">${esc(o.server.uptime.split(',')[0])}</div><div class="l">System Uptime</div></div>
      </div>

      <!-- Balanced 2-Column Section: 3D Server Rack + Server Overview -->
      <div class="grid g2">
        <!-- 3D Server Rack (Compact & Proportionate) -->
        <div class="rack-hero-card">
          <div class="rack-header">
            <div>
              <h2>Server Infrastructure (3D)</h2>
              <p class="sub" style="margin-bottom:0">Virtual server rack representation</p>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn ghost active" id="btnViewIso" style="font-size:11.5px;padding:4px 10px">Isometric</button>
              <button class="btn ghost" id="btnViewFront" style="font-size:11.5px;padding:4px 10px">Front</button>
            </div>
          </div>
          <div class="rack-viewport-wrap" id="rackViewport"></div>
          <div id="rackHoverOverlay" style="margin-top:10px;font-size:12px;color:var(--muted)">
            Hover a server blade to view subsystem details · Click to open module
          </div>
        </div>

        <!-- Resource Utilization & Server Info -->
        <div class="card">
          <h2>Server Overview</h2>
          <p class="sub">Live Linux system measurements</p>
          ${meter('CPU usage', o.cpu)}
          ${meter('RAM usage', rp, `${o.ram.usedGB} of ${o.ram.totalGB} GB (${rp}%)`)}
          ${meter('Disk usage', dp, `${gb(o.disk.usedGB)} of ${gb(o.disk.totalGB)} (${dp}%)`)}
          
          <dl class="kv" style="margin-top:16px;padding-top:12px;border-top:1px solid var(--line)">
            <dt>Hostname</dt><dd><code>${esc(o.server.hostname)}</code></dd>
            <dt>OS & Kernel</dt><dd>
              <div style="font-weight:500;color:#ffffff">${esc(o.server.os)}</div>
              <div style="margin-top:3px"><code style="font-size:11px;color:var(--muted)">${esc(o.server.kernel || 'Linux')}</code></div>
            </dd>
            <dt>IP Address</dt><dd>${esc(o.server.ip)}</dd>
            <dt>Active Users</dt><dd>${o.students} students · ${o.faculty} faculty</dd>
          </dl>
        </div>
      </div>

      <!-- Recent Activities Section -->
      <div class="card" style="margin-top:18px">
        <h2>Recent System Activities</h2>
        <p class="sub">Latest events recorded by the platform</p>
        ${o.activities && o.activities.length ? activityList(o.activities) : empty('No recent events', 'System events will appear here.')}
      </div>
    `;
  },
  after:()=>{
    const viewport = $('#rackViewport');
    if (viewport) {
      if (window._activeRack) {
        try { window._activeRack.destroy(); } catch(e){}
      }
      window._activeRack = new ServerRack3D(viewport, RACK_BLADES, (b) => {
        toast(`Opening ${b.name}`);
      });

      const btnIso = $('#btnViewIso');
      const btnFront = $('#btnViewFront');
      if (btnIso) btnIso.onclick = () => window._activeRack.setViewMode('iso');
      if (btnFront) btnFront.onclick = () => window._activeRack.setViewMode('front');
    }
  }
};

/* -------------------------------------------------------------
   MODULE 2: User Management (Clean, Readable Table & Filters)
   ------------------------------------------------------------- */
PAGES.users = {
  title: 'User Management',
  load: async () => {
    await api.get('departments');
    return api.get('users');
  },
  state: { tab: 'all', dept: 'all', status: 'all', q: '', page: 1 },
  render: function(users) {
    const s = this.state;
    return `
      <!-- User Directory Controls -->
      <div class="tabs" id="uTabs" role="tablist" aria-label="User role filter">
        ${[
          ['all', 'All Users'],
          ['student', 'Students'],
          ['faculty', 'Faculty']
        ].map(t => `<button role="tab" data-tab="${t[0]}" class="${s.tab === t[0] ? 'on' : ''}" aria-selected="${s.tab === t[0]}">${t[1]}</button>`).join('')}
      </div>
      <div class="toolbar">
        <input id="uQ" type="search" placeholder="Search by name, username or group..." aria-label="Search users" value="${esc(s.q)}">
        <select id="uDept" aria-label="Filter by department">
          <option value="all">All Departments</option>
          ${(api.cache.departments || []).map(d => `<option value="${d.id}" ${s.dept === d.id ? 'selected' : ''}>${esc(d.name || d.short)} (${esc(d.short)})</option>`).join('')}
        </select>
        <select id="uStatus" aria-label="Filter by account status">
          <option value="all" ${s.status === 'all' ? 'selected' : ''}>All Statuses</option>
          <option value="active" ${s.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="locked" ${s.status === 'locked' ? 'selected' : ''}>Locked</option>
          <option value="suspended" ${s.status === 'suspended' ? 'selected' : ''}>Suspended</option>
        </select>
        <button class="btn ghost" id="uToolbarClear" style="white-space:nowrap" title="Reset all search queries and filters">Clear Filters</button>
      </div>
      <div id="uTable"></div>
    `;
  },
  after: function(users) {
    const s = this.state, per = 15;
    const resetFilters = () => {
      s.tab = 'all';
      s.dept = 'all';
      s.status = 'all';
      s.q = '';
      s.page = 1;
      const qEl = $('#uQ'); if (qEl) qEl.value = '';
      const dEl = $('#uDept'); if (dEl) dEl.value = 'all';
      const sEl = $('#uStatus'); if (sEl) sEl.value = 'all';
      document.querySelectorAll('#uTabs button').forEach(x => {
        x.classList.toggle('on', x.dataset.tab === 'all');
        x.setAttribute('aria-selected', x.dataset.tab === 'all');
      });
      draw();
    };

    const draw = () => {
      const q = s.q.trim().toLowerCase();
      const list = users.filter(u => {
        const matchesTab = (s.tab === 'all' || u.role === s.tab);
        const matchesDept = (s.dept === 'all' || u.dept === s.dept);
        const matchesStatus = (s.status === 'all' || u.status === s.status);
        const matchesQ = !q || (
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.group && u.group.toLowerCase().includes(q))
        );
        return matchesTab && matchesDept && matchesStatus && matchesQ;
      });

      const pages = Math.max(1, Math.ceil(list.length / per));
      s.page = Math.max(1, Math.min(s.page, pages));

      const startIdx = (s.page - 1) * per;
      const endIdx = Math.min(startIdx + per, list.length);
      const pageSlice = list.slice(startIdx, endIdx);

      const tableContent = pageSlice.map(u => `<tr>
        <td><strong>${esc(u.name)}</strong></td>
        <td><code>${esc(u.username)}</code></td>
        <td><span class="badge ${u.role === 'faculty' ? 'ok' : ''}">${u.role === 'faculty' ? 'Faculty' : 'Student'}</span></td>
        <td>${deptName(u.dept)}</td>
        <td><code>${esc(u.group)}</code></td>
        <td>${pill(u.status)}</td>
        <td style="font-family:var(--mono);font-size:12px;color:var(--muted)">${esc(u.lastLogin || 'Not available')}</td>
      </tr>`);

      const displayStart = list.length > 0 ? startIdx + 1 : 0;
      const tableHtml = list.length > 0
        ? table(['Name', 'Username', 'Role', 'Department', 'Groups', 'Status', 'Last Login'], tableContent, '', 'table-compact users-table')
        : empty(
            'No matching users',
            'No user accounts match your search or filter criteria.<div style="margin-top:12px"><button class="btn ghost" id="uClear">Clear filters</button></div>'
          );

      const pagerHtml = list.length > 0 ? `
        <div class="pager">
          <span style="font-size:12.5px;color:var(--muted)" id="uPagerInfo">
            Showing ${displayStart}\u2013${endIdx} of ${list.length} users
          </span>
          <span style="display:flex;align-items:center;gap:8px">
            <button class="btn ghost" id="pv" ${s.page <= 1 ? 'disabled' : ''} aria-label="Previous page">Previous</button>
            <span style="margin:0 4px;font-family:var(--mono);font-size:12.5px;color:var(--muted-dark)">Page ${s.page} of ${pages}</span>
            <button class="btn ghost" id="nx" ${s.page >= pages ? 'disabled' : ''} aria-label="Next page">Next</button>
          </span>
        </div>` : '';

      $('#uTable').innerHTML = tableHtml + pagerHtml;

      const btnPv = $('#pv');
      const btnNx = $('#nx');
      if (btnPv) btnPv.onclick = () => { if (s.page > 1) { s.page--; draw(); } };
      if (btnNx) btnNx.onclick = () => { if (s.page < pages) { s.page++; draw(); } };

      const btnClear = $('#uClear');
      if (btnClear) btnClear.onclick = resetFilters;
    };

    const tbClear = $('#uToolbarClear');
    if (tbClear) tbClear.onclick = resetFilters;

    $('#uQ').oninput = e => { s.q = e.target.value; s.page = 1; draw(); };
    $('#uDept').onchange = e => { s.dept = e.target.value; s.page = 1; draw(); };
    $('#uStatus').onchange = e => { s.status = e.target.value; s.page = 1; draw(); };
    $('#uTabs').onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      s.tab = b.dataset.tab;
      s.page = 1;
      document.querySelectorAll('#uTabs button').forEach(x => {
        x.classList.toggle('on', x === b);
        x.setAttribute('aria-selected', x === b);
      });
      draw();
    };
    draw();
  }
};

/* -------------------------------------------------------------
   MODULE 3: Departments (Three Balanced Desktop Cards)
   ------------------------------------------------------------- */
PAGES.departments = {
  title: 'Departments',
  load: () => api.get('departments'),
  render: deps => `
    <div class="grid g3">
      ${deps.map(d => {
        const bytes = Math.round((d.usedGB || 0) * (1024 ** 3));
        const hasPersonnel = (d.students !== undefined && d.faculty !== undefined);
        const totalAccounts = hasPersonnel ? (d.students + d.faculty) : 0;
        const iconCode = d.id === 'it' ? 'IT' : (d.id === 'cse' ? 'CS' : 'AI');

        return `
          <div class="card dept-card">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:36px;height:36px;border-radius:var(--r-sm);background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.25);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;letter-spacing:0.04em">
                    ${iconCode}
                  </div>
                  <div>
                    <h2 style="font-size:15px;margin:0">${esc(d.name)}</h2>
                    <span style="font-size:11.5px;color:var(--muted);font-family:var(--mono)">${esc(d.short)}</span>
                  </div>
                </div>
                <span class="badge ok">${esc(d.short)}</span>
              </div>

              <dl class="kv" style="margin-bottom:14px">
                <dt>Directory</dt><dd><code>${esc(d.mount)}</code></dd>
                <dt>POSIX Group</dt><dd><code>${esc(d.group)}</code></dd>
                <dt>Directory Usage</dt><dd><strong>${gb(d.usedGB)}</strong> <span style="font-size:11.5px;color:var(--muted)">(${bytes.toLocaleString()} bytes)</span></dd>
                ${hasPersonnel ? `<dt>Personnel</dt><dd><strong>${totalAccounts}</strong> <span style="font-size:11.5px;color:var(--muted)">(${d.students} students, ${d.faculty} faculty)</span></dd>` : ''}
                <dt>Allocation</dt><dd><span style="color:var(--muted)">Shared root filesystem (no quota limit)</span></dd>
              </dl>
            </div>

            <div style="margin-top:auto;border-top:1px solid var(--line);padding-top:12px">
              <details>
                <summary style="cursor:pointer;font-size:12.5px;color:var(--blue);font-weight:500">View Access Permissions</summary>
                <ul class="list" style="margin-top:10px;font-size:12px">
                  ${d.access.map(a => `<li><span>${esc(a)}</span></li>`).join('')}
                </ul>
              </details>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `
};

/* -------------------------------------------------------------
   MODULE 4: Storage Management (Total, Used, Available + Clean Chart)
   ------------------------------------------------------------- */
PAGES.storage = {
  title: 'Storage Management',
  load: () => Promise.all([api.get('storage'), api.get('overview')]),
  render: ([s, o]) => {
    const totalGB = Number(o.disk.totalGB) || 0;
    const usedGB = Number(o.disk.usedGB) || 0;
    const freeGB = Math.max(0, totalGB - usedGB);

    const rows = s.lvs.map(l => {
      const bytes = typeof l.usedGB === 'number'
        ? Math.round(l.usedGB * (1024 ** 3)) : 0;

      return `<tr>
        <td><strong>${deptName(l.dept)}</strong></td>
        <td><code class="cell-code" title="${esc(l.mount)}">${esc(l.mount)}</code></td>
        <td style="white-space:nowrap;text-align:right"><strong>${gb(l.usedGB)}</strong></td>
        <td style="color:var(--muted);font-family:var(--mono);font-size:12px;white-space:nowrap;text-align:right">${bytes.toLocaleString()} bytes</td>
      </tr>`;
    });

    const deptUsedTotal = s.lvs.reduce(
      (acc, l) => acc + (Number(l.usedGB) || 0), 0
    );
    const systemUsedGB = Math.max(0, usedGB - deptUsedTotal);

    const donutSegments = s.lvs.map((l, idx) => ({
      l: deptName(l.dept),
      v: Number(l.usedGB) || 0,
      c: COLORS[idx % COLORS.length]
    }));

    if (systemUsedGB > 0) {
      donutSegments.push({
        l: 'OS & System',
        v: systemUsedGB,
        c: '#64748b'
      });
    }

    donutSegments.push({
      l: 'Available',
      v: freeGB,
      c: '#10b981'
    });

    // Actual LVM information, separate from root directory usage.
    const lvm = s.lvm || {};
    const lvmVolumes = Array.isArray(lvm.volumes) ? lvm.volumes : [];

    const lvmRows = lvmVolumes.map(v => {
      const status = v.mounted
        ? '<span class="status success">Mounted</span>'
        : '<span class="status warning">Not mounted</span>';

      return `<tr>
        <td><strong>${esc(v.dept)}</strong></td>
        <td><code>${esc(v.name)}</code></td>
        <td style="text-align:right">${Number(v.sizeMB).toLocaleString()} MB</td>
        <td><code>${esc(v.mount)}</code></td>
        <td>${status}</td>
        <td style="text-align:right">${v.mounted ? gb(v.usedGB) : '—'}</td>
        <td style="text-align:right">${v.mounted ? gb(v.freeGB) : '—'}</td>
      </tr>`;
    });

    return `
      <!-- Root filesystem summary -->
      <div class="grid g3">
        <div class="card stat">
          <div class="n">${gb(totalGB)}</div>
          <div class="l">Total Storage Capacity</div>
        </div>
        <div class="card stat">
          <div class="n">${gb(usedGB)}</div>
          <div class="l">Used Storage (${pct(usedGB, totalGB)}%)</div>
        </div>
        <div class="card stat">
          <div class="n">${gb(freeGB)}</div>
          <div class="l">Available Free Space</div>
        </div>
      </div>

      <!-- Original department directory usage and distribution -->
      <div class="storage-grid" style="margin-top:18px">
        <div class="card">
          <h2>Department Directory Usage</h2>
          <p class="sub">Actual storage consumed by each academic department directory on root</p>
          ${table(['Department', 'Directory Path', 'Used', 'Raw Bytes'], rows, '', 'table-compact storage-table')}
        </div>

        <div class="card" style="display:flex;flex-direction:column;align-items:center;text-align:center">
          <div style="width:100%;text-align:left">
            <h2>Storage Distribution</h2>
            <p class="sub">Department consumption relative to system capacity</p>
          </div>
          <div style="margin:auto;padding:12px 0">
            ${donut(donutSegments, [gb(usedGB), 'Total Used'])}
          </div>
        </div>
      </div>

      <!-- Actual LVM configuration -->
      <div class="card" style="margin-top:18px">
        <h2>LVM Storage Architecture</h2>
        <p class="sub">Actual Logical Volume Manager configuration in the WSL2 virtual-disk lab</p>

        <dl class="kv">
          <dt>Volume Group</dt>
          <dd><code>${esc(lvm.available ? s.vg : 'Unavailable')}</code></dd>

          <dt>Physical Volume</dt>
          <dd>${(lvm.physicalVolumes || []).map(p => `<code>${esc(p)}</code>`).join(', ') || 'Unavailable'}</dd>

          <dt>Volume Group Capacity</dt>
          <dd>${lvm.available ? Number(lvm.vgSizeMB).toLocaleString() + ' MB' : 'Unavailable'}</dd>

          <dt>Unallocated VG Space</dt>
          <dd>${lvm.available ? Number(lvm.vgFreeMB).toLocaleString() + ' MB' : 'Unavailable'}</dd>

          <dt>Physical Extent Size</dt>
          <dd>${lvm.available ? esc(lvm.extentMB) + ' MB' : 'Unavailable'}</dd>

          <dt>Filesystem</dt>
          <dd><code>ext4</code></dd>
        </dl>

        <h3 style="margin-top:22px">Logical Volume Details</h3>
        <p class="sub">Department volume capacity and actual mounted filesystem usage.</p>

        ${lvmRows.length
          ? table(['Department', 'Logical Volume', 'LV Size', 'Mount Point', 'Status', 'Used', 'Free'], lvmRows, '', 'table-compact')
          : '<p class="sub">LVM volume information is currently unavailable.</p>'}

        <p class="sub" style="margin-top:14px;margin-bottom:0;font-size:12px">
          This LVM configuration uses a 2 GB virtual disk image attached as /dev/loop0. It is separate from the WSL2 root filesystem and is a lab implementation, not a dedicated physical server disk.
        </p>
      </div>

      <!-- Host root filesystem information -->
      <div class="card" style="margin-top:18px">
        <h2>Host Root Filesystem</h2>
        <p class="sub">These figures describe the WSL2 Linux root filesystem, not the separate LVM virtual disk.</p>

        <dl class="kv">
          <dt>Mount</dt><dd><code>/</code></dd>
          <dt>Filesystem Capacity</dt><dd>${gb(totalGB)}</dd>
          <dt>Used</dt><dd>${gb(usedGB)}</dd>
          <dt>Available</dt><dd>${gb(freeGB)}</dd>
          <dt>Department Directories</dt><dd><code>/srv/university/</code></dd>
        </dl>
      </div>
    `;
  }
};


/* -------------------------------------------------------------
   MODULE 5: Backup and Recovery (Status, Schedules & History Below)
   ------------------------------------------------------------- */
PAGES.backup = {
  title: 'Backup and Recovery',
  load: () => api.get('backups'),
  state: { type: 'all' },
  render: function(b) {
    const full = b.history.filter(h => h.type === 'full');
    const inc = b.history.filter(h => h.type === 'incremental');
    const last = b.history[0] || { id: 'None', time: 'N/A', sizeGB: 0, duration: 'Not recorded', verified: false, type: 'N/A' };
    const verCount = b.history.filter(h => h.verified).length;
    const verPct = b.history.length > 0 ? pct(verCount, b.history.length) : 0;

    return `
      <!-- 4 Essential Backup KPIs -->
      <div class="grid g4">
        <div class="card stat">
          <div class="n">${esc(last.time !== 'N/A' ? last.time.split(' ')[0] : 'None')}</div>
          <div class="l">Last Backup (${esc(last.time !== 'N/A' ? last.time.split(' ')[1] || '' : '')})</div>
        </div>
        <div class="card stat">
          <div class="n">${verPct}%</div>
          <div class="l">Checksums Verified (${verCount}/${b.history.length})</div>
        </div>
        <div class="card stat">
          <div class="n">${full.length}</div>
          <div class="l">Full Backups</div>
        </div>
        <div class="card stat">
          <div class="n">${inc.length}</div>
          <div class="l">Incremental Backups</div>
        </div>
      </div>

      <!-- Backup Schedule Cards -->
      <div class="grid g2" style="margin-top:18px">
        <div class="card">
          <h2>Full Backup Schedule</h2>
          <p class="sub">Complete archive of all department partitions</p>
          <dl class="kv">
            <dt>Execution</dt><dd>${esc(b.schedule.full)}</dd>
            <dt>Retention</dt><dd>${esc(b.schedule.retention)}</dd>
            <dt>Target Path</dt><dd><code>${esc(b.schedule.target)}/full</code></dd>
            <dt>Method</dt><dd>tar.gz + SHA-256 integrity checksum</dd>
          </dl>
        </div>
        <div class="card">
          <h2>Incremental Backup Schedule</h2>
          <p class="sub">Differential filesystem snapshots</p>
          <dl class="kv">
            <dt>Execution</dt><dd>${esc(b.schedule.incremental)}</dd>
            <dt>Latest Archive</dt><dd><code>${esc(last.id)}</code></dd>
            <dt>Target Path</dt><dd><code>${esc(b.schedule.target)}/incremental</code></dd>
            <dt>Verification</dt><dd>${last.verified ? '<span class="badge ok">Verified OK</span>' : '<span class="badge warn">Pending Checksum</span>'}</dd>
          </dl>
        </div>
      </div>

      <!-- Backup History Section -->
      <div style="margin-top:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px">
          <div>
            <h2 class="sec-h" style="margin:0">Backup History</h2>
            <p class="sub" style="margin:0">Archives stored in <code>${esc(b.schedule.target)}</code></p>
          </div>
          <div class="toolbar" style="margin-bottom:0;width:auto">
            <select id="bType" aria-label="Filter backup type">
              <option value="all" ${this.state.type === 'all' ? 'selected' : ''}>All Backup Types</option>
              <option value="full" ${this.state.type === 'full' ? 'selected' : ''}>Full Backups Only</option>
              <option value="incremental" ${this.state.type === 'incremental' ? 'selected' : ''}>Incremental Only</option>
            </select>
          </div>
        </div>
        <div id="bTable"></div>
      </div>

      <!-- Compact Expandable Safe Recovery Workflow -->
      <div class="card" style="margin-top:18px">
        <details>
          <summary style="cursor:pointer;font-size:14px;font-weight:600;color:#ffffff">
            Disaster Recovery & Safe Restore Workflow
          </summary>
          <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">
            <p class="sub" style="margin-bottom:12px">
              Standard operating procedures for restoring academic department directories from backup archives.
            </p>
            <ol style="padding-left:20px;line-height:1.9;font-size:13px;color:var(--ink-light)">
              ${(b.recovery.steps || []).map(x => `<li>${esc(x)}</li>`).join('')}
            </ol>

            <div style="margin-top:16px;background:#060a14;border:1px solid var(--line);border-radius:var(--r-sm);padding:14px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-size:12px;font-weight:600;color:var(--cyan);text-transform:uppercase;letter-spacing:0.05em">Safe Restore Preview Command</span>
                <button class="btn ghost" style="padding:4px 10px;font-size:11.5px" onclick="copyText($('#cmdRestore').textContent, 'Restore command')">Copy Command</button>
              </div>
              <pre style="margin:0;font-family:var(--mono);font-size:12px;color:#cbd5e1;overflow-x:auto;padding:8px 0"><code id="cmdRestore">sudo tar -tzvf /var/backups/university/full/${esc(full[0] ? full[0].id : 'backup_full_latest.tar.gz')}</code></pre>
              <p style="margin:8px 0 0;font-size:11.5px;color:var(--muted)">
                <strong>Safety Notice:</strong> Automated restore is disabled in this web console to prevent accidental overwrites. Commands must be executed directly on the host server console by an authorized administrator with sudo privileges.
              </p>
            </div>
          </div>
        </details>
      </div>
    `;
  },
  after: function(b) {
    const s = this.state;
    const draw = () => {
      const typeFilter = s.type;
      const list = b.history.filter(h => typeFilter === 'all' || h.type === typeFilter);

      const rows = list.map(h => `<tr>
        <td><code class="cell-code" title="${esc(h.id)}">${esc(h.id)}</code></td>
        <td style="text-align:center"><span class="badge ${h.type === 'full' ? 'ok' : ''}">${h.type}</span></td>
        <td style="color:var(--muted);font-family:var(--mono);font-size:12px;white-space:nowrap">${esc(h.time)}</td>
        <td style="white-space:nowrap;text-align:right"><strong>${gb(h.sizeGB)}</strong></td>
        <td style="color:var(--muted);font-size:12px;white-space:nowrap;text-align:right">${esc(h.duration || 'Not recorded')}</td>
        <td style="text-align:center">${pill(h.status || 'success')}</td>
        <td style="white-space:nowrap;text-align:center">${h.verified ? '<span class="badge ok">Verified OK</span>' : '<span class="badge warn">Pending</span>'}</td>
      </tr>`);

      $('#bTable').innerHTML = table(
        ['Archive ID', 'Type', 'Timestamp', 'Size', 'Duration', 'Status', 'SHA-256 Checksum'],
        rows,
        'No backup archives found matching this filter.',
        'table-compact backup-table'
      );
    };

    const sel = $('#bType');
    if (sel) {
      sel.onchange = e => {
        s.type = e.target.value;
        draw();
      };
    }
    draw();
  }
};

/* -------------------------------------------------------------
   MODULE 6: Server Monitoring (CPU, RAM, Disk, Uptime + Clean Chart)
   ------------------------------------------------------------- */
PAGES.monitoring = {
  title:'Server Monitoring',
  load:async()=>{
    const res=await Promise.all([api.get('monitoring'),api.get('overview'),api.get('storage')]);
    if(res[1]&&res[1].cpu!==undefined) {
      recordTelemetry(res[1].cpu, pct(res[1].ram.usedGB, res[1].ram.totalGB));
    }
    return res;
  },
  render:([m,o])=>{
    const cpu=o.cpu;
    const mem=pct(o.ram.usedGB,o.ram.totalGB);
    const disk=pct(o.disk.usedGB,o.disk.totalGB);
    const run=m.services.filter(x=>x.status==='running').length;

    return `
      <!-- Prioritize CPU, RAM, Disk, Uptime -->
      <div class="grid g4">
        <div class="card stat"><div class="n">${cpu}%</div><div class="l">CPU Usage</div></div>
        <div class="card stat"><div class="n">${mem}%</div><div class="l">Memory Usage</div></div>
        <div class="card stat"><div class="n">${disk}%</div><div class="l">Disk Usage</div></div>
        <div class="card stat"><div class="n">${esc(m.uptime.split(',')[0])}</div><div class="l">Uptime</div></div>
      </div>

      <!-- Compact Performance Snapshot Chart (Target: 230–260px Height) -->
      <div class="perf-card" style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
          <div>
            <h2>Performance Snapshot</h2>
            <p class="sub" style="margin-bottom:0">Real-time CPU and Memory utilization (active session telemetry)</p>
          </div>
          <span class="badge ok">Live Session Telemetry</span>
        </div>
        ${perfChart(cpu, mem)}
      </div>

      <!-- System Services & Resource Breakdown -->
      <div class="grid g2" style="margin-top:16px">
        <div class="card">
          <h2>System Services</h2>
          <p class="sub">${run} of ${m.services.length} critical services running</p>
          ${m.services.map(x=>`<div class="svc"><div><strong>${esc(x.name)}</strong><small>${esc(x.desc)}${x.port!=='-'?' · port '+x.port:''}</small></div>${pill(x.status)}</div>`).join('')}
        </div>
        <div class="card">
          <h2>Load & Utilization</h2>
          <p class="sub">${m.cores} CPU Cores · Load Average ${m.load.join(' / ')}</p>
          ${meter('CPU usage', cpu)}
          ${meter('Memory usage', mem, `${o.ram.usedGB} GB of ${o.ram.totalGB} GB`)}
          ${meter('Disk usage', disk, `${gb(o.disk.usedGB)} of ${gb(o.disk.totalGB)}`)}
        </div>
      </div>`;
  }
};

/* -------------------------------------------------------------
   MODULE 7: Security & Administration (Simple, Organized Layout)
   ------------------------------------------------------------- */
PAGES.security = {
  title: 'Security and Administration',
  load: () => api.get('security'),
  render: s => {
    // Parse firewall rules safely whether they are objects or strings
    let fwRows = [];
    if (s.firewall.rules && s.firewall.rules.length > 0) {
      if (typeof s.firewall.rules[0] === 'object') {
        fwRows = s.firewall.rules.map(r => `<tr>
          <td><code>${esc(r.port)}</code></td>
          <td><span class="badge ${r.action === 'ALLOW' ? 'ok' : 'bad'}">${esc(r.action)}</span></td>
          <td>${esc(r.from)}</td>
          <td>${esc(r.note || r.purpose || 'Standard traffic')}</td>
        </tr>`);
      } else {
        fwRows = s.firewall.rules.map(ruleStr => {
          const parts = String(ruleStr).trim().split(/\s+/);
          const action = parts[1] ? parts[1].toUpperCase() : 'RULE';
          const port = parts.slice(2).join(' ') || '-';
          return `<tr>
            <td><code>${esc(port)}</code></td>
            <td><span class="badge ${action === 'ALLOW' ? 'ok' : 'warn'}">${esc(action)}</span></td>
            <td>Anywhere / Configured</td>
            <td><code>${esc(ruleStr)}</code></td>
          </tr>`;
        });
      }
    }

    return `
      <!-- Perimeter Service Status -->
      <div class="grid g3">
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <h2 style="font-size:15px;margin:0">OpenSSH Daemon</h2>
            ${pill(s.ssh.status)}
          </div>
          <div style="margin-top:10px;font-size:12.5px;color:var(--muted)">
            Port <code>${esc(s.ssh.port)}</code> · ${esc(s.ssh.version || 'OpenSSH')}
          </div>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <h2 style="font-size:15px;margin:0">Apache Web Server</h2>
            ${pill(s.apache.status)}
          </div>
          <div style="margin-top:10px;font-size:12.5px;color:var(--muted)">
            ${esc(s.apache.version || 'Apache 2.4')} · Host: <code>${esc(s.apache.vhosts || 'localhost')}</code>
          </div>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <h2 style="font-size:15px;margin:0">UFW Firewall</h2>
            ${pill(s.firewall.status)}
          </div>
          <div style="margin-top:10px;font-size:12.5px;color:var(--muted)">
            ${esc(s.firewall.policy || 'Policy configured')}
          </div>
        </div>
      </div>

      <!-- Essential Service Configurations -->
      <div class="grid g2" style="margin-top:18px">
        <div class="card">
          <h2>OpenSSH Configuration</h2>
          <p class="sub">Effective runtime configuration queried via <code>sshd -T</code></p>
          <dl class="kv">
            <dt>Permit Root Login</dt><dd>${esc(s.ssh.rootLogin)}</dd>
            <dt>Password Auth</dt><dd>${esc(s.ssh.passwordAuth)}</dd>
            <dt>Port Binding</dt><dd><code>${esc(s.ssh.port)}/tcp</code></dd>
            <dt>Service State</dt><dd>${pill(s.ssh.status)}</dd>
          </dl>
          <details style="margin-top:14px;border-top:1px solid var(--line);padding-top:10px">
            <summary style="cursor:pointer;font-size:12px;color:var(--blue)">SSH Hardening Guidelines</summary>
            <p class="sub" style="margin-top:8px;margin-bottom:0;font-size:11.5px;line-height:1.6">
              For production environments, ensure <code>PermitRootLogin no</code> and <code>PasswordAuthentication no</code> with public key authentication enforced via <code>~/.ssh/authorized_keys</code>.
            </p>
          </details>
        </div>

        <div class="card">
          <h2>Apache Reverse Proxy</h2>
          <p class="sub">Gateway configuration and REST API forwarding</p>
          <dl class="kv">
            <dt>Virtual Host</dt><dd><code>${esc(s.apache.vhosts || 'localhost')}</code></dd>
            <dt>SSL / TLS</dt><dd>${esc(s.apache.ssl || 'Not configured')}</dd>
            <dt>API Reverse Proxy</dt><dd><code>ProxyPass /api/v1/ -> :8000</code></dd>
            <dt>Proxy Headers</dt><dd>X-Forwarded-For, X-Real-IP</dd>
          </dl>
          <details style="margin-top:14px;border-top:1px solid var(--line);padding-top:10px">
            <summary style="cursor:pointer;font-size:12px;color:var(--blue)">Proxy Security Directives</summary>
            <p class="sub" style="margin-top:8px;margin-bottom:0;font-size:11.5px;line-height:1.6">
              Port 8000 is bound internally to localhost (127.0.0.1) and exposed exclusively through Apache reverse proxy with CORS headers restricted to authorized origins.
            </p>
          </details>
        </div>
      </div>

      <!-- Firewall Rules Table -->
      <div style="margin-top:22px">
        <h2 class="sec-h">Firewall Rules (UFW)</h2>
        ${table(
          ['Port / Protocol', 'Action', 'Source', 'Rule Definition'],
          fwRows,
          'No custom UFW firewall rules added. System relying on default perimeter policies.'
        )}
      </div>

      <!-- Directory Permissions Table -->
      <div style="margin-top:22px">
        <h2 class="sec-h">Directory Permissions & POSIX Ownership</h2>
        ${table(
          ['Path', 'Owner', 'Group', 'Mode', 'Security Policy'],
          s.permissions.map(p => `<tr>
            <td><code>${esc(p.path)}</code></td>
            <td>${esc(p.owner)}</td>
            <td><code>${esc(p.group)}</code></td>
            <td><code style="color:var(--blue)">${esc(p.mode)}</code></td>
            <td>${esc(p.meaning)}</td>
          </tr>`),
          'No directory permissions recorded.'
        )}
      </div>

      <!-- Security Events Audit Log -->
      <div class="card" style="margin-top:22px">
        <h2>Security Events & Audit Log</h2>
        <p class="sub">Authentication, sudo privilege elevation and perimeter events</p>
        ${s.events && s.events.length > 0
          ? activityList(s.events)
          : empty('No Security Incidents', 'No security violations or authentication failure events recorded in current log window.')}
      </div>
    `;
  }
};

/* ============ 8. ROUTER & CONTROLLER ============ */
let seq=0;

function buildNav() {
  $('#nav').innerHTML=NAV.map(n=>n.sep?`<div class="nav-sep">${n.sep}</div>`:`<a href="#${n.id}" data-id="${n.id}">${ICONS[n.i]}<span>${n.t}</span></a>`).join('');
}

function closeMenu() {
  $('#sidebar').classList.remove('open');
  $('#scrim').classList.remove('open');
}

async function route(force) {
  if (window._activeRack) {
    try { window._activeRack.destroy(); } catch(e){}
    window._activeRack = null;
  }

  const id=(location.hash.slice(1) in PAGES)?location.hash.slice(1):'dashboard';
  const page=PAGES[id], my=++seq, view=$('#view');
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('active',a.dataset.id===id));
  $('#pageTitle').textContent=page.title;
  document.title=page.title+' – University Computer Centre';
  closeMenu();
  view.innerHTML=skeletons(4);
  try {
    if(force)Object.keys(api.cache).forEach(k=>delete api.cache[k]);
    const data=await page.load();
    if(my!==seq)return;
    view.innerHTML=page.render.call(page,data);
    page.after&&page.after.call(page,data);
    requestAnimationFrame(()=>view.querySelectorAll('.bar i[data-w]').forEach(b=>b.style.width=b.dataset.w+'%'));
    window.scrollTo(0,0);
  } catch(err) {
    if(my!==seq)return;
    view.innerHTML=`<div class="card">${empty('Could not load data',esc(err.message)+'. Ensure the Python backend is running on port 8000, then try again.')}<p style="text-align:center"><button class="btn" id="retry">Try again</button></p></div>`;
    $('#retry')&&($('#retry').onclick=()=>route(true));
  }
}

function init() {
  buildNav();
  $('#modeDot').classList.toggle('live',!CONFIG.USE_DEMO);
  $('#modeLabel').textContent=CONFIG.USE_DEMO?'Demonstration data':'Live data from API';
  if(!CONFIG.USE_DEMO) {
    const demoBadge = document.querySelector('.badge.demo');
    if (demoBadge && demoBadge.style) demoBadge.style.display='none';
  }

  // Mobile navigation
  $('#menuBtn').onclick=()=>{
    $('#sidebar').classList.add('open');
    $('#scrim').classList.add('open');
  };
  $('#scrim').onclick=closeMenu;
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});

  // Refresh dashboard data
  $('#refreshBtn').onclick=async()=>{
    await route(true);
    toast('Data refreshed');
  };

  // Administrator profile dropdown
  const profileBtn=$('#profileBtn');
  const profileMenu=$('#profileMenu');

  if(profileBtn&&profileMenu) {
    profileBtn.addEventListener('click',event=>{
      event.stopPropagation();
      profileMenu.hidden=!profileMenu.hidden;
      profileBtn.setAttribute('aria-expanded',String(!profileMenu.hidden));
    });

    document.addEventListener('click',event=>{
      if(!event.target.closest('.profile-wrap')) {
        profileMenu.hidden=true;
        profileBtn.setAttribute('aria-expanded','false');
      }
    });

    document.addEventListener('keydown',event=>{
      if(event.key==='Escape') {
        profileMenu.hidden=true;
        profileBtn.setAttribute('aria-expanded','false');
        profileBtn.focus();
      }
    });
  }

  // Page navigation
  addEventListener('hashchange',()=>route());
  if(!location.hash)location.hash='#home';
  else route();

  // Automatic refresh for live monitoring pages
  if(!CONFIG.USE_DEMO) {
    setInterval(()=>{
      if(location.hash==='#monitoring'||location.hash==='#dashboard')route(true);
    },CONFIG.REFRESH_MS);
  }
}

init();
