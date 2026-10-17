-- Ship Visit Report: Shipboard role for approved shipboard staff.
-- Shipboard can view Open, In Review, and Submitted reports; add ship comments
-- and submit Ship Response for In Review reports. They cannot create, edit
-- checklist findings, or delete reports. Existing photo data is untouched.
-- Safe incremental patch: run once in Supabase SQL Editor after a backup.

begin;

-- 1) Allow the new role in the current role table.
alter table public.app_user_roles drop constraint if exists app_user_roles_role_check;
alter table public.app_user_roles add constraint app_user_roles_role_check
  check (role in ('admin','reviewer','user','shipboard'));

-- 2) Assign roles automatically when approved Auth accounts are created later.
create or replace function public.assign_ship_visit_report_role_for_approved_email()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_email text := lower(coalesce(new.email, ''));
  v_role text;
begin
  v_role := case
    when v_email = 'aleksei.sologubov-ic@virginvoyages.com' then 'admin'
    when v_email in (
      'levi.mezick@virginvoyages.com',
      'seidy.soderholm@virginvoyages.com',
      'don.habets@virginvoyages.com',
      'eszter.tary@virginvoyages.com',
      'marin.lukin@virginvoyages.com',
      'edina.smajic-ic@virginvoyages.com',
      'andras.rafajlovics@virginvoyages.com',
      'andrew.diclementi@virginvoyages.com',
      'jamesadam.noffsinger@virginvoyages.com',
      'mycca.argawanon-ic@virginvoyages.com'
    ) then 'user'
    when v_email in (
      'val.htl.fbdirector@virginvoyages.com',
      'brl.htl.fbdirector@virginvoyages.com',
      'scl.htl.fbdirector@virginvoyages.com',
      'res.htl.fbdirector@virginvoyages.com',
      'scl.cul.srexecchef@virginvoyages.com',
      'val.cul.srexecchef@virginvoyages.com',
      'res.cul.srexecchef@virginvoyages.com',
      'brl.cul.srexecchef@virginvoyages.com',
      'scl.restaurantoperationsmanager@virginvoyages.com',
      'val.rst.operationsmgr@virginvoyages.com',
      'brl.rst.operationsmgr@virginvoyages.com',
      'scl.beverageoperationsmanager@virginvoyages.com',
      'brl.bev.operationsmgr@virginvoyages.com',
      'res.rst.operationsmgr@virginvoyages.com',
      'val.bev.operationsmgr@virginvoyages.com',
      'res.bev.operationsmgr@virginvoyages.com',
      'scl.htl.sanitationofficer@virginvoyages.com',
      'res.htl.sanitationofficer@virginvoyages.com',
      'val.htl.sanitationoff@virginvoyages.com',
      'brl.htl.sanitationofficer@virginvoyages.com'
    ) then 'shipboard'
    else null
  end;

  if v_role is not null then
    insert into public.app_user_roles(user_id, role)
    values (new.id, v_role)
    on conflict (user_id) do update set role = excluded.role;
  end if;
  return new;
end;
$$;
revoke all on function public.assign_ship_visit_report_role_for_approved_email() from public, anon, authenticated;
drop trigger if exists ship_visit_report_assign_approved_role on auth.users;
create trigger ship_visit_report_assign_approved_role
  after insert on auth.users
  for each row execute function public.assign_ship_visit_report_role_for_approved_email();

-- 3) Assign the expected role to users who already exist in Supabase Auth.
with approved_emails(email, role) as (
  values
    ('levi.mezick@virginvoyages.com','user'),
    ('seidy.soderholm@virginvoyages.com','user'),
    ('don.habets@virginvoyages.com','user'),
    ('eszter.tary@virginvoyages.com','user'),
    ('marin.lukin@virginvoyages.com','user'),
    ('edina.smajic-ic@virginvoyages.com','user'),
    ('andras.rafajlovics@virginvoyages.com','user'),
    ('andrew.diclementi@virginvoyages.com','user'),
    ('jamesadam.noffsinger@virginvoyages.com','user'),
    ('mycca.argawanon-ic@virginvoyages.com','user'),
    ('aleksei.sologubov-ic@virginvoyages.com','admin'),
    ('val.htl.fbdirector@virginvoyages.com','shipboard'),
    ('brl.htl.fbdirector@virginvoyages.com','shipboard'),
    ('scl.htl.fbdirector@virginvoyages.com','shipboard'),
    ('res.htl.fbdirector@virginvoyages.com','shipboard'),
    ('scl.cul.srexecchef@virginvoyages.com','shipboard'),
    ('val.cul.srexecchef@virginvoyages.com','shipboard'),
    ('res.cul.srexecchef@virginvoyages.com','shipboard'),
    ('brl.cul.srexecchef@virginvoyages.com','shipboard'),
    ('scl.restaurantoperationsmanager@virginvoyages.com','shipboard'),
    ('val.rst.operationsmgr@virginvoyages.com','shipboard'),
    ('brl.rst.operationsmgr@virginvoyages.com','shipboard'),
    ('scl.beverageoperationsmanager@virginvoyages.com','shipboard'),
    ('brl.bev.operationsmgr@virginvoyages.com','shipboard'),
    ('res.rst.operationsmgr@virginvoyages.com','shipboard'),
    ('val.bev.operationsmgr@virginvoyages.com','shipboard'),
    ('res.bev.operationsmgr@virginvoyages.com','shipboard'),
    ('scl.htl.sanitationofficer@virginvoyages.com','shipboard'),
    ('res.htl.sanitationofficer@virginvoyages.com','shipboard'),
    ('val.htl.sanitationoff@virginvoyages.com','shipboard'),
    ('brl.htl.sanitationofficer@virginvoyages.com','shipboard')
)
insert into public.app_user_roles(user_id, role)
select u.id, e.role
from auth.users u
join approved_emails e on lower(u.email) = e.email
on conflict (user_id) do update set role = excluded.role;

-- 4) Shipboard can read reports of every status. No Shipboard INSERT/UPDATE/DELETE
-- policy is granted on ship_visit_reports, so direct edits remain blocked by RLS.
drop policy if exists ship_visit_reports_shipboard_read_all on public.ship_visit_reports;
create policy ship_visit_reports_shipboard_read_all
  on public.ship_visit_reports
  for select to authenticated
  using (public.current_app_role() = 'shipboard');

-- 5) Allow Shipboard to read images in the existing private Storage bucket.
-- They have no INSERT/UPDATE/DELETE policies for this bucket.
drop policy if exists ship_report_photos_read_by_role on storage.objects;
create policy ship_report_photos_read_by_role on storage.objects
  for select to authenticated
  using (bucket_id='ship-report-photos' and (
    public.current_app_role() in ('admin','user','shipboard')
    or (public.current_app_role()='reviewer' and exists (
      select 1 from public.ship_visit_reports r
      where r.id::text=(storage.foldername(name))[1]
        and r.status in ('ship_review','submitted')
    ))
  ));

drop policy if exists ship_report_photos_select_restrict on storage.objects;
create policy ship_report_photos_select_restrict on storage.objects as restrictive
  for select to authenticated using (
    bucket_id <> 'ship-report-photos'
    or public.current_app_role() in ('admin','user','shipboard')
    or (public.current_app_role()='reviewer' and exists (
      select 1 from public.ship_visit_reports r
      where r.id::text=(storage.foldername(name))[1]
        and r.status in ('ship_review','submitted')
    ))
  );

-- 6) Allow Shipboard to fetch one legacy photo via the same protected RPC
-- used by click-to-load photos. Reviewer access remains status-limited.
create or replace function public.get_legacy_report_photo(p_photo_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_photo_data text;
  v_role text;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to view report photos.' using errcode = '42501';
  end if;

  v_role := public.current_app_role();
  if coalesce(v_role, '') not in ('admin','user','reviewer','shipboard') then
    raise exception 'You do not have permission to view report photos.' using errcode = '42501';
  end if;

  select p.photo_data, r.status
    into v_photo_data, v_status
  from public.ship_visit_report_legacy_photos p
  join public.ship_visit_reports r on r.id = p.report_id
  where p.id = p_photo_id;

  if v_photo_data is null then
    raise exception 'Photo not found or photo data is missing.' using errcode = '42501';
  end if;

  if v_role = 'reviewer' and v_status not in ('ship_review','submitted') then
    raise exception 'Reviewer access is limited to In Review and Submitted report photos.' using errcode = '42501';
  end if;

  return v_photo_data;
end;
$$;
revoke all on function public.get_legacy_report_photo(uuid) from public, anon;
grant execute on function public.get_legacy_report_photo(uuid) to authenticated;

-- 7) Shipboard can submit ship comments through the controlled RPC only.
-- The function accepts only shipComments for follow-up points and preserves the
-- reviewer answers, checklist values, photos, and report metadata.
create or replace function public.submit_ship_response(
  p_report_id uuid,
  p_state jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_report public.ship_visit_reports%rowtype;
  v_state jsonb;
  v_input_item jsonb;
  v_ship_comments jsonb;
  v_key text;
  v_updated_report_data jsonb;
  v_result jsonb;
begin
  if auth.uid() is null or public.current_app_role() not in ('admin','reviewer','shipboard') then
    raise exception 'Authenticated Admin, Reviewer, or Shipboard access is required.' using errcode = '42501';
  end if;

  select * into v_report
  from public.ship_visit_reports
  where id = p_report_id and status = 'ship_review'
  for update;

  if not found then
    raise exception 'The report is not currently in review.' using errcode = 'P0002';
  end if;

  v_state := coalesce(v_report.report_data -> 'state', '{}'::jsonb);
  if jsonb_typeof(v_state) <> 'object' then
    raise exception 'The report state has an unexpected format.' using errcode = '22023';
  end if;

  for v_key, v_input_item in
    select key, value from jsonb_each(coalesce(p_state, '{}'::jsonb))
  loop
    if v_state ? v_key
       and jsonb_typeof(v_state -> v_key) = 'object'
       and coalesce((v_state -> v_key ->> 'followUpNeeded')::boolean, false) then
      v_ship_comments := coalesce(v_input_item -> 'shipComments', '[]'::jsonb);
      if jsonb_typeof(v_ship_comments) <> 'array' then
        raise exception 'Ship comments must be an array.' using errcode = '22023';
      end if;
      v_state := jsonb_set(v_state, array[v_key, 'shipComments'], v_ship_comments, true);
    end if;
  end loop;

  v_updated_report_data := jsonb_set(
    coalesce(v_report.report_data, '{}'::jsonb),
    '{state}', v_state, true
  ) || jsonb_build_object(
    'shipResponseStatus', 'submitted',
    'shipResponseUpdatedAt', now()
  );

  update public.ship_visit_reports as r
  set report_data = v_updated_report_data,
      status = 'submitted',
      submitted_at = now(),
      updated_at = now()
  where r.id = p_report_id and r.status = 'ship_review'
  returning to_jsonb(r) into v_result;

  if v_result is null then
    raise exception 'The report could not be submitted.' using errcode = 'P0001';
  end if;

  return jsonb_build_object('id', p_report_id, 'status', 'submitted');
end;
$$;
revoke all on function public.submit_ship_response(uuid, jsonb) from public, anon;
grant execute on function public.submit_ship_response(uuid, jsonb) to authenticated;

commit;

-- Read-only verification. All listed addresses should show shipboard if they
-- already exist in Auth; accounts created later get assigned by the trigger.
with approved_emails(email) as (
  values
    ('val.htl.fbdirector@virginvoyages.com'),
    ('brl.htl.fbdirector@virginvoyages.com'),
    ('scl.htl.fbdirector@virginvoyages.com'),
    ('res.htl.fbdirector@virginvoyages.com'),
    ('scl.cul.srexecchef@virginvoyages.com'),
    ('val.cul.srexecchef@virginvoyages.com'),
    ('res.cul.srexecchef@virginvoyages.com'),
    ('brl.cul.srexecchef@virginvoyages.com'),
    ('scl.restaurantoperationsmanager@virginvoyages.com'),
    ('val.rst.operationsmgr@virginvoyages.com'),
    ('brl.rst.operationsmgr@virginvoyages.com'),
    ('scl.beverageoperationsmanager@virginvoyages.com'),
    ('brl.bev.operationsmgr@virginvoyages.com'),
    ('res.rst.operationsmgr@virginvoyages.com'),
    ('val.bev.operationsmgr@virginvoyages.com'),
    ('res.bev.operationsmgr@virginvoyages.com'),
    ('scl.htl.sanitationofficer@virginvoyages.com'),
    ('res.htl.sanitationofficer@virginvoyages.com'),
    ('val.htl.sanitationoff@virginvoyages.com'),
    ('brl.htl.sanitationofficer@virginvoyages.com')
)
select e.email,
       (u.id is not null) as auth_account_exists,
       r.role as assigned_role
from approved_emails e
left join auth.users u on lower(u.email)=e.email
left join public.app_user_roles r on r.user_id=u.id
order by e.email;
