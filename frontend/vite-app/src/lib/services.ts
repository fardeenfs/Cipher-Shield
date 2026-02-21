import axios from "axios";

export interface AnalysisEvent {
  id: string;
  stream_id: string;
  captured_at: string;
  description: string;
  events: Record<string, unknown> | unknown[];
  risk_level: string;
  created_at: string;
  raw_response?: string | null;
}

export interface CreateStreamRequest {
  name: string;
  source_type: string;
  source_url: string;
  capture_interval_sec?: number;
  enabled?: boolean;
}

export interface Stream {
  id: string;
  name: string;
  source_type: string;
  source_url: string;
  capture_interval_sec: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateStreamRequest {
  capture_interval_sec?: number | null;
  enabled?: boolean | null;
  name?: string | null;
  source_type?: string | null;
  source_url?: string | null;
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

export const apiClient = axios.create({
  baseURL: "/api",
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

  // --- STREAMS ---
  listStreams: async (): Promise<Stream[]> => {
    const { data } = await apiClient.get("/streams");
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
};
