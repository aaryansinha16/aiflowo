import { z } from 'zod';

export const SearchFlightsSchema = z.object({
  from: z.string().min(3).max(3),
  to: z.string().min(3).max(3),
  date: z.string(),
  return_date: z.string().nullable().optional(),
  passengers: z.number().int().min(1).default(1),
  class: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  budget: z.number().optional(),
});

export const BookFlightSchema = z.object({
  flight_option_id: z.string(),
  passengers: z.array(
    z.object({
      name: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
  ),
  payment_method_id: z.string(),
});

export const FillFormSchema = z.object({
  url: z.string().url(),
  fields: z.record(z.any()),
  files: z.record(z.string()).optional(),
});

export const ApplyJobSchema = z.object({
  job_url: z.string().url(),
  resume_id: z.string(),
  cover_letter: z.string().optional(),
});

export const PostSocialSchema = z.object({
  platform: z.enum(['instagram', 'twitter', 'facebook', 'linkedin']),
  account_id: z.string(),
  media_ids: z.array(z.string()),
  caption: z.string(),
  scheduled_for: z.string().optional(),
});

export const BrowserActionSchema = z.object({
  steps: z.array(
    z.object({
      action: z.enum(['goto', 'click', 'type', 'upload', 'wait', 'extract']),
      selector: z.string().optional(),
      value: z.any().optional(),
    })
  ),
});

export type SearchFlightsInput = z.infer<typeof SearchFlightsSchema>;
export type BookFlightInput = z.infer<typeof BookFlightSchema>;
export type FillFormInput = z.infer<typeof FillFormSchema>;
export type ApplyJobInput = z.infer<typeof ApplyJobSchema>;
export type PostSocialInput = z.infer<typeof PostSocialSchema>;
export type BrowserActionInput = z.infer<typeof BrowserActionSchema>;
