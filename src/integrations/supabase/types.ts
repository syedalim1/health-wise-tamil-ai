import { Database } from "@/integrations/supabase/types";

declare global {
  type Database = {
    public: {
      Tables: {
        chat_messages: {
          Row: {
            id: string;
            content: string;
            is_user: boolean;
            timestamp: string;
            model: string | null;
          };
          Insert: {
            id: string;
            content: string;
            is_user: boolean;
            timestamp: string;
            model: string | null;
          };
          Update: {
            content?: string;
            is_user?: boolean;
            timestamp?: string;
            model?: string | null;
          };
        };
      };
      Views: {};
      Functions: {};
    };
  };
}
