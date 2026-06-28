import { Html, useContextBridge } from "@react-three/drei";
import { AuthContext } from "../../contexts/AuthContext";
import { WebSocketContext } from "../../contexts/WebSocketContext";
import { BattleContext } from "../../contexts/BattleContext";
import { UNSAFE_NavigationContext, UNSAFE_LocationContext, UNSAFE_RouteContext } from "react-router";

export function BridgedHtml({ children, ...props }) {
  const Bridge = useContextBridge(
    AuthContext, WebSocketContext, BattleContext,
    UNSAFE_NavigationContext, UNSAFE_LocationContext, UNSAFE_RouteContext
  );
  return (
    <Html {...props}>
      <Bridge>{children}</Bridge>
    </Html>
  );
}
