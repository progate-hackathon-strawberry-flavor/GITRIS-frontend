"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';

const Header = () => {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("user:", user);

      if (user && user.id) {
        // usersテーブルからicon_urlとidを取得
        const { data, error } = await supabase
          .from("users")
          .select('*')
          .eq("id", user.id)
          .single();
          console.log(data);
          console.log(error);
          console.log(user.id);
        console.log("Fetched user data:", data, "Error:", error);

        if (!error && data) {
          setIconUrl(data.icon_url ?? null);
          setUserId(data.user_name ?? null);
        } else {
          setIconUrl(null);
          setUserId(null);
        }
      } else {
        setIconUrl(null);
        setUserId(null);
      }
    };
    fetchUser();
  }, []);

  return (
    <header
      style={{
        width: "100%",
        padding: "1rem",
        display: "flex",
        borderBottom: "1px solid #eee",
        gap: "1rem",
      }}
    > 
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <button type="button" onClick={() => router.push('/homepage')}>
          <Image
        className="dark:invert"
        src="/gitris.png"
        alt="gitris-logo"
        width={32}
        height={32}
        priority
          />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button type="button" onClick={() => router.push(`https://github.com/${userId}`)}>
        {iconUrl && (
          <Image
            src={iconUrl}
            alt="User Icon"
            width={32}
            height={32}
            style={{ borderRadius: "50%" }}
          />
        )}
          </button>
          {userId && <span>{userId}</span>}
        </div>
      </div>
    </header>
  );
};

export default Header;
