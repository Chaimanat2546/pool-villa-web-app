alter type public.accommodation_date_price_type
  add value if not exists 'pending';

alter type public.accommodation_date_price_type
  add value if not exists 'booked';
