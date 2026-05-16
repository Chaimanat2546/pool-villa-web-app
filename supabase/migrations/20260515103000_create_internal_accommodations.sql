create type public.accommodation_status as enum ('published', 'archived');
create type public.accommodation_date_price_type as enum ('special', 'holiday');
create type public.pool_detail_type as enum ('private', 'shared', 'none');
create type public.pool_system_type as enum ('salt', 'chlorine');

create table public.provinces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provinces_name_not_blank check (length(btrim(name)) > 0),
  constraint provinces_name_trimmed check (name = btrim(name))
);

create unique index provinces_name_lower_unique_idx
on public.provinces (lower(name));

create table public.accommodation_zones (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references public.provinces(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodation_zones_name_not_blank check (length(btrim(name)) > 0),
  constraint accommodation_zones_name_trimmed check (name = btrim(name))
);

create unique index accommodation_zones_province_name_lower_unique_idx
on public.accommodation_zones (province_id, lower(name));

create index accommodation_zones_province_id_idx
on public.accommodation_zones (province_id);

create table public.accommodation_areas (
  id uuid primary key default gen_random_uuid(),
  accommodation_zone_id uuid not null references public.accommodation_zones(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodation_areas_name_not_blank check (length(btrim(name)) > 0),
  constraint accommodation_areas_name_trimmed check (name = btrim(name))
);

create unique index accommodation_areas_zone_name_lower_unique_idx
on public.accommodation_areas (accommodation_zone_id, lower(name));

create index accommodation_areas_accommodation_zone_id_idx
on public.accommodation_areas (accommodation_zone_id);

create table public.accommodation_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodation_types_name_not_blank check (length(btrim(name)) > 0),
  constraint accommodation_types_name_trimmed check (name = btrim(name))
);

create unique index accommodation_types_name_lower_unique_idx
on public.accommodation_types (lower(name));

create table public.accommodations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  status public.accommodation_status not null default 'published',
  youtube_url text,
  additional_details text,
  additional_fee_details text,
  check_in_time time,
  check_out_time time,
  accommodation_area_id uuid not null references public.accommodation_areas(id) on delete restrict,
  accommodation_type_id uuid not null references public.accommodation_types(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodations_name_not_blank check (length(btrim(name)) > 0),
  constraint accommodations_name_trimmed check (name = btrim(name)),
  constraint accommodations_code_not_blank check (length(btrim(code)) > 0),
  constraint accommodations_code_trimmed check (code = btrim(code))
);

comment on table public.accommodations is
  'Internal accommodation inventory. New rows default to published; archive rows to hide them from public listings.';
comment on column public.accommodations.status is
  'published = visible to public consumers, archived = hidden or no longer sold.';

create unique index accommodations_code_lower_unique_idx
on public.accommodations (lower(code));

create index accommodations_status_created_at_idx
on public.accommodations (status, created_at desc);

create index accommodations_area_status_idx
on public.accommodations (accommodation_area_id, status);

create index accommodations_type_status_idx
on public.accommodations (accommodation_type_id, status);

create table public.accommodation_admin_notes (
  accommodation_id uuid primary key references public.accommodations(id) on delete cascade,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.accommodation_admin_notes is
  'Admin-only accommodation notes kept out of the public accommodation table to avoid column leaks through public reads.';

create table public.accommodation_addresses (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null unique references public.accommodations(id) on delete cascade,
  address_details text,
  google_maps_url text,
  distance_to_beach_meters integer,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodation_addresses_distance_non_negative
    check (distance_to_beach_meters is null or distance_to_beach_meters >= 0),
  constraint accommodation_addresses_latitude_range
    check (latitude is null or latitude between -90 and 90),
  constraint accommodation_addresses_longitude_range
    check (longitude is null or longitude between -180 and 180)
);

create index accommodation_addresses_accommodation_id_idx
on public.accommodation_addresses (accommodation_id);

create index accommodation_addresses_distance_to_beach_idx
on public.accommodation_addresses (distance_to_beach_meters);

create table public.accommodation_capacity (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null unique references public.accommodations(id) on delete cascade,
  bathroom_count integer not null,
  bedroom_count integer not null,
  bedroom_details text,
  guest_capacity integer not null,
  extra_guest_capacity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodation_capacity_bathroom_count_non_negative
    check (bathroom_count >= 0),
  constraint accommodation_capacity_bedroom_count_non_negative
    check (bedroom_count >= 0),
  constraint accommodation_capacity_guest_capacity_positive
    check (guest_capacity > 0),
  constraint accommodation_capacity_extra_guest_capacity_non_negative
    check (extra_guest_capacity >= 0)
);

create index accommodation_capacity_accommodation_id_idx
on public.accommodation_capacity (accommodation_id);

create index accommodation_capacity_guest_capacity_idx
on public.accommodation_capacity (guest_capacity);

create table public.accommodation_pricing (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null unique references public.accommodations(id) on delete cascade,
  normal_price numeric(12, 2) not null,
  extra_guest_price numeric(12, 2),
  security_deposit_amount numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodation_pricing_normal_price_non_negative
    check (normal_price >= 0),
  constraint accommodation_pricing_extra_guest_price_non_negative
    check (extra_guest_price is null or extra_guest_price >= 0),
  constraint accommodation_pricing_security_deposit_amount_non_negative
    check (security_deposit_amount is null or security_deposit_amount >= 0)
);

create index accommodation_pricing_accommodation_id_idx
on public.accommodation_pricing (accommodation_id);

create index accommodation_pricing_normal_price_idx
on public.accommodation_pricing (normal_price);

create table public.accommodation_weekday_prices (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  weekday smallint not null,
  price numeric(12, 2) not null,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodation_weekday_prices_weekday_range
    check (weekday between 1 and 7),
  constraint accommodation_weekday_prices_price_non_negative
    check (price >= 0)
);

comment on table public.accommodation_weekday_prices is
  'Normal recurring prices by ISO weekday: 1=Monday through 7=Sunday. Use one row per active day.';
comment on column public.accommodation_weekday_prices.weekday is
  'ISO weekday number: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday.';

create unique index accommodation_weekday_prices_accommodation_weekday_unique_idx
on public.accommodation_weekday_prices (accommodation_id, weekday);

create index accommodation_weekday_prices_active_lookup_idx
on public.accommodation_weekday_prices (accommodation_id, weekday, is_active);

create table public.accommodation_date_prices (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  stay_date date not null,
  price_type public.accommodation_date_price_type not null,
  price numeric(12, 2) not null,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodation_date_prices_price_non_negative
    check (price >= 0)
);

comment on table public.accommodation_date_prices is
  'Date-specific price overrides. Price priority is special, then holiday, then weekday price, then normal price.';

create unique index accommodation_date_prices_accommodation_date_type_unique_idx
on public.accommodation_date_prices (accommodation_id, stay_date, price_type);

create index accommodation_date_prices_active_lookup_idx
on public.accommodation_date_prices (accommodation_id, stay_date, price_type)
where is_active;

create table public.pool_details (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null unique references public.accommodations(id) on delete cascade,
  description text,
  type public.pool_detail_type not null default 'none',
  system public.pool_system_type,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pool_details_accommodation_id_idx
on public.pool_details (accommodation_id);

create table public.accommodation_pet_policies (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null unique references public.accommodations(id) on delete cascade,
  pets_allowed boolean not null default false,
  details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accommodation_pet_policies_accommodation_id_idx
on public.accommodation_pet_policies (accommodation_id);

create table public.accommodation_contacts (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  name text,
  phone_number text not null,
  role text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodation_contacts_phone_number_not_blank
    check (length(btrim(phone_number)) > 0),
  constraint accommodation_contacts_phone_number_trimmed
    check (phone_number = btrim(phone_number))
);

create index accommodation_contacts_accommodation_id_idx
on public.accommodation_contacts (accommodation_id);

create index accommodation_contacts_public_lookup_idx
on public.accommodation_contacts (accommodation_id, is_public);

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint facilities_name_not_blank check (length(btrim(name)) > 0),
  constraint facilities_name_trimmed check (name = btrim(name)),
  constraint facilities_slug_not_blank check (length(btrim(slug)) > 0),
  constraint facilities_slug_trimmed check (slug = btrim(slug)),
  constraint facilities_slug_lowercase check (slug = lower(slug))
);

create unique index facilities_slug_unique_idx
on public.facilities (slug);

create unique index facilities_name_lower_unique_idx
on public.facilities (lower(name));

create table public.accommodation_facilities (
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (accommodation_id, facility_id)
);

create index accommodation_facilities_facility_id_idx
on public.accommodation_facilities (facility_id);

create table public.alert_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alert_statuses_name_not_blank check (length(btrim(name)) > 0),
  constraint alert_statuses_name_trimmed check (name = btrim(name))
);

create unique index alert_statuses_name_lower_unique_idx
on public.alert_statuses (lower(name));

create table public.accommodation_alerts (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  alert_status_id uuid not null references public.alert_statuses(id) on delete restrict,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint accommodation_alerts_resolved_when_inactive
    check (is_active or resolved_at is not null)
);

create index accommodation_alerts_accommodation_id_idx
on public.accommodation_alerts (accommodation_id);

create index accommodation_alerts_active_lookup_idx
on public.accommodation_alerts (accommodation_id, is_active, created_at desc);

create index accommodation_alerts_alert_status_id_idx
on public.accommodation_alerts (alert_status_id);

create trigger set_provinces_updated_at
before update on public.provinces
for each row
execute function app_private.set_updated_at();

create trigger set_accommodation_zones_updated_at
before update on public.accommodation_zones
for each row
execute function app_private.set_updated_at();

create trigger set_accommodation_areas_updated_at
before update on public.accommodation_areas
for each row
execute function app_private.set_updated_at();

create trigger set_accommodation_types_updated_at
before update on public.accommodation_types
for each row
execute function app_private.set_updated_at();

create trigger set_accommodations_updated_at
before update on public.accommodations
for each row
execute function app_private.set_updated_at();

create trigger set_accommodation_admin_notes_updated_at
before update on public.accommodation_admin_notes
for each row
execute function app_private.set_updated_at();

create trigger set_accommodation_addresses_updated_at
before update on public.accommodation_addresses
for each row
execute function app_private.set_updated_at();

create trigger set_accommodation_capacity_updated_at
before update on public.accommodation_capacity
for each row
execute function app_private.set_updated_at();

create trigger set_accommodation_pricing_updated_at
before update on public.accommodation_pricing
for each row
execute function app_private.set_updated_at();

create trigger set_accommodation_weekday_prices_updated_at
before update on public.accommodation_weekday_prices
for each row
execute function app_private.set_updated_at();

create trigger set_accommodation_date_prices_updated_at
before update on public.accommodation_date_prices
for each row
execute function app_private.set_updated_at();

create trigger set_pool_details_updated_at
before update on public.pool_details
for each row
execute function app_private.set_updated_at();

create trigger set_accommodation_pet_policies_updated_at
before update on public.accommodation_pet_policies
for each row
execute function app_private.set_updated_at();

create trigger set_accommodation_contacts_updated_at
before update on public.accommodation_contacts
for each row
execute function app_private.set_updated_at();

create trigger set_facilities_updated_at
before update on public.facilities
for each row
execute function app_private.set_updated_at();

create trigger set_alert_statuses_updated_at
before update on public.alert_statuses
for each row
execute function app_private.set_updated_at();

create trigger set_accommodation_alerts_updated_at
before update on public.accommodation_alerts
for each row
execute function app_private.set_updated_at();

alter table public.provinces enable row level security;
alter table public.accommodation_zones enable row level security;
alter table public.accommodation_areas enable row level security;
alter table public.accommodation_types enable row level security;
alter table public.accommodations enable row level security;
alter table public.accommodation_admin_notes enable row level security;
alter table public.accommodation_addresses enable row level security;
alter table public.accommodation_capacity enable row level security;
alter table public.accommodation_pricing enable row level security;
alter table public.accommodation_weekday_prices enable row level security;
alter table public.accommodation_date_prices enable row level security;
alter table public.pool_details enable row level security;
alter table public.accommodation_pet_policies enable row level security;
alter table public.accommodation_contacts enable row level security;
alter table public.facilities enable row level security;
alter table public.accommodation_facilities enable row level security;
alter table public.alert_statuses enable row level security;
alter table public.accommodation_alerts enable row level security;

grant select on table
  public.provinces,
  public.accommodation_zones,
  public.accommodation_areas,
  public.accommodation_types,
  public.accommodations,
  public.accommodation_addresses,
  public.accommodation_capacity,
  public.accommodation_pricing,
  public.accommodation_weekday_prices,
  public.accommodation_date_prices,
  public.pool_details,
  public.accommodation_pet_policies,
  public.accommodation_contacts,
  public.facilities,
  public.accommodation_facilities
to anon, authenticated;

grant select, insert, update, delete on table
  public.provinces,
  public.accommodation_zones,
  public.accommodation_areas,
  public.accommodation_types,
  public.accommodations,
  public.accommodation_admin_notes,
  public.accommodation_addresses,
  public.accommodation_capacity,
  public.accommodation_pricing,
  public.accommodation_weekday_prices,
  public.accommodation_date_prices,
  public.pool_details,
  public.accommodation_pet_policies,
  public.accommodation_contacts,
  public.facilities,
  public.accommodation_facilities,
  public.alert_statuses,
  public.accommodation_alerts
to authenticated;

grant all on table
  public.provinces,
  public.accommodation_zones,
  public.accommodation_areas,
  public.accommodation_types,
  public.accommodations,
  public.accommodation_admin_notes,
  public.accommodation_addresses,
  public.accommodation_capacity,
  public.accommodation_pricing,
  public.accommodation_weekday_prices,
  public.accommodation_date_prices,
  public.pool_details,
  public.accommodation_pet_policies,
  public.accommodation_contacts,
  public.facilities,
  public.accommodation_facilities,
  public.alert_statuses,
  public.accommodation_alerts
to service_role;

create policy "Anyone can read provinces"
on public.provinces
for select
to anon, authenticated
using (true);

create policy "Anyone can read accommodation zones"
on public.accommodation_zones
for select
to anon, authenticated
using (true);

create policy "Anyone can read accommodation areas"
on public.accommodation_areas
for select
to anon, authenticated
using (true);

create policy "Anyone can read accommodation types"
on public.accommodation_types
for select
to anon, authenticated
using (true);

create policy "Anyone can read published accommodations"
on public.accommodations
for select
to anon, authenticated
using (status = 'published');

create policy "Anyone can read facilities"
on public.facilities
for select
to anon, authenticated
using (true);

create policy "Anyone can read published accommodation addresses"
on public.accommodation_addresses
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.accommodations
    where accommodations.id = accommodation_addresses.accommodation_id
      and accommodations.status = 'published'
  )
);

create policy "Anyone can read published accommodation capacity"
on public.accommodation_capacity
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.accommodations
    where accommodations.id = accommodation_capacity.accommodation_id
      and accommodations.status = 'published'
  )
);

create policy "Anyone can read published accommodation pricing"
on public.accommodation_pricing
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.accommodations
    where accommodations.id = accommodation_pricing.accommodation_id
      and accommodations.status = 'published'
  )
);

create policy "Anyone can read active published weekday prices"
on public.accommodation_weekday_prices
for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from public.accommodations
    where accommodations.id = accommodation_weekday_prices.accommodation_id
      and accommodations.status = 'published'
  )
);

create policy "Anyone can read active published date prices"
on public.accommodation_date_prices
for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from public.accommodations
    where accommodations.id = accommodation_date_prices.accommodation_id
      and accommodations.status = 'published'
  )
);

create policy "Anyone can read published pool details"
on public.pool_details
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.accommodations
    where accommodations.id = pool_details.accommodation_id
      and accommodations.status = 'published'
  )
);

create policy "Anyone can read published pet policies"
on public.accommodation_pet_policies
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.accommodations
    where accommodations.id = accommodation_pet_policies.accommodation_id
      and accommodations.status = 'published'
  )
);

create policy "Anyone can read public published contacts"
on public.accommodation_contacts
for select
to anon, authenticated
using (
  is_public
  and exists (
    select 1
    from public.accommodations
    where accommodations.id = accommodation_contacts.accommodation_id
      and accommodations.status = 'published'
  )
);

create policy "Anyone can read published accommodation facilities"
on public.accommodation_facilities
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.accommodations
    where accommodations.id = accommodation_facilities.accommodation_id
      and accommodations.status = 'published'
  )
);

create policy "Admins can read provinces"
on public.provinces
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can create provinces"
on public.provinces
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can update provinces"
on public.provinces
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete provinces"
on public.provinces
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can read accommodation zones"
on public.accommodation_zones
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can create accommodation zones"
on public.accommodation_zones
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can update accommodation zones"
on public.accommodation_zones
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete accommodation zones"
on public.accommodation_zones
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can read accommodation areas"
on public.accommodation_areas
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can create accommodation areas"
on public.accommodation_areas
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can update accommodation areas"
on public.accommodation_areas
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete accommodation areas"
on public.accommodation_areas
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can read accommodation types"
on public.accommodation_types
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can create accommodation types"
on public.accommodation_types
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can update accommodation types"
on public.accommodation_types
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete accommodation types"
on public.accommodation_types
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can read accommodations"
on public.accommodations
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can create accommodations"
on public.accommodations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can update accommodations"
on public.accommodations
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete accommodations"
on public.accommodations
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can read accommodation admin notes"
on public.accommodation_admin_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can create accommodation admin notes"
on public.accommodation_admin_notes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can update accommodation admin notes"
on public.accommodation_admin_notes
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete accommodation admin notes"
on public.accommodation_admin_notes
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can manage accommodation addresses"
on public.accommodation_addresses
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can manage accommodation capacity"
on public.accommodation_capacity
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can manage accommodation pricing"
on public.accommodation_pricing
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can manage accommodation weekday prices"
on public.accommodation_weekday_prices
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can manage accommodation date prices"
on public.accommodation_date_prices
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can manage pool details"
on public.pool_details
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can manage pet policies"
on public.accommodation_pet_policies
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can manage accommodation contacts"
on public.accommodation_contacts
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can manage facilities"
on public.facilities
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can manage accommodation facilities"
on public.accommodation_facilities
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can manage alert statuses"
on public.alert_statuses
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can manage accommodation alerts"
on public.accommodation_alerts
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);
