import { createClient } from "@/lib/supabase/server";

const HOUSE_API_URL =
  "https://www.devillegroups.com/api/json/getHouse_deville.json";

const HOUSE_IMAGES_API_URL = "https://api.poolvilla.co.th/api/images";
const HOUSE_IMAGE_DELIVERY_BASE_URL =
  "https://d24r25u6qcb3zryipzoiqj2jxy0ilqtm.lambda-url.ap-southeast-1.on.aws";
const COVER_IMAGE_BASE_URL =
  "https://www.devillegroups.com/imgs/profile_imgs_large";

const BUDGET_MAX_PRICE = 7000;
const NEAR_SEA_MAX_DISTANCE = 5;
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
  source: "external" | "internal";
  sourceId: string;
  code: string;
  name?: string;
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

export type PublicHouseGroups = {
  externalHouses: House[];
  internalHouses: House[];
};

export type PublicHouseContact = {
  name: string | null;
  phoneNumber: string;
  role: string | null;
};

export type PublicHouseFacility = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export type PublicHouseDetail = House & {
  accommodationAreaId: string;
  accommodationTypeName: string | null;
  areaName: string | null;
  zoneName: string | null;
  provinceName: string | null;
  addressDetails: string | null;
  googleMapsUrl: string | null;
  distanceToBeachMeters: number | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  youtubeUrl: string | null;
  additionalDetails: string | null;
  additionalFeeDetails: string | null;
  bedroomDetails: string | null;
  extraGuestPrice: number | null;
  securityDepositAmount: number | null;
  poolType: PoolDetailType | null;
  poolSystem: PoolSystemType | null;
  poolDescription: string | null;
  petsAllowed: boolean;
  petPolicyDetails: string | null;
  facilities: PublicHouseFacility[];
  contacts: PublicHouseContact[];
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
  "id" | "source" | "sourceId" | "code" | "name" | "coverImage" | "toilet" | "bedroom" | "farsea" | "price"
>;

export type HouseApiData = Omit<House, "swimmingKid"> & {
  swimming_kid: string;
};

export type HouseSearchParams = {
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  maxFarsea?: string;
  people?: string;
  sort?: string;
  recommended?: string;
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

export type AccommodationStatus = "published" | "archived";
export type PoolDetailType = "private" | "shared" | "none";
export type PoolSystemType = "salt" | "chlorine";

export type AdminHouseStatusFilter = AccommodationStatus | "all";

export type AdminHouseListParams = {
  q?: string;
  status?: AdminHouseStatusFilter;
};

export type AdminHouseSummary = {
  id: string;
  name: string;
  code: string;
  status: AccommodationStatus;
  accommodationTypeName: string | null;
  areaName: string | null;
  zoneName: string | null;
  provinceName: string | null;
  normalPrice: number | null;
  weekdayPriceCount: number;
  bedroomCount: number | null;
  bathroomCount: number | null;
  guestCapacity: number | null;
  distanceToBeachMeters: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminHouseAreaOption = {
  id: string;
  name: string;
  accommodationZoneId: string | null;
  zoneName: string | null;
  provinceName: string | null;
};

export type AdminHouseTypeOption = {
  id: string;
  name: string;
};

export type AdminHouseFacilityOption = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export type AdminHouseProvinceOption = {
  id: string;
  name: string;
};

export type AdminHouseZoneOption = {
  id: string;
  provinceId: string;
  name: string;
  provinceName: string | null;
};

export type AdminHouseCreateOptions = {
  areas: AdminHouseAreaOption[];
  types: AdminHouseTypeOption[];
  facilities: AdminHouseFacilityOption[];
};

export type AdminHouseSettingsData = AdminHouseCreateOptions & {
  provinces: AdminHouseProvinceOption[];
  zones: AdminHouseZoneOption[];
};

export type AdminHouseWeekdayPriceInput = {
  weekday: number;
  price: number;
  agencyPrice: number | null;
  note: string | null;
};

export const ADMIN_HOUSE_IMAGE_CATEGORIES = [
  "cover",
  "exterior",
  "interior",
  "review",
  "kitchen",
  "bathroom",
  "bedroom",
] as const;

export type AdminHouseImageCategory =
  (typeof ADMIN_HOUSE_IMAGE_CATEGORIES)[number];

export type AdminHouseImage = {
  id: string;
  accommodationId: string;
  category: AdminHouseImageCategory;
  storagePath: string;
  publicUrl: string;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminHouseImageApiData = {
  id: string;
  accommodation_id: string;
  category: AdminHouseImageCategory;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AdminHouseImageInput = {
  id: string | null;
  category: AdminHouseImageCategory;
  storagePath: string;
  publicUrl: string;
  altText: string | null;
  sortOrder: number;
};

export type AdminHouseImageGroup = {
  category: AdminHouseImageCategory;
  label: string;
  images: AdminHouseImage[];
};

export type AdminHouseCreateInput = {
  name: string;
  code: string;
  accommodationAreaId: string;
  accommodationTypeId: string;
  normalPrice: number;
  normalAgencyPrice: number | null;
  bathroomCount: number;
  bedroomCount: number;
  guestCapacity: number;
  extraGuestCapacity: number;
  addressDetails: string | null;
  googleMapsUrl: string | null;
  distanceToBeachMeters: number | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  youtubeUrl: string | null;
  additionalDetails: string | null;
  additionalFeeDetails: string | null;
  bedroomDetails: string | null;
  extraGuestPrice: number | null;
  securityDepositAmount: number | null;
  weekdayPrices: AdminHouseWeekdayPriceInput[];
  poolType: PoolDetailType;
  poolSystem: PoolSystemType | null;
  poolDescription: string | null;
  petsAllowed: boolean;
  petPolicyDetails: string | null;
  facilityIds: string[];
  contacts: AdminHouseContactInput[];
};

export type AdminHouseUpdateInput = AdminHouseCreateInput & {
  status: AccommodationStatus;
  datePrices: AdminHouseDatePriceInput[];
};

export type AdminHouseEditData = AdminHouseUpdateInput & {
  id: string;
  images: AdminHouseImage[];
  createdAt: string;
  updatedAt: string;
};

export type AdminHouseContactInput = {
  name: string | null;
  phoneNumber: string;
  role: string | null;
  isPublic: boolean;
};

export type AdminHouseDatePriceType = "special" | "holiday" | "pending" | "booked";

export type AdminHouseDatePriceInput = {
  stayDate: string;
  priceType: AdminHouseDatePriceType;
  price: number;
  agencyPrice: number | null;
  note: string | null;
  isActive: boolean;
};

type RelatedValue<T> = T | T[] | null | undefined;

type AdminHouseRow = {
  id: string;
  name: string;
  code: string;
  status: AccommodationStatus;
  created_at: string;
  updated_at: string;
  accommodation_type?: RelatedValue<{
    name: string | null;
  }>;
  area?: RelatedValue<{
    name: string | null;
    accommodation_zone?: RelatedValue<{
      name: string | null;
      province?: RelatedValue<{
        name: string | null;
      }>;
    }>;
  }>;
  pricing?: RelatedValue<{
    normal_price: number | string | null;
  }>;
  weekday_prices?: {
    id: string;
  }[] | null;
  capacity?: RelatedValue<{
    bedroom_count: number | null;
    bathroom_count: number | null;
    guest_capacity: number | null;
  }>;
  address?: RelatedValue<{
    distance_to_beach_meters: number | null;
  }>;
};

type AdminHouseAreaOptionRow = {
  id: string;
  name: string;
  accommodation_zone?: RelatedValue<{
    id: string;
    name: string | null;
    province?: RelatedValue<{
      name: string | null;
    }>;
  }>;
};

type AdminHouseTypeOptionRow = {
  id: string;
  name: string;
};

type AdminHouseFacilityOptionRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

type AdminHouseZoneOptionRow = {
  id: string;
  province_id: string;
  name: string;
  province?: RelatedValue<{
    name: string | null;
  }>;
};

type AdminHouseProvinceOptionRow = {
  id: string;
  name: string;
};

type AdminHouseImageRow = {
  id: string;
  accommodation_id: string;
  category: AdminHouseImageCategory;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type PublicAccommodationImagesRow = {
  id: string;
  code: string;
  images?: AdminHouseImageRow[] | null;
};

type PublicAccommodationHouseRow = {
  id: string;
  name: string;
  code: string;
  status: AccommodationStatus;
  created_at: string;
  updated_at: string;
  area?: RelatedValue<{
    name: string | null;
    accommodation_zone?: RelatedValue<{
      name: string | null;
      province?: RelatedValue<{
        name: string | null;
      }>;
    }>;
  }>;
  pricing?: RelatedValue<{
    normal_price: number | string | null;
  }>;
  capacity?: RelatedValue<{
    bathroom_count: number | null;
    bedroom_count: number | null;
    guest_capacity: number | null;
  }>;
  address?: RelatedValue<{
    distance_to_beach_meters: number | null;
  }>;
  pool?: RelatedValue<{
    type: PoolDetailType | null;
    system: PoolSystemType | null;
  }>;
  pet_policy?: RelatedValue<{
    pets_allowed: boolean | null;
  }>;
  facilities?: Array<{
    facility?: RelatedValue<{
      slug: string | null;
    }>;
  }> | null;
  images?: AdminHouseImageRow[] | null;
};

type PublicAccommodationDetailRow = {
  id: string;
  name: string;
  code: string;
  status: AccommodationStatus;
  accommodation_area_id: string;
  created_at: string;
  updated_at: string;
  accommodation_type?: RelatedValue<{
    name: string | null;
  }>;
  area?: RelatedValue<{
    name: string | null;
    accommodation_zone?: RelatedValue<{
      name: string | null;
      province?: RelatedValue<{
        name: string | null;
      }>;
    }>;
  }>;
  pricing?: RelatedValue<{
    normal_price: number | string | null;
    extra_guest_price: number | string | null;
    security_deposit_amount: number | string | null;
  }>;
  capacity?: RelatedValue<{
    bathroom_count: number | null;
    bedroom_count: number | null;
    bedroom_details: string | null;
    guest_capacity: number | null;
    extra_guest_capacity: number | null;
  }>;
  address?: RelatedValue<{
    address_details: string | null;
    google_maps_url: string | null;
    distance_to_beach_meters: number | null;
  }>;
  pool?: RelatedValue<{
    description: string | null;
    type: PoolDetailType | null;
    system: PoolSystemType | null;
  }>;
  pet_policy?: RelatedValue<{
    pets_allowed: boolean | null;
    details: string | null;
  }>;
  facilities?: Array<{
    facility?: RelatedValue<{
      id: string;
      name: string;
      slug: string;
      icon: string | null;
    }>;
  }> | null;
  contacts?: Array<{
    name: string | null;
    phone_number: string;
    role: string | null;
    is_public: boolean;
  }> | null;
  check_in_time: string | null;
  check_out_time: string | null;
  youtube_url: string | null;
  additional_details: string | null;
  additional_fee_details: string | null;
  images?: AdminHouseImageRow[] | null;
};

type AdminHouseEditRow = {
  id: string;
  name: string;
  code: string;
  status: AccommodationStatus;
  accommodation_area_id: string;
  accommodation_type_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  youtube_url: string | null;
  additional_details: string | null;
  additional_fee_details: string | null;
  created_at: string;
  updated_at: string;
  address?: RelatedValue<{
    address_details: string | null;
    google_maps_url: string | null;
    distance_to_beach_meters: number | null;
  }>;
  capacity?: RelatedValue<{
    bathroom_count: number | null;
    bedroom_count: number | null;
    bedroom_details: string | null;
    guest_capacity: number | null;
    extra_guest_capacity: number | null;
  }>;
  pricing?: RelatedValue<{
    normal_price: number | string | null;
    normal_agency_price: number | string | null;
    extra_guest_price: number | string | null;
    security_deposit_amount: number | string | null;
  }>;
  weekday_prices?: Array<{
    weekday: number;
    price: number | string | null;
    agency_price: number | string | null;
    note: string | null;
  }> | null;
  pool?: RelatedValue<{
    description: string | null;
    type: PoolDetailType | null;
    system: PoolSystemType | null;
  }>;
  pet_policy?: RelatedValue<{
    pets_allowed: boolean | null;
    details: string | null;
  }>;
  facilities?: Array<{
    facility_id: string;
  }> | null;
  contacts?: Array<{
    name: string | null;
    phone_number: string;
    role: string | null;
    is_public: boolean;
  }> | null;
  date_prices?: Array<{
    stay_date: string;
    price_type: AdminHouseDatePriceType;
    price: number | string | null;
    agency_price: number | string | null;
    note: string | null;
    is_active: boolean;
  }> | null;
  images?: AdminHouseImageRow[] | null;
};

type ParsedAdminHouseCreateInput =
  | { ok: true; data: AdminHouseCreateInput }
  | { ok: false; error: string };

type ParsedAdminHouseUpdateInput =
  | { ok: true; data: AdminHouseUpdateInput }
  | { ok: false; error: string };

type ParsedAdminHouseImagesInput =
  | { ok: true; data: AdminHouseImageInput[] }
  | { ok: false; error: string };

const ADMIN_HOUSES_SELECT = `
  id,
  name,
  code,
  status,
  created_at,
  updated_at,
  accommodation_type:accommodation_types(name),
  area:accommodation_areas(
    name,
    accommodation_zone:accommodation_zones(
      name,
      province:provinces(name)
    )
  ),
  pricing:accommodation_pricing(normal_price),
  weekday_prices:accommodation_weekday_prices(id),
  capacity:accommodation_capacity(
    bedroom_count,
    bathroom_count,
    guest_capacity
  ),
  address:accommodation_addresses(distance_to_beach_meters)
`;

const ADMIN_HOUSE_AREAS_SELECT = `
  id,
  name,
  accommodation_zone:accommodation_zones(
    id,
    name,
    province:provinces(name)
  )
`;

const ADMIN_HOUSE_IMAGES_SELECT = `
  id,
  accommodation_id,
  category,
  storage_path,
  public_url,
  alt_text,
  sort_order,
  created_at,
  updated_at
`;

const PUBLIC_ACCOMMODATION_IMAGES_SELECT = `
  id,
  code,
  images:accommodation_images(
    ${ADMIN_HOUSE_IMAGES_SELECT}
  )
`;

const ADMIN_HOUSE_EDIT_SELECT = `
  id,
  name,
  code,
  status,
  accommodation_area_id,
  accommodation_type_id,
  check_in_time,
  check_out_time,
  youtube_url,
  additional_details,
  additional_fee_details,
  created_at,
  updated_at,
  address:accommodation_addresses(
    address_details,
    google_maps_url,
    distance_to_beach_meters
  ),
  capacity:accommodation_capacity(
    bathroom_count,
    bedroom_count,
    bedroom_details,
    guest_capacity,
    extra_guest_capacity
  ),
  pricing:accommodation_pricing(
    normal_price,
    normal_agency_price,
    extra_guest_price,
    security_deposit_amount
  ),
  weekday_prices:accommodation_weekday_prices(
    weekday,
    price,
    agency_price,
    note
  ),
  pool:pool_details(
    description,
    type,
    system
  ),
  pet_policy:accommodation_pet_policies(
    pets_allowed,
    details
  ),
  facilities:accommodation_facilities(facility_id),
  contacts:accommodation_contacts(
    name,
    phone_number,
    role,
    is_public
  ),
  date_prices:accommodation_date_prices(
    stay_date,
    price_type,
    price,
    agency_price,
    note,
    is_active
  ),
  images:accommodation_images(
    ${ADMIN_HOUSE_IMAGES_SELECT}
  )
`;

const PUBLIC_HOUSES_SELECT = `
  id,
  name,
  code,
  status,
  created_at,
  updated_at,
  area:accommodation_areas(
    name,
    accommodation_zone:accommodation_zones(
      name,
      province:provinces(name)
    )
  ),
  pricing:accommodation_pricing(normal_price),
  capacity:accommodation_capacity(
    bathroom_count,
    bedroom_count,
    guest_capacity
  ),
  address:accommodation_addresses(distance_to_beach_meters),
  pool:pool_details(
    type,
    system
  ),
  pet_policy:accommodation_pet_policies(pets_allowed),
  facilities:accommodation_facilities(
    facility:facilities(slug)
  ),
  images:accommodation_images(
    ${ADMIN_HOUSE_IMAGES_SELECT}
  )
`;

const PUBLIC_HOUSE_DETAIL_SELECT = `
  id,
  name,
  code,
  status,
  accommodation_area_id,
  created_at,
  updated_at,
  accommodation_type:accommodation_types(name),
  area:accommodation_areas(
    name,
    accommodation_zone:accommodation_zones(
      name,
      province:provinces(name)
    )
  ),
  pricing:accommodation_pricing(
    normal_price,
    extra_guest_price,
    security_deposit_amount
  ),
  capacity:accommodation_capacity(
    bathroom_count,
    bedroom_count,
    bedroom_details,
    guest_capacity,
    extra_guest_capacity
  ),
  address:accommodation_addresses(
    address_details,
    google_maps_url,
    distance_to_beach_meters
  ),
  pool:pool_details(
    description,
    type,
    system
  ),
  pet_policy:accommodation_pet_policies(
    pets_allowed,
    details
  ),
  facilities:accommodation_facilities(
    facility:facilities(
      id,
      name,
      slug,
      icon
    )
  ),
  contacts:accommodation_contacts(
    name,
    phone_number,
    role,
    is_public
  ),
  check_in_time,
  check_out_time,
  youtube_url,
  additional_details,
  additional_fee_details,
  images:accommodation_images(
    ${ADMIN_HOUSE_IMAGES_SELECT}
  )
`;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

const ADMIN_HOUSE_IMAGE_CATEGORY_LABELS: Record<
  AdminHouseImageCategory,
  string
> = {
  cover: "รูปปก",
  exterior: "ภายนอก",
  interior: "ภายใน",
  review: "รีวิว",
  kitchen: "ห้องครัว",
  bathroom: "ห้องน้ำ",
  bedroom: "ห้องนอน",
};

export function normalizeAdminHouseStatusFilter(
  status: string | null | undefined,
): AdminHouseStatusFilter {
  return status === "published" || status === "archived" ? status : "all";
}

function firstRelated<T>(value: RelatedValue<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function toOptionalNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || value.trim() === "") return null;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

export function isAdminHouseImageCategory(
  category: unknown,
): category is AdminHouseImageCategory {
  return (
    typeof category === "string" &&
    ADMIN_HOUSE_IMAGE_CATEGORIES.includes(
      category as AdminHouseImageCategory,
    )
  );
}

export function formatAdminHouseImageCategory(
  category: AdminHouseImageCategory,
) {
  return ADMIN_HOUSE_IMAGE_CATEGORY_LABELS[category];
}

function sortAdminHouseImages(images: AdminHouseImage[]) {
  const categoryOrder = new Map(
    ADMIN_HOUSE_IMAGE_CATEGORIES.map((category, index) => [category, index]),
  );

  return images.sort((a, b) => {
    const categorySort =
      (categoryOrder.get(a.category) ?? Number.MAX_SAFE_INTEGER) -
      (categoryOrder.get(b.category) ?? Number.MAX_SAFE_INTEGER);

    if (categorySort !== 0) return categorySort;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;

    return a.storagePath.localeCompare(b.storagePath);
  });
}

function sortAdminHouseImageInputs(images: AdminHouseImageInput[]) {
  const categoryOrder = new Map(
    ADMIN_HOUSE_IMAGE_CATEGORIES.map((category, index) => [category, index]),
  );

  return [...images].sort((a, b) => {
    const categorySort =
      (categoryOrder.get(a.category) ?? Number.MAX_SAFE_INTEGER) -
      (categoryOrder.get(b.category) ?? Number.MAX_SAFE_INTEGER);

    if (categorySort !== 0) return categorySort;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;

    return a.storagePath.localeCompare(b.storagePath);
  });
}

function mapAdminHouseImage(row: AdminHouseImageRow): AdminHouseImage {
  return {
    id: row.id,
    accommodationId: row.accommodation_id,
    category: row.category,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAdminHouseSummary(row: AdminHouseRow): AdminHouseSummary {
  const accommodationType = firstRelated(row.accommodation_type);
  const area = firstRelated(row.area);
  const zone = firstRelated(area?.accommodation_zone);
  const province = firstRelated(zone?.province);
  const pricing = firstRelated(row.pricing);
  const capacity = firstRelated(row.capacity);
  const address = firstRelated(row.address);

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    status: row.status,
    accommodationTypeName: accommodationType?.name ?? null,
    areaName: area?.name ?? null,
    zoneName: zone?.name ?? null,
    provinceName: province?.name ?? null,
    normalPrice: toOptionalNumber(pricing?.normal_price),
    weekdayPriceCount: row.weekday_prices?.length ?? 0,
    bedroomCount: capacity?.bedroom_count ?? null,
    bathroomCount: capacity?.bathroom_count ?? null,
    guestCapacity: capacity?.guest_capacity ?? null,
    distanceToBeachMeters: address?.distance_to_beach_meters ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatInternalHouseNumber(
  value: number | null | undefined,
  fallback = "0",
) {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : fallback;
}

function formatInternalHousePrice(value: number | string | null | undefined) {
  const price = toOptionalNumber(value);

  return price === null ? "-" : String(Math.round(price));
}

function formatInternalHouseSeaDistance(
  distanceToBeachMeters: number | null | undefined,
) {
  if (
    typeof distanceToBeachMeters !== "number" ||
    !Number.isFinite(distanceToBeachMeters)
  ) {
    return "";
  }

  return `${distanceToBeachMeters / 1000} km`;
}

function toHouseFlag(value: boolean) {
  return value ? "y" : "n";
}

function getFacilitySlugs(row: PublicAccommodationHouseRow) {
  return new Set(
    (row.facilities ?? [])
      .map((item) => firstRelated(item.facility)?.slug?.trim().toLowerCase())
      .filter((slug): slug is string => Boolean(slug)),
  );
}

function hasFacilitySlug(slugs: Set<string>, candidates: string[]) {
  return candidates.some((candidate) => slugs.has(candidate));
}

function getInternalPoolFlag(
  pool: RelatedValue<{
    type: PoolDetailType | null;
    system: PoolSystemType | null;
  }>,
) {
  const poolDetails = firstRelated(pool);

  if (!poolDetails || poolDetails.type === "none") {
    return "n";
  }

  return poolDetails.system ?? "y";
}

function mapInternalAccommodationToHouse(
  row: PublicAccommodationHouseRow,
): House {
  const pricing = firstRelated(row.pricing);
  const capacity = firstRelated(row.capacity);
  const address = firstRelated(row.address);
  const petPolicy = firstRelated(row.pet_policy);
  const facilitySlugs = getFacilitySlugs(row);
  const coverImage =
    getHouseCoverImage((row.images ?? []).map(mapAdminHouseImage))?.publicUrl ??
    null;

  return {
    id: row.code,
    source: "internal",
    sourceId: row.id,
    code: row.code,
    name: row.name,
    coverImage,
    toilet: formatInternalHouseNumber(capacity?.bathroom_count),
    bedroom: formatInternalHouseNumber(capacity?.bedroom_count),
    farsea: formatInternalHouseSeaDistance(address?.distance_to_beach_meters),
    price: formatInternalHousePrice(pricing?.normal_price),
    wifi: toHouseFlag(hasFacilitySlug(facilitySlugs, ["wifi", "wi-fi"])),
    grill: toHouseFlag(
      hasFacilitySlug(facilitySlugs, ["grill", "bbq", "barbecue"]),
    ),
    pet: toHouseFlag(Boolean(petPolicy?.pets_allowed)),
    snooker: toHouseFlag(hasFacilitySlug(facilitySlugs, ["snooker"])),
    discotech: toHouseFlag(
      hasFacilitySlug(facilitySlugs, ["discotech", "disco", "party"]),
    ),
    fancyring: toHouseFlag(hasFacilitySlug(facilitySlugs, ["fancyring"])),
    tabletennis: toHouseFlag(
      hasFacilitySlug(facilitySlugs, [
        "tabletennis",
        "table-tennis",
        "pingpong",
      ]),
    ),
    slider: toHouseFlag(
      hasFacilitySlug(facilitySlugs, ["slider", "water-slider"]),
    ),
    billard: toHouseFlag(
      hasFacilitySlug(facilitySlugs, ["billard", "billiard", "pool-table"]),
    ),
    swimmingKid: toHouseFlag(
      hasFacilitySlug(facilitySlugs, [
        "swimming_kid",
        "swimming-kid",
        "kid-pool",
        "kids-pool",
      ]),
    ),
    swim: getInternalPoolFlag(row.pool),
    karaoke: toHouseFlag(hasFacilitySlug(facilitySlugs, ["karaoke"])),
    airhockey: toHouseFlag(
      hasFacilitySlug(facilitySlugs, ["airhockey", "air-hockey"]),
    ),
    jacuzzi: toHouseFlag(hasFacilitySlug(facilitySlugs, ["jacuzzi"])),
    bath: toHouseFlag(hasFacilitySlug(facilitySlugs, ["bath", "bathtub"])),
    people: formatInternalHouseNumber(capacity?.guest_capacity),
  };
}

function mapPublicAccommodationDetail(
  row: PublicAccommodationDetailRow,
): PublicHouseDetail {
  const baseHouse = mapInternalAccommodationToHouse(row);
  const area = firstRelated(row.area);
  const zone = firstRelated(area?.accommodation_zone);
  const province = firstRelated(zone?.province);
  const pricing = firstRelated(row.pricing);
  const capacity = firstRelated(row.capacity);
  const address = firstRelated(row.address);
  const pool = firstRelated(row.pool);
  const petPolicy = firstRelated(row.pet_policy);
  const accommodationType = firstRelated(row.accommodation_type);
  const facilities = (row.facilities ?? [])
    .map((item) => firstRelated(item.facility))
    .filter((facility): facility is PublicHouseFacility => Boolean(facility));
  const contacts = (row.contacts ?? [])
    .filter((contact) => contact.is_public)
    .map((contact) => ({
      name: contact.name,
      phoneNumber: contact.phone_number,
      role: contact.role,
    }));

  return {
    ...baseHouse,
    accommodationAreaId: row.accommodation_area_id,
    accommodationTypeName: accommodationType?.name ?? null,
    areaName: area?.name ?? null,
    zoneName: zone?.name ?? null,
    provinceName: province?.name ?? null,
    addressDetails: address?.address_details ?? null,
    googleMapsUrl: address?.google_maps_url ?? null,
    distanceToBeachMeters: address?.distance_to_beach_meters ?? null,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
    youtubeUrl: row.youtube_url,
    additionalDetails: row.additional_details,
    additionalFeeDetails: row.additional_fee_details,
    bedroomDetails: capacity?.bedroom_details ?? null,
    extraGuestPrice: toOptionalNumber(pricing?.extra_guest_price),
    securityDepositAmount: toOptionalNumber(pricing?.security_deposit_amount),
    poolType: pool?.type ?? null,
    poolSystem: pool?.system ?? null,
    poolDescription: pool?.description ?? null,
    petsAllowed: petPolicy?.pets_allowed ?? false,
    petPolicyDetails: petPolicy?.details ?? null,
    facilities,
    contacts,
  };
}

function mapAdminHouseAreaOption(
  row: AdminHouseAreaOptionRow,
): AdminHouseAreaOption {
  const zone = firstRelated(row.accommodation_zone);
  const province = firstRelated(zone?.province);

  return {
    id: row.id,
    name: row.name,
    accommodationZoneId: zone?.id ?? null,
    zoneName: zone?.name ?? null,
    provinceName: province?.name ?? null,
  };
}

function mapAdminHouseZoneOption(
  row: AdminHouseZoneOptionRow,
): AdminHouseZoneOption {
  const province = firstRelated(row.province);

  return {
    id: row.id,
    provinceId: row.province_id,
    name: row.name,
    provinceName: province?.name ?? null,
  };
}

function mapAdminHouseEditData(row: AdminHouseEditRow): AdminHouseEditData {
  const address = firstRelated(row.address);
  const capacity = firstRelated(row.capacity);
  const pricing = firstRelated(row.pricing);
  const pool = firstRelated(row.pool);
  const petPolicy = firstRelated(row.pet_policy);

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    status: row.status,
    accommodationAreaId: row.accommodation_area_id,
    accommodationTypeId: row.accommodation_type_id,
    normalPrice: toOptionalNumber(pricing?.normal_price) ?? 0,
    normalAgencyPrice: toOptionalNumber(pricing?.normal_agency_price),
    bathroomCount: capacity?.bathroom_count ?? 0,
    bedroomCount: capacity?.bedroom_count ?? 0,
    guestCapacity: capacity?.guest_capacity ?? 1,
    extraGuestCapacity: capacity?.extra_guest_capacity ?? 0,
    addressDetails: address?.address_details ?? null,
    googleMapsUrl: address?.google_maps_url ?? null,
    distanceToBeachMeters: address?.distance_to_beach_meters ?? null,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
    youtubeUrl: row.youtube_url,
    additionalDetails: row.additional_details,
    additionalFeeDetails: row.additional_fee_details,
    bedroomDetails: capacity?.bedroom_details ?? null,
    extraGuestPrice: toOptionalNumber(pricing?.extra_guest_price),
    securityDepositAmount: toOptionalNumber(
      pricing?.security_deposit_amount,
    ),
    weekdayPrices: (row.weekday_prices ?? [])
      .map((weekdayPrice) => ({
        weekday: weekdayPrice.weekday,
        price: toOptionalNumber(weekdayPrice.price) ?? 0,
        agencyPrice: toOptionalNumber(weekdayPrice.agency_price),
        note: weekdayPrice.note,
      }))
      .sort((a, b) => a.weekday - b.weekday),
    poolType: pool?.type ?? "none",
    poolSystem: pool?.system ?? null,
    poolDescription: pool?.description ?? null,
    petsAllowed: petPolicy?.pets_allowed ?? false,
    petPolicyDetails: petPolicy?.details ?? null,
    facilityIds: (row.facilities ?? []).map((facility) => facility.facility_id),
    contacts: (row.contacts ?? []).map((contact) => ({
      name: contact.name,
      phoneNumber: contact.phone_number,
      role: contact.role,
      isPublic: contact.is_public,
    })),
    datePrices: (row.date_prices ?? [])
      .map((datePrice) => ({
        stayDate: datePrice.stay_date,
        priceType: datePrice.price_type,
        price: toOptionalNumber(datePrice.price) ?? 0,
        agencyPrice: toOptionalNumber(datePrice.agency_price),
        note: datePrice.note,
        isActive: datePrice.is_active,
      }))
      .sort((a, b) => a.stayDate.localeCompare(b.stayDate)),
    images: sortAdminHouseImages((row.images ?? []).map(mapAdminHouseImage)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function matchesAdminHouseQuery(house: AdminHouseSummary, query: string) {
  if (!query) return true;

  const searchableText = [
    house.name,
    house.code,
    house.accommodationTypeName,
    house.areaName,
    house.zoneName,
    house.provinceName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query);
}

function sortAdminHouseAreaOptions(
  a: AdminHouseAreaOption,
  b: AdminHouseAreaOption,
) {
  return [
    a.provinceName ?? "",
    a.zoneName ?? "",
    a.name,
    a.id,
  ]
    .join("/")
    .localeCompare(
      [b.provinceName ?? "", b.zoneName ?? "", b.name, b.id].join("/"),
    );
}

export async function getAdminHouseSummaries(
  params: AdminHouseListParams = {},
) {
  const supabase = await createClient();
  const status = params.status ?? "all";
  const query = params.q?.trim().toLowerCase() ?? "";

  let request = supabase
    .from("accommodations")
    .select(ADMIN_HOUSES_SELECT)
    .order("created_at", { ascending: false })
    .limit(300);

  if (status !== "all") {
    request = request.eq("status", status);
  }

  const { data, error } = await request.returns<AdminHouseRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data
    .map(mapAdminHouseSummary)
    .filter((house) => matchesAdminHouseQuery(house, query));
}

export async function getAdminHouseCreateOptions(): Promise<AdminHouseCreateOptions> {
  const supabase = await createClient();
  const [areasResult, typesResult, facilitiesResult] = await Promise.all([
    supabase
      .from("accommodation_areas")
      .select(ADMIN_HOUSE_AREAS_SELECT)
      .returns<AdminHouseAreaOptionRow[]>(),
    supabase
      .from("accommodation_types")
      .select("id, name")
      .order("name")
      .returns<AdminHouseTypeOptionRow[]>(),
    supabase
      .from("facilities")
      .select("id, name, slug, icon")
      .order("name")
      .returns<AdminHouseFacilityOptionRow[]>(),
  ]);

  if (areasResult.error) {
    throw new Error(areasResult.error.message);
  }

  if (typesResult.error) {
    throw new Error(typesResult.error.message);
  }

  if (facilitiesResult.error) {
    throw new Error(facilitiesResult.error.message);
  }

  return {
    areas: areasResult.data
      .map(mapAdminHouseAreaOption)
      .sort(sortAdminHouseAreaOptions),
    types: typesResult.data,
    facilities: facilitiesResult.data,
  };
}

export async function getAdminHouseSettingsData(): Promise<AdminHouseSettingsData> {
  const supabase = await createClient();
  const [provincesResult, zonesResult, createOptions] = await Promise.all([
    supabase
      .from("provinces")
      .select("id, name")
      .order("name")
      .returns<AdminHouseProvinceOptionRow[]>(),
    supabase
      .from("accommodation_zones")
      .select("id, province_id, name, province:provinces(name)")
      .order("name")
      .returns<AdminHouseZoneOptionRow[]>(),
    getAdminHouseCreateOptions(),
  ]);

  if (provincesResult.error) {
    throw new Error(provincesResult.error.message);
  }

  if (zonesResult.error) {
    throw new Error(zonesResult.error.message);
  }

  return {
    ...createOptions,
    provinces: provincesResult.data,
    zones: zonesResult.data.map(mapAdminHouseZoneOption),
  };
}

export async function createAdminHouseProvince(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("provinces")
    .insert({ name })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(getSupabaseHouseCreateErrorMessage(error, "Province already exists."));
  }

  return data.id;
}

export async function createAdminHouseZone(input: {
  provinceId: string;
  name: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodation_zones")
    .insert({
      province_id: input.provinceId,
      name: input.name,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(getSupabaseHouseCreateErrorMessage(error, "Zone already exists."));
  }

  return data.id;
}

export async function createAdminHouseArea(input: {
  accommodationZoneId: string;
  name: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodation_areas")
    .insert({
      accommodation_zone_id: input.accommodationZoneId,
      name: input.name,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(getSupabaseHouseCreateErrorMessage(error, "Area already exists."));
  }

  return data.id;
}

export async function createAdminHouseType(name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodation_types")
    .insert({ name })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(getSupabaseHouseCreateErrorMessage(error, "Type already exists."));
  }

  return data.id;
}

export async function createAdminHouseFacility(input: {
  name: string;
  slug: string;
  icon: string | null;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facilities")
    .insert({
      name: input.name,
      slug: input.slug,
      icon: input.icon,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(getSupabaseHouseCreateErrorMessage(error, "Facility already exists."));
  }

  return data.id;
}

export async function updateAdminHouseProvince(input: {
  id: string;
  name: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("provinces")
    .update({ name: input.name })
    .eq("id", input.id);

  if (error) {
    throw new Error(getSupabaseHouseCreateErrorMessage(error, "Province already exists."));
  }
}

export async function updateAdminHouseZone(input: {
  id: string;
  provinceId: string;
  name: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accommodation_zones")
    .update({
      province_id: input.provinceId,
      name: input.name,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(getSupabaseHouseCreateErrorMessage(error, "Zone already exists."));
  }
}

export async function updateAdminHouseArea(input: {
  id: string;
  accommodationZoneId: string;
  name: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accommodation_areas")
    .update({
      accommodation_zone_id: input.accommodationZoneId,
      name: input.name,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(getSupabaseHouseCreateErrorMessage(error, "Area already exists."));
  }
}

export async function updateAdminHouseType(input: { id: string; name: string }) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accommodation_types")
    .update({ name: input.name })
    .eq("id", input.id);

  if (error) {
    throw new Error(getSupabaseHouseCreateErrorMessage(error, "Type already exists."));
  }
}

export async function updateAdminHouseFacility(input: {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("facilities")
    .update({
      name: input.name,
      slug: input.slug,
      icon: input.icon,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error(getSupabaseHouseCreateErrorMessage(error, "Facility already exists."));
  }
}

export async function getAdminHouseForEdit(
  id: string,
): Promise<AdminHouseEditData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodations")
    .select(ADMIN_HOUSE_EDIT_SELECT)
    .eq("id", id)
    .maybeSingle<AdminHouseEditRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapAdminHouseEditData(data) : null;
}

export async function getAdminHouseImages(
  accommodationId: string,
): Promise<AdminHouseImage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodation_images")
    .select(ADMIN_HOUSE_IMAGES_SELECT)
    .eq("accommodation_id", accommodationId)
    .order("category")
    .order("sort_order")
    .order("created_at")
    .returns<AdminHouseImageRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return sortAdminHouseImages(data.map(mapAdminHouseImage));
}

export function getHouseCoverImage(images: AdminHouseImage[]) {
  const sortedImages = sortAdminHouseImages([...images]);

  return (
    sortedImages.find((image) => image.category === "cover") ??
    sortedImages[0] ??
    null
  );
}

function getHouseCodeCandidates(houseId: string) {
  const trimmedId = houseId.trim();
  const withoutPrefix = trimmedId.replace(/^DV-/i, "");
  const candidates = [
    trimmedId,
    trimmedId.toUpperCase(),
    trimmedId.toLowerCase(),
    withoutPrefix,
    `DV-${withoutPrefix}`,
    `dv-${withoutPrefix}`,
  ].filter(Boolean);

  return Array.from(new Set(candidates));
}

function getAllHouseCodeCandidates(houseIds: string[]) {
  return Array.from(
    new Set(houseIds.flatMap((houseId) => getHouseCodeCandidates(houseId))),
  );
}

function mapAdminHouseImageToHouseImage(
  image: AdminHouseImage,
  houseId: string,
): HouseImage {
  const numericPropertyId = Number.parseInt(houseId.replace(/\D/g, ""), 10);

  return {
    propertyId: Number.isFinite(numericPropertyId) ? numericPropertyId : 0,
    imageName: image.storagePath,
    url: image.publicUrl,
    zone: image.category,
    zoneLabel: formatAdminHouseImageCategory(image.category),
    order: image.sortOrder,
    isCoverSelected: image.category === "cover",
  };
}

export async function getPublicAccommodationImagesByHouseIds(
  houseIds: string[],
) {
  const uniqueHouseIds = Array.from(
    new Set(houseIds.map((houseId) => houseId.trim()).filter(Boolean)),
  );

  if (uniqueHouseIds.length === 0) {
    return new Map<string, AdminHouseImage[]>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodations")
    .select(PUBLIC_ACCOMMODATION_IMAGES_SELECT)
    .eq("status", "published")
    .in("code", getAllHouseCodeCandidates(uniqueHouseIds))
    .returns<PublicAccommodationImagesRow[]>();

  if (error) {
    return new Map<string, AdminHouseImage[]>();
  }

  const imagesByHouseId = new Map<string, AdminHouseImage[]>();

  uniqueHouseIds.forEach((houseId) => {
    const codeCandidates = new Set(getHouseCodeCandidates(houseId));
    const row = data.find((item) => codeCandidates.has(item.code));

    if (!row) return;

    imagesByHouseId.set(
      houseId,
      sortAdminHouseImages((row.images ?? []).map(mapAdminHouseImage)),
    );
  });

  return imagesByHouseId;
}

export async function getPublicAccommodationImagesByAccommodationIds(
  accommodationIds: string[],
) {
  const uniqueAccommodationIds = Array.from(
    new Set(accommodationIds.map((id) => id.trim()).filter(Boolean)),
  );

  if (uniqueAccommodationIds.length === 0) {
    return new Map<string, AdminHouseImage[]>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodations")
    .select(PUBLIC_ACCOMMODATION_IMAGES_SELECT)
    .eq("status", "published")
    .in("id", uniqueAccommodationIds)
    .returns<PublicAccommodationImagesRow[]>();

  if (error) {
    return new Map<string, AdminHouseImage[]>();
  }

  const imagesByAccommodationId = new Map<string, AdminHouseImage[]>();

  uniqueAccommodationIds.forEach((accommodationId) => {
    const row = data.find((item) => item.id === accommodationId);

    if (!row) return;

    imagesByAccommodationId.set(
      accommodationId,
      sortAdminHouseImages((row.images ?? []).map(mapAdminHouseImage)),
    );
  });

  return imagesByAccommodationId;
}

export async function getPublicHouseImages(houseId: string) {
  const imagesByHouseId = await getPublicAccommodationImagesByHouseIds([
    houseId,
  ]);
  const images = imagesByHouseId.get(houseId) ?? [];

  return sortHouseImages(
    images.map((image) => mapAdminHouseImageToHouseImage(image, houseId)),
  );
}

export async function getPublicHouseImagesByAccommodationId(
  accommodationId: string,
) {
  const imagesById = await getPublicAccommodationImagesByAccommodationIds([
    accommodationId,
  ]);
  const images = imagesById.get(accommodationId) ?? [];

  return sortHouseImages(
    images.map((image) =>
      mapAdminHouseImageToHouseImage(image, accommodationId),
    ),
  );
}

export async function applyPublicAccommodationCoverImages<
  T extends HouseCardData,
>(houses: T[]) {
  const internalHouses = houses.filter((house) => house.source === "internal");
  const imagesByAccommodationId =
    await getPublicAccommodationImagesByAccommodationIds(
      internalHouses.map((house) => house.sourceId),
    );

  return houses.map((house) => {
    if (house.source !== "internal") {
      return house;
    }

    const coverImage = getHouseCoverImage(
      imagesByAccommodationId.get(house.sourceId) ?? [],
    );

    return coverImage
      ? {
        ...house,
        coverImage: coverImage.publicUrl,
      }
      : house;
  });
}

export function groupAccommodationImagesByCategory(
  images: AdminHouseImage[],
): AdminHouseImageGroup[] {
  const groups = new Map<AdminHouseImageCategory, AdminHouseImage[]>();

  sortAdminHouseImages([...images]).forEach((image) => {
    const group = groups.get(image.category);

    if (group) {
      group.push(image);
    } else {
      groups.set(image.category, [image]);
    }
  });

  return ADMIN_HOUSE_IMAGE_CATEGORIES.flatMap((category) => {
    const groupedImages = groups.get(category);

    return groupedImages
      ? [
        {
          category,
          label: formatAdminHouseImageCategory(category),
          images: groupedImages,
        },
      ]
      : [];
  });
}

export function toAdminHouseImageApiData(
  image: AdminHouseImage,
): AdminHouseImageApiData {
  return {
    id: image.id,
    accommodation_id: image.accommodationId,
    category: image.category,
    storage_path: image.storagePath,
    public_url: image.publicUrl,
    alt_text: image.altText,
    sort_order: image.sortOrder,
    created_at: image.createdAt,
    updated_at: image.updatedAt,
  };
}

export async function replaceAdminHouseImages(
  accommodationId: string,
  images: AdminHouseImageInput[],
) {
  const supabase = await createClient();
  const rows = sortAdminHouseImageInputs(images).map((image) => ({
    accommodation_id: accommodationId,
    category: image.category,
    storage_path: image.storagePath,
    public_url: image.publicUrl,
    alt_text: image.altText,
    sort_order: image.sortOrder,
  }));

  const deleteResult = await supabase
    .from("accommodation_images")
    .delete()
    .eq("accommodation_id", accommodationId);

  if (deleteResult.error) {
    throw new Error(deleteResult.error.message);
  }

  if (rows.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("accommodation_images")
    .insert(rows)
    .select(ADMIN_HOUSE_IMAGES_SELECT)
    .returns<AdminHouseImageRow[]>();

  if (error) {
    throw new Error(
      getSupabaseHouseCreateErrorMessage(error, "Image already exists."),
    );
  }

  return sortAdminHouseImages(data.map(mapAdminHouseImage));
}

export async function addAdminHouseImages(
  accommodationId: string,
  images: AdminHouseImageInput[],
) {
  if (images.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const rows = sortAdminHouseImageInputs(images).map((image) => ({
    accommodation_id: accommodationId,
    category: image.category,
    storage_path: image.storagePath,
    public_url: image.publicUrl,
    alt_text: image.altText,
    sort_order: image.sortOrder,
  }));

  const { data, error } = await supabase
    .from("accommodation_images")
    .insert(rows)
    .select(ADMIN_HOUSE_IMAGES_SELECT)
    .returns<AdminHouseImageRow[]>();

  if (error) {
    throw new Error(
      getSupabaseHouseCreateErrorMessage(error, "Image already exists."),
    );
  }

  return sortAdminHouseImages(data.map(mapAdminHouseImage));
}

export async function deleteAdminHouseImages(
  accommodationId: string,
  imageIds: string[],
) {
  const uniqueImageIds = Array.from(
    new Set(imageIds.map((id) => id.trim()).filter(Boolean)),
  );

  if (uniqueImageIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodation_images")
    .delete()
    .eq("accommodation_id", accommodationId)
    .in("id", uniqueImageIds)
    .select(ADMIN_HOUSE_IMAGES_SELECT)
    .returns<AdminHouseImageRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return sortAdminHouseImages(data.map(mapAdminHouseImage));
}

function getTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalTrimmedString(value: unknown) {
  const text = getTrimmedString(value);

  return text ? text : null;
}

function parseRequiredString(
  value: unknown,
  fieldName: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const text = getTrimmedString(value);

  if (!text) {
    return { ok: false, error: `${fieldName} is required.` };
  }

  return { ok: true, value: text };
}

function parseNumberInput(
  value: unknown,
  fieldName: string,
  options: { required: boolean; integer?: boolean; min?: number },
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value === null || value === undefined || value === "") {
    if (options.required) {
      return { ok: false, error: `${fieldName} is required.` };
    }

    return { ok: true, value: null };
  }

  const number =
    typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));

  if (!Number.isFinite(number)) {
    return { ok: false, error: `${fieldName} must be a number.` };
  }

  if (options.integer && !Number.isInteger(number)) {
    return { ok: false, error: `${fieldName} must be an integer.` };
  }

  if (options.min !== undefined && number < options.min) {
    return { ok: false, error: `${fieldName} must be ${options.min} or greater.` };
  }

  return { ok: true, value: number };
}

function parseOptionalTime(value: unknown, fieldName: string) {
  const text = getOptionalTrimmedString(value);

  if (!text) {
    return { ok: true as const, value: null };
  }

  if (!TIME_PATTERN.test(text)) {
    return { ok: false as const, error: `${fieldName} must be HH:MM.` };
  }

  return { ok: true as const, value: text.slice(0, 5) };
}

function parseWeekdayPrices(value: unknown) {
  if (value === null || value === undefined) {
    return { ok: true as const, value: [] };
  }

  if (!Array.isArray(value)) {
    return { ok: false as const, error: "weekday_prices must be an array." };
  }

  const weekdayPrices: AdminHouseWeekdayPriceInput[] = [];
  const usedWeekdays = new Set<number>();

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return { ok: false as const, error: "weekday_prices is invalid." };
    }

    const row = item as Record<string, unknown>;
    const weekday = parseNumberInput(row.weekday, "weekday", {
      required: true,
      integer: true,
      min: 1,
    });
    const price = parseNumberInput(row.price, "weekday price", {
      required: true,
      min: 0,
    });
    const agencyPrice = parseNumberInput(row.agency_price, "weekday agency price", {
      required: false,
      min: 0,
    });

    if (!weekday.ok) return { ok: false as const, error: weekday.error };
    if (!price.ok) return { ok: false as const, error: price.error };
    if (!agencyPrice.ok) return { ok: false as const, error: agencyPrice.error };

    if (weekday.value === null || weekday.value > 7) {
      return {
        ok: false as const,
        error: "weekday must be between 1 and 7.",
      };
    }

    if (usedWeekdays.has(weekday.value)) {
      return {
        ok: false as const,
        error: "weekday_prices cannot contain duplicate weekdays.",
      };
    }

    usedWeekdays.add(weekday.value);
    weekdayPrices.push({
      weekday: weekday.value,
      price: price.value ?? 0,
      agencyPrice: agencyPrice.value,
      note: getOptionalTrimmedString(row.note),
    });
  }

  return { ok: true as const, value: weekdayPrices };
}

export function parseAdminHouseCreateInput(
  value: unknown,
): ParsedAdminHouseCreateInput {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Invalid house payload." };
  }

  const body = value as Record<string, unknown>;
  const name = parseRequiredString(body.name, "name");
  const code = parseRequiredString(body.code, "code");
  const accommodationAreaId = parseRequiredString(
    body.accommodation_area_id,
    "accommodation_area_id",
  );
  const accommodationTypeId = parseRequiredString(
    body.accommodation_type_id,
    "accommodation_type_id",
  );
  const normalPrice = parseNumberInput(body.normal_price, "normal_price", {
    required: true,
    min: 0,
  });
  const normalAgencyPrice = parseNumberInput(
    body.normal_agency_price,
    "normal_agency_price",
    { required: false, min: 0 },
  );
  const bathroomCount = parseNumberInput(
    body.bathroom_count,
    "bathroom_count",
    { required: true, integer: true, min: 0 },
  );
  const bedroomCount = parseNumberInput(body.bedroom_count, "bedroom_count", {
    required: true,
    integer: true,
    min: 0,
  });
  const guestCapacity = parseNumberInput(body.guest_capacity, "guest_capacity", {
    required: true,
    integer: true,
    min: 1,
  });
  const extraGuestCapacity = parseNumberInput(
    body.extra_guest_capacity,
    "extra_guest_capacity",
    { required: false, integer: true, min: 0 },
  );
  const distanceToBeachMeters = parseNumberInput(
    body.distance_to_beach_meters,
    "distance_to_beach_meters",
    { required: false, integer: true, min: 0 },
  );
  const extraGuestPrice = parseNumberInput(
    body.extra_guest_price,
    "extra_guest_price",
    { required: false, min: 0 },
  );
  const securityDepositAmount = parseNumberInput(
    body.security_deposit_amount,
    "security_deposit_amount",
    { required: false, min: 0 },
  );
  const checkInTime = parseOptionalTime(body.check_in_time, "check_in_time");
  const checkOutTime = parseOptionalTime(body.check_out_time, "check_out_time");
  const weekdayPrices = parseWeekdayPrices(body.weekday_prices);
  const poolType = getOptionalTrimmedString(body.pool_type) ?? "none";
  const poolSystem = getOptionalTrimmedString(body.pool_system);
  const facilityIds = parseStringArray(body.facility_ids, "facility_ids");
  const contacts = parseContacts(body.contacts);

  if (!name.ok) return { ok: false, error: name.error };
  if (!code.ok) return { ok: false, error: code.error };
  if (!accommodationAreaId.ok) {
    return { ok: false, error: accommodationAreaId.error };
  }
  if (!accommodationTypeId.ok) {
    return { ok: false, error: accommodationTypeId.error };
  }
  if (!normalPrice.ok) return { ok: false, error: normalPrice.error };
  if (!normalAgencyPrice.ok) {
    return { ok: false, error: normalAgencyPrice.error };
  }
  if (!bathroomCount.ok) return { ok: false, error: bathroomCount.error };
  if (!bedroomCount.ok) return { ok: false, error: bedroomCount.error };
  if (!guestCapacity.ok) return { ok: false, error: guestCapacity.error };
  if (!extraGuestCapacity.ok) {
    return { ok: false, error: extraGuestCapacity.error };
  }
  if (!distanceToBeachMeters.ok) {
    return { ok: false, error: distanceToBeachMeters.error };
  }
  if (!extraGuestPrice.ok) return { ok: false, error: extraGuestPrice.error };
  if (!securityDepositAmount.ok) {
    return { ok: false, error: securityDepositAmount.error };
  }
  if (!checkInTime.ok) return { ok: false, error: checkInTime.error };
  if (!checkOutTime.ok) return { ok: false, error: checkOutTime.error };
  if (!weekdayPrices.ok) return { ok: false, error: weekdayPrices.error };
  if (!isPoolDetailType(poolType)) {
    return { ok: false, error: "pool_type must be private, shared, or none." };
  }
  if (poolSystem !== null && !isPoolSystemType(poolSystem)) {
    return { ok: false, error: "pool_system must be salt or chlorine." };
  }
  if (!facilityIds.ok) return { ok: false, error: facilityIds.error };
  if (!contacts.ok) return { ok: false, error: contacts.error };

  const addressDetails = getOptionalTrimmedString(body.address_details);

  if (!addressDetails && distanceToBeachMeters.value === null) {
    return {
      ok: false,
      error: "address_details or distance_to_beach_meters is required.",
    };
  }

  return {
    ok: true,
    data: {
      name: name.value,
      code: code.value,
      accommodationAreaId: accommodationAreaId.value,
      accommodationTypeId: accommodationTypeId.value,
      normalPrice: normalPrice.value ?? 0,
      normalAgencyPrice: normalAgencyPrice.value,
      bathroomCount: bathroomCount.value ?? 0,
      bedroomCount: bedroomCount.value ?? 0,
      guestCapacity: guestCapacity.value ?? 1,
      extraGuestCapacity: extraGuestCapacity.value ?? 0,
      addressDetails,
      googleMapsUrl: getOptionalTrimmedString(body.google_maps_url),
      distanceToBeachMeters: distanceToBeachMeters.value,
      checkInTime: checkInTime.value,
      checkOutTime: checkOutTime.value,
      youtubeUrl: getOptionalTrimmedString(body.youtube_url),
      additionalDetails: getOptionalTrimmedString(body.additional_details),
      additionalFeeDetails: getOptionalTrimmedString(
        body.additional_fee_details,
      ),
      bedroomDetails: getOptionalTrimmedString(body.bedroom_details),
      extraGuestPrice: extraGuestPrice.value,
      securityDepositAmount: securityDepositAmount.value,
      weekdayPrices: weekdayPrices.value,
      poolType,
      poolSystem,
      poolDescription: getOptionalTrimmedString(body.pool_description),
      petsAllowed: parseBooleanInput(body.pets_allowed),
      petPolicyDetails: getOptionalTrimmedString(body.pet_policy_details),
      facilityIds: facilityIds.value,
      contacts: contacts.value,
    },
  };
}

function isAccommodationStatus(status: unknown): status is AccommodationStatus {
  return status === "published" || status === "archived";
}

function isPoolDetailType(type: unknown): type is PoolDetailType {
  return type === "private" || type === "shared" || type === "none";
}

function isPoolSystemType(system: unknown): system is PoolSystemType {
  return system === "salt" || system === "chlorine";
}

function isDatePriceType(type: unknown): type is AdminHouseDatePriceType {
  return (
    type === "special" ||
    type === "holiday" ||
    type === "pending" ||
    type === "booked"
  );
}

function parseBooleanInput(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string" || value.trim() === "") return fallback;

  return value === "true" || value === "on" || value === "1";
}

function parseStringArray(value: unknown, fieldName: string) {
  if (value === null || value === undefined) {
    return { ok: true as const, value: [] };
  }

  if (!Array.isArray(value)) {
    return { ok: false as const, error: `${fieldName} must be an array.` };
  }

  const values = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return { ok: true as const, value: Array.from(new Set(values)) };
}

export function parseAdminHouseImagesInput(
  value: unknown,
): ParsedAdminHouseImagesInput {
  const imagesValue =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>).images
      : value;

  if (imagesValue === null || imagesValue === undefined) {
    return { ok: true, data: [] };
  }

  if (!Array.isArray(imagesValue)) {
    return { ok: false, error: "images must be an array." };
  }

  const images: AdminHouseImageInput[] = [];
  const usedStoragePaths = new Set<string>();
  let coverCount = 0;

  for (const [index, item] of imagesValue.entries()) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "images is invalid." };
    }

    const row = item as Record<string, unknown>;
    const id = getOptionalTrimmedString(row.id);
    const category = getTrimmedString(row.category);
    const storagePath = parseRequiredString(row.storage_path, "storage_path");
    const publicUrl = parseRequiredString(row.public_url, "public_url");
    const sortOrder = parseNumberInput(row.sort_order ?? index, "sort_order", {
      required: true,
      integer: true,
      min: 0,
    });

    if (!isAdminHouseImageCategory(category)) {
      return { ok: false, error: "image category is invalid." };
    }

    if (!storagePath.ok) {
      return { ok: false, error: storagePath.error };
    }

    if (!publicUrl.ok) {
      return { ok: false, error: publicUrl.error };
    }

    if (!sortOrder.ok) {
      return { ok: false, error: sortOrder.error };
    }

    if (usedStoragePaths.has(storagePath.value)) {
      return {
        ok: false,
        error: "images cannot contain duplicate storage_path values.",
      };
    }

    usedStoragePaths.add(storagePath.value);

    if (category === "cover") {
      coverCount += 1;
    }

    if (coverCount > 1) {
      return { ok: false, error: "images can contain only one cover image." };
    }

    images.push({
      id,
      category,
      storagePath: storagePath.value,
      publicUrl: publicUrl.value,
      altText: getOptionalTrimmedString(row.alt_text),
      sortOrder: sortOrder.value ?? index,
    });
  }

  return { ok: true, data: sortAdminHouseImageInputs(images) };
}

function parseContacts(value: unknown) {
  if (value === null || value === undefined) {
    return { ok: true as const, value: [] };
  }

  if (!Array.isArray(value)) {
    return { ok: false as const, error: "contacts must be an array." };
  }

  const contacts: AdminHouseContactInput[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return { ok: false as const, error: "contacts is invalid." };
    }

    const row = item as Record<string, unknown>;
    const phoneNumber = getTrimmedString(row.phone_number);

    if (!phoneNumber) {
      return { ok: false as const, error: "contact phone_number is required." };
    }

    contacts.push({
      name: getOptionalTrimmedString(row.name),
      phoneNumber,
      role: getOptionalTrimmedString(row.role),
      isPublic: parseBooleanInput(row.is_public),
    });
  }

  return { ok: true as const, value: contacts };
}

function parseDatePrices(value: unknown) {
  if (value === null || value === undefined) {
    return { ok: true as const, value: [] };
  }

  if (!Array.isArray(value)) {
    return { ok: false as const, error: "date_prices must be an array." };
  }

  const datePrices: AdminHouseDatePriceInput[] = [];
  const usedDatePrices = new Set<string>();

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return { ok: false as const, error: "date_prices is invalid." };
    }

    const row = item as Record<string, unknown>;
    const stayDate = getTrimmedString(row.stay_date);
    const priceType = row.price_type;
    const priceRequired = priceType === "special" || priceType === "holiday";
    const price = parseNumberInput(row.price, "date price", {
      required: priceRequired,
      min: 0,
    });
    const agencyPrice = parseNumberInput(row.agency_price, "date agency price", {
      required: false,
      min: 0,
    });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(stayDate)) {
      return { ok: false as const, error: "stay_date must be YYYY-MM-DD." };
    }

    if (!isDatePriceType(priceType)) {
      return {
        ok: false as const,
        error: "price_type must be special, holiday, pending, or booked.",
      };
    }

    if (!price.ok) return { ok: false as const, error: price.error };
    if (!agencyPrice.ok) return { ok: false as const, error: agencyPrice.error };

    const key = `${stayDate}:${priceType}`;
    if (usedDatePrices.has(key)) {
      return {
        ok: false as const,
        error: "date_prices cannot contain duplicate date/type rows.",
      };
    }

    usedDatePrices.add(key);
    datePrices.push({
      stayDate,
      priceType,
      price: price.value ?? 0,
      agencyPrice: agencyPrice.value,
      note: getOptionalTrimmedString(row.note),
      isActive: parseBooleanInput(row.is_active, true),
    });
  }

  return { ok: true as const, value: datePrices };
}

export function parseAdminHouseUpdateInput(
  value: unknown,
): ParsedAdminHouseUpdateInput {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Invalid house payload." };
  }

  const body = value as Record<string, unknown>;
  const parsed = parseAdminHouseCreateInput(value);

  if (!parsed.ok) {
    return parsed;
  }

  if (!isAccommodationStatus(body.status)) {
    return { ok: false, error: "status must be published or archived." };
  }

  const datePrices = parseDatePrices(body.date_prices);

  if (!datePrices.ok) return { ok: false, error: datePrices.error };

  return {
    ok: true,
    data: {
      ...parsed.data,
      status: body.status,
      datePrices: datePrices.value,
    },
  };
}

function getSupabaseHouseCreateErrorMessage(
  error: {
    code?: string;
    message: string;
  },
  duplicateMessage = "House code already exists.",
) {
  if (error.code === "23505") {
    return duplicateMessage;
  }

  if (error.code === "23503") {
    return "Selected area or type does not exist.";
  }

  return error.message;
}

export async function createAdminHouse(input: AdminHouseCreateInput) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_admin_accommodation", {
    p_name: input.name,
    p_code: input.code,
    p_accommodation_area_id: input.accommodationAreaId,
    p_accommodation_type_id: input.accommodationTypeId,
    p_normal_price: input.normalPrice,
    p_normal_agency_price: input.normalAgencyPrice,
    p_bathroom_count: input.bathroomCount,
    p_bedroom_count: input.bedroomCount,
    p_guest_capacity: input.guestCapacity,
    p_extra_guest_capacity: input.extraGuestCapacity,
    p_address_details: input.addressDetails,
    p_google_maps_url: input.googleMapsUrl,
    p_distance_to_beach_meters: input.distanceToBeachMeters,
    p_check_in_time: input.checkInTime,
    p_check_out_time: input.checkOutTime,
    p_youtube_url: input.youtubeUrl,
    p_additional_details: input.additionalDetails,
    p_additional_fee_details: input.additionalFeeDetails,
    p_bedroom_details: input.bedroomDetails,
    p_extra_guest_price: input.extraGuestPrice,
    p_security_deposit_amount: input.securityDepositAmount,
    p_pool_type: input.poolType,
    p_pool_system: input.poolSystem,
    p_pool_description: input.poolDescription,
    p_pets_allowed: input.petsAllowed,
    p_pet_policy_details: input.petPolicyDetails,
    p_facility_ids: input.facilityIds,
    p_contacts: input.contacts.map((contact) => ({
      name: contact.name,
      phone_number: contact.phoneNumber,
      role: contact.role,
      is_public: contact.isPublic,
    })),
    p_weekday_prices: input.weekdayPrices.map((wp) => ({
      weekday: wp.weekday,
      price: wp.price,
      agency_price: wp.agencyPrice,
      note: wp.note,
    })),
  });

  if (error) {
    throw new Error(getSupabaseHouseCreateErrorMessage(error));
  }

  if (typeof data !== "string") {
    throw new Error("House was created but the id was not returned.");
  }

  return data;
}

export async function updateAdminHouse(
  id: string,
  input: AdminHouseUpdateInput,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_admin_accommodation", {
    p_accommodation_id: id,
    p_name: input.name,
    p_code: input.code,
    p_status: input.status,
    p_accommodation_area_id: input.accommodationAreaId,
    p_accommodation_type_id: input.accommodationTypeId,
    p_normal_price: input.normalPrice,
    p_normal_agency_price: input.normalAgencyPrice,
    p_bathroom_count: input.bathroomCount,
    p_bedroom_count: input.bedroomCount,
    p_guest_capacity: input.guestCapacity,
    p_extra_guest_capacity: input.extraGuestCapacity,
    p_address_details: input.addressDetails,
    p_google_maps_url: input.googleMapsUrl,
    p_distance_to_beach_meters: input.distanceToBeachMeters,
    p_check_in_time: input.checkInTime,
    p_check_out_time: input.checkOutTime,
    p_youtube_url: input.youtubeUrl,
    p_additional_details: input.additionalDetails,
    p_additional_fee_details: input.additionalFeeDetails,
    p_bedroom_details: input.bedroomDetails,
    p_extra_guest_price: input.extraGuestPrice,
    p_security_deposit_amount: input.securityDepositAmount,
    p_weekday_prices: input.weekdayPrices.map((wp) => ({
      weekday: wp.weekday,
      price: wp.price,
      agency_price: wp.agencyPrice,
      note: wp.note,
    })),
    p_pool_type: input.poolType,
    p_pool_system: input.poolSystem,
    p_pool_description: input.poolDescription,
    p_pets_allowed: input.petsAllowed,
    p_pet_policy_details: input.petPolicyDetails,
    p_facility_ids: input.facilityIds,
    p_contacts: input.contacts.map((contact) => ({
      name: contact.name,
      phone_number: contact.phoneNumber,
      role: contact.role,
      is_public: contact.isPublic,
    })),
    p_date_prices: input.datePrices.map((datePrice) => ({
      stay_date: datePrice.stayDate,
      price_type: datePrice.priceType,
      price: datePrice.price,
      agency_price: datePrice.agencyPrice,
      note: datePrice.note,
      is_active: datePrice.isActive,
    })),
  });

  if (error) {
    throw new Error(getSupabaseHouseCreateErrorMessage(error));
  }

  if (typeof data !== "string") {
    throw new Error("House was updated but the id was not returned.");
  }

  return data;
}

function mapExternalHouse(house: ExternalHouse): House {
  return {
    id: house.h_id,
    source: "external",
    sourceId: house.h_id,
    code: house.h_id,
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

export async function getExternalHouses(): Promise<House[]> {
  const res = await fetch(HOUSE_API_URL, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch houses");
  }

  const houses = (await res.json()) as ExternalHouse[];

  return houses.map(mapExternalHouse);
}

export async function getInternalHouses(): Promise<House[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodations")
    .select(PUBLIC_HOUSES_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(300)
    .returns<PublicAccommodationHouseRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapInternalAccommodationToHouse);
}

export async function getPublicHouseGroups(): Promise<PublicHouseGroups> {
  const [externalHouses, internalHouses] = await Promise.all([
    getExternalHouses(),
    getInternalHouses(),
  ]);

  return {
    externalHouses,
    internalHouses,
  };
}

export async function getHouses(): Promise<House[]> {
  return getInternalHouses();
}

export async function getHouseById(id: string): Promise<House | null> {
  return getInternalHouseByCode(id);
}

export async function getInternalHouseByCode(
  code: string,
): Promise<House | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodations")
    .select(PUBLIC_HOUSES_SELECT)
    .eq("status", "published")
    .in("code", getHouseCodeCandidates(code))
    .limit(1)
    .returns<PublicAccommodationHouseRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const row = data[0];

  return row ? mapInternalAccommodationToHouse(row) : null;
}

export async function getInternalHouseDetailByCode(
  code: string,
): Promise<PublicHouseDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodations")
    .select(PUBLIC_HOUSE_DETAIL_SELECT)
    .eq("status", "published")
    .in("code", getHouseCodeCandidates(code))
    .limit(1)
    .returns<PublicAccommodationDetailRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const row = data[0];

  return row ? mapPublicAccommodationDetail(row) : null;
}

export async function getExternalHouseById(
  id: string,
): Promise<House | null> {
  const normalizedId = id.replace(/\D/g, "");
  const houses = await getExternalHouses();

  return houses.find((house) => house.id === normalizedId) ?? null;
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

export function parseSeaDistanceKm(value: string | null | undefined) {
  if (!value) return null;

  const text = value.trim().toLowerCase();

  if (!text) return null;

  if (text.includes("ติดทะเล")) {
    return 0;
  }

  const numberMatch = text.match(/\d+(?:[.,]\d+)?/);

  if (!numberMatch) return null;

  const rawNumber = Number(numberMatch[0].replace(",", "."));

  if (Number.isNaN(rawNumber)) return null;

  const isKilometer =
    text.includes("กิโล") ||
    /ก\s*\.?\s*ม/.test(text) ||
    /\bkm\.?\b/.test(text);
  const isMeter =
    !isKilometer &&
    (text.includes("เมตร") || /\d\s*ม\.?(?:\s|$)/.test(text));

  return isMeter ? rawNumber / 1000 : rawNumber;
}

function getActiveNumber(value: string | undefined, inactiveValue?: string) {
  if (!value || value === inactiveValue) return null;

  return toNumber(value);
}

function sortByNumber(
  houses: House[],
  field: "price" | "people",
  direction: "asc" | "desc" = "asc",
) {
  return houses.sort((a, b) => {
    const valueA = toNumber(a[field]) ?? 0;
    const valueB = toNumber(b[field]) ?? 0;

    return direction === "asc" ? valueA - valueB : valueB - valueA;
  });
}

function sortBySeaDistance(
  houses: House[],
  direction: "asc" | "desc" = "asc",
) {
  return houses.sort((a, b) => {
    const valueA = parseSeaDistanceKm(a.farsea);
    const valueB = parseSeaDistanceKm(b.farsea);

    if (valueA === null && valueB === null) return 0;
    if (valueA === null) return 1;
    if (valueB === null) return -1;

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
  return sortBySeaDistance(
    houses.filter((house) => {
      const farsea = parseSeaDistanceKm(house.farsea);

      return farsea !== null && farsea <= NEAR_SEA_MAX_DISTANCE;
    }),
  ).slice(0, limit);
}

export function getHousesByIds(houses: House[], houseIds: string[]) {
  const housesById = new Map(houses.map((house) => [house.id, house]));

  return houseIds
    .map((houseId) => housesById.get(houseId))
    .filter((house): house is House => house !== undefined);
}

export function getHousesBySourceIds(houses: House[], sourceIds: string[]) {
  const housesBySourceId = new Map(
    houses.map((house) => [house.sourceId, house]),
  );

  return sourceIds
    .map((sourceId) => housesBySourceId.get(sourceId))
    .filter((house): house is House => house !== undefined);
}

function getQueryHouseIds(query: string) {
  return query
    .match(/(?:dv[-\s]*)?\d+/g)
    ?.map((value) => value.replace(/\D/g, ""))
    .filter(Boolean);
}

function matchesHouseQuery(
  house: House,
  query: string,
  queryHouseIds: Set<string> | null,
) {
  if (!query) return true;

  if (queryHouseIds) {
    const candidates = [house.code, house.id, house.sourceId].filter(Boolean);

    return candidates.some((candidate) => {
      const digits = candidate.replace(/\D/g, "");

      return digits ? queryHouseIds.has(digits) : false;
    });
  }

  const normalizedQuery = query.toLowerCase();

  return (
    house.code.toLowerCase().includes(normalizedQuery) ||
    house.id.toLowerCase().includes(normalizedQuery) ||
    house.sourceId.toLowerCase().includes(normalizedQuery) ||
    (house.name?.toLowerCase().includes(normalizedQuery) ?? false)
  );
}

export async function getPublicHouseById(id: string): Promise<House | null> {
  const normalizedId = id.trim().toLowerCase();
  const { externalHouses, internalHouses } = await getPublicHouseGroups();
  const allHouses = [...internalHouses, ...externalHouses];

  return (
    allHouses.find((house) => {
      const candidates = [house.code, house.id, house.sourceId].map((value) =>
        value.toLowerCase(),
      );

      return candidates.includes(normalizedId);
    }) ?? null
  );
}

export function filterHouses(
  houses: House[],
  params: HouseSearchParams,
): House[] {
  const query = params.q?.trim().toLowerCase() ?? "";
  const queryHouseIds = getQueryHouseIds(query);
  const queryHouseIdSet = queryHouseIds?.length
    ? new Set(queryHouseIds)
    : null;
  const minPrice = getActiveNumber(params.minPrice, INACTIVE_MIN_PRICE);
  const maxPrice = getActiveNumber(params.maxPrice, INACTIVE_MAX_PRICE);
  const maxFarsea = getActiveNumber(params.maxFarsea);
  const selectedPeople = getActiveNumber(params.people, INACTIVE_PEOPLE);
  const sort = params.sort ?? "";

  const filteredHouses = houses.filter((house) => {
    const price = toNumber(house.price);
    const people = toNumber(house.people);
    const farsea = parseSeaDistanceKm(house.farsea);

    const matchesQuery = matchesHouseQuery(house, query, queryHouseIdSet);

    const matchesMinPrice =
      minPrice === null || (price !== null && price >= minPrice);

    const matchesMaxPrice =
      maxPrice === null || (price !== null && price <= maxPrice);

    const matchesMaxFarsea =
      maxFarsea === null || (farsea !== null && farsea <= maxFarsea);

    const matchesPeople =
      selectedPeople === null || (people !== null && people >= selectedPeople);

    const matchesAmenities = AMENITY_FILTERS.every(
      ({ param, field }) => !params[param] || house[field] === "y",
    );

    return (
      matchesQuery &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesMaxFarsea &&
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

  if (sort === "farsea_asc") {
    return sortBySeaDistance(filteredHouses);
  }

  if (sort === "farsea_desc") {
    return sortBySeaDistance(filteredHouses, "desc");
  }

  return filteredHouses;
}

export function getDisplayNightlyPrice(price: string | null | undefined) {
  const priceNum = Number.parseInt(price ?? "", 10);

  if (!Number.isFinite(priceNum)) {
    return null;
  }

  const last3 = priceNum % 1000;
  const commission =
    priceNum <= 28000
      ? last3 === 500
        ? 1400
        : 1900
      : priceNum <= 47000
        ? last3 === 500
          ? 2400
          : 2900
        : last3 === 500
          ? 3400
          : 3900;

  return priceNum + commission;
}

export function formatSeaDistance(farsea: string | null | undefined) {
  if (!farsea || farsea.trim() === "") {
    return "ไม่ระบุระยะห่างจากทะเล";
  }

  const text = farsea.trim().toLowerCase();

  if (text.includes("ติดทะเล")) {
    return "ติดทะเล";
  }

  const distanceKm = parseSeaDistanceKm(farsea);

  if (distanceKm === null) {
    return "ไม่ระบุระยะห่างจากทะเล";
  }

  if (distanceKm <= 1) {
    return "ห่างจากทะเลไม่เกิน 1 กม.";
  }

  // format เลข
  const formatted =
    distanceKm % 1 === 0
      ? distanceKm.toFixed(0)
      : distanceKm.toFixed(1);

  return `ห่างจากทะเลไม่เกิน ${formatted} กม.`;
}
