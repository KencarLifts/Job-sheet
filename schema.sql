-- Run once in Supabase: SQL Editor -> New query -> paste -> Run

create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  email text, full_name text default '',
  role text not null default 'technician' check (role in ('admin','technician')),
  approved boolean not null default false,
  created_at timestamptz default now());

create table public.app_settings(
  id int primary key default 1 check (id=1),
  data jsonb not null default '{}',
  next_no int not null default 12160,
  suffix text not null default 'A');
insert into public.app_settings(id) values (1);

create table public.documents(
  id uuid primary key default gen_random_uuid(),
  no text not null unique,
  type int not null default 0,
  client text default '', doc_date date, total numeric default 0, tech text default '',
  data jsonb not null,
  created_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now());
create index on public.documents (lower(client));
create index on public.documents (updated_at desc);

create function public.is_approved() returns boolean language sql stable security definer set search_path=public as
$$ select coalesce((select approved from profiles where id=auth.uid()),false) $$;
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select coalesce((select approved and role='admin' from profiles where id=auth.uid()),false) $$;
create function public.my_role() returns text language sql stable security definer set search_path=public as
$$ select role from profiles where id=auth.uid() $$;

-- first registered user = approved admin; everyone else waits for approval
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare first_user boolean := not exists(select 1 from profiles);
begin
  insert into profiles(id,email,full_name,role,approved)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),
         case when first_user then 'admin' else 'technician' end, first_user);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- atomic document numbering
create function public.take_number() returns text language plpgsql security definer set search_path=public as $$
declare n int; s text;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  update app_settings set next_no=next_no+1 where id=1 returning next_no-1, suffix into n,s;
  return n::text || case when coalesce(s,'')<>'' then ' '||s else '' end;
end $$;
revoke all on function public.take_number() from public, anon;
grant execute on function public.take_number() to authenticated;

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.documents enable row level security;

create policy "profiles read" on public.profiles for select to authenticated using (id=auth.uid() or is_approved());
create policy "profiles own update" on public.profiles for update to authenticated
  using (id=auth.uid()) with check (id=auth.uid() and role=my_role() and approved=is_approved());
create policy "profiles admin update" on public.profiles for update to authenticated using (is_admin()) with check (is_admin());

create policy "settings read" on public.app_settings for select to authenticated using (is_approved());
create policy "settings admin update" on public.app_settings for update to authenticated using (is_admin()) with check (is_admin());

create policy "docs read" on public.documents for select to authenticated using (is_approved());
create policy "docs insert" on public.documents for insert to authenticated with check (is_approved() and (created_by=auth.uid() or is_admin()));
-- only the author or an administrator can edit a saved document
create policy "docs update" on public.documents for update to authenticated
  using (is_approved() and (created_by=auth.uid() or is_admin()))
  with check (is_approved() and (created_by=auth.uid() or is_admin()));
create policy "docs delete (admin)" on public.documents for delete to authenticated using (is_admin());

-- assign imported documents to technicians by the name written on them (admin button in Settings)
create or replace function public.fix_doc_authors() returns int language plpgsql security definer set search_path=public as $$
declare n int;
begin
  if not is_admin() then raise exception 'admin only'; end if;
  with u as (
    update documents d set created_by=p.id from profiles p
    where p.approved and btrim(d.tech)<>''
      and lower(btrim(d.tech)) in (lower(btrim(coalesce(p.full_name,''))), lower(btrim(coalesce(p.email,''))))
      and d.created_by<>p.id
      and d.created_by in (select id from profiles where role='admin')
    returning 1)
  select count(*) into n from u;
  return n;
end $$;
revoke all on function public.fix_doc_authors() from public, anon;
grant execute on function public.fix_doc_authors() to authenticated;
