import {
  queryOptions,
  mutationOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { type ListEventsParams, api } from "./services";

// ==========================================
// QUERY KEYS
// ==========================================
export const queryKeys = {
  health: ["health"] as const,
  events: {
    all: ["events"] as const,
    lists: () => [...queryKeys.events.all, "list"] as const,
    list: (params?: ListEventsParams) =>
      [...queryKeys.events.lists(), params] as const,
    details: () => [...queryKeys.events.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
  },
  streams: {
    all: ["streams"] as const,
    lists: () => [...queryKeys.streams.all, "list"] as const,
    details: () => [...queryKeys.streams.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.streams.details(), id] as const,
    snapshots: () => [...queryKeys.streams.all, "snapshot"] as const,
    snapshot: (id: string) => [...queryKeys.streams.snapshots(), id] as const,
  },
};

// ==========================================
// QUERY OPTIONS
// ==========================================

export const healthQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.health,
    queryFn: api.health,
  });

export const eventsQueries = {
  list: (params?: ListEventsParams) =>
    queryOptions({
      queryKey: queryKeys.events.list(params),
      queryFn: () => api.listEvents(params),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.events.detail(id),
      queryFn: () => api.getEvent(id),
      enabled: !!id,
    }),
};

export const streamsQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.streams.lists(),
      queryFn: api.listStreams,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.streams.detail(id),
      queryFn: () => api.getStream(id),
      enabled: !!id,
    }),
  snapshot: (id: string) =>
    queryOptions({
      queryKey: queryKeys.streams.snapshot(id),
      queryFn: () => api.getSnapshot(id),
      enabled: !!id,
      staleTime: 0,
    }),
};

// ==========================================
// MUTATION OPTIONS FACTORY
// ==========================================

export const streamsMutations = {
  create: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: api.createStream,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.lists() });
      },
    }),

  update: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: api.updateStream,
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.lists() });
        queryClient.setQueryData(queryKeys.streams.detail(variables.id), data);
      },
    }),

  delete: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: api.deleteStream,
      onSuccess: (_, id) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.lists() });
        queryClient.removeQueries({ queryKey: queryKeys.streams.detail(id) });
      },
    }),

  disable: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: api.disableStream,
      onSuccess: (data, id) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.lists() });
        queryClient.setQueryData(queryKeys.streams.detail(id), data);
      },
    }),

  enable: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: api.enableStream,
      onSuccess: (data, id) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.lists() });
        queryClient.setQueryData(queryKeys.streams.detail(id), data);
      },
    }),
};
