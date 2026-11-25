-- Run once in Supabase SQL Editor (existing projects)
drop policy if exists "docs insert" on public.documents;
create policy "docs insert" on public.documents for insert to authenticated
  with check (is_approved() and (created_by=auth.uid() or is_admin()));
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

-- one-time fix of documents that were imported by an admin: assign them to the technician named on them
update public.documents d set created_by=p.id from public.profiles p
where p.approved and btrim(d.tech)<>''
  and lower(btrim(d.tech)) in (lower(btrim(coalesce(p.full_name,''))), lower(btrim(coalesce(p.email,''))))
  and d.created_by<>p.id
  and d.created_by in (select id from public.profiles where role='admin');
