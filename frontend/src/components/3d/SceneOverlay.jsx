import { BridgedHtml } from "./BridgedHtml";

export function SceneOverlay({ children }) {
  return <BridgedHtml fullscreen>{children}</BridgedHtml>;
}
