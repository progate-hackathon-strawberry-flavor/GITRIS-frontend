"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';

const GitHubicon = () => {
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
      <div style={{display: "flex",justifyContent: "flex-end",}}>
        <button type="button" onClick={() => router.push(`https://github.com/${userId}`)}>
          {iconUrl && (
          <Image
            src={iconUrl}
            alt="User Icon"
            width={32}
            height={32}
            style={{ borderRadius: "50%"  }}
          />
          )}
        </button>
      </div>
  );
};

export default GitHubicon;
