-- 1. Create the Editor function
CREATE OR REPLACE FUNCTION public.check_is_event_editor(p_event_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = p_event_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.event_members 
    WHERE (event_id = p_event_id OR event_id = (SELECT parent_id FROM public.events WHERE id = p_event_id AND parent_id IS NOT NULL))
    AND user_id = auth.uid() AND role IN ('admin', 'editor')
  );
$function$;

-- 2. Update EVENTS policies
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid() = user_id AND (
    parent_id IS NULL OR public.check_is_event_editor(parent_id)
  )
);

DROP POLICY IF EXISTS "Event admins can update events" ON public.events;
DROP POLICY IF EXISTS "Event editors can update events" ON public.events;
CREATE POLICY "Event editors can update events" ON public.events FOR UPDATE USING (
  public.check_is_event_editor(id)
);

DROP POLICY IF EXISTS "Event admins can delete events" ON public.events;
CREATE POLICY "Event admins can delete events" ON public.events FOR DELETE USING (
  public.check_is_event_admin(id)
);

-- 3. Update SCHEDULE_ITEMS
DROP POLICY IF EXISTS "Event members can insert schedule_items" ON public.schedule_items;
CREATE POLICY "Event editors can insert schedule_items" ON public.schedule_items FOR INSERT WITH CHECK (public.check_is_event_editor(event_id));

DROP POLICY IF EXISTS "Event members can update schedule_items" ON public.schedule_items;
CREATE POLICY "Event editors can update schedule_items" ON public.schedule_items FOR UPDATE USING (public.check_is_event_editor(event_id));

DROP POLICY IF EXISTS "Event members can delete schedule_items" ON public.schedule_items;
CREATE POLICY "Event admins can delete schedule_items" ON public.schedule_items FOR DELETE USING (public.check_is_event_admin(event_id));

-- 4. Update TRANSPORT_ITEMS
DROP POLICY IF EXISTS "Event members can insert transport_items" ON public.transport_items;
CREATE POLICY "Event editors can insert transport_items" ON public.transport_items FOR INSERT WITH CHECK (public.check_is_event_editor(event_id));

DROP POLICY IF EXISTS "Event members can update transport_items" ON public.transport_items;
CREATE POLICY "Event editors can update transport_items" ON public.transport_items FOR UPDATE USING (public.check_is_event_editor(event_id));

DROP POLICY IF EXISTS "Event members can delete transport_items" ON public.transport_items;
CREATE POLICY "Event admins can delete transport_items" ON public.transport_items FOR DELETE USING (public.check_is_event_admin(event_id));

-- 5. Update LODGING_ITEMS
DROP POLICY IF EXISTS "Event members can insert lodging_items" ON public.lodging_items;
CREATE POLICY "Event editors can insert lodging_items" ON public.lodging_items FOR INSERT WITH CHECK (public.check_is_event_editor(event_id));

DROP POLICY IF EXISTS "Event members can update lodging_items" ON public.lodging_items;
CREATE POLICY "Event editors can update lodging_items" ON public.lodging_items FOR UPDATE USING (public.check_is_event_editor(event_id));

DROP POLICY IF EXISTS "Event members can delete lodging_items" ON public.lodging_items;
CREATE POLICY "Event admins can delete lodging_items" ON public.lodging_items FOR DELETE USING (public.check_is_event_admin(event_id));

-- 6. Update NOTES
DROP POLICY IF EXISTS "Event members can insert notes" ON public.notes;
CREATE POLICY "Event editors can insert notes" ON public.notes FOR INSERT WITH CHECK (associated_event_id IS NOT NULL AND associated_event_id != '' AND public.check_is_event_editor(associated_event_id::uuid));

DROP POLICY IF EXISTS "Event members can update notes" ON public.notes;
CREATE POLICY "Event editors can update notes" ON public.notes FOR UPDATE USING (associated_event_id IS NOT NULL AND associated_event_id != '' AND public.check_is_event_editor(associated_event_id::uuid));

DROP POLICY IF EXISTS "Event members can delete notes" ON public.notes;
CREATE POLICY "Event admins can delete notes" ON public.notes FOR DELETE USING (associated_event_id IS NOT NULL AND associated_event_id != '' AND public.check_is_event_admin(associated_event_id::uuid));
