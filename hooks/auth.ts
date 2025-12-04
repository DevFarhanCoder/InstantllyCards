// hooks/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import api from "../lib/api";

type User = { id: string; name: string; phone: string; email?: string; avatar?: string };
type AuthRes = { token: string; user: User };

export const useLogin = () =>
  useMutation({
    mutationFn: (body: { phone: string; password: string }) =>
      api.post<AuthRes>("/auth/login", body),
    onSuccess: async (data) => {
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
    },
  });

export const useSignup = () =>
  useMutation({
    mutationFn: (body: { name: string; phone: string; password: string; email?: string }) =>
      api.post<AuthRes>("/auth/signup", body),
    onSuccess: async (data) => {
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
    },
  });

export const useLogout = () =>
  useMutation({
    mutationFn: async () => {
      await AsyncStorage.multiRemove(["token", "user"]);
    },
  });
