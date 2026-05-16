-- Add agency price columns
alter table public.accommodation_pricing
add column normal_agency_price numeric(12, 2),
add constraint accommodation_pricing_normal_agency_price_non_negative
  check (normal_agency_price is null or normal_agency_price >= 0);

alter table public.accommodation_weekday_prices
add column agency_price numeric(12, 2),
add constraint accommodation_weekday_prices_agency_price_non_negative
  check (agency_price is null or agency_price >= 0);

alter table public.accommodation_date_prices
add column agency_price numeric(12, 2),
add constraint accommodation_date_prices_agency_price_non_negative
  check (agency_price is null or agency_price >= 0);

-- Update create_admin_accommodation
create or replace function public.create_admin_accommodation(
  p_name text,
  p_code text,
  p_accommodation_area_id uuid,
  p_accommodation_type_id uuid,
  p_normal_price numeric,
  p_bathroom_count integer,
  p_bedroom_count integer,
  p_guest_capacity integer,
  p_extra_guest_capacity integer default 0,
  p_address_details text default null,
  p_google_maps_url text default null,
  p_distance_to_beach_meters integer default null,
  p_check_in_time time default null,
  p_check_out_time time default null,
  p_youtube_url text default null,
  p_additional_details text default null,
  p_additional_fee_details text default null,
  p_bedroom_details text default null,
  p_extra_guest_price numeric default null,
  p_security_deposit_amount numeric default null,
  p_weekday_prices jsonb default '[]'::jsonb,
  p_normal_agency_price numeric default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_accommodation_id uuid;
  v_weekday_price jsonb;
  v_weekday integer;
  v_price numeric;
  v_agency_price numeric;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can create accommodations.'
      using errcode = '42501';
  end if;

  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'name is required.'
      using errcode = '23514';
  end if;

  if p_code is null or length(btrim(p_code)) = 0 then
    raise exception 'code is required.'
      using errcode = '23514';
  end if;

  if p_normal_price is null or p_normal_price < 0 then
    raise exception 'normal_price must be 0 or greater.'
      using errcode = '23514';
  end if;

  if p_normal_agency_price is not null and p_normal_agency_price < 0 then
    raise exception 'normal_agency_price must be 0 or greater.'
      using errcode = '23514';
  end if;

  if p_bathroom_count is null or p_bathroom_count < 0 then
    raise exception 'bathroom_count must be 0 or greater.'
      using errcode = '23514';
  end if;

  if p_bedroom_count is null or p_bedroom_count < 0 then
    raise exception 'bedroom_count must be 0 or greater.'
      using errcode = '23514';
  end if;

  if p_guest_capacity is null or p_guest_capacity <= 0 then
    raise exception 'guest_capacity must be greater than 0.'
      using errcode = '23514';
  end if;

  if coalesce(p_extra_guest_capacity, 0) < 0 then
    raise exception 'extra_guest_capacity must be 0 or greater.'
      using errcode = '23514';
  end if;

  if p_distance_to_beach_meters is not null
    and p_distance_to_beach_meters < 0 then
    raise exception 'distance_to_beach_meters must be 0 or greater.'
      using errcode = '23514';
  end if;

  if p_weekday_prices is null
    or jsonb_typeof(p_weekday_prices) <> 'array' then
    raise exception 'weekday_prices must be an array.'
      using errcode = '22023';
  end if;

  insert into public.accommodations (
    name,
    code,
    accommodation_area_id,
    accommodation_type_id,
    check_in_time,
    check_out_time,
    youtube_url,
    additional_details,
    additional_fee_details
  )
  values (
    btrim(p_name),
    btrim(p_code),
    p_accommodation_area_id,
    p_accommodation_type_id,
    p_check_in_time,
    p_check_out_time,
    nullif(btrim(coalesce(p_youtube_url, '')), ''),
    nullif(btrim(coalesce(p_additional_details, '')), ''),
    nullif(btrim(coalesce(p_additional_fee_details, '')), '')
  )
  returning id into v_accommodation_id;

  insert into public.accommodation_addresses (
    accommodation_id,
    address_details,
    google_maps_url,
    distance_to_beach_meters
  )
  values (
    v_accommodation_id,
    nullif(btrim(coalesce(p_address_details, '')), ''),
    nullif(btrim(coalesce(p_google_maps_url, '')), ''),
    p_distance_to_beach_meters
  );

  insert into public.accommodation_capacity (
    accommodation_id,
    bathroom_count,
    bedroom_count,
    bedroom_details,
    guest_capacity,
    extra_guest_capacity
  )
  values (
    v_accommodation_id,
    p_bathroom_count,
    p_bedroom_count,
    nullif(btrim(coalesce(p_bedroom_details, '')), ''),
    p_guest_capacity,
    coalesce(p_extra_guest_capacity, 0)
  );

  insert into public.accommodation_pricing (
    accommodation_id,
    normal_price,
    normal_agency_price,
    extra_guest_price,
    security_deposit_amount
  )
  values (
    v_accommodation_id,
    p_normal_price,
    p_normal_agency_price,
    p_extra_guest_price,
    p_security_deposit_amount
  );

  insert into public.pool_details (accommodation_id)
  values (v_accommodation_id);

  insert into public.accommodation_pet_policies (accommodation_id)
  values (v_accommodation_id);

  for v_weekday_price in
    select value
    from jsonb_array_elements(p_weekday_prices)
  loop
    v_weekday := (v_weekday_price ->> 'weekday')::integer;
    v_price := (v_weekday_price ->> 'price')::numeric;
    v_agency_price := (v_weekday_price ->> 'agency_price')::numeric;

    if v_weekday not between 1 and 7 then
      raise exception 'weekday must be between 1 and 7.'
        using errcode = '23514';
    end if;

    if v_price < 0 then
      raise exception 'weekday price must be 0 or greater.'
        using errcode = '23514';
    end if;

    if v_agency_price is not null and v_agency_price < 0 then
      raise exception 'weekday agency price must be 0 or greater.'
        using errcode = '23514';
    end if;

    insert into public.accommodation_weekday_prices (
      accommodation_id,
      weekday,
      price,
      agency_price,
      note
    )
    values (
      v_accommodation_id,
      v_weekday,
      v_price,
      v_agency_price,
      nullif(btrim(coalesce(v_weekday_price ->> 'note', '')), '')
    );
  end loop;

  return v_accommodation_id;
end;
$$;

-- Update update_admin_accommodation
-- Note: We drop the old signature first
drop function if exists public.update_admin_accommodation(
  uuid,
  text,
  text,
  public.accommodation_status,
  uuid,
  uuid,
  numeric,
  integer,
  integer,
  integer,
  integer,
  text,
  text,
  integer,
  time,
  time,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  jsonb,
  public.pool_detail_type,
  public.pool_system_type,
  text,
  boolean,
  text,
  uuid[],
  jsonb,
  jsonb
);

create or replace function public.update_admin_accommodation(
  p_accommodation_id uuid,
  p_name text,
  p_code text,
  p_status public.accommodation_status,
  p_accommodation_area_id uuid,
  p_accommodation_type_id uuid,
  p_normal_price numeric,
  p_bathroom_count integer,
  p_bedroom_count integer,
  p_guest_capacity integer,
  p_extra_guest_capacity integer default 0,
  p_address_details text default null,
  p_google_maps_url text default null,
  p_distance_to_beach_meters integer default null,
  p_check_in_time time default null,
  p_check_out_time time default null,
  p_youtube_url text default null,
  p_additional_details text default null,
  p_additional_fee_details text default null,
  p_bedroom_details text default null,
  p_extra_guest_price numeric default null,
  p_security_deposit_amount numeric default null,
  p_weekday_prices jsonb default '[]'::jsonb,
  p_pool_type public.pool_detail_type default 'none',
  p_pool_system public.pool_system_type default null,
  p_pool_description text default null,
  p_pets_allowed boolean default false,
  p_pet_policy_details text default null,
  p_facility_ids uuid[] default '{}'::uuid[],
  p_contacts jsonb default '[]'::jsonb,
  p_date_prices jsonb default '[]'::jsonb,
  p_normal_agency_price numeric default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_weekday_price jsonb;
  v_weekday integer;
  v_price numeric;
  v_weekday_agency_price numeric;
  v_facility_id uuid;
  v_contact jsonb;
  v_date_price jsonb;
  v_stay_date date;
  v_price_type public.accommodation_date_price_type;
  v_date_price_amount numeric;
  v_date_agency_price numeric;
begin
  if not exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  ) then
    raise exception 'Only admins can update accommodations.'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.accommodations
    where accommodations.id = p_accommodation_id
  ) then
    raise exception 'Accommodation not found.'
      using errcode = 'P0002';
  end if;

  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'name is required.'
      using errcode = '23514';
  end if;

  if p_code is null or length(btrim(p_code)) = 0 then
    raise exception 'code is required.'
      using errcode = '23514';
  end if;

  if p_status not in ('published', 'archived') then
    raise exception 'status must be published or archived.'
      using errcode = '23514';
  end if;

  if p_normal_price is null or p_normal_price < 0 then
    raise exception 'normal_price must be 0 or greater.'
      using errcode = '23514';
  end if;

  if p_normal_agency_price is not null and p_normal_agency_price < 0 then
    raise exception 'normal_agency_price must be 0 or greater.'
      using errcode = '23514';
  end if;

  if p_bathroom_count is null or p_bathroom_count < 0 then
    raise exception 'bathroom_count must be 0 or greater.'
      using errcode = '23514';
  end if;

  if p_bedroom_count is null or p_bedroom_count < 0 then
    raise exception 'bedroom_count must be 0 or greater.'
      using errcode = '23514';
  end if;

  if p_guest_capacity is null or p_guest_capacity <= 0 then
    raise exception 'guest_capacity must be greater than 0.'
      using errcode = '23514';
  end if;

  if coalesce(p_extra_guest_capacity, 0) < 0 then
    raise exception 'extra_guest_capacity must be 0 or greater.'
      using errcode = '23514';
  end if;

  if p_distance_to_beach_meters is not null
    and p_distance_to_beach_meters < 0 then
    raise exception 'distance_to_beach_meters must be 0 or greater.'
      using errcode = '23514';
  end if;

  if p_weekday_prices is null
    or jsonb_typeof(p_weekday_prices) <> 'array' then
    raise exception 'weekday_prices must be an array.'
      using errcode = '22023';
  end if;

  if p_contacts is null
    or jsonb_typeof(p_contacts) <> 'array' then
    raise exception 'contacts must be an array.'
      using errcode = '22023';
  end if;

  if p_date_prices is null
    or jsonb_typeof(p_date_prices) <> 'array' then
    raise exception 'date_prices must be an array.'
      using errcode = '22023';
  end if;

  update public.accommodations
  set name = btrim(p_name),
      code = btrim(p_code),
      status = p_status,
      accommodation_area_id = p_accommodation_area_id,
      accommodation_type_id = p_accommodation_type_id,
      check_in_time = p_check_in_time,
      check_out_time = p_check_out_time,
      youtube_url = nullif(btrim(coalesce(p_youtube_url, '')), ''),
      additional_details = nullif(btrim(coalesce(p_additional_details, '')), ''),
      additional_fee_details = nullif(btrim(coalesce(p_additional_fee_details, '')), '')
  where id = p_accommodation_id;

  insert into public.accommodation_addresses (
    accommodation_id,
    address_details,
    google_maps_url,
    distance_to_beach_meters
  )
  values (
    p_accommodation_id,
    nullif(btrim(coalesce(p_address_details, '')), ''),
    nullif(btrim(coalesce(p_google_maps_url, '')), ''),
    p_distance_to_beach_meters
  )
  on conflict (accommodation_id) do update
  set address_details = excluded.address_details,
      google_maps_url = excluded.google_maps_url,
      distance_to_beach_meters = excluded.distance_to_beach_meters;

  insert into public.accommodation_capacity (
    accommodation_id,
    bathroom_count,
    bedroom_count,
    bedroom_details,
    guest_capacity,
    extra_guest_capacity
  )
  values (
    p_accommodation_id,
    p_bathroom_count,
    p_bedroom_count,
    nullif(btrim(coalesce(p_bedroom_details, '')), ''),
    p_guest_capacity,
    coalesce(p_extra_guest_capacity, 0)
  )
  on conflict (accommodation_id) do update
  set bathroom_count = excluded.bathroom_count,
      bedroom_count = excluded.bedroom_count,
      bedroom_details = excluded.bedroom_details,
      guest_capacity = excluded.guest_capacity,
      extra_guest_capacity = excluded.extra_guest_capacity;

  insert into public.accommodation_pricing (
    accommodation_id,
    normal_price,
    normal_agency_price,
    extra_guest_price,
    security_deposit_amount
  )
  values (
    p_accommodation_id,
    p_normal_price,
    p_normal_agency_price,
    p_extra_guest_price,
    p_security_deposit_amount
  )
  on conflict (accommodation_id) do update
  set normal_price = excluded.normal_price,
      normal_agency_price = excluded.normal_agency_price,
      extra_guest_price = excluded.extra_guest_price,
      security_deposit_amount = excluded.security_deposit_amount;

  insert into public.pool_details (
    accommodation_id,
    description,
    type,
    system
  )
  values (
    p_accommodation_id,
    nullif(btrim(coalesce(p_pool_description, '')), ''),
    p_pool_type,
    p_pool_system
  )
  on conflict (accommodation_id) do update
  set description = excluded.description,
      type = excluded.type,
      system = excluded.system;

  insert into public.accommodation_pet_policies (
    accommodation_id,
    pets_allowed,
    details
  )
  values (
    p_accommodation_id,
    coalesce(p_pets_allowed, false),
    nullif(btrim(coalesce(p_pet_policy_details, '')), '')
  )
  on conflict (accommodation_id) do update
  set pets_allowed = excluded.pets_allowed,
      details = excluded.details;

  delete from public.accommodation_weekday_prices
  where accommodation_id = p_accommodation_id;

  for v_weekday_price in
    select value
    from jsonb_array_elements(p_weekday_prices)
  loop
    v_weekday := (v_weekday_price ->> 'weekday')::integer;
    v_price := (v_weekday_price ->> 'price')::numeric;
    v_weekday_agency_price := (v_weekday_price ->> 'agency_price')::numeric;

    if v_weekday not between 1 and 7 then
      raise exception 'weekday must be between 1 and 7.'
        using errcode = '23514';
    end if;

    if v_price < 0 then
      raise exception 'weekday price must be 0 or greater.'
        using errcode = '23514';
    end if;

    if v_weekday_agency_price is not null and v_weekday_agency_price < 0 then
      raise exception 'weekday agency price must be 0 or greater.'
        using errcode = '23514';
    end if;

    insert into public.accommodation_weekday_prices (
      accommodation_id,
      weekday,
      price,
      agency_price,
      note
    )
    values (
      p_accommodation_id,
      v_weekday,
      v_price,
      v_weekday_agency_price,
      nullif(btrim(coalesce(v_weekday_price ->> 'note', '')), '')
    );
  end loop;

  delete from public.accommodation_facilities
  where accommodation_id = p_accommodation_id;

  foreach v_facility_id in array coalesce(p_facility_ids, '{}'::uuid[])
  loop
    insert into public.accommodation_facilities (
      accommodation_id,
      facility_id
    )
    values (p_accommodation_id, v_facility_id)
    on conflict do nothing;
  end loop;

  delete from public.accommodation_contacts
  where accommodation_id = p_accommodation_id;

  for v_contact in
    select value
    from jsonb_array_elements(p_contacts)
  loop
    if length(btrim(coalesce(v_contact ->> 'phone_number', ''))) = 0 then
      raise exception 'contact phone_number is required.'
        using errcode = '23514';
    end if;

    insert into public.accommodation_contacts (
      accommodation_id,
      name,
      phone_number,
      role,
      is_public
    )
    values (
      p_accommodation_id,
      nullif(btrim(coalesce(v_contact ->> 'name', '')), ''),
      btrim(v_contact ->> 'phone_number'),
      nullif(btrim(coalesce(v_contact ->> 'role', '')), ''),
      coalesce((v_contact ->> 'is_public')::boolean, false)
    );
  end loop;

  delete from public.accommodation_date_prices
  where accommodation_id = p_accommodation_id;

  for v_date_price in
    select value
    from jsonb_array_elements(p_date_prices)
  loop
    v_stay_date := (v_date_price ->> 'stay_date')::date;
    v_price_type := (v_date_price ->> 'price_type')::public.accommodation_date_price_type;
    v_date_price_amount := (v_date_price ->> 'price')::numeric;
    v_date_agency_price := (v_date_price ->> 'agency_price')::numeric;

    if v_date_price_amount < 0 then
      raise exception 'date price must be 0 or greater.'
        using errcode = '23514';
    end if;

    if v_date_agency_price is not null and v_date_agency_price < 0 then
      raise exception 'date agency price must be 0 or greater.'
        using errcode = '23514';
    end if;

    insert into public.accommodation_date_prices (
      accommodation_id,
      stay_date,
      price_type,
      price,
      agency_price,
      note,
      is_active
    )
    values (
      p_accommodation_id,
      v_stay_date,
      v_price_type,
      v_date_price_amount,
      v_date_agency_price,
      nullif(btrim(coalesce(v_date_price ->> 'note', '')), ''),
      coalesce((v_date_price ->> 'is_active')::boolean, true)
    );
  end loop;

  return p_accommodation_id;
end;
$$;

-- Revoke/Grant and Comments (Create)
comment on function public.create_admin_accommodation(
  text,
  text,
  uuid,
  uuid,
  numeric,
  integer,
  integer,
  integer,
  integer,
  text,
  text,
  integer,
  time,
  time,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  jsonb,
  numeric
) is
  'Creates a published accommodation and its required detail rows in one transaction. Includes agency price support. Admin-only.';

revoke all on function public.create_admin_accommodation(
  text,
  text,
  uuid,
  uuid,
  numeric,
  integer,
  integer,
  integer,
  integer,
  text,
  text,
  integer,
  time,
  time,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  jsonb,
  numeric
) from public, anon;

grant execute on function public.create_admin_accommodation(
  text,
  text,
  uuid,
  uuid,
  numeric,
  integer,
  integer,
  integer,
  integer,
  text,
  text,
  integer,
  time,
  time,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  jsonb,
  numeric
) to authenticated;

-- Revoke/Grant and Comments (Update)
comment on function public.update_admin_accommodation(
  uuid,
  text,
  text,
  public.accommodation_status,
  uuid,
  uuid,
  numeric,
  integer,
  integer,
  integer,
  integer,
  text,
  text,
  integer,
  time,
  time,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  jsonb,
  public.pool_detail_type,
  public.pool_system_type,
  text,
  boolean,
  text,
  uuid[],
  jsonb,
  jsonb,
  numeric
) is
  'Updates an accommodation and its rules in one transaction. Includes agency price support. Admin-only.';

revoke all on function public.update_admin_accommodation(
  uuid,
  text,
  text,
  public.accommodation_status,
  uuid,
  uuid,
  numeric,
  integer,
  integer,
  integer,
  integer,
  text,
  text,
  integer,
  time,
  time,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  jsonb,
  public.pool_detail_type,
  public.pool_system_type,
  text,
  boolean,
  text,
  uuid[],
  jsonb,
  jsonb,
  numeric
) from public, anon;

grant execute on function public.update_admin_accommodation(
  uuid,
  text,
  text,
  public.accommodation_status,
  uuid,
  uuid,
  numeric,
  integer,
  integer,
  integer,
  integer,
  text,
  text,
  integer,
  time,
  time,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  jsonb,
  public.pool_detail_type,
  public.pool_system_type,
  text,
  boolean,
  text,
  uuid[],
  jsonb,
  jsonb,
  numeric
) to authenticated;
