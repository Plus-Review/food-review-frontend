const makananBeratImage = 'https://images.pexels.com/photos/37073148/pexels-photo-37073148.jpeg?auto=compress&cs=tinysrgb&w=1800&h=1000&fit=crop';

export const CATEGORY_FEEDS = [
    {
        key: 'makanan-berat',
        label: 'Makanan Berat',
        caption: 'Menu utama',
        description: 'Pilihan makan kenyang untuk jeda kuliah, kerja kelompok, atau pulang kampus.',
        imageUrl: makananBeratImage,
        heroImageUrl: makananBeratImage,
        sourceUrl: 'https://images.pexels.com/photos/37073148/pexels-photo-37073148.jpeg',
        keywords: ['makanan berat', 'nasi', 'ayam', 'bakso', 'mie', 'soto', 'padang', 'warteg', 'lalapan', 'pecel', 'gado', 'rawon', 'rendang'],
    },
    {
        key: 'dessert-snacks',
        label: 'Snacks & Dessert',
        caption: 'Manis & ringan',
        description: 'Cemilan, dessert, dan jajanan ringan untuk teman ngobrol atau belajar.',
        imageUrl: 'https://images.pexels.com/photos/29380155/pexels-photo-29380155.jpeg?auto=compress&cs=tinysrgb&w=1800&h=1000&fit=crop',
        sourceUrl: 'https://www.pexels.com/photo/artisan-bakery-interior-with-freshly-baked-bread-29380155/',
        keywords: ['snacks dessert', 'dessert', 'desert', 'snack', 'snacks', 'cemilan', 'camilan', 'jajanan', 'kue', 'roti', 'gorengan', 'martabak', 'pisang', 'donat', 'puding'],
    },
    {
        key: 'drinks',
        label: 'Drinks',
        caption: 'Minuman',
        description: 'Minuman segar, kopi, teh, jus, dan pilihan dingin untuk recharge singkat.',
        imageUrl: 'https://i.pinimg.com/1200x/5c/76/3f/5c763f0699fc95adcc7d3b45f9cbb1cd.jpg',
        sourceUrl: 'https://pin.it/FWi2XNI7s',
        keywords: ['drinks', 'drink', 'minuman', 'kopi', 'coffee', 'teh', 'tea', 'jus', 'juice', 'boba', 'susu', 'milkshake'],
    },
];

export const normalizeCategoryText = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const getCategoryFeedKey = (item) => {
    const text = normalizeCategoryText([
        item?.jenis_makanan,
        item?.nama_umkm,
        item?.deskripsi,
    ].filter(Boolean).join(' '));

    const matchedCategory = CATEGORY_FEEDS.find((category) => (
        category.keywords.some((keyword) => text.includes(normalizeCategoryText(keyword)))
    ));

    return matchedCategory?.key || CATEGORY_FEEDS[0].key;
};

export const getCategoryFeedByKey = (key) => (
    CATEGORY_FEEDS.find((category) => category.key === key)
);
