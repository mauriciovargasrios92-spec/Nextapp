-- Datos de prueba para NEXT.
-- Usa el mismo id que DEMO_USER_ID en lib/supabase.ts, así que funciona
-- aunque no hayas configurado login real todavía.

insert into brain_dumps (id, user_id, original_text)
values (
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'need to reply to Sarah, send the invoice to the client, work out, buy groceries, edit the launch video, book the dentist'
)
on conflict (id) do nothing;

insert into tasks (user_id, brain_dump_id, title, estimated_minutes, status, energy_required, urgency, importance)
values
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Reply to Sarah', 5, 'pending', 'low', 4, 3),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Send the invoice', 5, 'pending', 'low', 5, 5),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Work out', 30, 'pending', 'medium', 2, 4),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Buy groceries', 20, 'pending', 'medium', 3, 3),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Edit the launch video', 45, 'pending', 'high', 3, 5),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Book the dentist', 5, 'pending', 'low', 2, 2);
