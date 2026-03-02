-- Function to update a member's role in an event
CREATE OR REPLACE FUNCTION public.update_user_role(p_event_id uuid, p_target_user_id uuid, p_new_role text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_caller_role text;
  v_is_owner boolean;
BEGIN
  -- 1. Verify caller has admin rights
  -- Check if caller is the owner
  SELECT EXISTS (
    SELECT 1 FROM public.events WHERE id = p_event_id AND user_id = auth.uid()
  ) INTO v_is_owner;

  -- Check if caller is an admin member
  SELECT role INTO v_caller_role FROM public.event_members 
  WHERE event_id = p_event_id AND user_id = auth.uid();

  IF NOT v_is_owner AND v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Not authorized to change roles for this event';
  END IF;

  -- 2. Prevent removing the owner's admin status
  IF EXISTS (
    SELECT 1 FROM public.events WHERE id = p_event_id AND user_id = p_target_user_id
  ) THEN
    RAISE EXCEPTION 'Cannot change the role of the event owner';
  END IF;

  -- 3. Update the role
  UPDATE public.event_members
  SET role = p_new_role
  WHERE event_id = p_event_id AND user_id = p_target_user_id;

  RETURN json_build_object('success', true);
END;
$function$;

-- Function to remove a member from an event
CREATE OR REPLACE FUNCTION public.remove_user_from_event(p_event_id uuid, p_target_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_caller_role text;
  v_is_owner boolean;
BEGIN
  -- 1. Verify caller has admin rights
  -- Check if caller is the owner
  SELECT EXISTS (
    SELECT 1 FROM public.events WHERE id = p_event_id AND user_id = auth.uid()
  ) INTO v_is_owner;

  -- Check if caller is an admin member
  SELECT role INTO v_caller_role FROM public.event_members 
  WHERE event_id = p_event_id AND user_id = auth.uid();

  IF NOT v_is_owner AND v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Not authorized to remove members from this event';
  END IF;

  -- 2. Prevent removing the owner
  IF EXISTS (
    SELECT 1 FROM public.events WHERE id = p_event_id AND user_id = p_target_user_id
  ) THEN
    RAISE EXCEPTION 'Cannot remove the event owner';
  END IF;

  -- 3. Delete the member
  DELETE FROM public.event_members
  WHERE event_id = p_event_id AND user_id = p_target_user_id;

  RETURN json_build_object('success', true);
END;
$function$;
