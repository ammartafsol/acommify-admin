"use client";

import RenderToast from "@/components/atoms/RenderToast";
import config from "@/config";
import { useRouter } from "@/i18n/navigation";
import { getUniqueBrowserId } from "@/resources/utils/helper";
import { signOutRequest, updateUser } from "@/store/auth/authSlice";
import Cookies from "js-cookie";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";

// Create a new context for the socket connection
const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socket = useRef(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const { accessToken, user } = useSelector((state) => state?.authReducer);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Manual reconnect function
  const manualReconnect = useCallback(() => {
    if (socket.current && !socket.current.connected) {
      console.log("Attempting manual reconnection...");
      socket.current.connect();
    }
  }, []);

  // Handlers
  const handleBlocked = useCallback(() => {
    RenderToast({
      message: "Your account has been blocked by admin",
      type: "info",
    });
    dispatch(signOutRequest());
    Cookies.remove("_xpdx_acom");
    Cookies.remove("_xpdx_rf_acom");
    Cookies.remove("role");

    router?.push("/");
  }, [dispatch, router]);

  const handleDeleted = useCallback(() => {
    RenderToast("Your account has been deleted", "info");
    dispatch(signOutRequest());
    Cookies.remove("_xpdx_acom");
    Cookies.remove("_xpdx_rf_acom");
    Cookies.remove("role");
    router?.push("/");
  }, [dispatch, router]);

  const handleUpdatedUser = useCallback(
    (data) => {
      if (data && data?.status === "active" && user?._id === data?._id) {
        Cookies.set(
          "user_permissions",
          JSON.stringify(data?.permissions || []),
          {
            expires: 7,
          }
        );
        dispatch(updateUser(data));

        console.log("Updated User Data from Socket:", data);
        RenderToast({
          message: "Your profile has been updated",
          type: "info",
        });
        router?.push("/dashboard");
      } else if (
        data &&
        data?.status === "inactive" &&
        user?._id === data?._id
      ) {
        handleBlocked();
      }
    },
    [router, dispatch, handleBlocked, user?._id]
  );

  useEffect(() => {
    if (!accessToken) return;
    
    // Prevent duplicate connections
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }

    // Enhanced socket configuration with timeout and retry settings
    socket.current = io(config?.apiBaseUrl, {
      transports: ["websocket", "polling"], // Fallback to polling if websocket fails
      timeout: 20000, // 20 seconds timeout
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
      forceNew: true,
    });

    socket.current.on("connect", () => {
      console.log("Socket Connected", {
        socketId: socket.current.id,
        device: getUniqueBrowserId(),
        id: user?._id,
      });
      setIsConnected(true);
      setConnectionAttempts(0);
      socket.current.emit("join", {
        id: user?._id,
        device: getUniqueBrowserId(),
      });
    });

    socket.current.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        // Server initiated disconnect, reconnect manually
        socket.current.connect();
      }
    });

    socket.current.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setConnectionAttempts(0);
      // Re-emit join event on reconnection
      socket.current.emit("join", {
        id: user?._id,
        device: getUniqueBrowserId(),
      });
    });

    socket.current.on("reconnect_attempt", (attemptNumber) => {
      console.log("Socket reconnection attempt:", attemptNumber);
      setConnectionAttempts(attemptNumber);
    });

    socket.current.on("reconnect_error", (err) => {
      console.error("Socket reconnection error:", err);
    });

    socket.current.on("reconnect_failed", () => {
      console.error("Socket reconnection failed after all attempts");
      RenderToast({
        message: "Connection lost. Please refresh the page.",
        type: "error",
      });
    });

    socket.current.on("user-blocked", handleBlocked);
    socket.current.on("user-deleted", handleDeleted);
    socket.current.on("updated-user", handleUpdatedUser);

    socket.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      if (err.type === "TransportError" || err.description === "timeout") {
        RenderToast({
          message: "Connection timeout. Retrying...",
          type: "warning",
        });
      }
    });

    return () => {
      if (socket.current) {
        socket.current.off("connect");
        socket.current.off("disconnect");
        socket.current.off("reconnect");
        socket.current.off("reconnect_attempt");
        socket.current.off("reconnect_error");
        socket.current.off("reconnect_failed");
        socket.current.off("user-blocked", handleBlocked);
        socket.current.off("user-deleted", handleDeleted);
        socket.current.off("updated-user", handleUpdatedUser);
        socket.current.off("connect_error");
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [
    accessToken,
    dispatch,
    user?._id,
    handleBlocked,
    handleDeleted,
    handleUpdatedUser,
  ]);

  // Memoize context value
  const contextValue = useMemo(() => ({
    socket,
    isConnected,
    connectionAttempts,
    manualReconnect,
  }), [isConnected, connectionAttempts, manualReconnect]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to access the socket connection
export const useSocket = () => {
  return useContext(SocketContext);
};
