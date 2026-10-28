-- AxFit — base de datos en Supabase.
-- Pega todo esto en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.

-- Una fila por usuario con todo su progreso (perfil, pesos, comidas, entrenamientos, logros, ajustes).
-- Los videos NO se suben: se quedan en el celular.
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Seguridad: cada quien solo puede ver y cambiar su propia fila.
alter table public.user_state enable row level security;

drop policy if exists "leer lo mío" on public.user_state;
create policy "leer lo mío" on public.user_state
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "crear lo mío" on public.user_state;
create policy "crear lo mío" on public.user_state
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "cambiar lo mío" on public.user_state;
create policy "cambiar lo mío" on public.user_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "borrar lo mío" on public.user_state;
create policy "borrar lo mío" on public.user_state
  for delete to authenticated using ((select auth.uid()) = user_id);

-- La hora de actualización la pone el servidor.
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists user_state_touch on public.user_state;
create trigger user_state_touch before insert or update on public.user_state
  for each row execute function public.touch_updated_at();
