import {
  queryOptions,
  mutationOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { type ListEventsParams, api, type CreateRuleRequest, type UpdateRuleRequest, type UpdateBlueprintRequest } from "./services";

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
  blueprints: {
    all: ["blueprints"] as const,
    lists: () => [...queryKeys.blueprints.all, "list"] as const,
    list: () => [...queryKeys.blueprints.lists()] as const,
    details: () => [...queryKeys.blueprints.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.blueprints.details(), id] as const,
  },
  streams: {
    all: ["streams"] as const,
    lists: () => [...queryKeys.streams.all, "list"] as const,
    details: () => [...queryKeys.streams.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.streams.details(), id] as const,
    snapshots: () => [...queryKeys.streams.all, "snapshot"] as const,
    snapshot: (id: string) => [...queryKeys.streams.snapshots(), id] as const,
    rules: (streamId: string) => [...queryKeys.streams.detail(streamId), "rules"] as const,
  },
  settings: {
    all: ["settings"] as const,
    alertPhone: () => [...queryKeys.settings.all, "alertPhone"] as const,
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

export const eventsMutations = {
  update: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: api.updateEvent,
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
        queryClient.setQueryData(queryKeys.events.detail(variables.id), data);
      },
    }),
};

export const streamsQueries = {
  list: () =>
    queryOptions({
      queryKey: [...queryKeys.streams.lists()] as const,
      queryFn: () => api.listStreams(),
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

export const blueprintsQueries = {
  list: () =>
    queryOptions({
      queryKey: queryKeys.blueprints.list(),
      queryFn: api.listBlueprints,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: queryKeys.blueprints.detail(id),
      queryFn: () => api.getBlueprint(id),
      enabled: !!id,
    }),
};

export const rulesQueries = {
  list: (streamId: string) =>
    queryOptions({
      queryKey: queryKeys.streams.rules(streamId),
      queryFn: () => api.listRules(streamId),
      enabled: !!streamId,
    }),
};

export const settingsQueries = {
  alertPhone: () =>
    queryOptions({
      queryKey: queryKeys.settings.alertPhone(),
      queryFn: api.getAlertPhoneNumber,
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

export const rulesMutations = {
  create: (queryClient: QueryClient, streamId: string) =>
    mutationOptions({
      mutationFn: (payload: CreateRuleRequest) => api.createRule({ streamId, payload }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.rules(streamId) });
      },
    }),

  update: (queryClient: QueryClient, streamId: string) =>
    mutationOptions({
      mutationFn: ({ ruleId, payload }: { ruleId: string; payload: UpdateRuleRequest }) =>
        api.updateRule({ streamId, ruleId, payload }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.rules(streamId) });
      },
    }),

  delete: (queryClient: QueryClient, streamId: string) =>
    mutationOptions({
      mutationFn: (ruleId: string) => api.deleteRule({ streamId, ruleId }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.rules(streamId) });
      },
    }),
};

export const blueprintsMutations = {
  create: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: api.createBlueprint,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
      },
    }),

  update: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateBlueprintRequest }) =>
        api.updateBlueprint({ id, payload }),
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
        queryClient.setQueryData(queryKeys.blueprints.detail(variables.id), data);
      },
    }),

  delete: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: api.deleteBlueprint,
      onSuccess: (_, id) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.lists() });
        queryClient.removeQueries({ queryKey: queryKeys.blueprints.detail(id) });
      },
    }),
};

export const settingsMutations = {
  updateAlertPhone: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: api.updateAlertPhoneNumber,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.alertPhone() });
      },
    }),
};

export const notificationsMutations = {
  testTwilio: () =>
    mutationOptions({
      mutationFn: api.testTwilioAlert,
    }),
};

export const assistantMutations = {
  chat: () =>
    mutationOptions({
      mutationFn: api.assistantChat,
    }),
};
