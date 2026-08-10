import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://damdvbtvczmbbfyyiwly.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhbWR2YnR2Y3ptYmJmeXlpd2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNjE5NDQsImV4cCI6MjEwMTYzNzk0NH0.b4OGoYqclgpc4tJY7kIhPFIRNs_jo2hkG8Wz3r97rmw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);