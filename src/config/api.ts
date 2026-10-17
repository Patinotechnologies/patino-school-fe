import { env } from "./env";

type ApiConfig = {
  readonly baseUrl: string;
};

export const apiConfig: ApiConfig = {
  get baseUrl() {
    return env.api.baseUrl;
  },
};
