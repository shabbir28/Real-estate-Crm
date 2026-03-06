import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  HomeModernIcon,
  UserIcon,
  EyeIcon,
  TrashIcon,
  PencilSquareIcon,
  PhotoIcon,
  Squares2X2Icon,
  XMarkIcon,
  BuildingOffice2Icon,
  HomeIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useNotifications, NOTIFICATION_TYPES } from '../context/NotificationContext';
import PropertyMap from '../components/map/PropertyMap';

/* ─── Status config ──────────────────────────────────── */
const STATUS = {
  available:      { label: 'Available',     color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)'  },
  sold:           { label: 'Sold',          color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' },
  rented:         { label: 'Rented',        color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)' },
  'under-contract':{ label: 'Under Contract',color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)'  },
};

const TYPE_ICON = {
  apartment: BuildingOffice2Icon,
  house:     HomeIcon,
  villa:     SparklesIcon,
  land:      MapPinIcon,
  office:    BuildingOffice2Icon,
  loft:      HomeModernIcon,
};

const dummyProperties = [
  { id: 1, title: '5 Marla House',  price: '2 Crore', location: 'DHA Islamabad', lat: 33.6844, lng: 73.0479, image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994' },
  { id: 2, title: '10 Marla House', price: '4 Crore', location: 'Bahria Town',   lat: 33.5651, lng: 73.0169, image: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c' },
];

/* ─── Tiny inline modal ──────────────────────────────── */
const ModalShell = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-surface-border shadow-2xl overflow-hidden"
        style={{ background: '#0e1015' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-surface-border"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div>
            <h2 className="text-sm font-bold text-ink-primary">{title}</h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[82vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

/* ─── Field + input shared ───────────────────────────── */
const F = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-widest">{label}</label>
    {children}
  </div>
);
const inp = 'w-full rounded-lg border border-surface-border bg-surface-raised text-ink-primary text-sm px-3 py-2 focus:outline-none focus:border-accent placeholder-ink-tertiary';

/* ═══════════════════════════════════════════
   PROPERTIES PAGE
═══════════════════════════════════════════ */
const Properties = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [properties, setProperties]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProp, setEditingProp] = useState(null);
  const [agents, setAgents]           = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode]       = useState('grid');
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews]   = useState([]);

  const [form, setForm] = useState({
    title: '', description: '', type: 'apartment', status: 'available',
    price: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    features: { bedrooms: '', bathrooms: '', area: '' },
    listedBy: '',
  });

  useEffect(() => { if (user) { fetchProperties(); fetchAgents(); } }, [user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const r = await axios.get('/api/properties');
      if (r.data.success) setProperties(r.data.data);
    } catch { toast.error('Failed to load properties'); }
    finally { setLoading(false); }
  };

  const fetchAgents = async () => {
    try {
      const r = await axios.get('/api/users');
      if (r.data.success) setAgents(r.data.data);
    } catch {}
  };

  const openModal = (prop = null) => {
    setEditingProp(prop);
    setSelectedImages([]); setImagePreviews([]);
    setForm(prop ? {
      title: prop.title, description: prop.description, type: prop.type,
      status: prop.status, price: prop.price,
      address: { ...prop.address },
      features: { ...prop.features },
      listedBy: prop.listedBy?._id || '',
    } : {
      title: '', description: '', type: 'apartment', status: 'available', price: '',
      address: { street: '', city: '', state: '', zipCode: '' },
      features: { bedrooms: '', bathrooms: '', area: '' }, listedBy: '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this property?')) return;
    try {
      const r = await axios.delete(`/api/properties/${id}`);
      if (r.data.success) { toast.success('Property removed'); fetchProperties(); }
    } catch { toast.error('Failed to remove'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (typeof v === 'object' && v !== null) {
          Object.entries(v).forEach(([sk, sv]) => data.append(`${k}[${sk}]`, sv || ''));
        } else {
          data.append(k, v);
        }
      });
      selectedImages.forEach(img => data.append('images', img));
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      const resp = editingProp
        ? await axios.put(`/api/properties/${editingProp._id}`, data, cfg)
        : await axios.post('/api/properties', data, cfg);
      if (resp.data.success) {
        toast.success(editingProp ? 'Property updated!' : 'Property added!', {
          style: { background: '#111316', border: '1px solid #1e2025', color: '#f0f2f5' },
          iconTheme: { primary: '#34d399', secondary: '#111316' },
        });
        if (!editingProp) addNotification(NOTIFICATION_TYPES.PROPERTY_ADDED, 'Property Listed', `"${form.title}" added to portfolio.`);
        setIsModalOpen(false);
        fetchProperties();
      }
    } catch { toast.error('Failed to save'); }
  };

  /* Filtering */
  const filtered = properties.filter(p => {
    const matchSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  /* Stats */
  const totalValue    = properties.reduce((s, p) => s + (p.price || 0), 0);
  const availableCount = properties.filter(p => p.status === 'available').length;

  /* Helpers */
  const setAddr = (k) => (e) => setForm(p => ({ ...p, address: { ...p.address, [k]: e.target.value } }));
  const setFeat = (k) => (e) => setForm(p => ({ ...p, features: { ...p.features, [k]: e.target.value } }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-5 h-5 rounded-full border-2 border-surface-border border-t-accent animate-spin" />
        <span className="text-xs text-ink-tertiary uppercase tracking-widest font-semibold">Loading properties…</span>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6 pb-16">

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-4 w-1 rounded-full bg-[#5c6bc0]" />
            <span className="text-[#7986cb] text-[10px] font-black uppercase tracking-[0.4em]">Property Portfolio</span>
          </div>
          <h1 className="text-3xl font-black text-ink-primary tracking-tight">Properties</h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            {properties.length} listings · Rs. {(totalValue / 1e6).toFixed(1)}M total value
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-tertiary" />
            <input
              type="text" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search title or city…"
              className="input pl-9 pr-4 py-2 text-sm w-52"
            />
          </div>

          {/* View toggle */}
          <div className="flex rounded-xl border border-surface-border overflow-hidden" style={{ background: '#0d0f12' }}>
            {[{ id: 'grid', Icon: Squares2X2Icon, label: 'Grid' }, { id: 'map', Icon: MapPinIcon, label: 'Map' }].map(v => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all"
                style={{
                  background: viewMode === v.id ? 'rgba(92,107,192,0.2)' : 'transparent',
                  color: viewMode === v.id ? '#9fa8da' : '#545769',
                  borderRight: v.id === 'grid' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <v.Icon className="w-4 h-4" /> {v.label}
              </button>
            ))}
          </div>

          {/* Add Property */}
          <button
            onClick={() => openModal()}
            className="btn flex items-center gap-2"
            style={{ background: 'rgba(92,107,192,0.18)', borderColor: 'rgba(92,107,192,0.45)', color: '#9fa8da', fontWeight: 700 }}
          >
            <PlusIcon className="w-4 h-4" /> Add Property
          </button>
        </div>
      </div>

      {/* ── Stat Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Listings', value: properties.length, accent: '#7986cb' },
          { label: 'Available',      value: availableCount,    accent: '#10b981' },
          { label: 'Sold',           value: properties.filter(p=>p.status==='sold').length,   accent: '#f87171' },
          { label: 'Portfolio Value',value: `Rs. ${(totalValue/1e6).toFixed(1)}M`, accent: '#fbbf24' },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-xl px-4 py-3 border"
            style={{ background: `rgba(${s.accent === '#7986cb' ? '121,134,203' : s.accent === '#10b981' ? '16,185,129' : s.accent === '#f87171' ? '248,113,113' : '251,191,36'},0.06)`, borderColor: `rgba(${s.accent === '#7986cb' ? '121,134,203' : s.accent === '#10b981' ? '16,185,129' : s.accent === '#f87171' ? '248,113,113' : '251,191,36'},0.18)` }}
          >
            <div className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider">{s.label}</div>
            <div className="text-xl font-black text-ink-primary mt-0.5 tracking-tight" style={{ color: s.accent }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Status Filters ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'available', 'sold', 'rented', 'under-contract']).map(st => {
          const cfg = STATUS[st] || { label: 'All', color: '#8b8fa8', bg: 'rgba(139,143,168,0.08)', border: 'rgba(139,143,168,0.2)' };
          const active = filterStatus === st;
          return (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize"
              style={{
                background: active ? cfg.bg : 'transparent',
                color: active ? cfg.color : '#545769',
                border: `1px solid ${active ? cfg.border : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {st === 'all' ? `All (${properties.length})` : `${cfg.label} (${properties.filter(p=>p.status===st).length})`}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {viewMode === 'map' ? (
        <div className="rounded-2xl overflow-hidden border border-surface-border">
          <PropertyMap properties={dummyProperties} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-16 w-16 rounded-2xl border border-surface-border flex items-center justify-center">
            <HomeModernIcon className="h-8 w-8 text-ink-tertiary opacity-40" />
          </div>
          <p className="text-sm text-ink-tertiary">No properties found</p>
          <button onClick={() => openModal()} className="btn flex items-center gap-2" style={{ color: '#7986cb', background: 'rgba(92,107,192,0.1)', borderColor: 'rgba(92,107,192,0.25)' }}>
            <PlusIcon className="w-4 h-4" /> Add your first property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p) => {
            const st   = STATUS[p.status] || STATUS.available;
            const TIcon = TYPE_ICON[p.type] || HomeModernIcon;
            return (
              <div
                key={p._id}
                className="group rounded-2xl border overflow-hidden flex flex-col"
                style={{ background: '#111316', borderColor: 'rgba(255,255,255,0.07)', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(92,107,192,0.35)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Image Section */}
                <div className="relative h-52 overflow-hidden bg-surface-raised flex-shrink-0">
                  {p.images?.length > 0 ? (
                    <img
                      src={p.images[0].url}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, rgba(92,107,192,0.08) 0%, rgba(139,92,246,0.05) 100%)' }}>
                      <TIcon className="h-10 w-10 text-ink-tertiary opacity-30" />
                      <span className="text-[10px] text-ink-tertiary uppercase tracking-wider">No Image</span>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Status badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
                      style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                    >
                      <span className="inline-block h-1.5 w-1.5 rounded-full mr-1" style={{ background: st.color }} />
                      {st.label}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm capitalize"
                      style={{ background: 'rgba(0,0,0,0.5)', color: '#adb5bf', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {p.type}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal(p)}
                      className="h-8 w-8 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all"
                      style={{ background: 'rgba(14,16,21,0.85)', border: '1px solid rgba(92,107,192,0.3)', color: '#9fa8da' }}
                      title="Edit"
                    >
                      <PencilSquareIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="h-8 w-8 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all"
                      style={{ background: 'rgba(14,16,21,0.85)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
                      title="Delete"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Price tag at bottom */}
                  <div className="absolute bottom-3 left-3">
                    <div
                      className="px-3 py-1.5 rounded-xl backdrop-blur-sm font-black text-sm"
                      style={{ background: 'rgba(92,107,192,0.85)', color: '#fff', border: '1px solid rgba(121,134,203,0.4)' }}
                    >
                      Rs. {Number(p.price).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Title + location */}
                  <div>
                    <h3 className="text-sm font-bold text-ink-primary leading-snug group-hover:text-[#7986cb] transition-colors line-clamp-1">
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPinIcon className="h-3.5 w-3.5 text-ink-tertiary flex-shrink-0" />
                      <span className="text-xs text-ink-tertiary truncate">{p.address?.street}, {p.address?.city}</span>
                    </div>
                  </div>

                  {/* Feature pills */}
                  <div className="flex items-center gap-2">
                    {[
                      { label: `${p.features?.bedrooms ?? 0} Bed` },
                      { label: `${p.features?.bathrooms ?? 0} Bath` },
                      { label: `${Number(p.features?.area || 0).toLocaleString()} sqft` },
                    ].map((feat, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-ink-secondary"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        {feat.label}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-surface-divide mt-auto">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-lg flex items-center justify-center text-[9px] font-bold"
                        style={{ background: 'rgba(92,107,192,0.12)', color: '#9fa8da', border: '1px solid rgba(92,107,192,0.2)' }}
                      >
                        {p.listedBy?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-xs text-ink-tertiary">{p.listedBy?.name || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-ink-tertiary">
                      <EyeIcon className="h-3.5 w-3.5" />
                      {p.views ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* ── Add / Edit Modal ── */}
    <ModalShell
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title={editingProp ? 'Edit Property' : 'Add Property'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          <F label="Property Type *">
            <select className={inp} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} required>
              {['apartment','house','villa','loft','office','land'].map(t => <option key={t} value={t} style={{ background: '#0e1015' }} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </F>
          <F label="Status">
            <select className={inp} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="available" style={{ background: '#0e1015' }}>Available</option>
              <option value="sold"      style={{ background: '#0e1015' }}>Sold</option>
              <option value="rented"    style={{ background: '#0e1015' }}>Rented</option>
              <option value="under-contract" style={{ background: '#0e1015' }}>Under Contract</option>
            </select>
          </F>
        </div>

        {/* Title */}
        <F label="Property Title *">
          <input className={inp} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. 4-Bed House — F-7 Markaz" required />
        </F>

        {/* Description */}
        <F label="Description">
          <textarea
            className={inp}
            style={{ minHeight: 80, resize: 'vertical' }}
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Property overview…"
          />
        </F>

        {/* Row 2 */}
        <div className="grid grid-cols-2 gap-4">
          <F label="Price (PKR) *">
            <input className={inp} type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0" required />
          </F>
          <F label="Listed By *">
            <select className={inp} value={form.listedBy} onChange={e => setForm(p => ({ ...p, listedBy: e.target.value }))} required>
              <option value="">Select agent…</option>
              {agents.map(a => <option key={a._id} value={a._id} style={{ background: '#0e1015' }}>{a.name}</option>)}
            </select>
          </F>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-4">
          <F label="Bedrooms"><input className={inp} type="number" value={form.features.bedrooms} onChange={setFeat('bedrooms')} placeholder="0" /></F>
          <F label="Bathrooms"><input className={inp} type="number" value={form.features.bathrooms} onChange={setFeat('bathrooms')} placeholder="0" /></F>
          <F label="Area (sqft)"><input className={inp} type="number" value={form.features.area} onChange={setFeat('area')} placeholder="0" /></F>
        </div>

        {/* Address */}
        <div className="grid grid-cols-2 gap-4">
          <F label="Street *"><input className={inp} value={form.address.street} onChange={setAddr('street')} placeholder="Street / Phase" required /></F>
          <F label="City *"><input className={inp} value={form.address.city} onChange={setAddr('city')} placeholder="Islamabad" required /></F>
        </div>

        {/* Image Upload */}
        <F label="Images">
          <label
            className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors"
            style={{ borderColor: 'rgba(92,107,192,0.3)', background: 'rgba(92,107,192,0.04)' }}
          >
            <PhotoIcon className="h-6 w-6 mb-1" style={{ color: '#7986cb' }} />
            <span className="text-xs text-ink-tertiary">
              {selectedImages.length ? `${selectedImages.length} file(s) selected` : 'Click to upload photos'}
            </span>
            <input type="file" className="hidden" accept="image/*" multiple onChange={e => {
              const files = Array.from(e.target.files);
              setSelectedImages(files);
              setImagePreviews(files.map(f => URL.createObjectURL(f)));
            }} />
          </label>
          {imagePreviews.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {imagePreviews.map((src, i) => <img key={i} src={src} alt="" className="h-16 w-16 object-cover rounded-lg border border-surface-border" />)}
            </div>
          )}
        </F>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
          <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ background: 'rgba(255,255,255,0.04)', borderColor: '#1e2025', color: '#8b8fa8' }}>
            Cancel
          </button>
          <button type="submit" className="btn" style={{ background: 'rgba(92,107,192,0.18)', borderColor: 'rgba(92,107,192,0.45)', color: '#9fa8da', fontWeight: 700, minWidth: 120 }}>
            {editingProp ? 'Save Changes' : 'Add Property'}
          </button>
        </div>
      </form>
    </ModalShell>
    </>
  );
};

export default Properties;
