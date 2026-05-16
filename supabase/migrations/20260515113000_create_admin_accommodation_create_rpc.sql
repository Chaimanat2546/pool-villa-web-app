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
  p_weekday_prices jsonb default '[]'::jsonb
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
    extra_guest_price,
    security_deposit_amount
  )
  values (
    v_accommodation_id,
    p_normal_price,
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

    if v_weekday not between 1 and 7 then
      raise exception 'weekday must be between 1 and 7.'
        using errcode = '23514';
    end if;

    if v_price < 0 then
      raise exception 'weekday price must be 0 or greater.'
        using errcode = '23514';
    end if;

    insert into public.accommodation_weekday_prices (
      accommodation_id,
      weekday,
      price,
      note
    )
    values (
      v_accommodation_id,
      v_weekday,
      v_price,
      nullif(btrim(coalesce(v_weekday_price ->> 'note', '')), '')
    );
  end loop;

  return v_accommodation_id;
end;
$$;

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
  jsonb
) is
  'Creates a published accommodation and its required detail rows in one transaction. Admin-only via explicit role check and table RLS.';

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
  jsonb
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
  jsonb
) to authenticated;
