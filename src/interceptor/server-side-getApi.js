import { baseURL } from "@/resources/utils/helper";
import axios from "axios";

export const getApi = async (endpoint = "") => {
  try {
    const response = await axios.get(baseURL(endpoint));
    return response?.data;
  } catch (error) {
    console.log("🚀  getApi  error:", error);
    return null;
  }
};
