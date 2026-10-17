// Single source of truth for frontend environment variables.
export const env = {
  api: {
    get baseUrl(): string {
      return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    },
  },
};
