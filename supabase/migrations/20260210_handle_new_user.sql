-- Auto-create a public.users row when a new auth.users entry is created.
-- Extracts display_name and avatar_url from Google OAuth metadata.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, display_name, avatar_url, subscription_tier)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.email
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    'free'
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url;
  return new;
end;
$$;

-- Trigger on every new auth signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Grant permissions so the auth admin can execute
grant execute on function public.handle_new_user() to supabase_auth_admin;
grant insert, update on table public.users to supabase_auth_admin;
