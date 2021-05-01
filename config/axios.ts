import { AxiosError } from 'axios';
import { IAxiosRetryConfig } from 'axios-retry';

// Axios module configuration (https://go.nuxtjs.dev/config-axios)
export default {
  // https://axios.nuxtjs.org/options#retry
  retry: {
    // Attempts to retry N times
    retries: 3,
    // Extends the retry condition
    retryCondition(error: AxiosError): boolean {
      return !error.response
        // @ts-ignore axios-module#467 (https://git.io/J3nCc)
        || axiosRetry.isNetworkOrIdempotentRequestError(error) // eslint-disable-line no-undef
        || error.response.status === 429; // 429 Too Many Requests
    },
    // Extends the retry delay based on the Retry-After header
    retryDelay(retryCount: number, error: AxiosError): number {
      const retryAfter: number = error.response?.headers['retry-after'];
      if (retryAfter) return retryAfter < 30 ? retryAfter * 1000 : -1;
      // @ts-ignore axios-module#467 (https://git.io/J3nCc)
      return axiosRetry.exponentialDelay(retryCount); // eslint-disable-line no-undef
    },
  } as IAxiosRetryConfig,
};
