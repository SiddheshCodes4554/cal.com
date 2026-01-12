import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { SUCCESS_STATUS } from "@calcom/platform-constants";

import { useAvailableSlots } from "../useAvailableSlots";

// Mock http client
const mockGet = vi.fn();
vi.mock("../../lib/http", () => ({
    default: {
        get: (...args: any[]) => mockGet(...args),
    },
}));

describe("useAvailableSlots", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        mockGet.mockReset();
        mockGet.mockResolvedValue({
            data: {
                status: SUCCESS_STATUS,
                data: {}, // Mock response data
            },
        });
    });

    const createWrapper = () => {
        return ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
    };

    it("should include timeZone in query key and refetch when it changes", async () => {
        const initialProps = {
            startTime: "2024-01-01T09:00:00Z",
            endTime: "2024-01-01T17:00:00Z",
            eventTypeId: 123,
            eventTypeSlug: "test-event",
            usernameList: ["test-user"],
            timeZone: "UTC",
            enabled: true,
        };

        const { rerender } = renderHook((props) => useAvailableSlots(props), {
            wrapper: createWrapper(),
            initialProps,
        });

        // Should fetch initially
        await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

        // Rerender with same props - should not refetch (key same)
        rerender(initialProps);
        await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

        // Rerender with different timeZone
        rerender({
            ...initialProps,
            timeZone: "America/New_York",
        });

        // Should fetch again because query key changed
        await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));

        // Verify the second call params if needed
        // expect(mockGet).toHaveBeenLastCalledWith(...)
    });
});
