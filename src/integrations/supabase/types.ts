declare global {
  type Database = {
    public: {
      Views: object;
      Functions: object;
    };
  };
}

export type { Database };
