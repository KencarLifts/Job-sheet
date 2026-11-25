-- Run once on an existing project: adds the CRM reference column
alter table public.documents add column if not exists ext text;
create index if not exists documents_ext_idx on public.documents (ext);
