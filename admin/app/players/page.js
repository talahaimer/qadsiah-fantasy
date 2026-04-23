'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Plus, Save, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];

export default function PlayersPage() {
  const { data: players = [], mutate } = useSWR('/players');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null); // player id
  const [form, setForm] = useState(blankForm());

  function blankForm() {
    return { nameEn: '', nameAr: '', position: 'MID', jerseyNumber: '', fantasyValue: 10, photoUrl: '', externalId: '', isActive: true };
  }

  function openEdit(p) {
    setCreating(false);
    setEditing(p.id);
    setForm({
      nameEn: p.nameEn, nameAr: p.nameAr || '', position: p.position,
      jerseyNumber: p.jerseyNumber ?? '', fantasyValue: p.fantasyValue,
      photoUrl: p.photoUrl || '', externalId: p.externalId || '', isActive: p.isActive,
    });
  }

  async function save() {
    const body = {
      nameEn: form.nameEn,
      nameAr: form.nameAr || undefined,
      position: form.position,
      jerseyNumber: form.jerseyNumber === '' ? undefined : Number(form.jerseyNumber),
      fantasyValue: Number(form.fantasyValue),
      photoUrl: form.photoUrl || undefined,
      externalId: form.externalId || undefined,
      isActive: form.isActive,
    };
    if (editing) await api.patch(`/admin/players/${editing}`, body);
    else await api.post('/admin/players', body);
    setCreating(false); setEditing(null); setForm(blankForm()); mutate();
  }

  async function remove(id) {
    if (!confirm('Deactivate this player?')) return;
    await api.del(`/admin/players/${id}`);
    mutate();
  }

  const showingForm = creating || editing;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Players</h1>
        {!showingForm && (
          <button className="btn-primary" onClick={() => { setCreating(true); setEditing(null); setForm(blankForm()); }}>
            <Plus size={14} /> Add player
          </button>
        )}
      </div>

      {showingForm && (
        <div className="card space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div><label className="label">Name (EN)</label><input className="input" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} /></div>
            <div><label className="label">Name (AR)</label><input className="input" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></div>
            <div>
              <label className="label">Position</label>
              <select className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="label">Jersey #</label><input type="number" min="0" max="99" className="input" value={form.jerseyNumber} onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })} /></div>
            <div><label className="label">Fantasy value</label><input type="number" min="1" max="50" className="input" value={form.fantasyValue} onChange={(e) => setForm({ ...form, fantasyValue: e.target.value })} /></div>
            <div><label className="label">External ID</label><input className="input" value={form.externalId} onChange={(e) => setForm({ ...form, externalId: e.target.value })} /></div>
            <div className="md:col-span-2"><label className="label">Photo URL</label><input className="input" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} /></div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={save}><Save size={14} /> {editing ? 'Save changes' : 'Create'}</button>
            <button className="btn-ghost" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card !p-0 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>AR</th><th>Pos</th><th>Value</th><th>Active</th><th></th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="hover:bg-white/5">
                <td>{p.jerseyNumber ?? '—'}</td>
                <td className="font-medium">{p.nameEn}</td>
                <td className="text-white/70" dir="rtl">{p.nameAr || '—'}</td>
                <td><span className="chip">{p.position}</span></td>
                <td className="text-brand tabular-nums">{p.fantasyValue}</td>
                <td>{p.isActive ? <span className="chip text-green-400 border-green-500/30">yes</span> : <span className="chip text-white/40">no</span>}</td>
                <td className="text-end whitespace-nowrap">
                  <button className="btn-ghost" onClick={() => openEdit(p)}>Edit</button>
                  <button className="btn-danger ms-2" onClick={() => remove(p.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {players.length === 0 && <tr><td colSpan={7} className="text-center text-white/50 py-6">No players.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
