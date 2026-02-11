export interface MailchimpAudience {
  id: string;
  name: string;
  member_count: number;
}

export interface MailchimpCampaign {
  id: string;
  type?: string;
  status: string;
  send_time: string | null;
  settings: {
    subject_line: string;
    title: string;
  };
  recipients: {
    list_id?: string;
    segment_text: string;
    recipient_count: number;
  };
  content_type?: string;
  tracking?: {
    delivered: number;
    bounced: number;
    failed: number;
    opted_out: number;
    delivery_rate: number;
  };
}
