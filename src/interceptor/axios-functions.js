"use client";
import axios from "axios";
import momentTimezone from "moment-timezone";
import { useDispatch, useSelector } from "react-redux";
import { useTranslations } from "@/resources/hooks/useTranslations";
import RenderToast from "@/components/atoms/RenderToast";
import { baseURL } from "@/resources/utils/helper";
import { signOutRequest, updateJWTTokens } from "@/store/auth/authSlice";
import Cookies from "js-cookie";
import { handleEncrypt } from "./encryption";
import { usePathname } from "@/i18n/navigation";

const isLoginRoute = (pathname) => {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/login/admin" ||
    pathname === "/login/nationwide-dashboard"
  );
};

const useAxios = () => {
  const dispatch = useDispatch();
  const c = useTranslations("toast");
  const t = useTranslations("common");
  const pathname = usePathname();
  const { accessToken, refreshToken } = useSelector(
    (state) => state.authReducer,
  );

  // Function to refresh the access token
  const refreshAccessToken = async () => {
    if (!refreshToken) {
      RenderToast({
        message: c("tokenFound"),
        type: "error",
      });
      return null;
    }

    try {
      const response = await axios.get(baseURL("auth/refresh/token"), {
        token: refreshToken,
      });

      const data = response?.data;
      Cookies.set("_xpdx_acom", handleEncrypt(data?.token));
      Cookies.set("_xpdx_rf_acom", handleEncrypt(data?.refreshToken));
      dispatch(
        updateJWTTokens({
          accessToken: data.token,
          refreshToken: data.refreshToken,
        }),
      );

      return data.token;
    } catch (error) {
      Cookies.remove("_xpdx_acom");
      Cookies.remove("_xpdx_rf_acom");
      dispatch(signOutRequest());

      window.location.replace("/");
      window.location.reload();
      return null;
    }
  };

  const getErrorMsg = (error = null) => {
    if (error?.message === t("networkError")) {
      return t("networkErrorMsg");
    }
    const message = error?.response?.data?.message?.error;
    let errorMessage = "";

    if (Array.isArray(message)) {
      message?.map(
        (item, i) => (errorMessage = `${errorMessage} • ${item} \n`),
      );
    } else {
      errorMessage = message;
    }

    return errorMessage;
  };

  // Function to handle API requests
  const handleRequest = async ({
    method = "",
    route = "",
    data = {},
    headers = {},
    showAlert = true,
    isFormData = false,
    signal = null,
  }) => {
    const url = baseURL(route);
    const _headers = {
      Accept: "application/json",
      "Content-Type": isFormData ? "multipart/form-data" : "application/json",
      timezone: momentTimezone.tz.guess(),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...headers,
    };

    try {
      const response = await axios({
        method,
        url,
        data,
        headers: _headers,
        signal,
      });
      return { response: response?.data, error: null };
    } catch (error) {
      if (error.code === "ERR_CANCELED") {
        return {
          error: {
            ...error,
            message: t("requestAborted"),
            code: "ERR_CANCELED",
            name: "AbortError",
          },
          response: null,
        };
      }

      const errorMessage = getErrorMsg(error);
      if (showAlert) {
        RenderToast({
          message: errorMessage || t("unexpectedError"),
          type: "error",
        });
      }

      if (
        error?.response?.status === 401 &&
        !isLoginRoute(pathname) &&
        errorMessage ===
          "It seems that you are trying to access from an unauthorized network. Please contact support for assistance."
      ) {
        dispatch(signOutRequest());
        Cookies.remove("_xpdx_u_acom-web");
        Cookies.remove("_xpdx_acom");
        Cookies.remove("_xpdx_rf_acom");
        Cookies.remove("role");
        Cookies.remove("user_permissions");

        globalThis.location.replace("/");
      }

      if (error?.response?.status === 401 && !isLoginRoute(pathname)) {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          headers.Authorization = `Bearer ${newAccessToken}`;
          return await axios({ method, url, data, headers });
        }
      }

      return { error, response: null };
    }
  };

  return {
    Get: ({ route = "", headers = {}, showAlert = true, signal = null }) =>
      handleRequest({ method: "get", route, headers, showAlert, signal }),

    Post: ({
      route = "",
      data = {},
      headers = {},
      showAlert = true,
      isFormData = false,
      signal = null,
    }) =>
      handleRequest({
        method: "post",
        route,
        data,
        headers,
        showAlert,
        isFormData,
        signal,
      }),

    Put: ({
      route = "",
      data = {},
      headers = {},
      showAlert = true,
      isFormData = false,
      signal = null,
    }) =>
      handleRequest({
        method: "put",
        route,
        data,
        headers,
        showAlert,
        isFormData,
        signal,
      }),

    Patch: ({
      route = "",
      data = {},
      headers = {},
      showAlert = true,
      isFormData = false,
      signal = null,
    }) =>
      handleRequest({
        method: "patch",
        route,
        data,
        headers,
        showAlert,
        isFormData,
        signal,
      }),

    Delete: ({ route = "", headers = {}, showAlert = true, signal = null }) =>
      handleRequest({ method: "delete", route, headers, showAlert, signal }),
  };
};

export default useAxios;
