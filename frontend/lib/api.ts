const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000';

type ApiOptions = RequestInit & {
    auth?: boolean;
};

type ApiErrorResponse = {
    message?: string | string[];
    error?: string;
    statusCode?: number;
};

export async function apiFetch<T>(
    endpoint: string,
    options: ApiOptions = {},
): Promise<T> {
    const {
        auth = true,
        headers,
        ...fetchOptions
    } = options;

    const token =
        typeof window !== 'undefined'
            ? localStorage.getItem('accessToken')
            : null;

    const requestHeaders = new Headers(headers);

    /**
     * Automatically set JSON content type
     * when request body is not FormData.
     */
    if (
        fetchOptions.body &&
        !(fetchOptions.body instanceof FormData)
    ) {
        requestHeaders.set(
            'Content-Type',
            'application/json',
        );
    }

    /**
     * Attach access token.
     */
    if (auth && token) {
        requestHeaders.set(
            'Authorization',
            `Bearer ${token}`,
        );
    }

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...fetchOptions,
            headers: requestHeaders,
        },
    );

    /**
     * Token expired or invalid.
     */
    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(
                'accessToken',
            );

            window.location.replace('/login');
        }

        throw new Error(
            'Your session has expired.',
        );
    }

    /**
     * Parse response body.
     */
    let data: T | ApiErrorResponse;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            'Invalid response from server.',
        );
    }

    /**
     * Handle HTTP errors.
     */
    if (!response.ok) {
        const errorData =
            data as ApiErrorResponse;

        let message =
            'Something went wrong.';

        if (Array.isArray(errorData.message)) {
            message =
                errorData.message.join(', ');
        } else if (
            typeof errorData.message === 'string'
        ) {
            message = errorData.message;
        } else if (
            typeof errorData.error === 'string'
        ) {
            message = errorData.error;
        }

        throw new Error(message);
    }

    /**
     * Response is successful.
     */
    return data as T;
}