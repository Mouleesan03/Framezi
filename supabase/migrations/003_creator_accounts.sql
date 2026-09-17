-- Free creator accounts: each creator can manage only campaigns they own.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles alter column role set default 'creator';
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'creator'));

create or replace function public.is_creator_account()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'creator')
  )
$$;

revoke all on function public.is_creator_account() from public;
grant execute on function public.is_creator_account() to authenticated, service_role;

drop policy if exists campaign_creator on public.campaigns;
create policy campaign_creator on public.campaigns
for all to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists frames_creator on public.campaign_frames;
create policy frames_creator on public.campaign_frames
for all to authenticated
using (exists (
  select 1 from campaigns c
  where c.id = campaign_id and c.created_by = auth.uid()
))
with check (exists (
  select 1 from campaigns c
  where c.id = campaign_id and c.created_by = auth.uid()
));

drop policy if exists participants_creator on public.participants;
create policy participants_creator on public.participants
for select to authenticated
using (exists (
  select 1 from campaigns c
  where c.id = campaign_id and c.created_by = auth.uid()
));

drop policy if exists events_creator on public.campaign_events;
create policy events_creator on public.campaign_events
for select to authenticated
using (exists (
  select 1 from campaigns c
  where c.id = campaign_id and c.created_by = auth.uid()
));

create or replace function public.save_campaign(p_campaign jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  c campaigns;
  f jsonb;
  cid uuid;
begin
  if not is_creator_account() then
    raise exception 'Unauthorized';
  end if;
  if jsonb_array_length(p_campaign->'frames') > 3 then
    raise exception 'Too many frames';
  end if;
  cid := coalesce(nullif(p_campaign->>'id', '')::uuid, gen_random_uuid());
  if exists (select 1 from campaigns where id = cid)
    and not is_admin()
    and not exists (select 1 from campaigns where id = cid and created_by = auth.uid()) then
    raise exception 'Unauthorized';
  end if;
  select * into c
  from jsonb_populate_record(
    null::campaigns,
    p_campaign - 'frames' - 'created_at' || jsonb_build_object(
      'id', cid,
      'created_by', auth.uid(),
      'created_at', now(),
      'updated_at', now()
    )
  );
  insert into campaigns select c.*
  on conflict(id) do update set
    name=excluded.name, slug=excluded.slug,
    organization_name=excluded.organization_name, title=excluded.title,
    description=excluded.description, logo_url=excluded.logo_url,
    cover_url=excluded.cover_url, primary_color=excluded.primary_color,
    secondary_color=excluded.secondary_color, accent_color=excluded.accent_color,
    event_date_text=excluded.event_date_text, location=excluded.location,
    status=excluded.status, start_at=excluded.start_at, end_at=excluded.end_at,
    require_name=excluded.require_name, require_email=excluded.require_email,
    show_name_on_image=excluded.show_name_on_image,
    enable_face_centering=excluded.enable_face_centering,
    enable_share=excluded.enable_share, enable_facebook=excluded.enable_facebook,
    enable_png=excluded.enable_png, enable_jpg=excluded.enable_jpg,
    allow_duplicate_emails=excluded.allow_duplicate_emails,
    allow_after_end=excluded.allow_after_end, share_text=excluded.share_text,
    privacy_text=excluded.privacy_text, cta_text=excluded.cta_text,
    filename_prefix=excluded.filename_prefix,
    thank_you_text=excluded.thank_you_text, name_position=excluded.name_position,
    name_color=excluded.name_color, name_font=excluded.name_font,
    name_font_size=excluded.name_font_size, updated_at=now();
  delete from campaign_frames
  where campaign_id=cid
    and id not in (
      select (value->>'id')::uuid from jsonb_array_elements(p_campaign->'frames')
    );
  for f in select value from jsonb_array_elements(p_campaign->'frames') loop
    if exists (
      select 1 from campaign_frames
      where id=(f->>'id')::uuid and campaign_id<>cid
    ) then
      raise exception 'Frame belongs to another campaign';
    end if;
    insert into campaign_frames(
      id,campaign_id,name,frame_url,thumbnail_url,sort_order,is_active
    ) values (
      (f->>'id')::uuid,cid,f->>'name',f->>'frame_url',f->>'thumbnail_url',
      (f->>'sort_order')::integer,(f->>'is_active')::boolean
    ) on conflict(id) do update set
      name=excluded.name, frame_url=excluded.frame_url,
      thumbnail_url=excluded.thumbnail_url, sort_order=excluded.sort_order,
      is_active=excluded.is_active;
  end loop;
  return cid;
end
$$;

revoke all on function public.save_campaign(jsonb) from public, anon;
grant execute on function public.save_campaign(jsonb) to authenticated;
