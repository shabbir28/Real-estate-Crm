import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  CurrencyDollarIcon, UserGroupIcon, CheckCircleIcon,
  ArrowTrendingUpIcon, BoltIcon, ClockIcon, UserPlusIcon,
  CalendarIcon, PhoneIcon, TrophyIcon, StarIcon,
  ChevronRightIcon, PlusIcon, BuildingOfficeIcon,
  ArrowUpIcon, ArrowDownIcon, FireIcon, SparklesIcon,
  MapPinIcon, ChartBarIcon, ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line,
  ComposedChart,
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useFollowUp } from '../context/FollowUpContext';
import {
  sparklineRevenue, sparklineLeads, sparklineDeals, sparklineValue,
  revenueChartData, funnelData, recentLeads as initialLeads, topAgent, todayOps,
} from '../data/dashboardData';
import AddLeadModal      from '../components/modals/AddLeadModal';
import AddPropertyModal  from '../components/modals/AddPropertyModal';
import CreateDealModal   from '../components/modals/CreateDealModal';
import ScheduleVisitModal from '../components/visits/ScheduleVisitModal';
import AddTaskModal from '../components/tasks/AddTaskModal';
import TaskList from '../components/tasks/TaskList';
import VisitList from '../components/visits/VisitList';
import LeadPipeline from '../components/pipeline/LeadPipeline';

/* ══  COLOR SYSTEM  ══════════════════════════════════════════ */
const C = {
  bg:      '#05060a',
  s1:      '#0a0d14',
  s2:      '#0e1220',
  s3:      '#131928',
  border:  'rgba(255,255,255,0.06)',
  border2: 'rgba(255,255,255,0.03)',
  purple:  '#8b5cf6',
  indigo:  '#6366f1',
  gold:    '#f59e0b',
  cyan:    '#22d3ee',
  pink:    '#ec4899',
  green:   '#34d399',
  red:     '#f87171',
  text:    '#f0f4ff',
  sub:     '#6b7280',
  dim:     '#374151',
};

const MONTH_DATA = [
  { m: 'Sep', rev: 12.4, deals: 3, leads: 18 },
  { m: 'Oct', rev: 18.9, deals: 5, leads: 24 },
  { m: 'Nov', rev: 14.2, deals: 4, leads: 19 },
  { m: 'Dec', rev: 21.5, deals: 6, leads: 31 },
  { m: 'Jan', rev: 19.8, deals: 5, leads: 27 },
  { m: 'Feb', rev: 26.3, deals: 7, leads: 38 },
];

const PIPELINE = [
  { stage: 'New',         val: 120, pct: 100, color: C.cyan },
  { stage: 'Contacted',   val: 88,  pct: 73,  color: C.indigo },
  { stage: 'Site Visit',  val: 54,  pct: 45,  color: C.purple },
  { stage: 'Negotiation', val: 31,  pct: 26,  color: C.gold },
  { stage: 'Closed',      val: 18,  pct: 15,  color: C.green },
];

const AGENTS = [
  { name: 'Sarah Ali',   leads: 14, deals: 7,  rev: '28.4M', rating: 98, color: C.purple },
  { name: 'Omar Khan',   leads: 11, deals: 5,  rev: '18.2M', rating: 84, color: C.cyan },
  { name: 'Aisha Rao',   leads: 8,  deals: 4,  rev: '12.6M', rating: 76, color: C.gold },
  { name: 'Bilal Shah',  leads: 6,  deals: 3,  rev: '9.1M',  rating: 64, color: C.green },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ══  TINY HELPERS  ══════════════════════════════════════════ */
const Av = ({ name, size = 32, color = C.purple }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.3, flexShrink: 0,
    background: `${color}20`, border: `1px solid ${color}40`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.32, fontWeight: 800, color,
  }}>
    {name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
  </div>
);

const Pill = ({ children, color }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 9px', borderRadius: 99,
    fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
    background: `${color}18`, color, border: `1px solid ${color}30`,
  }}>{children}</span>
);

const STATUS_MAP = {
  new:         C.cyan,
  contacted:   C.indigo,
  visit:       C.purple,
  negotiation: C.gold,
  closed:      C.green,
  lost:        C.red,
};

const StatusBadge = ({ status }) => {
  const c = STATUS_MAP[status] || C.sub;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px',
      borderRadius: 99, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      background: `${c}15`, color: c, border: `1px solid ${c}30`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
      {status}
    </span>
  );
};

/* ══  GLASS CARD  ════════════════════════════════════════════ */
const Glass = ({ children, style = {}, glow, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: glow ? `0 0 0 1px ${glow}20, 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)` : '0 4px 24px rgba(0,0,0,0.4)',
      ...style,
    }}
  >
    {glow && (
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at top right, ${glow}10 0%, transparent 60%)`,
      }} />
    )}
    {children}
  </div>
);

/* ══  CHART TOOLTIP  ═════════════════════════════════════════ */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(5,6,10,0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, padding: '10px 14px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: i > 0 ? 3 : 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
          <span style={{ fontSize: 11, color: C.sub }}>{p.name}:</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ══  HERO KPI (large accent card)  ════════════════════════ */
const HeroKpi = ({ label, value, sub, prefix = '', icon: Icon, color, chartData, trend }) => {
  const isUp = trend && !trend.startsWith('-');
  return (
    <Glass glow={color} style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
      {/* top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${color}20`, border: `1px solid ${color}35` }}>
          <Icon style={{ width: 18, height: 18, color }} />
        </div>
        {trend && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700,
            color: isUp ? C.green : C.red,
            background: isUp ? `${C.green}12` : `${C.red}12`,
            border: `1px solid ${isUp ? C.green : C.red}25`,
            padding: '3px 8px', borderRadius: 99 }}>
            {isUp ? <ArrowUpIcon style={{ width: 10, height: 10 }} /> : <ArrowDownIcon style={{ width: 10, height: 10 }} />}
            {trend}
          </span>
        )}
      </div>

      {/* value */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {sub && <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>{sub}</div>}
      </div>

      {/* mini sparkline */}
      {chartData?.length > 0 && (
        <div style={{ height: 44, marginLeft: -6, marginRight: -6, marginTop: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.map(v => ({ v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`hg-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip content={() => null} />
              <Area type="monotoneX" dataKey="v" stroke={color} strokeWidth={2}
                fill={`url(#hg-${label})`} dot={false} activeDot={false}
                isAnimationActive animationDuration={1600} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Glass>
  );
};

/* ══  REVENUE TIMELINE CHART  ═══════════════════════════════ */
const RevenueTimeline = ({ data }) => (
  <Glass style={{ padding: '22px 24px 20px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Revenue Timeline</div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>Monthly revenue & deal volume — last 6 months</div>
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        {[{ c: C.purple, l: 'Revenue' }, { c: C.gold, l: 'Deals' }, { c: C.cyan, l: 'Leads' }].map((x, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 24, height: 2, borderRadius: 99, background: x.c }} />
            <span style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
    <div style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="rev-v3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.purple} stopOpacity={0.35} />
              <stop offset="100%" stopColor={C.purple} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="lead-v3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.cyan} stopOpacity={0.18} />
              <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.035)" />
          <XAxis dataKey="m" axisLine={false} tickLine={false}
            tick={{ fill: C.sub, fontSize: 11, fontFamily: 'inherit', fontWeight: 600 }} dy={8} />
          <YAxis yAxisId="rev" axisLine={false} tickLine={false}
            tick={{ fill: C.dim, fontSize: 10, fontFamily: 'inherit' }}
            tickFormatter={v => `${v}M`} width={36} />
          <YAxis yAxisId="cnt" orientation="right" axisLine={false} tickLine={false}
            tick={{ fill: C.dim, fontSize: 10, fontFamily: 'inherit' }} domain={[0, 50]} width={28} />
          <Tooltip content={<Tip />} cursor={{ stroke: 'rgba(255,255,255,0.04)', strokeWidth: 20 }} />

          {/* Lead area (behind) */}
          <Area yAxisId="cnt" type="monotone" dataKey="leads" name="Leads"
            stroke={C.cyan} strokeWidth={1.5} fill="url(#lead-v3)" dot={false}
            activeDot={{ r: 4, fill: C.cyan, stroke: C.bg, strokeWidth: 2 }} />

          {/* Revenue area (front) */}
          <Area yAxisId="rev" type="monotone" dataKey="rev" name="Revenue (M)"
            stroke={C.purple} strokeWidth={2.5} fill="url(#rev-v3)" dot={false}
            activeDot={{ r: 5, fill: C.purple, stroke: C.bg, strokeWidth: 2 }} />

          {/* Deals bars */}
          <Bar yAxisId="cnt" dataKey="deals" name="Deals"
            fill={`${C.gold}60`} stroke={C.gold} strokeWidth={1}
            radius={[5, 5, 0, 0]} maxBarSize={16} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </Glass>
);

/* ══  PIPELINE FUNNEL (trapezoid style via custom bars)  ═══ */
const PipelineFunnel = ({ data }) => {
  const max = data[0]?.val || 1;
  return (
    <Glass style={{ padding: '22px 24px 20px' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Sales Pipeline</div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>Lead conversion through each stage</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((d, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, flexShrink: 0,
                  boxShadow: `0 0 6px ${d.color}` }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#a0aec0' }}>{d.stage}</span>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: C.sub }}>{d.pct}%</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: d.color }}>{d.val}</span>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${d.pct}%`,
                background: `linear-gradient(90deg, ${d.color}dd 0%, ${d.color}66 100%)`,
                boxShadow: `0 0 10px ${d.color}50`,
                transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: 11, color: C.sub }}>Overall conversion rate</span>
        <span style={{ fontSize: 18, fontWeight: 900, color: C.green }}>
          {Math.round((data[data.length-1]?.val / data[0]?.val) * 100)}%
        </span>
      </div>
    </Glass>
  );
};

/* ══  TODAY'S PULSE (vertical metric stack)  ════════════════ */
const TodayPulse = ({ data, followUps }) => {
  const items = [
    { label: 'Site Visits',    value: data.siteVisits,        color: C.cyan,   Icon: BuildingOfficeIcon },
    { label: 'Follow-ups',     value: followUps.length,        color: C.gold,   Icon: PhoneIcon },
    { label: 'New Leads',      value: data.newLeadsToday,      color: C.purple, Icon: UserPlusIcon },
    { label: 'Closing Soon',   value: data.closingSoon,        color: C.pink,   Icon: FireIcon },
  ];
  return (
    <Glass style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Today's Pulse</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>Live operational metrics</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green,
            boxShadow: `0 0 8px ${C.green}`, animation: 'livePulse 2s ease infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.green }}>Live</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map((r, i) => (
          <div key={i} style={{
            padding: '14px 16px', borderRadius: 14,
            background: `${r.color}0e`,
            border: `1px solid ${r.color}25`,
            display: 'flex', flexDirection: 'column', gap: 10,
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${r.color}55`}
            onMouseLeave={e => e.currentTarget.style.borderColor = `${r.color}25`}
          >
            <r.Icon style={{ width: 18, height: 18, color: r.color }} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{r.value}</div>
              <div style={{ fontSize: 10, color: C.sub, marginTop: 4, fontWeight: 600 }}>{r.label}</div>
            </div>
          </div>
        ))}
      </div>
    </Glass>
  );
};

/* ══  LEADERBOARD  ═══════════════════════════════════════════ */
const Leaderboard = ({ agents, liveData }) => {
  const list = liveData?.length
    ? liveData.map((a, i) => ({ name: a.agentName, leads: a.count, deals: a.deals || '—', rev: a.revenue || '—',
        rating: Math.round((a.count / (liveData[0]?.count || 1)) * 100),
        color: [C.purple, C.cyan, C.gold, C.green, C.pink][i % 5] }))
    : agents;

  return (
    <Glass style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Agent Leaderboard</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>Performance ranking this month</div>
        </div>
        <Pill color={C.gold}><TrophyIcon style={{ width: 9, height: 9 }} /> This Month</Pill>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 14,
            background: i === 0 ? `${a.color}0c` : 'rgba(255,255,255,0.02)',
            border: `1px solid ${i === 0 ? a.color + '30' : 'rgba(255,255,255,0.04)'}`,
            transition: 'border-color 0.2s, background 0.2s',
          }}>
            {/* rank */}
            <div style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i === 0 ? `${a.color}30` : 'rgba(255,255,255,0.04)',
              fontSize: 12, fontWeight: 900,
              color: i === 0 ? a.color : C.sub, flexShrink: 0 }}>
              {i === 0 ? '🏆' : i + 1}
            </div>
            <Av name={a.name} size={32} color={a.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
              {/* progress bar */}
              <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', marginTop: 6 }}>
                <div style={{ width: `${a.rating}%`, height: '100%', borderRadius: 99,
                  background: `linear-gradient(90deg,${a.color},${a.color}88)`,
                  boxShadow: `0 0 6px ${a.color}50` }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: a.color }}>{a.leads}</div>
              <div style={{ fontSize: 9, color: C.sub, marginTop: 2 }}>leads</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 52 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{a.deals}</div>
              <div style={{ fontSize: 9, color: C.sub, marginTop: 2 }}>deals</div>
            </div>
          </div>
        ))}
      </div>
    </Glass>
  );
};

/* ══  RECENT LEADS FEED  ════════════════════════════════════ */
const LeadsFeed = ({ leads, onRespondAssignment, isAgent }) => (
  <Glass style={{ padding: '22px 24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Recent Leads</div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>Latest incoming records</div>
      </div>
      <a href="/leads" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
        color: C.purple, textDecoration: 'none', padding: '5px 12px', borderRadius: 99,
        background: `${C.purple}12`, border: `1px solid ${C.purple}30` }}>
        View All <ChevronRightIcon style={{ width: 12, height: 12 }} />
      </a>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {leads.slice(0, 6).map((l, i) => (
        <div key={l._id || l.id || i} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
          borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
          transition: 'background 0.15s, border-color 0.15s', cursor: 'pointer',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; e.currentTarget.style.borderColor = `${C.purple}20`; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}
        >
          <Av name={l.name} size={34} color={[C.purple, C.cyan, C.gold, C.green, C.pink, C.indigo][i % 6]} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
            <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>
              {l.preferredLocation || l.location || '—'} · {l.agent || l.assignedAgent?.name || 'Unassigned'}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {isAgent && l.assignmentStatus === 'pending' ? (
              <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onRespondAssignment(l._id || l.id, 'accepted')}
                  style={{ background: 'rgba(16,185,129,0.15)', color: C.green, border: `1px solid ${C.green}30`, 
                           padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                >
                  Accept
                </button>
                <button
                  onClick={() => onRespondAssignment(l._id || l.id, 'rejected')}
                  style={{ background: 'rgba(248,113,113,0.15)', color: C.red, border: `1px solid ${C.red}30`, 
                           padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                >
                  Reject
                </button>
              </div>
            ) : (
              <>
                <StatusBadge status={l.status} />
                {l.assignmentStatus === 'pending' && !isAgent && (
                  <span style={{ fontSize: 9, color: C.gold, fontWeight: 700, background: `${C.gold}15`, padding: '2px 6px', borderRadius: 4 }}>
                    Pending
                  </span>
                )}
                <span style={{ fontSize: 10, color: C.sub, fontWeight: 600 }}>{l.budget || '—'}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  </Glass>
);

/* ══  FOLLOW-UPS  ════════════════════════════════════════════ */
const FollowUps = ({ followUps, onComplete }) => (
  <Glass style={{ padding: '22px 24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Follow-ups</div>
        <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>Scheduled for today</div>
      </div>
      <Pill color={C.gold}>{followUps.length} pending</Pill>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
      {followUps.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
          <CheckCircleIcon style={{ width: 28, height: 28, color: C.green, opacity: 0.5 }} />
          <span style={{ fontSize: 12, color: C.sub }}>All caught up! 🎉</span>
        </div>
      ) : followUps.map(fu => {
        const now = new Date();
        const fuDate = new Date(fu.followUpDate);
        const isDue = fu.status === 'due' || fuDate <= now;
        const diffMins = Math.floor((fuDate - now) / 60000);
        const timeText = isDue ? 'Due Now' : diffMins < 60 ? `In ${diffMins}m` : `In ${Math.floor(diffMins / 60)}h`;
        const timeColor = isDue ? C.red : diffMins < 60 ? C.gold : C.green;
        return (
          <div key={fu.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12,
            background: `${timeColor}08`, border: `1px solid ${timeColor}20`,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{fu.leadName}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: timeColor, marginTop: 2 }}>{timeText}</div>
            </div>
            <button onClick={() => onComplete(fu.id)} style={{
              width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${C.green}15`, border: `1px solid ${C.green}30`, color: C.green, cursor: 'pointer',
            }}>
              <CheckCircleIcon style={{ width: 14, height: 14 }} />
            </button>
          </div>
        );
      })}
    </div>
  </Glass>
);

/* ══  QUICK ACTIONS  ═════════════════════════════════════════ */
const QuickActions = ({ onAddLead, onAddProperty, onCreateDeal, onSchedule, onAssignTask, isAdmin }) => {
  const actions = [
    { label: 'Add Lead',     color: C.purple, onClick: onAddLead },
    { label: 'Add Property', color: C.cyan,   onClick: onAddProperty },
    { label: 'Create Deal',  color: C.indigo, onClick: onCreateDeal },
    { label: 'Schedule',     color: C.gold,   onClick: onSchedule },
  ];

  if (isAdmin) {
    actions.push({ label: 'Assign Task', color: C.pink, onClick: onAssignTask, icon: ClipboardDocumentListIcon });
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {actions.map((a, i) => {
        const Icon = a.icon || PlusIcon;
        return (
          <button key={i} onClick={a.onClick} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 12, border: `1px solid ${a.color}35`,
            background: `${a.color}12`, color: a.color, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = `${a.color}22`; e.currentTarget.style.borderColor = `${a.color}55`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${a.color}12`; e.currentTarget.style.borderColor = `${a.color}35`; e.currentTarget.style.transform = ''; }}
          >
            <Icon style={{ width: 13, height: 13 }} />{a.label}
          </button>
        )
      })}
    </div>
  );
};

/* ══════════════════════════════════════════════════
   AGENT PREMIUM DASHBOARD
══════════════════════════════════════════════════ */
const AgentDashboard = ({ user, stats, leads, tasks, visits, completeTask, updateVisitStatus, handleRespondAssignment, handleRespondTask, loading, kpis, onAddTask, onScheduleVisit }) => {
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: '#0a0a0c' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid rgba(20,184,166,0.3)`, borderTopColor: '#14b8a6', animation: 'spin 0.8s ease-in-out infinite' }} />
    </div>
  );

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60, minHeight: '100vh',
      background: '#0a0a0c', // Deep obsidian base
      backgroundImage: `
        radial-gradient(circle at 15% 0%, rgba(20,184,166,0.05) 0%, transparent 40%),
        radial-gradient(circle at 85% 20%, rgba(139,92,246,0.06) 0%, transparent 35%),
        linear-gradient(180deg, rgba(20,184,166,0.01) 0%, transparent 100%)
      `,
      fontFamily: 'Inter, sans-serif'
    }}>
      <style>{`
        .agt-bento {
          background: rgba(18, 18, 22, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 24px;
          box-shadow: 0 8px 32px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.02);
          overflow: hidden;
        }
        .agt-glass-btn {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: #fff;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .agt-glass-btn:hover {
          background: rgba(255,255,255,0.08);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .agt-task-item {
          transition: all 0.2s;
        }
        .agt-task-item:hover {
          background: rgba(255,255,255,0.03) !important;
          transform: translateX(4px);
        }
        .agt-hide-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .agt-hide-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .agt-hide-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
      `}</style>

      {/* HEADER: Premium Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#14b8a6', boxShadow: `0 0 12px #14b8a6` }}></div>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#14b8a6' }}>
              Agent Terminal
            </span>
          </div>
          <h1 style={{ 
            margin: 0, fontSize: 38, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1,
            color: '#fff'
          }}>
            Ready to close,{' '}
            <span style={{ 
              background: `linear-gradient(135deg, #14b8a6 0%, #38bdf8 100%)`, 
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              {user?.name?.split(' ')[0]}?
            </span>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} — Your daily command center.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="agt-glass-btn" onClick={onScheduleVisit} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPinIcon style={{ width: 14, height: 14, color: '#38bdf8' }} /> Schedule Visit
          </button>
          <button className="agt-glass-btn" onClick={onAddTask} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#14b8a6', color: '#000', border: 'none' }}>
            <ClipboardDocumentListIcon style={{ width: 14, height: 14 }} /> New Task
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {kpis.map((k, i) => (
          <div key={i} className="agt-bento" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${k.color}15 0%, rgba(255,255,255,0.02) 100%)`, 
              color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${k.color}20`
            }}>
              <k.icon style={{ width: 24, height: 24 }} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6, fontWeight: 600 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN BENTO GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: ACTIVE LEADS */}
        <div className="agt-bento" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 480 }}>
          <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Active Leads & Opportunities</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>Organized by absolute urgency</p>
            </div>
            <div style={{ background: 'rgba(20,184,166,0.1)', color: '#14b8a6', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>
              {leads.length} Pending
            </div>
          </div>
          
          <div className="agt-hide-scroll" style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {leads.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', padding: 40 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.02)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <InboxIcon style={{ width: 28, height: 28, color: 'rgba(255,255,255,0.2)' }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Inbox Zero</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>You have no assigned leads right now.</div>
              </div>
            ) : leads.map(l => (
              <div key={l._id || l.id} className="agt-task-item" style={{ 
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 16,
                background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)'
              }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 14, 
                  background: `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 100%)`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' 
                }}>
                  {l.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PhoneIcon style={{ width: 10, height: 10 }} /> {l.phone}
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                    <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{l.preferredPropertyType || 'Any'}</span>
                  </div>
                </div>
                <div>
                  <StatusBadge status={l.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: TASKS & VISITS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
          
          {/* TODAY'S TASKS */}
          <div className="agt-bento" style={{ padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 230 }}>
            <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                 <ClipboardDocumentListIcon style={{ width: 16, height: 16, color: '#8b5cf6' }} /> My Tasks
               </h3>
               {tasks.filter(t => t.status !== 'completed').length > 0 && (
                 <span style={{ fontSize: 11, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>Due Today</span>
               )}
            </div>
            <div className="agt-hide-scroll" style={{ padding: '0 20px 20px', flex: 1, overflowY: 'auto' }}>
               <TaskList tasks={tasks.filter(t => t.status !== 'completed')} onComplete={completeTask} onRespondTask={handleRespondTask} />
            </div>
          </div>

          {/* UPCOMING VISITS */}
          <div className="agt-bento" style={{ padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 230 }}>
            <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                 <MapPinIcon style={{ width: 16, height: 16, color: '#38bdf8' }} /> Upcoming Tours
               </h3>
            </div>
            <div className="agt-hide-scroll" style={{ padding: '0 20px 20px', flex: 1, overflowY: 'auto' }}>
               <VisitList visits={visits.filter(v => ['scheduled','today'].includes(v.status))} onStatusChange={updateVisitStatus} />
            </div>
          </div>

        </div>
      </div>

      {/* PIPELINE FOOTER */}
      {stats?.leadPipeline && (
        <div className="agt-bento" style={{ padding: '24px', flexShrink: 0 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 24px 0' }}>Conversion Pipeline</h2>
          <LeadPipeline data={stats.leadPipeline} />
        </div>
      )}
    </div>
  );
};


const AdminTasksWidget = ({ tasks }) => (
  <div style={{
    background: C.s1, borderRadius: 20, border: `1px solid ${C.border}`, padding: 24,
    display: 'flex', flexDirection: 'column', height: '100%'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.text }}>All System Tasks</h2>
        <p style={{ fontSize: 12, color: C.sub, margin: '4px 0 0' }}>Overview of agent assignments</p>
      </div>
      <div style={{ padding: '6px 12px', background: `${C.purple}15`, color: C.purple, borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
        {tasks.length} Total
      </div>
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: 400, paddingRight: 4 }}>
      {tasks.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: C.sub, fontSize: 13 }}>No tasks recorded yet.</div>
      ) : tasks.map(t => (
        <div key={t._id} style={{
          padding: 14, borderRadius: 12, background: C.s2, border: `1px solid ${C.border2}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{t.title}</div>
            <div style={{ fontSize: 11, color: C.sub }}>
              Assigned to: <span style={{ color: C.cyan, fontWeight: 600 }}>{t.agentId?.name || 'Self'}</span>
            </div>
          </div>
          <StatusBadge status={t.assignmentStatus === 'self' ? 'pending' : (t.assignmentStatus || 'pending')} />
        </div>
      ))}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user } = useAuth();
  const { getTodayFollowUps, completeFollowUp } = useFollowUp();
  const todayFollowUps = getTodayFollowUps();

  const isAdmin = user?.role === 'admin';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [leads, setLeads] = useState(initialLeads);
  const [activeDeals, setActiveDeals] = useState(8);
  const [siteVisits,  setSiteVisits]  = useState(todayOps.siteVisits);
  const [schedulerLeads, setSchedulerLeads] = useState([]);
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [visits, setVisits] = useState([]);
  const [agents, setAgents] = useState([]);

  const [showAddLead,     setShowAddLead]     = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showCreateDeal,  setShowCreateDeal]  = useState(false);
  const [showSchedule,    setShowSchedule]    = useState(false);
  const [showAddTask,     setShowAddTask]     = useState(false);

  useEffect(() => {
    if (!user) return;
    axios.get('/api/leads').then(res => {
      if (res.data.success) setSchedulerLeads(res.data.data.map(l => ({ ...l, id: l._id })));
    }).catch(() => {});
  }, [user]);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, activitiesRes, tasksRes, visitsRes, agentsRes] = await Promise.all([
        axios.get('/api/dashboard/stats').catch(() => ({ data: { success: false } })),
        axios.get('/api/activities/today/list').catch(() => ({ data: { success: true, data: [] } })),
        isAdmin ? axios.get('/api/tasks').catch(() => ({ data: { success: true, data: [] } })) : axios.get(`/api/tasks/agent/${user._id}`).catch(() => ({ data: { success: true, data: [] } })),
        axios.get(`/api/visits/agent/${user._id}`).catch(() => ({ data: { success: true, data: [] } })),
        isAdmin ? axios.get('/api/users?role=agent&limit=1000').catch(() => ({ data: { success: true, data: [] } })) : Promise.resolve({ data: { success: true, data: [] } })
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
        if (statsRes.data.data.totalLeads !== undefined) {
          axios.get('/api/leads?limit=7').then(r => {
            if (r.data.success && r.data.data?.length)
              setLeads(r.data.data.map(l => ({ ...l, id: l._id })));
          }).catch(() => {});
        }
      }
      if (activitiesRes.data.success) setActivities(activitiesRes.data.data || []);
      if (tasksRes?.data?.success) setTasks(tasksRes.data.data || []);
      if (visitsRes?.data?.success) setVisits(visitsRes.data.data || []);
      if (agentsRes?.data?.success) setAgents(agentsRes.data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) fetchStats(); }, [user, fetchStats]);
  useEffect(() => {
    if (!user) return;
    const t = setInterval(fetchStats, 60000);
    return () => clearInterval(t);
  }, [user, fetchStats]);

  const handleLeadAdded    = (l) => { setLeads(p => [{ ...l, id: l._id || l.id }, ...p]); setSchedulerLeads(p => [{ ...l, id: l._id || l.id }, ...p]); fetchStats(); };
  const handleDealCreated  = ()  => { setActiveDeals(p => p + 1); fetchStats(); };
  const handleVisitScheduled = () => { setSiteVisits(p => p + 1); fetchStats(); };

  const handleRespondAssignment = async (leadId, responseType) => {
    try {
      const res = await axios.put(`/api/leads/${leadId}/respond`, { response: responseType });
      if (res.data.success) {
        toast.success(responseType === 'accepted' ? 'Lead accepted!' : 'Lead rejected', {
          style: { background: '#111316', border: '1px solid #1e2025', color: '#f0f2f5' }
        });
        fetchStats(); // Refresh the dashboard to show new status
      }
    } catch { toast.error('Action failed'); }
  };

  const handleRespondTask = async (taskId, responseType) => {
    try {
      const res = await axios.patch(`/api/tasks/${taskId}/respond`, { response: responseType });
      if (res.data.success) {
        toast.success(responseType === 'accepted' ? 'Task accepted!' : 'Task rejected', {
          style: { background: '#111316', border: '1px solid #1e2025', color: '#f0f2f5' }
        });
        fetchStats(); // Refresh the dashboard to show new status
      }
    } catch { toast.error('Action failed'); }
  };

  const completeTask = async (id) => {
    try {
      await axios.patch(`/api/tasks/${id}/complete`);
      toast.success('Task marked as completed!');
      fetchStats();
    } catch { toast.error('Failed to complete task'); }
  };

  const updateVisitStatus = async (id, status) => {
    try {
      await axios.patch(`/api/visits/${id}/status`, { status });
      toast.success(`Visit marked as ${status}!`);
      fetchStats();
    } catch { toast.error('Failed to update visit'); }
  };

  const livePipeline = stats?.leadPipeline?.length
    ? stats.leadPipeline.map((item, i) => ({
        stage: item.name, val: item.value,
        pct: Math.round((item.value / stats.leadPipeline[0].value) * 100),
        color: [C.cyan, C.indigo, C.purple, C.gold, C.green, C.red][i] || C.sub,
      }))
    : PIPELINE;

  const kpis = isAdmin ? [
    { label: 'Portfolio Value', value: stats ? `${(stats.totalValue / 1e6).toFixed(1)}M` : '82.0M',
      prefix: 'Rs. ', icon: CurrencyDollarIcon, color: C.purple, chartData: sparklineValue, trend: '+12.5%',
      sub: 'Total property assets' },
    { label: 'Revenue (MTD)', value: stats ? `${(stats.totalRevenue / 1e5).toFixed(1)}L` : '28.4L',
      prefix: 'Rs. ', icon: ArrowTrendingUpIcon, color: C.green, chartData: sparklineRevenue, trend: '+8.2%',
      sub: 'Commission earned MTD' },
    { label: 'Active Leads', value: stats?.totalLeads ?? leads.length,
      icon: UserGroupIcon, color: C.cyan, chartData: sparklineLeads, trend: '+22%',
      sub: `${stats?.newLeads ?? 3} added this week` },
    { label: 'Active Deals', value: stats?.activeDeals ?? activeDeals,
      icon: CheckCircleIcon, color: C.gold, chartData: sparklineDeals, trend: '+3',
      sub: 'new this week', trendLabel: 'new deals' },
  ] : [
    { label: 'Total Leads',   value: stats?.totalLeads ?? leads.length, icon: UserGroupIcon, color: C.cyan,   chartData: sparklineLeads, trend: '+4' },
    { label: 'Active Deals',  value: stats?.activeDeals ?? activeDeals, icon: CheckCircleIcon, color: C.gold, chartData: [3,4,3,5,4,6,5,6], trend: '+1' },
    { label: 'Visits Today',  value: visits.filter(v => new Date(v.visitDate).toDateString() === new Date().toDateString()).length, icon: BuildingOfficeIcon, color: C.green, chartData: [1,2,1,3,2,3,2,3], trend: '+3' },
    { label: 'Tasks Today',   value: tasks.filter(t => new Date(t.dueDate).toDateString() === new Date().toDateString()).length, icon: ClipboardDocumentListIcon, color: C.purple, chartData: [55,60,58,62,63,66,65,68], trend: '+5' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12,
      background: C.bg }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%',
        border: `2px solid ${C.purple}40`, borderTopColor: C.purple, animation: 'spin 0.7s linear infinite' }} />
      <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>Loading dashboard…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );

  if (!isAdmin) {
    return (
      <AgentDashboard 
        user={user} 
        stats={stats} 
        leads={leads} 
        tasks={tasks}
        visits={visits}
        completeTask={completeTask} 
        updateVisitStatus={updateVisitStatus}
        handleRespondAssignment={handleRespondAssignment}
        handleRespondTask={handleRespondTask}
        loading={loading}
        kpis={kpis}
        onAddTask={() => setShowAddTask(true)}
        onScheduleVisit={() => setShowSchedule(true)}
      />
    );
  }

  return (
    <>
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 22, paddingBottom: 60,
      minHeight: '100vh',
      backgroundImage: `
        radial-gradient(ellipse at 20% 0%, rgba(139,92,246,0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 10%, rgba(34,211,238,0.06) 0%, transparent 40%)
      `,
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <SparklesIcon style={{ width: 14, height: 14, color: C.purple }} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: C.purple }}>
              {isAdmin ? 'Operations Command' : 'My Workspace'}
            </span>
          </div>
          <h1 style={{
            margin: 0, fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05,
            background: `linear-gradient(135deg, ${C.text} 0%, #a78bfa 60%, ${C.cyan} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {isAdmin ? 'Executive Command' : `${getGreeting()}, ${user?.name?.split(' ')[0]}`}
          </h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <QuickActions
          onAddLead={() => setShowAddLead(true)}
          onAddProperty={() => setShowAddProperty(true)}
          onCreateDeal={() => setShowCreateDeal(true)}
          onSchedule={() => setShowSchedule(true)}
          onAssignTask={() => setShowAddTask(true)}
          isAdmin={isAdmin}
        />
      </div>

      {/* ── KPI GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {kpis.map((k, i) => <HeroKpi key={i} {...k} />)}
      </div>

      {/* ── MAIN CHARTS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
        <RevenueTimeline data={MONTH_DATA} />
        <TodayPulse data={{ ...todayOps, siteVisits }} followUps={todayFollowUps} />
      </div>

      {/* ── PIPELINE + LEADERBOARD ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 16, alignItems: 'start' }}>
        <PipelineFunnel data={livePipeline} />
        {isAdmin
          ? <Leaderboard agents={AGENTS} liveData={stats?.leadsPerAgent} />
          : <LeadsFeed leads={leads} onRespondAssignment={handleRespondAssignment} isAgent={!isAdmin} />}
      </div>

      {/* ── LEADS + TASKS/FOLLOWUPS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
        <LeadsFeed leads={leads} onRespondAssignment={handleRespondAssignment} isAgent={!isAdmin} />
        {isAdmin ? <AdminTasksWidget tasks={tasks} /> : <FollowUps followUps={todayFollowUps} onComplete={completeFollowUp} />}
      </div>

    </div>

    <AddLeadModal    isOpen={showAddLead}     onClose={() => setShowAddLead(false)}     onLeadAdded={handleLeadAdded} />
    <AddPropertyModal isOpen={showAddProperty} onClose={() => setShowAddProperty(false)} />
    <CreateDealModal  isOpen={showCreateDeal}  onClose={() => setShowCreateDeal(false)}  onDealCreated={handleDealCreated} />
    <ScheduleVisitModal
      isOpen={showSchedule} onClose={() => setShowSchedule(false)}
      onVisitScheduled={handleVisitScheduled}
      leads={schedulerLeads.length ? schedulerLeads : undefined}
    />
    <AddTaskModal 
      isOpen={showAddTask} 
      onClose={() => setShowAddTask(false)} 
      onTaskAdded={() => { fetchStats(); setShowAddTask(false); }}
      leads={schedulerLeads.length ? schedulerLeads : undefined}
      agents={agents.length ? agents : (stats?.agents || AGENTS)}
      userRole={user?.role}
    />
    </>
  );
};

export default Dashboard;
