-- Virgin Voyages Ship Visit Report
-- Secure RPC for shipboard comments and department Ship Focus Requests on OPEN reports.
-- Run this migration in Supabase SQL Editor, preferably in staging first.
-- This function does not accept reviewer findings, checklist status, or follow-up flags from the client.

BEGIN;

CREATE OR REPLACE FUNCTION public.save_shipboard_open_updates(
  p_report_id uuid,
  p_comments jsonb DEFAULT '{}'::jsonb,
  p_focus_requests jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $function$
DECLARE
  v_report public.ship_visit_reports%ROWTYPE;
  v_state jsonb;
  v_focus jsonb;
  v_key text;
  v_text text;
  v_item jsonb;
  v_comments jsonb;
  v_comment jsonb;
  v_email text;
  v_name text;
  v_entry record;
  v_request jsonb;
  v_updated_rows integer;
BEGIN
  -- Only authenticated shipboard-role users may use this RPC.
  IF auth.uid() IS NULL OR public.current_app_role() IS DISTINCT FROM 'shipboard' THEN
    RAISE EXCEPTION 'Authenticated shipboard access is required.' USING errcode = '42501';
  END IF;

  IF jsonb_typeof(COALESCE(p_comments, '{}'::jsonb)) IS DISTINCT FROM 'object'
     OR jsonb_typeof(COALESCE(p_focus_requests, '{}'::jsonb)) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Comments and focus requests must be JSON objects.' USING errcode = '22023';
  END IF;

  -- Lock only a report that is still open. Shipboard inputs are not accepted after status changes.
  SELECT * INTO v_report
  FROM public.ship_visit_reports
  WHERE id = p_report_id AND status = 'open'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The report is not open or does not exist.' USING errcode = 'P0002';
  END IF;

  v_state := COALESCE(v_report.report_data -> 'state', '{}'::jsonb);
  IF jsonb_typeof(v_state) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Report state has an unexpected format.' USING errcode = '22023';
  END IF;

  v_focus := COALESCE(v_report.report_data -> 'shipFocusRequests', '{}'::jsonb);
  IF jsonb_typeof(v_focus) IS DISTINCT FROM 'object' THEN
    v_focus := '{}'::jsonb;
  END IF;

  v_email := lower(COALESCE(auth.jwt() ->> 'email', ''));
  v_name := COALESCE(
    NULLIF(auth.jwt() ->> 'full_name', ''),
    NULLIF(auth.jwt() ->> 'name', ''),
    NULLIF(v_email, ''),
    'Shipboard'
  );

  -- Only update shipComments on existing points whose saved reviewer flag is true.
  -- The client cannot set or change followUpNeeded, checked, comments, or photos through this RPC.
  FOR v_entry IN
    SELECT key, value FROM jsonb_each(COALESCE(p_comments, '{}'::jsonb))
  LOOP
    v_key := v_entry.key;

    IF v_key !~ '^[A-Za-z0-9_-]+__[0-9]+$' THEN
      RAISE EXCEPTION 'Invalid checklist point key.' USING errcode = '22023';
    END IF;

    IF jsonb_typeof(v_entry.value) NOT IN ('string', 'null') THEN
      RAISE EXCEPTION 'Each ship comment must be a string or null.' USING errcode = '22023';
    END IF;

    v_text := btrim(COALESCE(v_entry.value #>> '{}', ''));
    IF length(v_text) > 3000 THEN
      RAISE EXCEPTION 'Ship comment must be 3000 characters or fewer.' USING errcode = '22023';
    END IF;

    v_item := v_state -> v_key;
    IF v_item IS NULL OR jsonb_typeof(v_item) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'Checklist point was not found in this report.' USING errcode = '22023';
    END IF;

    IF COALESCE((v_item ->> 'followUpNeeded')::boolean, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'Ship comments are allowed only when Follow-Up Needed from Ship is enabled.' USING errcode = '42501';
    END IF;

    v_comments := COALESCE(v_item -> 'shipComments', '[]'::jsonb);
    IF jsonb_typeof(v_comments) IS DISTINCT FROM 'array' THEN
      v_comments := '[]'::jsonb;
    END IF;

    -- Replace this user's previous response for this point; preserve responses from other users.
    SELECT COALESCE(jsonb_agg(entry.value), '[]'::jsonb)
      INTO v_comments
    FROM jsonb_array_elements(v_comments) AS entry(value)
    WHERE lower(COALESCE(entry.value ->> 'email', '')) <> v_email;

    IF v_text <> '' THEN
      v_comment := jsonb_build_object(
        'name', v_name,
        'email', v_email,
        'text', v_text,
        'timestamp', now()
      );
      v_comments := v_comments || jsonb_build_array(v_comment);
    END IF;

    v_item := jsonb_set(v_item, '{shipComments}', v_comments, true);
    v_state := jsonb_set(v_state, ARRAY[v_key], v_item, true);
  END LOOP;

  -- Store the latest request per department without touching other report fields.
  FOR v_entry IN
    SELECT key, value FROM jsonb_each(COALESCE(p_focus_requests, '{}'::jsonb))
  LOOP
    v_key := v_entry.key;

    IF v_key !~ '^[A-Za-z0-9_-]+$' THEN
      RAISE EXCEPTION 'Invalid department ID.' USING errcode = '22023';
    END IF;

    IF jsonb_typeof(v_entry.value) NOT IN ('string', 'null') THEN
      RAISE EXCEPTION 'Each Ship Focus Request must be a string or null.' USING errcode = '22023';
    END IF;

    v_text := btrim(COALESCE(v_entry.value #>> '{}', ''));
    IF length(v_text) > 3000 THEN
      RAISE EXCEPTION 'Ship Focus Request must be 3000 characters or fewer.' USING errcode = '22023';
    END IF;

    IF v_text = '' THEN
      v_focus := v_focus - v_key;
    ELSE
      v_request := jsonb_build_object(
        'sectionId', v_key,
        'text', v_text,
        'name', v_name,
        'email', v_email,
        'timestamp', now()
      );
      v_focus := jsonb_set(v_focus, ARRAY[v_key], v_request, true);
    END IF;
  END LOOP;

  UPDATE public.ship_visit_reports AS r
  SET report_data = jsonb_set(
        jsonb_set(COALESCE(r.report_data, '{}'::jsonb), '{state}', v_state, true),
        '{shipFocusRequests}', v_focus, true
      ),
      updated_at = now()
  WHERE r.id = p_report_id AND r.status = 'open';

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  IF v_updated_rows <> 1 THEN
    RAISE EXCEPTION 'The report is no longer open; shipboard updates were not saved.' USING errcode = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'report_id', p_report_id,
    'status', 'open'
  );
END;
$function$;

-- Do not expose this RPC to anonymous/public callers.
REVOKE ALL ON FUNCTION public.save_shipboard_open_updates(uuid, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_shipboard_open_updates(uuid, jsonb, jsonb) TO authenticated;

COMMENT ON FUNCTION public.save_shipboard_open_updates(uuid, jsonb, jsonb) IS
  'Allows shipboard-role users to save ship comments only on reviewer-flagged follow-up points and department Ship Focus Requests while a report is open.';

COMMIT;
