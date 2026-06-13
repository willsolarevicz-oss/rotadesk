-- Tabela de pacotes do entregador
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tracking_code text,
  recipient_name text,
  recipient_phone text,
  address text,
  complement text,
  route text,
  latitude double precision,
  longitude double precision,
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'failed')),
  notes text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists packages_user_status_idx
  on public.packages (user_id, status);
create index if not exists packages_user_created_idx
  on public.packages (user_id, created_at desc);

-- Row Level Security: cada entregador só acessa seus pacotes
alter table public.packages enable row level security;

create policy "Entregador le seus pacotes"
  on public.packages for select
  using (auth.uid() = user_id);

create policy "Entregador insere seus pacotes"
  on public.packages for insert
  with check (auth.uid() = user_id);

create policy "Entregador atualiza seus pacotes"
  on public.packages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Entregador apaga seus pacotes"
  on public.packages for delete
  using (auth.uid() = user_id);
