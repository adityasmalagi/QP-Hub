CREATE OR REPLACE FUNCTION public.get_public_trending_papers(_limit integer DEFAULT 8)
RETURNS TABLE (
  id uuid,
  title text,
  subject text,
  board text,
  class_level text,
  year integer,
  exam_type text,
  views_count integer,
  downloads_count integer,
  semester integer,
  internal_number integer,
  institute_name text,
  created_at timestamp with time zone,
  avg_difficulty text,
  ratings_count integer,
  trending_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    qp.id,
    qp.title,
    qp.subject,
    qp.board,
    qp.class_level,
    qp.year,
    qp.exam_type,
    qp.views_count,
    qp.downloads_count,
    qp.semester,
    qp.internal_number,
    qp.institute_name,
    qp.created_at,
    qp.avg_difficulty,
    qp.ratings_count,
    (
      COALESCE(qp.views_count, 0) +
      (COALESCE(qp.downloads_count, 0) * 3) +
      (GREATEST(0, 10 - EXTRACT(EPOCH FROM (now() - COALESCE(qp.created_at, '1970-01-01'::timestamp with time zone))) / 86400) * 5)
    )::numeric AS trending_score
  FROM public.question_papers qp
  WHERE qp.status = 'approved'
  ORDER BY trending_score DESC, qp.created_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 24);
$$;

REVOKE ALL ON FUNCTION public.get_public_trending_papers(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_trending_papers(integer) TO anon, authenticated;