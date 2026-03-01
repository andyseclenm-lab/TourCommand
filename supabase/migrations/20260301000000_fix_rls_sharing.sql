-- Fix Events Table RLS to enforce privacy
DROP POLICY IF EXISTS "Events are viewable by everyone." ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events." ON public.events;
DROP POLICY IF EXISTS "Authenticated users can update events." ON public.events;
DROP POLICY IF EXISTS "Authenticated users can delete events." ON public.events;
DROP POLICY IF EXISTS "Event members can select events" ON public.events;
CREATE POLICY "Event members can select events" ON public.events FOR SELECT USING (
  public.check_is_event_member(id)
);
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid() = user_id
);
DROP POLICY IF EXISTS "Event members can update events" ON public.events;
CREATE POLICY "Event admins can update events" ON public.events FOR UPDATE USING (
  public.check_is_event_admin(id)
);
CREATE POLICY "Event admins can delete events" ON public.events FOR DELETE USING (
  public.check_is_event_admin(id)
);

-- Fix Venues and Contacts RLS to allow shared users to view them
CREATE OR REPLACE FUNCTION public.check_user_shares_event_with_owner(resource_owner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM event_members em1
    JOIN events e ON em1.event_id = e.id
    WHERE em1.user_id = auth.uid() 
      AND (e.user_id = resource_owner_id OR EXISTS (
        SELECT 1 FROM event_members em2 
        WHERE em2.event_id = e.id AND em2.user_id = resource_owner_id
      ))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Users can manage their own venues" ON public.venues;
CREATE POLICY "Users can manage their own venues" ON public.venues 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Shared users can view venues" ON public.venues
FOR SELECT USING (
  auth.uid() = user_id OR public.check_user_shares_event_with_owner(user_id)
);

DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.contacts;
CREATE POLICY "Users can manage their own contacts" ON public.contacts 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Shared users can view contacts" ON public.contacts
FOR SELECT USING (
  auth.uid() = user_id OR public.check_user_shares_event_with_owner(user_id)
);
