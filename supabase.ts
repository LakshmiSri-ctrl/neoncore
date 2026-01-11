
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mzpbpnbsffgvmumyjqbj.supabase.co';
const supabaseAnonKey = 'sb_publishable_m1FHHGszdLyBf-cYzxHoZA_bvSLCYYd';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
