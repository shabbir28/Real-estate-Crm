import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import ModalWrapper from './ModalWrapper';
import { Field, Input, Select, Textarea, ModalFooter, FieldSection, Grid2 } from './formUtils';

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
  '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '02:00 PM',
  '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM',
];

const EMPTY = {
  leadId: '', propertyId: '', visitDate: '',
  time: '', agent: '', notes: '',
};

const validate = (form) => {
  const errors = {};
  if (!form.leadId)      errors.leadId    = 'Please select a lead';
  if (!form.propertyId)  errors.propertyId = 'Please select a property';
  if (!form.visitDate)   errors.visitDate  = 'Visit date is required';
  if (!form.time)        errors.time       = 'Please select a time slot';
  return errors;
};

/**
 * ScheduleVisitModal
 *
 * Props:
 *  - isOpen, onClose, onVisitScheduled (required)
 *  - leads, agents (optional override arrays — if omitted, the modal fetches its own data)
 */
const ScheduleVisitModal = ({ isOpen, onClose, onVisitScheduled, leads: leadsProp, agents: agentsProp }) => {
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);

  // Real data fetched from the API
  const [leads, setLeads]             = useState(leadsProp || []);
  const [properties, setProperties]   = useState([]);
  const [agents, setAgents]           = useState(agentsProp || []);
  const [fetchingData, setFetchingData] = useState(false);

  // Load real leads, properties, and agents when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setFetchingData(true);
    Promise.all([
      // If parent passed leads, skip fetching
      leadsProp?.length
        ? Promise.resolve({ data: { success: true, data: leadsProp } })
        : axios.get('/api/leads'),
      axios.get('/api/properties'),
      // Fetch agents (users with role=agent) for the dropdown
      agentsProp?.length
        ? Promise.resolve({ data: { success: true, data: agentsProp } })
        : axios.get('/api/users?role=agent').catch(() => ({ data: { success: true, data: [] } })),
    ])
      .then(([leadsRes, propsRes, agentsRes]) => {
        if (leadsRes.data.success) {
          // Ensure id field is set consistently
          setLeads(leadsRes.data.data.map(l => ({ ...l, id: l._id || l.id })));
        }
        if (propsRes.data.success) {
          setProperties(propsRes.data.data.map(p => ({ ...p, id: p._id || p.id })));
        }
        if (agentsRes.data.success && agentsRes.data.data?.length) {
          setAgents(agentsRes.data.data); // Keep full objects for _id
        }
      })
      .catch(() => toast.error('Could not load some data for scheduling'))
      .finally(() => setFetchingData(false));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const selectedLead     = leads.find(l => String(l.id || l._id) === String(form.leadId));
  const selectedProperty = properties.find(p => String(p.id || p._id) === String(form.propertyId));

  const handleSubmit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      // Build a proper Date object from visitDate and time
      const datetimeString = `${form.visitDate} ${form.time}`; // Simplistic combining
      let dueDate = new Date(datetimeString);
      if (isNaN(dueDate.getTime())) {
        dueDate = new Date(form.visitDate); // Fallback
      }

      const payload = {
        type: 'site-visit',
        title: `Site Visit: ${selectedProperty?.title || 'Property'}`,
        description: form.notes,
        lead: form.leadId,
        property: form.propertyId,
        assignedTo: form.agent || agents[0]?._id, // Needs a valid user ID
        dueDate: dueDate.toISOString(),
        status: 'pending',
        priority: 'high'
      };

      const res = await axios.post('/api/activities', payload);

      if (res.data.success) {
        onVisitScheduled?.(res.data.data);
        toast.success(
          `Site visit scheduled for ${selectedLead?.name || 'lead'} on ${form.visitDate} at ${form.time}`,
          {
            style: { background: '#111316', border: '1px solid #1e2025', color: '#f0f2f5' },
            iconTheme: { primary: '#34d399', secondary: '#111316' },
            duration: 4000,
          }
        );
        setForm(EMPTY);
        setErrors({});
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule visit');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(EMPTY);
    setErrors({});
    onClose();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="Schedule Site Visit"
      subtitle="Book a property viewing for a lead"
      icon={<CalendarDaysIcon className="w-4 h-4" />}
      iconBg="rgba(245,158,11,0.12)"
      iconColor="#fbbf24"
      maxWidth="max-w-xl"
    >
      <FieldSection>
        {fetchingData ? (
          <div className="flex items-center gap-2 py-4" style={{ color: '#545769', fontSize: 13 }}>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Loading leads &amp; properties…
          </div>
        ) : (
          <>
            {/* Lead + Property */}
            <Grid2>
              <Field label="Select Lead" required error={errors.leadId}>
                <Select value={form.leadId} onChange={set('leadId')} placeholder="Choose lead">
                  {leads.map(l => (
                    <option key={l.id || l._id} value={l.id || l._id} style={{ background: '#111316' }}>
                      {l.name}{l.budget ? ` — ${typeof l.budget === 'string' ? l.budget : (l.budget?.min || '')}` : ''}
                    </option>
                  ))}
                </Select>
                {leads.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>No leads found. Add leads first.</p>
                )}
              </Field>
              <Field label="Select Property" required error={errors.propertyId}>
                <Select value={form.propertyId} onChange={set('propertyId')} placeholder="Choose property">
                  {properties.map(p => (
                    <option key={p.id || p._id} value={p.id || p._id} style={{ background: '#111316' }}>{p.title}</option>
                  ))}
                </Select>
                {properties.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>No properties found. Add properties first.</p>
                )}
              </Field>
            </Grid2>

            {/* Date + Time */}
            <Grid2>
              <Field label="Visit Date" required error={errors.visitDate}>
                <input
                  type="date"
                  value={form.visitDate}
                  onChange={set('visitDate')}
                  min={today}
                  className="input"
                  style={{ height: 38, colorScheme: 'dark' }}
                />
              </Field>
              <Field label="Time Slot" required error={errors.time}>
                <Select value={form.time} onChange={set('time')} placeholder="Select time">
                  {TIME_SLOTS.map((t, idx) => (
                    <option key={`time-${idx}`} value={t} style={{ background: '#111316' }}>{t}</option>
                  ))}
                </Select>
              </Field>
            </Grid2>

            {/* Assigned Agent */}
            <Field label="Assigned Agent" required error={errors.agent}>
              <Select value={form.agent} onChange={set('agent')} placeholder="Select agent">
                {agents.map(a => (
                  <option key={a._id || a.id} value={a._id || a.id} style={{ background: '#111316' }}>{a.name}</option>
                ))}
              </Select>
            </Field>

            {/* Visit Summary Card */}
            {selectedLead && selectedProperty && form.visitDate && form.time && (
              <div
                className="rounded-lg px-4 py-3 space-y-1.5"
                style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#fbbf24' }}>Visit Summary</p>
                <div className="text-xs space-y-1" style={{ color: '#8b8fa8' }}>
                  <div>👤 <span style={{ color: '#f0f2f5', fontWeight: 500 }}>{selectedLead.name}</span></div>
                  <div>🏠 <span style={{ color: '#f0f2f5', fontWeight: 500 }}>{selectedProperty.title}</span></div>
                  <div>📅 <span style={{ color: '#f0f2f5', fontWeight: 500 }}>{form.visitDate} at {form.time}</span></div>
                  {form.agent && <div>👔 <span style={{ color: '#f0f2f5', fontWeight: 500 }}>{agents.find(a => a._id === form.agent || a.id === form.agent)?.name || 'Assigned'}</span></div>}
                </div>
              </div>
            )}

            {/* Notes */}
            <Field label="Notes (Optional)">
              <Textarea
                placeholder="Any special instructions, directions, or client preferences…"
                value={form.notes}
                onChange={set('notes')}
                rows={3}
              />
            </Field>
          </>
        )}
      </FieldSection>

      <ModalFooter
        onCancel={handleClose}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel="Schedule Visit"
        submitColor="#d97706"
      />
    </ModalWrapper>
  );
};

export default ScheduleVisitModal;
