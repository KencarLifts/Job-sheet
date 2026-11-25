-- Run once in Supabase SQL Editor (existing projects). Replaces earlier document policies.
drop policy if exists "docs read" on public.documents;
drop policy if exists "docs insert" on public.documents;
drop policy if exists "docs update" on public.documents;
create or replace function public.is_assigned(doc_tech text) returns boolean language sql stable security definer set search_path=public as
$$ select coalesce((select p.approved and btrim(coalesce(doc_tech,''))<>'' and lower(btrim(doc_tech)) in (lower(btrim(coalesce(p.full_name,''))), lower(btrim(coalesce(p.email,'')))) from profiles p where p.id=auth.uid()),false) $$;
-- Administrators see and edit everything. A technician sees and edits only documents whose
-- "Technician" is that technician (matches his full name or email). The author does not matter.
create policy "docs read" on public.documents for select to authenticated using (is_admin() or is_assigned(tech));
create policy "docs insert" on public.documents for insert to authenticated
  with check (is_admin() or (is_approved() and created_by=auth.uid() and is_assigned(tech)));
create policy "docs update" on public.documents for update to authenticated
  using (is_admin() or is_assigned(tech)) with check (is_admin() or is_assigned(tech));
drop function if exists public.is_mine(uuid, text);
drop function if exists public.fix_doc_authors();
