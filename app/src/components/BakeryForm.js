import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import TextField from '@/src/components/TextField';
import Button from '@/src/components/Button';
import { geocodeAddress } from '@/src/services/bakeries';
import { isNonEmpty } from '@/src/utils/validation';

function CheckRow({ label, icon, value, onToggle }) {
  const { colors, typography, radius, spacing } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.checkRow,
        { borderColor: value ? colors.primary : colors.border, borderRadius: radius.md, backgroundColor: value ? colors.primarySoft : 'transparent' },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={value ? colors.primary : colors.textMuted} />
      <Text style={[typography.body, { color: colors.text, flex: 1, marginLeft: spacing.md }]}>
        {label}
      </Text>
      <View
        style={[
          styles.checkbox,
          { borderColor: value ? colors.primary : colors.border, backgroundColor: value ? colors.primary : 'transparent' },
        ]}
      >
        {value ? <MaterialCommunityIcons name="check" size={15} color={colors.onPrimary} /> : null}
      </View>
    </Pressable>
  );
}

/**
 * Reusable Add/Edit bakery form. Reviews are intentionally NOT shown here.
 * `onSubmit(data)` receives the fully assembled + geocoded bakery payload.
 */
export default function BakeryForm({ initial, submitLabel = 'Save bakery', onSubmit, submitting }) {
  const { colors, spacing, typography, radius } = useTheme();

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

  const setVariation = (index, key, value) => {
    setVariations((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };
  const addVariationRow = () => setVariations((prev) => [...prev, { name: '', price: '' }]);
  const removeVariationRow = (index) =>
    setVariations((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const handleGeocode = async () => {
    if (!isNonEmpty(address)) {
      setErrors((e) => ({ ...e, address: 'Enter an address first.' }));
      return;
    }
    setGeocoding(true);
    try {
      const result = await geocodeAddress(address);
      if (result) {
        setCoords(result);
        Alert.alert('Location found', `Pinned at ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}.`);
      } else {
        Alert.alert(
          'Could not locate address',
          'We couldn’t geocode that address automatically. You can still save; distance sorting just won’t work for this bakery until a valid address is set.'
        );
      }
    } finally {
      setGeocoding(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!isNonEmpty(name)) e.name = 'Name is required.';
    if (!isNonEmpty(address)) e.address = 'Address is required.';
    const cleanVars = variations
      .map((v) => ({ name: v.name.trim(), price: Number(v.price) }))
      .filter((v) => v.name && !Number.isNaN(v.price));
    if (cleanVars.length === 0) {
      e.variations = 'Add at least one variation with a name and price.';
    }
    if (!isHomeBakery && !isBrickAndMortar) {
      e.type = 'Choose at least one: home bakery or brick-and-mortar.';
    }
    setErrors(e);
    return Object.keys(e).length === 0 ? cleanVars : null;
  };

  const handleSubmit = async () => {
    const cleanVars = validate();
    if (!cleanVars) return;

    // Auto-geocode on save if we don't have coordinates yet.
    let finalCoords = coords;
    if (!finalCoords) {
      setGeocoding(true);
      finalCoords = await geocodeAddress(address);
      setGeocoding(false);
    }

    onSubmit({
      name,
      address,
      phone,
      description,
      shipping,
      isHomeBakery,
      isBrickAndMortar,
      variations: cleanVars,
      coords: finalCoords || null,
    });
  };

  return (
    <View>
      <TextField
        label="Bakery name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Bayou Sweets"
        autoCapitalize="words"
        icon="storefront-outline"
        error={errors.name}
      />

      <TextField
        label="Address"
        value={address}
        onChangeText={setAddress}
        placeholder="123 Bourbon St, New Orleans, LA"
        autoCapitalize="words"
        icon="map-marker-outline"
        error={errors.address}
      />

      <Pressable
        onPress={handleGeocode}
        style={[styles.geocodeBtn, { borderColor: colors.border, borderRadius: radius.md }]}
      >
        <MaterialCommunityIcons
          name={coords ? 'map-marker-check' : 'crosshairs-gps'}
          size={18}
          color={coords ? colors.green : colors.primary}
        />
        <Text style={[typography.small, { color: colors.text, marginLeft: 8, fontWeight: '600' }]}>
          {geocoding
            ? 'Locating…'
            : coords
            ? `Pinned: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} — tap to re-locate`
            : 'Locate address on map (for distance sorting)'}
        </Text>
      </Pressable>

      <TextField
        label="Phone number"
        value={phone}
        onChangeText={setPhone}
        placeholder="(504) 555-0142"
        keyboardType="phone-pad"
        icon="phone-outline"
      />

      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm, marginTop: spacing.xs, textTransform: 'uppercase' }]}>
        Options
      </Text>
      <CheckRow label="Offers shipping" icon="truck-fast-outline" value={shipping} onToggle={() => setShipping((v) => !v)} />
      <CheckRow label="Home bakery" icon="home-outline" value={isHomeBakery} onToggle={() => setIsHomeBakery((v) => !v)} />
      <CheckRow label="Brick-and-mortar" icon="storefront-outline" value={isBrickAndMortar} onToggle={() => setIsBrickAndMortar((v) => !v)} />
      {errors.type ? (
        <Text style={[typography.small, { color: colors.danger, marginBottom: spacing.sm }]}>{errors.type}</Text>
      ) : null}

      <View style={{ height: spacing.md }} />
      <TextField
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Tell customers what makes these king cakes special…"
        multiline
        autoCapitalize="sentences"
        icon="text"
      />

      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase' }]}>
        Variations & pricing
      </Text>

      {variations.map((row, index) => (
        <View key={index} style={styles.variationRow}>
          <View style={{ flex: 1.6, marginRight: 8 }}>
            <TextField
              value={row.name}
              onChangeText={(t) => setVariation(index, 'name', t)}
              placeholder="Traditional"
              autoCapitalize="words"
              style={{ marginBottom: 0 }}
            />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <TextField
              value={row.price}
              onChangeText={(t) => setVariation(index, 'price', t.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              keyboardType="decimal-pad"
              icon="currency-usd"
              style={{ marginBottom: 0 }}
            />
          </View>
          <Pressable
            onPress={() => removeVariationRow(index)}
            hitSlop={8}
            style={[styles.removeBtn, { opacity: variations.length === 1 ? 0.3 : 1 }]}
            disabled={variations.length === 1}
          >
            <MaterialCommunityIcons name="close-circle" size={24} color={colors.danger} />
          </Pressable>
        </View>
      ))}

      {errors.variations ? (
        <Text style={[typography.small, { color: colors.danger, marginBottom: spacing.sm }]}>
          {errors.variations}
        </Text>
      ) : null}

      <Pressable onPress={addVariationRow} style={styles.addRow}>
        <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
        <Text style={[typography.small, { color: colors.primary, marginLeft: 6, fontWeight: '700' }]}>
          Add another variation
        </Text>
      </Pressable>

      <View style={{ height: spacing.xl }} />
      <Button title={submitLabel} icon="content-save-outline" onPress={handleSubmit} loading={submitting || geocoding} />
      <View style={{ height: spacing.xxl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  geocodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  variationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  removeBtn: { padding: 2 },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
});
