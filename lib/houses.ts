const HOUSE_API_URL =
  "https://www.devillegroups.com/api/json/getHouse_deville.json";

const COVER_IMAGE_BASE_URL =
  "https://www.devillegroups.com/imgs/profile_imgs_large";

const BUDGET_MAX_PRICE = 7000;
const NEAR_SEA_MAX_DISTANCE = 4;
const INACTIVE_MIN_PRICE = "0";
const INACTIVE_MAX_PRICE = "30000";
const INACTIVE_PEOPLE = "0";

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
