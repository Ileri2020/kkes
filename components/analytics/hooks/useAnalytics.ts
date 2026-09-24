import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAnalytics(metric: string, params?: Record<string, any>) {
    const query = new URLSearchParams(params).toString();
    const { data, error, isLoading } = useSWR(
        `/api/admin/analytics?metric=${metric}&${query}`,
        fetcher
    );

    return {
        data,
        isLoading,
        isError: error,
    };
}
