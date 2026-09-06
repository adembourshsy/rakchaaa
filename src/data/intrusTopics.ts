import { IntrusTopic } from '../types';

export const INTRUS_TOPIC_CATEGORIES = [
  { id: 'all', labelAr: 'الكل', labelFr: 'Toutes les catégories', labelEn: 'All Categories' },
  { id: 'places', labelAr: 'أماكن ومحلات', labelFr: 'Lieux & Sorties', labelEn: 'Places & Venues' },
  { id: 'tunisia', labelAr: 'ثقافة وتونس', labelFr: 'Culture & Tunisie 🇹🇳', labelEn: 'Tunisian Culture' },
  { id: 'food', labelAr: 'أكل ومشروبات', labelFr: 'Nourriture & Boissons', labelEn: 'Food & Drinks' },
  { id: 'activities', labelAr: 'أنشطة وهوايات', labelFr: 'Activités & Hobbies', labelEn: 'Activities & Hobbies' },
  { id: 'everyday', labelAr: 'أغراض يومية', labelFr: 'Objets du quotidien', labelEn: 'Everyday Objects' },
];

export const INTRUS_TOPICS: IntrusTopic[] = [
  // Lieux & Sorties
  { id: 't-1', title: '🏖️ Plage (الشاطئ)', category: 'places', icon: '🏖️' },
  { id: 't-2', title: '☕ Café (القهوة)', category: 'places', icon: '☕' },
  { id: 't-3', title: '🚕 Taxi (التاكسي)', category: 'places', icon: '🚕' },
  { id: 't-4', title: '⚽ Stade (الستاد)', category: 'places', icon: '⚽' },
  { id: 't-5', title: '🏬 Mall (المغازة العامة)', category: 'places', icon: '🏬' },
  { id: 't-6', title: '✈️ Aéroport (المطار)', category: 'places', icon: '✈️' },
  { id: 't-7', title: '🏫 Université (الجامعة)', category: 'places', icon: '🏫' },
  { id: 't-8', title: '🏋️ Salle de Sport (القاعة الرياضية)', category: 'places', icon: '🏋️' },
  { id: 't-9', title: '🏥 Hôpital (السبيطار)', category: 'places', icon: '🏥' },
  { id: 't-10', title: '🎬 Cinéma (السينما)', category: 'places', icon: '🎬' },
  { id: 't-11', title: '💈 Coiffeur (الحجام)', category: 'places', icon: '💈' },
  { id: 't-12', title: '🎪 Parc d\'attraction (الملاهي)', category: 'places', icon: '🎪' },

  // Culture & Tunisie 🇹🇳
  { id: 't-20', title: '🏛️ Sidi Bou Saïd (سيدي بوسعيد)', category: 'tunisia', icon: '🏛️' },
  { id: 't-21', title: '🚗 Louage (اللوااج)', category: 'tunisia', icon: '🚗' },
  { id: 't-22', title: '🫖 Thé à la Menthe (أتاي بالنعناع)', category: 'tunisia', icon: '🫖' },
  { id: 't-23', title: '📜 Examen du Bac (الباك)', category: 'tunisia', icon: '📜' },
  { id: 't-24', title: '🌴 Tozeur & Oasis (توزر والواحة)', category: 'tunisia', icon: '🌴' },
  { id: 't-25', title: '🥙 Lablebi (لبلابي)', category: 'tunisia', icon: '🥙' },
  { id: 't-26', title: '🕌 La Médina (المدينة العربي)', category: 'tunisia', icon: '🕌' },
  { id: 't-27', title: '🏖️ Hammamet (الحمامات)', category: 'tunisia', icon: '🏖️' },
  { id: 't-28', title: '🏟️ Derbi Capitale (الداربي)', category: 'tunisia', icon: '🏟️' },

  // Nourriture & Boissons
  { id: 't-40', title: '🍕 Pizza (بيتزا)', category: 'food', icon: '🍕' },
  { id: 't-41', title: '🍔 Burger (برغر)', category: 'food', icon: '🍔' },
  { id: 't-42', title: '🥐 Croissant (كرواسون)', category: 'food', icon: '🥐' },
  { id: 't-43', title: '🍣 Sushi (سوشي)', category: 'food', icon: '🍣' },
  { id: 't-44', title: '🍉 Pastèque (دلاع)', category: 'food', icon: '🍉' },
  { id: 't-45', title: '🍦 Glace (لاغلاس)', category: 'food', icon: '🍦' },
  { id: 't-46', title: '🌯 Kafteji (كفتاجي)', category: 'food', icon: '🌯' },
  { id: 't-47', title: '☕ Express Direct (قهوة أكسبريس)', category: 'food', icon: '☕' },

  // Activités & Hobbies
  { id: 't-60', title: '🎮 Gaming & Play (الجيمينغ)', category: 'activities', icon: '🎮' },
  { id: 't-61', title: '🏊 Natation (العومان)', category: 'activities', icon: '🏊' },
  { id: 't-62', title: '🏕️ Camping (الكامبينغ)', category: 'activities', icon: '🏕️' },
  { id: 't-63', title: '✈️ Voyage à l\'étranger (السفر)', category: 'activities', icon: '✈️' },
  { id: 't-64', title: '🎵 Concert & Festival (المهرجان)', category: 'activities', icon: '🎵' },
  { id: 't-65', title: '🚗 Permis de conduire (رخصة السياقة)', category: 'activities', icon: '🚗' },

  // Objets du quotidien
  { id: 't-80', title: '📱 Smartphone (التليفون)', category: 'everyday', icon: '📱' },
  { id: 't-81', title: '💻 Pc Portable (الحاسوب)', category: 'everyday', icon: '💻' },
  { id: 't-82', title: '🔑 Trousseau de Clés (المفاتيح)', category: 'everyday', icon: '🔑' },
  { id: 't-83', title: '🕶️ Lunettes de Soleil (النظارات)', category: 'everyday', icon: '🕶️' },
  { id: 't-84', title: '🎧 Casque Bluetooth (الكسك)', category: 'everyday', icon: '🎧' },
  { id: 't-85', title: '🎒 Sac à dos (المحفظة)', category: 'everyday', icon: '🎒' },
];
