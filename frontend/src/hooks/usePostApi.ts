import { useState, useCallback } from "react";
import axios from "axios";
import { ApiResponse } from "../types/ApiTypes";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { userAtom, defaultUser } from "recoil/user";

export const usePostApi = <D, T>(endpoint: string): [ApiResponse<T>, boolean, (data: D) => Promise<void>] => {
  const [results, setResults] = useState<ApiResponse<T>>({
    success: false,
    errorMessage: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUserAtom = useSetRecoilState(userAtom);
  
  const postProducts = useCallback(
    async (data: D) => {
      try {
        setLoading(true);
        const response = await axios.request<ApiResponse<T>>({
          data: data,
          method: "POST",
          url: process.env.REACT_APP_URL_BASE + endpoint,
          withCredentials: true,
        });

        if (!response.data.success) {
          throw new Error(response.data.errorMessage || "Failed to fetch");
        } else {
          setResults(response.data);
        }
      } catch (error: any) {
        if (error.response && error.response.status === 401) {
          setUserAtom(defaultUser);
          navigate('/login');
        }

        setResults({
          success: false,
          errorMessage: error.message,
        });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return [results, loading, postProducts];
};

export default usePostApi;
