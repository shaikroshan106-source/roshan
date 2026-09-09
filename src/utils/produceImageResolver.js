/**
 * produceImageResolver.js
 * 
 * Maps agricultural produce names (preset and custom, in English, Telugu, and Hindi)
 * to verified, high-resolution produce images, emojis, and colors.
 * Eliminates unrelated generic images (e.g. salad bowls).
 */

export const PRODUCE_DATABASE = {
  Chilli: {
    name: 'Chilli',
    telugu: 'మిరపకాయ (Chilli)',
    hindi: 'मिर्च (Mirchi)',
    emoji: '🌶️',
    color: '#D32F2F',
    defaultPrice: 65,
    typicalMoisture: 10,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
    keywords: ['chilli', 'chilly', 'mirchi', 'mirapa', 'pepper', 'chili', 'capsicum annuum', 'guntur chilli'],
  },
  Tomato: {
    name: 'Tomato',
    telugu: 'టమాటా (Tomato)',
    hindi: 'टमाटर (Tamatar)',
    emoji: '🍅',
    color: '#E53935',
    defaultPrice: 30,
    typicalMoisture: 12,
    imageUrl: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=600&q=80',
    keywords: ['tomato', 'tomatoes', 'tamatar', 'tamata', 'tamato'],
  },
  Onion: {
    name: 'Onion',
    telugu: 'ఉల్లిపాయ (Onion)',
    hindi: 'प्याज (Pyaaz)',
    emoji: '🧅',
    color: '#8E24AA',
    defaultPrice: 34,
    typicalMoisture: 13,
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
    keywords: ['onion', 'onions', 'pyaaz', 'ullipaya', 'ulli', 'pyaj', 'shallot'],
  },
  Potato: {
    name: 'Potato',
    telugu: 'బంగాళాదుంప (Potato)',
    hindi: 'आलू (Aloo)',
    emoji: '🥔',
    color: '#8D6E63',
    defaultPrice: 26,
    typicalMoisture: 14,
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    keywords: ['potato', 'potatoes', 'aloo', 'alu', 'bangaladumpa', 'batata'],
  },
  Garlic: {
    name: 'Garlic',
    telugu: 'వెల్లుల్లి (Garlic)',
    hindi: 'लहसुन (Lahsun)',
    emoji: '🧄',
    color: '#795548',
    defaultPrice: 85,
    typicalMoisture: 9,
    imageUrl: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=600&q=80',
    keywords: ['garlic', 'vellulli', 'lahsun', 'lasun'],
  },
  Ginger: {
    name: 'Ginger',
    telugu: 'అల్లం (Ginger)',
    hindi: 'अदरक (Adrak)',
    emoji: '🫚',
    color: '#A1887F',
    defaultPrice: 95,
    typicalMoisture: 11,
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    keywords: ['ginger', 'allam', 'adrak'],
  },
  Rice: {
    name: 'Rice',
    telugu: 'వరి / బియ్యం (Rice / Paddy)',
    hindi: 'चावल / धान (Rice)',
    emoji: '🌾',
    color: '#F9A825',
    defaultPrice: 35,
    typicalMoisture: 13,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e8c7?auto=format&fit=crop&w=600&q=80',
    keywords: ['rice', 'paddy', 'biyyam', 'vari', 'chawal', 'dhan', 'basmati', 'sona masoori'],
  },
  Cotton: {
    name: 'Cotton',
    telugu: 'పత్తి (Cotton)',
    hindi: 'कपास (Kapas)',
    emoji: '🧶',
    color: '#607D8B',
    defaultPrice: 72,
    typicalMoisture: 8,
    imageUrl: 'https://images.unsplash.com/photo-1605000797498-6f2145b1d820?auto=format&fit=crop&w=600&q=80',
    keywords: ['cotton', 'patti', 'kapas', 'kapus'],
  },
  Carrot: {
    name: 'Carrot',
    telugu: 'క్యారెట్ (Carrot)',
    hindi: 'गाजर (Gajar)',
    emoji: '🥕',
    color: '#E65100',
    defaultPrice: 40,
    typicalMoisture: 12,
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=600&q=80',
    keywords: ['carrot', 'carrots', 'gajar', 'kyarat'],
  },
  Cabbage: {
    name: 'Cabbage',
    telugu: 'క్యాబేజీ (Cabbage)',
    hindi: 'పత్తా గోభీ (Patta Gobhi)',
    emoji: '🥬',
    color: '#2E7D32',
    defaultPrice: 24,
    typicalMoisture: 13,
    imageUrl: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=600&q=80',
    keywords: ['cabbage', 'kyabeji', 'patta gobhi', 'bandha gobi'],
  },
  Brinjal: {
    name: 'Brinjal',
    telugu: 'వంకాయ (Brinjal)',
    hindi: 'बैंगन (Baingan)',
    emoji: '🍆',
    color: '#4A148C',
    defaultPrice: 32,
    typicalMoisture: 12,
    imageUrl: 'https://images.unsplash.com/photo-1528158222524-d4d912d2e20a?auto=format&fit=crop&w=600&q=80',
    keywords: ['brinjal', 'eggplant', 'vankaya', 'baingan', 'aubergine'],
  },
  Cauliflower: {
    name: 'Cauliflower',
    telugu: 'కాలీఫ్లవర్ (Cauliflower)',
    hindi: 'फूल गोभी (Phool Gobhi)',
    emoji: '🥦',
    color: '#388E3C',
    defaultPrice: 38,
    typicalMoisture: 12,
    imageUrl: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80',
    keywords: ['cauliflower', 'gobi', 'phool gobi', 'phool gobhi'],
  },
  Capsicum: {
    name: 'Capsicum',
    telugu: 'క్యాప్సికం (Capsicum)',
    hindi: 'शिमला मिर्च (Shimla Mirch)',
    emoji: '🫑',
    color: '#1B5E20',
    defaultPrice: 52,
    typicalMoisture: 11,
    imageUrl: 'https://images.unsplash.com/photo-1563565945647-40722f462a74?auto=format&fit=crop&w=600&q=80',
    keywords: ['capsicum', 'bell pepper', 'shimla mirch', 'green pepper'],
  },
  Ladyfinger: {
    name: 'Ladyfinger',
    telugu: 'బెండకాయ (Ladyfinger)',
    hindi: 'भिंडी (Bhindi)',
    emoji: '🌱',
    color: '#33691E',
    defaultPrice: 36,
    typicalMoisture: 11,
    imageUrl: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?auto=format&fit=crop&w=600&q=80',
    keywords: ['ladyfinger', 'okra', 'bhindi', 'bendakaya', 'ladies finger'],
  },
  Corn: {
    name: 'Corn',
    telugu: 'మొక్కజొన్న (Corn / Maize)',
    hindi: 'मक्का (Makka)',
    emoji: '🌽',
    color: '#FBC02D',
    defaultPrice: 28,
    typicalMoisture: 12,
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
    keywords: ['corn', 'maize', 'makka', 'mokkajonna', 'sweet corn'],
  },
  Wheat: {
    name: 'Wheat',
    telugu: 'గోధుమలు (Wheat)',
    hindi: 'गेहूं (Gehun)',
    emoji: '🌾',
    color: '#D4AC0D',
    defaultPrice: 32,
    typicalMoisture: 11,
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    keywords: ['wheat', 'gehun', 'godhumalu', 'flour'],
  },
  Groundnut: {
    name: 'Groundnut',
    telugu: 'వేరుశనగ (Groundnut)',
    hindi: 'मूंगफली (Peanut)',
    emoji: '🥜',
    color: '#795548',
    defaultPrice: 75,
    typicalMoisture: 9,
    imageUrl: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&w=600&q=80',
    keywords: ['groundnut', 'peanut', 'peanuts', 'mungphali', 'verusanaga', 'moongphali'],
  },
  Turmeric: {
    name: 'Turmeric',
    telugu: 'పసుపు (Turmeric)',
    hindi: 'हल्दी (Haldi)',
    emoji: '🌿',
    color: '#F57F17',
    defaultPrice: 110,
    typicalMoisture: 10,
    imageUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=600&q=80',
    keywords: ['turmeric', 'haldi', 'pasupu', 'curcuma'],
  },
  Mango: {
    name: 'Mango',
    telugu: 'మామిడి (Mango)',
    hindi: 'आम (Aam)',
    emoji: '🥭',
    color: '#FF8F00',
    defaultPrice: 80,
    typicalMoisture: 14,
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
    keywords: ['mango', 'aam', 'mamidi', 'alphonso', 'banganapalli'],
  },
  Banana: {
    name: 'Banana',
    telugu: 'అరటిపండు (Banana)',
    hindi: 'केला (Kela)',
    emoji: '🍌',
    color: '#FDD835',
    defaultPrice: 35,
    typicalMoisture: 15,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
    keywords: ['banana', 'kela', 'arati', 'araticaya'],
  },
};

// Preset list for quick UI chips
export const PRESET_CROPS = [
  PRODUCE_DATABASE.Chilli,
  PRODUCE_DATABASE.Tomato,
  PRODUCE_DATABASE.Onion,
  PRODUCE_DATABASE.Potato,
  PRODUCE_DATABASE.Garlic,
  PRODUCE_DATABASE.Ginger,
  PRODUCE_DATABASE.Rice,
  PRODUCE_DATABASE.Cotton,
  PRODUCE_DATABASE.Carrot,
  PRODUCE_DATABASE.Cabbage,
  PRODUCE_DATABASE.Brinjal,
  PRODUCE_DATABASE.Cauliflower,
  PRODUCE_DATABASE.Capsicum,
  PRODUCE_DATABASE.Ladyfinger,
  PRODUCE_DATABASE.Corn,
  PRODUCE_DATABASE.Groundnut,
  PRODUCE_DATABASE.Turmeric,
  PRODUCE_DATABASE.Mango,
];

/**
 * Intelligently resolves produce image:
 * 1. Returns uploadedImageUrl if provided by farmer.
 * 2. Matches exact key or fuzzy keyword against produce database.
 * 3. Never falls back to a salad bowl; returns an authentic vegetable/harvest farm image.
 */
export function resolveProduceImage(cropName = '', customImageUrl = null) {
  if (customImageUrl && typeof customImageUrl === 'string' && customImageUrl.trim().length > 5) {
    return customImageUrl;
  }

  const query = (cropName || '').toLowerCase().trim();
  if (!query) {
    return PRODUCE_DATABASE.Tomato.imageUrl;
  }

  // Exact match on produce key
  for (const [key, item] of Object.entries(PRODUCE_DATABASE)) {
    if (key.toLowerCase() === query) return item.imageUrl;
  }

  // Keyword match
  for (const item of Object.values(PRODUCE_DATABASE)) {
    if (item.keywords.some(k => query.includes(k) || k.includes(query))) {
      return item.imageUrl;
    }
  }

  // Fallback to high-definition organic harvest photo (farm field fresh produce crate, NOT salad bowl)
  return 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80';
}

export function getProduceMetadata(cropName = '') {
  const query = (cropName || '').toLowerCase().trim();
  for (const [key, item] of Object.entries(PRODUCE_DATABASE)) {
    if (key.toLowerCase() === query) return item;
  }
  for (const item of Object.values(PRODUCE_DATABASE)) {
    if (item.keywords.some(k => query.includes(k) || k.includes(query))) {
      return item;
    }
  }
  return {
    name: cropName || 'Produce',
    emoji: '🌾',
    color: '#052E2B',
    defaultPrice: 35,
    typicalMoisture: 12,
    imageUrl: resolveProduceImage(cropName),
  };
}

// Sample inspection photos for demo and testing
export const SAMPLE_PRODUCE_PHOTOS = [
  { name: 'Red Chilli (Guntur)', crop: 'Chilli', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fresh Tomato', crop: 'Tomato', url: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=600&q=80' },
  { name: 'Red Onion', crop: 'Onion', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80' },
  { name: 'Harvest Potato', crop: 'Potato', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80' },
  { name: 'Organic Garlic', crop: 'Garlic', url: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fresh Ginger', crop: 'Ginger', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80' },
];
