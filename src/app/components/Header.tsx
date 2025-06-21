"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const Header = () => {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserName(user?.email || null); // email以外の名前を表示したい場合は適宜修正
    };
    fetchUser();
  }, []);

  return (
    <header
      style={{
        width: "100%",
        padding: "1rem",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        borderBottom: "1px solid #eee",
      }}
    >
      {userName ? (
        <span style={{ fontWeight: "bold" }}>ログイン中: {userName}</span>
      ) : (
        <span>未ログイン</span>
      )}
    </header>
  );
};

export default Header;
