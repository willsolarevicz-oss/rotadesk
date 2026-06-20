-- Foto de comprovação de entrega
alter table public.packages
  add column if not exists photo_url text;

-- Bucket de Storage para os comprovantes (leitura pública por URL)
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do nothing;

-- Cada entregador gerencia apenas os arquivos dentro da sua pasta (user_id/...)
create policy "Comprovantes legiveis"
  on storage.objects for select
  using (bucket_id = 'proofs');

create policy "Entregador envia comprovantes"
  on storage.objects for insert
  with check (
    bucket_id = 'proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Entregador atualiza comprovantes"
  on storage.objects for update
  using (
    bucket_id = 'proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Entregador apaga comprovantes"
  on storage.objects for delete
  using (
    bucket_id = 'proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
