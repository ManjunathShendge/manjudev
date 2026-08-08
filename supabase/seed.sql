-- =============================================================================
-- Seed — starter categories
--
-- Optional, and safe to re-run. Edit the list to match what you actually plan
-- to write about; categories are curated, so the studio only lets editors and
-- admins add more later.
-- =============================================================================

insert into public.categories (name, slug, description, color, sort_order) values
  ('Engineering',   'engineering',   'Building things that have to survive real traffic.',        '#e8b75c', 1),
  ('Frontend',      'frontend',      'React, animation, and the parts users actually touch.',     '#7c7bff', 2),
  ('Backend',       'backend',       'APIs, schemas, queues and the work underneath the UI.',     '#4ed2a8', 3),
  ('AI & Agents',   'ai-agents',     'Working with models as components rather than as magic.',   '#ff9f6b', 4),
  ('Case Studies',  'case-studies',  'Full walkthroughs of shipped projects.',                    '#e8b75c', 5),
  ('Notes',         'notes',         'Shorter pieces — things worth writing down.',               '#6c667e', 6)
on conflict (slug) do nothing;
