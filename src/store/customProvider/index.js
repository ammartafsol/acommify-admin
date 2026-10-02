"use client";
import useAxios from "@/interceptor/axios-functions";
import Aos from "aos";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/lib/integration/react";
import store, { persistor } from "..";
import { signOutRequest } from "../auth/authSlice";
import { SocketProvider } from "@/context/SocketContext";
import { useLocaleHistory } from "@/resources/hooks/useLocaleHistory";

export function CustomProvider({ children }) {
  useLocaleHistory();

  useEffect(() => {
    Aos.init();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ApisProvider>
          <SocketProvider>{children}</SocketProvider>
        </ApisProvider>
      </PersistGate>
    </Provider>
  );
}

export default function ApisProvider({ children }) {
  let accessToken = Cookies.get("_xpdx_acom");
  const { user } = useSelector((state) => state?.authReducer);
  const dispatch = useDispatch();
  const { Get } = useAxios();

  const getCommonData = async () => {
    const [{ response: userResponse }] = await Promise?.all([
      Get({ route: "users/me" }),
    ]);
    if (userResponse) {
      dispatch(setExample(userResponse?.data?.data));
    }
  };

  useEffect(() => {
    if (!accessToken) {
      dispatch(signOutRequest());
    } else {
      console.log(user?.permissions);
      // getCommonData();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}
