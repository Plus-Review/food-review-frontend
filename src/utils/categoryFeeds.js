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
        aliases: ['makanan berat', 'makanan utama', 'menu utama', 'heavy meal'],
    },
    {
        key: 'dessert-snacks',
        label: 'Snacks & Dessert',
        caption: 'Manis & ringan',
        description: 'Cemilan, dessert, dan jajanan ringan untuk teman ngobrol atau belajar.',
        imageUrl: 'https://images.pexels.com/photos/29380155/pexels-photo-29380155.jpeg?auto=compress&cs=tinysrgb&w=1800&h=1000&fit=crop',
        sourceUrl: 'https://www.pexels.com/photo/artisan-bakery-interior-with-freshly-baked-bread-29380155/',
        aliases: ['snacks dessert', 'snack dessert', 'snacks dan dessert', 'snack dan dessert', 'dessert snacks', 'dessert snack', 'dessert', 'desert', 'snacks', 'snack'],
    },
    {
        key: 'drinks',
        label: 'Drinks',
        caption: 'Minuman',
        description: 'Minuman segar, kopi, teh, jus, dan pilihan dingin untuk recharge singkat.',
        imageUrl: 'https://i.pinimg.com/1200x/5c/76/3f/5c763f0699fc95adcc7d3b45f9cbb1cd.jpg',
        sourceUrl: 'https://pin.it/FWi2XNI7s',
        aliases: ['drinks', 'drink', 'minuman', 'beverage', 'beverages'],
    },
];

export const normalizeCategoryText = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getExactCategoryKey = (value) => {
    const normalized = normalizeCategoryText(value);
    if (!normalized) return null;

    const matchedCategory = CATEGORY_FEEDS.find((category) => (
        [
            category.key,
            category.label,
            ...(category.aliases || []),
        ].some((alias) => normalizeCategoryText(alias) === normalized)
    ));

    return matchedCategory?.key || null;
};

export const getCategoryFeedKey = (item) => getExactCategoryKey(item?.jenis_makanan);

export const getCategoryFeedByKey = (key) => (
    CATEGORY_FEEDS.find((category) => category.key === key)
);

export const getResolvedCategoryLabel = (item) => (
    getCategoryFeedByKey(getCategoryFeedKey(item))?.label || String(item?.jenis_makanan || '').trim() || 'Kategori belum valid'
);
