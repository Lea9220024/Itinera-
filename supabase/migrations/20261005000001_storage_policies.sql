insert into storage.buckets (id, name, public)
values
  ('trip-covers', 'trip-covers', false),
  ('memory-images', 'memory-images', false),
  ('avatars', 'avatars', false)
on conflict (id) do update set public = excluded.public;

create policy "itinera storage select own"
on storage.objects for select
to authenticated
using (
  bucket_id in ('trip-covers','memory-images','avatars')
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy "itinera storage insert own"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('trip-covers','memory-images','avatars')
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy "itinera storage update own"
on storage.objects for update
to authenticated
using (bucket_id in ('trip-covers','memory-images','avatars') and (storage.foldername(name))[2] = (select auth.uid())::text)
with check (bucket_id in ('trip-covers','memory-images','avatars') and (storage.foldername(name))[2] = (select auth.uid())::text);

create policy "itinera storage delete own"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('trip-covers','memory-images','avatars')
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
