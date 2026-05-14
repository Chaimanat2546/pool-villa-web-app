alter table public.house_recommendations
drop constraint house_recommendations_valid_date_range;

alter table public.house_recommendations
alter column ends_at drop not null;

alter table public.house_recommendations
add constraint house_recommendations_valid_date_range
check (ends_at is null or ends_at >= starts_at);

comment on column public.house_recommendations.ends_at is
  'Recommendation expiration date. Null means the recommendation does not expire.';

drop policy "Anyone can read active visible house recommendations"
on public.house_recommendations;

create policy "Anyone can read active visible house recommendations"
on public.house_recommendations
for select
to anon, authenticated
using (
  status = 'visible'
  and starts_at <= current_date
  and (ends_at is null or ends_at >= current_date)
);
