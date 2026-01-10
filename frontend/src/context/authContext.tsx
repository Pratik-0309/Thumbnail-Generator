import { createContext, useContext, useEffect, useState } from "react";
import type { IUser } from "../assets/assets";
import { axiosInstance } from "../utils/axiosInstance.ts";
import toast from "react-hot-toast";

interface AuthContextProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  login: (user: { email: string; password: string }) => Promise<void>;
  signUp: (user: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  user: null,
  setUser: () => {},
  login: async () => {},
  signUp: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const signUp = async ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) => {
    try {
      const { data } = await axiosInstance.post("api/user/register", {
        name,
        email,
        password,
      });
      if (data.user) {
        setUser(data.user as IUser);
        setIsLoggedIn(true);
      }
      toast.success(data.message);
    } catch (error) {
      console.log(error);
    }
  };

  const login = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      const { data } = await axiosInstance.post("api/user/login", {
        email,
        password,
      });
      if (data.user) {
        setUser(data.user as IUser);
        setIsLoggedIn(true);
      }
      toast.success(data.message);
    } catch (error) {
      console.log(error);
    }
  };

  const logout = async () => {
    try {
      const { data } = await axiosInstance.post("api/user/logout");
      setUser(null);
      setIsLoggedIn(false);
      toast.success(data.message);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUser = async () => {
    try {
      const { data } = await axiosInstance.get("/api/user/profile");
      if (data.user) {
        setUser(data.user as IUser);
        setIsLoggedIn(true);
      }
    } catch (error) {
        console.log(error);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchUser();
    })();
  }, []);

  const value = {
    user,
    setUser,
    isLoggedIn,
    setIsLoggedIn,
    login,
    logout,
    signUp,
    fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = () => useContext(AuthContext);