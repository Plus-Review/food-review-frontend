const CATEGORY_ALIASES = {
    'makanan berat': [
        'menu utama',
        'makan kenyang',
        'nasi',
        'ayam',
        'bakso',
        'mie',
        'soto',
        'padang',
        'warteg',
        'lalapan',
        'rendang',
    ],
    'snacks & dessert': [
        'snack',
        'snacks',
        'dessert',
        'desert',
        'cemilan',
        'camilan',
        'jajanan',
        'kue',
        'roti',
        'gorengan',
        'manis',
    ],
    drink: [
        'drinks',
        'drink',
        'minuman',
        'beverage',
        'beverages',
        'kopi',
        'coffee',
        'coffe',
        'cafe',
        'caffe',
        'latte',
        'espresso',
        'americano',
        'teh',
        'tea',
        'jus',
        'juice',
        'boba',
        'susu',
        'milkshake',
    ],
};

const getReviews = (item) => (Array.isArray(item?.reviews) ? item.reviews : []);

const getAverageRating = (item) => {
    const reviews = getReviews(item);
    if (reviews.length === 0) return 0;

    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
};

export const normalizeSearchValue = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' dan ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getSearchTokens = (query) => normalizeSearchValue(query)
    .split(' ')
    .filter(Boolean);

const getCategoryAliases = (category) => {
    const normalizedCategory = normalizeSearchValue(category);
    const matchedKey = Object.keys(CATEGORY_ALIASES).find((key) => (
        normalizedCategory.includes(normalizeSearchValue(key))
        || CATEGORY_ALIASES[key].some((alias) => normalizedCategory.includes(normalizeSearchValue(alias)))
    ));

    return matchedKey ? [matchedKey, ...CATEGORY_ALIASES[matchedKey]] : [];
};

const createSearchDocumentParts = (item) => {
    const reviews = getReviews(item);
    const rating = getAverageRating(item).toFixed(1);
    const reviewCount = reviews.length;
    const categoryAliases = getCategoryAliases(item?.jenis_makanan);

    return [
        item?.nama_umkm,
        item?.jenis_makanan,
        item?.harga_range,
        item?.jam_operasional,
        item?.alamat_teks,
        item?.deskripsi,
        item?.latitude,
        item?.longitude,
        ...categoryAliases,
        `rating ${rating}`,
        `bintang ${rating}`,
        `${reviewCount} review`,
        `review ${reviewCount}`,
        ...reviews.flatMap((review) => [
            review?.komentar,
            review?.rating ? `rating ${review.rating}` : '',
            review?.User?.username,
            review?.User?.email,
        ]),
    ].filter((part) => part !== undefined && part !== null && String(part).trim());
};

export const createUmkmSearchDocument = (item) => {
    const normalized = normalizeSearchValue(createSearchDocumentParts(item).join(' '));
    const compact = normalized.replace(/\s+/g, '');

    return `${normalized} ${compact}`;
};

export const getUmkmSearchScore = (item, query) => {
    const tokens = getSearchTokens(query);
    if (tokens.length === 0) return 0;

    const normalizedQuery = normalizeSearchValue(query);
    const document = createUmkmSearchDocument(item);
    const name = normalizeSearchValue(item?.nama_umkm);
    const category = normalizeSearchValue(item?.jenis_makanan);
    const address = normalizeSearchValue(item?.alamat_teks);
    const description = normalizeSearchValue(item?.deskripsi);
    const price = normalizeSearchValue(item?.harga_range);
    const hours = normalizeSearchValue(item?.jam_operasional);

    if (!tokens.every((token) => document.includes(token))) return 0;

    let score = 10;
    if (name === normalizedQuery) score += 120;
    if (name.startsWith(normalizedQuery)) score += 80;
    if (name.includes(normalizedQuery)) score += 62;
    if (category.includes(normalizedQuery)) score += 44;
    if (address.includes(normalizedQuery)) score += 28;
    if (description.includes(normalizedQuery)) score += 22;
    if (price.includes(normalizedQuery) || hours.includes(normalizedQuery)) score += 18;

    tokens.forEach((token) => {
        if (name.includes(token)) score += 15;
        if (category.includes(token)) score += 10;
        if (address.includes(token)) score += 7;
        if (description.includes(token)) score += 5;
        if (price.includes(token) || hours.includes(token)) score += 4;
    });

    return score;
};

export const rankUmkmSearchResults = (items, query) => {
    const tokens = getSearchTokens(query);
    if (tokens.length === 0) return [...items];

    return items
        .map((item, index) => ({
            item,
            index,
            score: getUmkmSearchScore(item, query),
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map(({ item }) => item);
};

export const getSearchQueryLabel = (query) => String(query || '').trim();
