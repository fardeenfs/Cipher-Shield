import axios from "axios";

export interface BlueprintSummary {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface BlueprintResponse {
  id: string;
  name: string;
  image_base64?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBlueprintRequest {
  name?: string | null;
  image_base64?: string | null;
}

export interface UpdateBlueprintRequest {
  name?: string | null;
  image_base64?: string | null;
}

export interface AnalysisEvent {
  id: string;
  stream_id: string;
  captured_at: string;
  description: string;
  events: Record<string, unknown> | unknown[];
  risk_level: string;
  status: string;
  title?: string | null;
  created_at: string;
  raw_response?: string | null;
  frame?: number[] | string | null;
}

export interface CreateStreamRequest {
  name: string;
  source_type: string;
  source_url: string;
  capture_interval_sec?: number;
  enabled?: boolean;
  blueprint_id?: string | null;
}

export interface Stream {
  id: string;
  name: string;
  source_type: string;
  source_url: string;
  capture_interval_sec: number;
  enabled: boolean;
  blueprint_id?: string | null;
  position_x: number;
  position_y: number;
  rotation: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateStreamRequest {
  capture_interval_sec?: number | null;
  enabled?: boolean | null;
  name?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  blueprint_id?: string | null;
  position_x?: number | null;
  position_y?: number | null;
  rotation?: number | null;
}

export interface StreamRule {
  id: string;
  stream_id: string;
  description: string;
  threat_level: "none" | "low" | "medium" | "high";
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRuleRequest {
  description: string;
  threat_level: "none" | "low" | "medium" | "high";
  position?: number;
}

export interface UpdateRuleRequest {
  description?: string | null;
  threat_level?: string | null;
  position?: number | null;
}

export interface UpdateEventRequest {
  status: string;
}

// Custom interface for list_events query parameters
export interface ListEventsParams {
  stream_id?: string | null;
  risk_level?: string | null;
  from?: string | null; // ISO Date string
  to?: string | null; // ISO Date string
  limit?: number;
  offset?: number;
}

export interface AlertSettings {
  alert_phone_number?: string | null;
}

export interface UpdateAlertSettings {
  alert_phone_number?: string | null;
}

export const apiClient = axios.create({
  // MARK: BASEURL HERE
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  // --- HEALTH ---
  health: async (): Promise<{ status: string }> => {
    const { data } = await apiClient.get("/health");
    return data;
  },

  // --- EVENTS ---
  listEvents: async (params?: ListEventsParams): Promise<AnalysisEvent[]> => {
    const { data } = await apiClient.get("/events", { params });
    return data;
  },

  getEvent: async (id: string): Promise<AnalysisEvent> => {
    const { data } = await apiClient.get(`/events/${id}`);
    return data;
  },

  updateEvent: async ({ id, payload }: { id: string; payload: UpdateEventRequest }): Promise<AnalysisEvent> => {
    const { data } = await apiClient.put(`/events/${id}`, payload);
    return data;
  },

  // --- BLUEPRINTS ---
  listBlueprints: async (): Promise<BlueprintSummary[]> => {
    const { data } = await apiClient.get("/blueprints");
    return data;
  },

  createBlueprint: async (payload: CreateBlueprintRequest): Promise<BlueprintResponse> => {
    const { data } = await apiClient.post("/blueprints", payload);
    return data;
  },

  getBlueprint: async (id: string): Promise<BlueprintResponse> => {
    const { data } = await apiClient.get(`/blueprints/${id}`);
    return data;
  },

  updateBlueprint: async ({ id, payload }: { id: string, payload: UpdateBlueprintRequest }): Promise<BlueprintResponse> => {
    const { data } = await apiClient.put(`/blueprints/${id}`, payload);
    return data;
  },

  deleteBlueprint: async (id: string): Promise<void> => {
    await apiClient.delete(`/blueprints/${id}`);
  },

  // --- STREAMS ---
  listStreams: async (blueprint_id?: string): Promise<Stream[]> => {
    const { data } = await apiClient.get("/streams", { params: { blueprint_id } });
    return data;
  },

  createStream: async (payload: CreateStreamRequest): Promise<Stream> => {
    const { data } = await apiClient.post("/streams", payload);
    return data;
  },

  getStream: async (id: string): Promise<Stream> => {
    const { data } = await apiClient.get(`/streams/${id}`);
    return data;
  },

  updateStream: async ({
    id,
    payload,
  }: {
    id: string;
    payload: UpdateStreamRequest;
  }): Promise<Stream> => {
    const { data } = await apiClient.put(`/streams/${id}`, payload);
    return data;
  },

  deleteStream: async (id: string): Promise<void> => {
    await apiClient.delete(`/streams/${id}`);
  },

  disableStream: async (id: string): Promise<Stream> => {
    const { data } = await apiClient.post(`/streams/${id}/disable`);
    return data;
  },

  enableStream: async (id: string): Promise<Stream> => {
    const { data } = await apiClient.post(`/streams/${id}/enable`);
    return data;
  },

  getSnapshot: async (id: string): Promise<Blob> => {
    const { data } = await apiClient.get(`/streams/${id}/snapshot`, {
      responseType: "blob",
    });
    return data;
  },

  // Helper for MJPEG live stream <img src={api.getLiveStreamUrl(id)} />
  getLiveStreamUrl: (id: string): string => {
    return `/api/streams/${id}/live`;
  },

  // --- RULES ---
  listRules: async (streamId: string): Promise<StreamRule[]> => {
    const { data } = await apiClient.get(`/streams/${streamId}/rules`);
    return data;
  },

  createRule: async ({ streamId, payload }: { streamId: string, payload: CreateRuleRequest }): Promise<StreamRule> => {
    const { data } = await apiClient.post(`/streams/${streamId}/rules`, payload);
    return data;
  },

  updateRule: async ({ streamId, ruleId, payload }: { streamId: string, ruleId: string, payload: UpdateRuleRequest }): Promise<StreamRule> => {
    const { data } = await apiClient.put(`/streams/${streamId}/rules/${ruleId}`, payload);
    return data;
  },

  deleteRule: async ({ streamId, ruleId }: { streamId: string, ruleId: string }): Promise<void> => {
    await apiClient.delete(`/streams/${streamId}/rules/${ruleId}`);
  },

  // --- NOTIFICATIONS & SETTINGS ---
  getAlertPhoneNumber: async (): Promise<AlertSettings> => {
    const { data } = await apiClient.get("/alert-phone-number");
    return data;
  },

  updateAlertPhoneNumber: async (payload: UpdateAlertSettings): Promise<void> => {
    await apiClient.put("/alert-phone-number", payload);
  },

  testTwilioAlert: async (): Promise<{ message: string }> => {
    const { data } = await apiClient.post("/test-twilio");
    return data;
  },
};
