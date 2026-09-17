import { createBakery } from '@/src/services/bakeries';

// A handful of demo king-cake bakeries (fictional) with real-ish New Orleans
// coordinates so distance sorting works out of the box. Superuser-only utility.
const SAMPLES = [
  {
    name: 'Bayou Sweets',
    address: '3200 Magazine St, New Orleans, LA 70115',
    phone: '(504) 555-0142',
    coords: { lat: 29.9256, lng: -90.0836 },
    isBrickAndMortar: true,
    isHomeBakery: false,
    shipping: true,
    description:
      'Uptown bakery famous for a buttery, hand-braided traditional king cake and a decadent Bavarian cream filling. Baked fresh every morning during Carnival season.',
    variations: [
      { name: 'Traditional', price: 24 },
      { name: 'Bavarian Cream', price: 32 },
      { name: 'Cream Cheese', price: 30 },
      { name: 'Praline', price: 36 },
    ],
  },
  {
    name: 'Marigny Home Bakes',
    address: '2100 Royal St, New Orleans, LA 70117',
    phone: '(504) 555-0199',
    coords: { lat: 29.9636, lng: -90.0533 },
    isBrickAndMortar: false,
    isHomeBakery: true,
    shipping: false,
    description:
      'A cozy home bakery run out of a Marigny shotgun house. Small-batch, made to order, and beloved for a lemon-berry king cake you won’t find anywhere else.',
    variations: [
      { name: 'Traditional', price: 20 },
      { name: 'Lemon-Berry', price: 28 },
      { name: 'Cream Cheese', price: 26 },
    ],
  },
  {
    name: 'Crescent City Cakery',
    address: '701 Canal St, New Orleans, LA 70130',
    phone: '(504) 555-0110',
    coords: { lat: 29.9541, lng: -90.0703 },
    isBrickAndMortar: true,
    isHomeBakery: false,
    shipping: true,
    description:
      'Downtown institution shipping king cakes nationwide. Classic recipe, generous cinnamon swirl, and the signature purple-green-gold sugar.',
    variations: [
      { name: 'Traditional', price: 27 },
      { name: 'Cream Cheese', price: 33 },
      { name: 'Chocolate', price: 35 },
    ],
  },
  {
    name: 'Garden District Patisserie',
    address: '1400 Washington Ave, New Orleans, LA 70130',
    phone: '(504) 555-0177',
    coords: { lat: 29.9285, lng: -90.0846 },
    isBrickAndMortar: true,
    isHomeBakery: false,
    shipping: false,
    description:
      'French-style patisserie with an almond-cream king cake and a gorgeous laminated dough. A more refined take on the classic.',
    variations: [
      { name: 'Traditional', price: 30 },
      { name: 'Almond Cream', price: 38 },
      { name: 'Bavarian Cream', price: 38 },
    ],
  },
  {
    name: 'Treme Sugar Shack',
    address: '1500 St Philip St, New Orleans, LA 70116',
    phone: '(504) 555-0163',
    coords: { lat: 29.9686, lng: -90.0669 },
    isBrickAndMortar: false,
    isHomeBakery: true,
    shipping: true,
    description:
      'Family home bakery with deep Treme roots. Known for a spiced sweet-potato king cake and warm hospitality. Ships within Louisiana.',
    variations: [
      { name: 'Traditional', price: 22 },
      { name: 'Sweet Potato', price: 30 },
      { name: 'Cream Cheese', price: 28 },
    ],
  },
];

/** Creates any sample bakeries. Returns how many were added. */
export async function seedSampleBakeries() {
  let created = 0;
  for (const sample of SAMPLES) {
    await createBakery(sample);
    created += 1;
  }
  return created;
}
