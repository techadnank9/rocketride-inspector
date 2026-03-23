import { create } from "zustand";
import { ChatMessage, PipelineInspectorData, PipelineRunSnapshot, PipelineSource } from "../../src/types";

type InspectorStore = {
  snapshot?: PipelineRunSnapshot;
  source?: PipelineSource;
  selectedNodeId?: string;
  messages: ChatMessage[];
  isRunning: boolean;
  setInspectorData: (data: PipelineInspectorData) => void;
  selectNode: (nodeId: string) => void;
  appendUserMessage: (content: string) => void;
  appendAssistantMessage: (content: string) => void;
  setRunning: (value: boolean) => void;
};

export const useInspectorStore = create<InspectorStore>((set) => ({
  snapshot: undefined,
  source: undefined,
  selectedNodeId: undefined,
  messages: [],
  isRunning: false,
  setInspectorData: ({ snapshot, source }) =>
    set((state) => ({
      snapshot,
      source,
      selectedNodeId: snapshot?.nodes[0]?.nodeId ?? state.selectedNodeId,
    })),
  selectNode: (selectedNodeId) => set(() => ({ selectedNodeId })),
  appendUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content,
          timestamp: Date.now(),
        },
      ],
    })),
  appendAssistantMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content,
          timestamp: Date.now(),
        },
      ],
    })),
  setRunning: (isRunning) => set(() => ({ isRunning })),
}));
