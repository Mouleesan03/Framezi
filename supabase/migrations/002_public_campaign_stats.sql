alter table public.campaigns
  add column if not exists short_code text
  default substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8);

update public.campaigns
set short_code = substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8)
where short_code is null;

alter table public.campaigns alter column short_code set not null;

create or replace function public.set_campaign_short_code()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.short_code is null or new.short_code = '' then
    new.short_code := substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8);
  end if;
  return new;
end
$$;

drop trigger if exists campaigns_set_short_code on public.campaigns;
create trigger campaigns_set_short_code
before insert on public.campaigns
for each row execute function public.set_campaign_short_code();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_short_code_key'
  ) then
    alter table public.campaigns add constraint campaigns_short_code_key unique(short_code);
  end if;
end $$;

create or replace function public.campaign_usage_count(p_campaign uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct participant_id)
  from campaign_events
  where campaign_id = p_campaign
    and event_type in ('download_png', 'download_jpg')
    and participant_id is not null
$$;

revoke all on function public.campaign_usage_count(uuid) from public;
grant execute on function public.campaign_usage_count(uuid) to anon, authenticated, service_role;
