const HOUSE_API_URL =
  "https://www.devillegroups.com/api/json/getHouse_deville.json";

const HOUSE_IMAGES_API_URL = "https://api.poolvilla.co.th/api/images";
const HOUSE_IMAGE_DELIVERY_BASE_URL =
  "https://d24r25u6qcb3zryipzoiqj2jxy0ilqtm.lambda-url.ap-southeast-1.on.aws";
const COVER_IMAGE_BASE_URL =
  "https://www.devillegroups.com/imgs/profile_imgs_large";

const BUDGET_MAX_PRICE = 7000;
const NEAR_SEA_MAX_DISTANCE = 4;
const INACTIVE_MIN_PRICE = "0";
const INACTIVE_MAX_PRICE = "30000";
const INACTIVE_PEOPLE = "0";
const HOUSE_IMAGES_PAGE_LIMIT = 100;
const HOUSE_IMAGES_MAX_PAGES = 10;

type ExternalHouse = {
  h_id: string;
  h_toilet: string | null;
  h_bedroom: string | null;
  h_farsea: string | null;
  price: string | null;
  img_name: string | null;
  wifi: string | null;
  grill: string | null;
  pet: string | null;
  snooker: string | null;
  discotech: string | null;
  fancyring: string | null;
  tabletennis: string | null;
  slider: string | null;
  billard: string | null;
  swimming_kid: string | null;
  swim: string | null;
  karaoke: string | null;
  airhockey: string | null;
  jacuzzi: string | null;
  bath: string | null;
  people: string | null;
};

type ExternalHouseImage = {
  property_id: number;
  cover_select: number | null;
  image_name: string | null;
  image_zone: string | null;
  image_move: number | null;
};

type HouseImagesResponse = {
  data?: ExternalHouseImage[];
  pagination?: {
    limit?: number;
    offset?: number;
  };
};

export type House = {
  id: string;
  coverImage: string | null;
  toilet: string;
  bedroom: string;
  farsea: string;
  price: string;
  wifi: string;
  grill: string;
  pet: string;
  snooker: string;
  discotech: string;
  fancyring: string;
  tabletennis: string;
  slider: string;
  billard: string;
  swimmingKid: string;
  swim: string;
  karaoke: string;
  airhockey: string;
  jacuzzi: string;
  bath: string;
  people: string;
};

export type HouseImage = {
  propertyId: number;
  imageName: string;
  url: string;
  zone: string;
  zoneLabel: string;
  order: number;
  isCoverSelected: boolean;
};

export type HouseImageGroup = {
  zone: string;
  label: string;
  images: HouseImage[];
};

export type HouseCardData = Pick<
  House,
  "id" | "coverImage" | "toilet" | "bedroom" | "farsea" | "price"
>;

export type HouseApiData = Omit<House, "swimmingKid"> & {
  swimming_kid: string;
};

export type HouseSearchParams = {
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  people?: string;
  sort?: string;
  farsea?: string;
  wifi?: string;
  grill?: string;
  pet?: string;
  snooker?: string;
  discotech?: string;
  fancyring?: string;
  tabletennis?: string;
  slider?: string;
  billard?: string;
  swimming_kid?: string;
  swim?: string;
  karaoke?: string;
  airhockey?: string;
  jacuzzi?: string;
  bath?: string;
};

type AmenityFilter = {
  param: keyof HouseSearchParams;
  field: keyof Pick<
    House,
    | "wifi"
    | "grill"
    | "pet"
    | "snooker"
    | "discotech"
    | "fancyring"
    | "tabletennis"
    | "slider"
    | "billard"
    | "swimmingKid"
    | "swim"
    | "karaoke"
    | "airhockey"
    | "jacuzzi"
    | "bath"
  >;
};

const AMENITY_FILTERS: AmenityFilter[] = [
  { param: "wifi", field: "wifi" },
  { param: "grill", field: "grill" },
  { param: "pet", field: "pet" },
  { param: "snooker", field: "snooker" },
  { param: "discotech", field: "discotech" },
  { param: "fancyring", field: "fancyring" },
  { param: "tabletennis", field: "tabletennis" },
  { param: "slider", field: "slider" },
  { param: "billard", field: "billard" },
  { param: "swimming_kid", field: "swimmingKid" },
  { param: "swim", field: "swim" },
  { param: "karaoke", field: "karaoke" },
  { param: "airhockey", field: "airhockey" },
  { param: "jacuzzi", field: "jacuzzi" },
  { param: "bath", field: "bath" },
];

const IMAGE_ZONE_LABELS: Record<string, string> = {
  cover: "รูปปก",
  outside: "ภายนอก",
  inside: "ภายใน",
  bedroom: "ห้องนอน",
  bathroom: "ห้องน้ำ",
  kitchen: "ห้องครัว",
  parking: "ที่จอดรถ",
  review: "รีวิว",
};

function withFallback(value: string | null | undefined, fallback = "ไม่มี") {
  return value?.trim() ? value : fallback;
}

function mapExternalHouse(house: ExternalHouse): House {
  return {
    id: house.h_id,
    coverImage: house.img_name
      ? `${COVER_IMAGE_BASE_URL}/${house.img_name}`
      : null,
    toilet: withFallback(house.h_toilet, "ไม่มีห้องน้ำ"),
    bedroom: withFallback(house.h_bedroom, "ไม่มีห้องนอน"),
    farsea: withFallback(house.h_farsea, "ไม่มีข้อมูล"),
    price: withFallback(house.price, "-"),
    wifi: withFallback(house.wifi),
    grill: withFallback(house.grill),
    pet: withFallback(house.pet),
    snooker: withFallback(house.snooker),
    discotech: withFallback(house.discotech),
    fancyring: withFallback(house.fancyring),
    tabletennis: withFallback(house.tabletennis),
    slider: withFallback(house.slider),
    billard: withFallback(house.billard),
    swimmingKid: withFallback(house.swimming_kid),
    swim: withFallback(house.swim),
    karaoke: withFallback(house.karaoke),
    airhockey: withFallback(house.airhockey),
    jacuzzi: withFallback(house.jacuzzi),
    bath: withFallback(house.bath),
    people: withFallback(house.people),
  };
}

export async function getHouses(): Promise<House[]> {
  const res = await fetch(HOUSE_API_URL, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch houses");
  }

  const houses = (await res.json()) as ExternalHouse[];

  return houses.map(mapExternalHouse);
}

export async function getHouseById(id: string): Promise<House | null> {
  const houses = await getHouses();

  return houses.find((house) => house.id === id) ?? null;
}

function getHouseImageUrl(imageName: string) {
  return `${HOUSE_IMAGE_DELIVERY_BASE_URL}/${encodeURIComponent(imageName)}`;
}

export function formatImageZone(zone: string | null | undefined) {
  const normalizedZone = zone?.trim().toLowerCase() || "other";

  return (
    IMAGE_ZONE_LABELS[normalizedZone] ??
    normalizedZone
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

function mapExternalHouseImage(image: ExternalHouseImage): HouseImage | null {
  const imageName = image.image_name?.trim();

  if (!imageName) return null;

  const zone = image.image_zone?.trim().toLowerCase() || "other";

  return {
    propertyId: image.property_id,
    imageName,
    url: getHouseImageUrl(imageName),
    zone,
    zoneLabel: formatImageZone(zone),
    order: image.image_move ?? 0,
    isCoverSelected: image.cover_select === 1,
  };
}

function sortHouseImages(images: HouseImage[]) {
  return images.sort((a, b) => {
    if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    if (a.order !== b.order) return a.order - b.order;

    return a.imageName.localeCompare(b.imageName);
  });
}

export async function getHouseImages(propertyId: string): Promise<HouseImage[]> {
  const token = process.env.POOLVILLA_API_TOKEN;

  if (!token) {
    return [];
  }

  const images: ExternalHouseImage[] = [];

  for (let page = 0; page < HOUSE_IMAGES_MAX_PAGES; page += 1) {
    const offset = page * HOUSE_IMAGES_PAGE_LIMIT;
    const url = new URL(HOUSE_IMAGES_API_URL);
    url.searchParams.set("property_id", propertyId);
    url.searchParams.set("limit", String(HOUSE_IMAGES_PAGE_LIMIT));
    url.searchParams.set("offset", String(offset));

    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "pool-villa-web-app/1.0",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        return [];
      }

      const body = (await res.json()) as HouseImagesResponse;
      const pageImages = Array.isArray(body.data) ? body.data : [];

      images.push(...pageImages);

      const responseLimit = body.pagination?.limit ?? HOUSE_IMAGES_PAGE_LIMIT;

      if (pageImages.length < responseLimit) {
        break;
      }
    } catch {
      return [];
    }
  }

  return sortHouseImages(
    images
      .map(mapExternalHouseImage)
      .filter((image): image is HouseImage => image !== null),
  );
}

export function groupHouseImagesByZone(
  images: HouseImage[],
): HouseImageGroup[] {
  const groups = new Map<string, HouseImage[]>();

  images.forEach((image) => {
    const group = groups.get(image.zone);

    if (group) {
      group.push(image);
    } else {
      groups.set(image.zone, [image]);
    }
  });

  return Array.from(groups.entries())
    .map(([zone, groupedImages]) => ({
      zone,
      label: formatImageZone(zone),
      images: groupedImages,
    }))
    .sort((a, b) => {
      const coverSort = Number(a.zone !== "cover") - Number(b.zone !== "cover");
      if (coverSort !== 0) return coverSort;

      return a.label.localeCompare(b.label);
    });
}

export function toHouseApiData(house: House): HouseApiData {
  const { swimmingKid, ...rest } = house;

  return {
    ...rest,
    swimming_kid: swimmingKid,
  };
}

export function toNumber(value: string | null | undefined) {
  if (!value) return null;

  const number = Number(value.replace(/,/g, ""));

  return Number.isNaN(number) ? null : number;
}

function getActiveNumber(value: string | undefined, inactiveValue?: string) {
  if (!value || value === inactiveValue) return null;

  return toNumber(value);
}

function sortByNumber(
  houses: House[],
  field: "price" | "people" | "farsea",
  direction: "asc" | "desc" = "asc",
) {
  return houses.sort((a, b) => {
    const valueA = toNumber(a[field]) ?? 0;
    const valueB = toNumber(b[field]) ?? 0;

    return direction === "asc" ? valueA - valueB : valueB - valueA;
  });
}

export function getBudgetHouses(houses: House[], limit = 12) {
  return sortByNumber(
    houses.filter((house) => {
      const price = toNumber(house.price);

      return price !== null && price <= BUDGET_MAX_PRICE;
    }),
    "price",
  ).slice(0, limit);
}

export function getNearSeaHouses(houses: House[], limit = 12) {
  return sortByNumber(
    houses.filter((house) => {
      const farsea = toNumber(house.farsea);

      return farsea !== null && farsea <= NEAR_SEA_MAX_DISTANCE;
    }),
    "farsea",
  ).slice(0, limit);
}

export function getHousesByIds(houses: House[], houseIds: string[]) {
  const housesById = new Map(houses.map((house) => [house.id, house]));

  return houseIds
    .map((houseId) => housesById.get(houseId))
    .filter((house): house is House => house !== undefined);
}

export function filterHouses(
  houses: House[],
  params: HouseSearchParams,
): House[] {
  const query = params.q?.trim().toLowerCase() ?? "";
  const minPrice = getActiveNumber(params.minPrice, INACTIVE_MIN_PRICE);
  const maxPrice = getActiveNumber(params.maxPrice, INACTIVE_MAX_PRICE);
  const selectedPeople = getActiveNumber(params.people, INACTIVE_PEOPLE);
  const sort = params.sort ?? "";

  const filteredHouses = houses.filter((house) => {
    const price = toNumber(house.price);
    const people = toNumber(house.people);

    const matchesQuery =
      !query ||
      house.id.toLowerCase().includes(query) ||
      `dv-${house.id}`.toLowerCase().includes(query);

    const matchesMinPrice =
      minPrice === null || (price !== null && price >= minPrice);

    const matchesMaxPrice =
      maxPrice === null || (price !== null && price <= maxPrice);

    const matchesPeople =
      selectedPeople === null || (people !== null && people >= selectedPeople);

    const matchesAmenities = AMENITY_FILTERS.every(
      ({ param, field }) => !params[param] || house[field] === "y",
    );

    return (
      matchesQuery &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesPeople &&
      matchesAmenities
    );
  });

  if (sort === "price_asc") {
    return sortByNumber(filteredHouses, "price");
  }

  if (sort === "price_desc") {
    return sortByNumber(filteredHouses, "price", "desc");
  }

  if (sort === "people_asc") {
    return sortByNumber(filteredHouses, "people");
  }

  if (sort === "people_desc") {
    return sortByNumber(filteredHouses, "people", "desc");
  }

  return filteredHouses;
}

export function formatSeaDistance(farsea: string | null | undefined) {
  const distance = toNumber(farsea);

  if (distance === null) return "ไม่มีข้อมูลระยะห่างจากทะเล";
  if (distance === 0) return "ติดทะเล";

  return `ห่างจากทะเล ${farsea}`;
}
