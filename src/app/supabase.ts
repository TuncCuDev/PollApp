import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabaseUrl = 'https://ovgibhfcndbxsbbzwmud.supabase.co'
  supabaseKey = "sb_publishable_HvUagpLMhL1ylpJs7tQOvQ_is9vHYnp"
  supabase = createClient(this.supabaseUrl, this.supabaseKey)

  async getSurveys() {
    let { data: surveys, error } = await this.supabase
    .from('surveys')
    .select('*')
  }


}
