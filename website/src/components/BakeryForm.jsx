import React, { useState } from 'react';
import { geocodeAddress } from '../services/bakeries';
import { isNonEmpty } from '../lib/validation';

/**
 * Add/Edit bakery form (superuser). Reviews are intentionally NOT shown here.
 * onSubmit(data) receives the assembled + geocoded payload.
 */
export default function BakeryForm({ initial, submitLabel = 'Save bakery', onSubmit, submitting, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [shipping, setShipping] = useState(!!initial?.shipping);
  const [isHomeBakery, setIsHomeBakery] = useState(!!initial?.isHomeBakery);
  const [isBrickAndMortar, setIsBrickAndMortar] = useState(!!initial?.isBrickAndMortar);
  const [variations, setVariations] = useState(
    initial?.variations?.length
      ? initial.variations.map((v) => ({ name: v.name, price: String(v.price) }))
      : [{ name: '', price: '' }]
  );
  const [coords, setCoords] = useState(initial?.coords || null);
  const [geocoding, setGeocoding] = useState(false);
  const [errors, setErrors] = useState({});

  const setVar = (i, k, val) => setVariations((p) => p.map((r, idx) => (idx === i ? { ...r, [k]: val } : r)));
  const addRow = () => setVariations((p) => [...p, { name: '', price: '' }]);
  const removeRow = (i) => setVariations((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)));

  const doGeocode = async () => {
    if (!isNonEmpty(address)) { setErrors((e) => ({ ...e, address: 'Enter an address first.' })); return; }
    setGeocoding(true);
    const res = await geocodeAddress(address);
    setGeocoding(false);
    if (res) setCoords(res);
    else alert('Could not locate that address automatically. You can still save; distance sorting just won’t work until a valid address is set.');
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!isNonEmpty(name)) err.name = 'Name is required.';
    if (!isNonEmpty(address)) err.address = 'Address is required.';
    const cleanVars = variations.map((v) => ({ name: v.name.trim(), price: Number(v.price) })).filter((v) => v.name && !Number.isNaN(v.price));
    if (cleanVars.length === 0) err.variations = 'Add at least one variation with a name and price.';
    if (!isHomeBakery && !isBrickAndMortar) err.type = 'Choose home bakery and/or brick-and-mortar.';
    setErrors(err);
    if (Object.keys(err).length) return;

    let finalCoords = coords;
    if (!finalCoords) { setGeocoding(true); finalCoords = await geocodeAddress(address); setGeocoding(false); }
    onSubmit({ name, address, phone, description, shipping, isHomeBakery, isBrickAndMortar, variations: cleanVars, coords: finalCoords || null });
  };

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label className="label">Bakery name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Bayou Sweets" />
        {errors.name ? <div className="field-error">{errors.name}</div> : null}
      </div>

      <div className="field">
        <label className="label">Address</label>
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Bourbon St, New Orleans, LA" />
        {errors.address ? <div className="field-error">{errors.address}</div> : null}
      </div>
      <button type="button" className="chip mb-2" onClick={doGeocode}>
        {geocoding ? 'Locating…' : coords ? `📍 Pinned: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} — re-locate` : '📍 Locate address (for distance sorting)'}
      </button>

      <div className="field">
        <label className="label">Phone</label>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(504) 555-0142" />
      </div>

      <div className="row wrap gap-1 mb-2">
        <label className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" checked={shipping} onChange={() => setShipping((v) => !v)} /> Offers shipping</label>
        <label className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" checked={isHomeBakery} onChange={() => setIsHomeBakery((v) => !v)} /> Home bakery</label>
        <label className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" checked={isBrickAndMortar} onChange={() => setIsBrickAndMortar((v) => !v)} /> Brick-and-mortar</label>
      </div>
      {errors.type ? <div className="field-error mb-2">{errors.type}</div> : null}

      <div className="field">
        <label className="label">Description</label>
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What makes their king cakes special…" />
      </div>

      <label className="label">Variations & pricing</label>
      {variations.map((row, i) => (
        <div className="row gap-1 mb-2" key={i}>
          <input className="input" style={{ flex: 2 }} value={row.name} onChange={(e) => setVar(i, 'name', e.target.value)} placeholder="Traditional" />
          <input className="input" style={{ flex: 1 }} value={row.price} onChange={(e) => setVar(i, 'price', e.target.value.replace(/[^0-9.]/g, ''))} placeholder="24" inputMode="decimal" />
          <button type="button" className="btn ghost sm" onClick={() => removeRow(i)} disabled={variations.length === 1} aria-label="Remove">✕</button>
        </div>
      ))}
      {errors.variations ? <div className="field-error mb-2">{errors.variations}</div> : null}
      <button type="button" className="chip mb-3" onClick={addRow}>+ Add variation</button>

      <div className="row gap-1">
        {onCancel ? <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button> : null}
        <button className="btn" type="submit" disabled={submitting || geocoding}>{submitting || geocoding ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
