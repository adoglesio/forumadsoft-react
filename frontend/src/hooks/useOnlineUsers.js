import { useState, useEffect } from "react";
import { ouvirOnline } from "../services/presence";

export function useOnlineUsers() {
  const [online, setOnline] = useState([]);
  useEffect(() => ouvirOnline(setOnline), []);
  return online;
}
