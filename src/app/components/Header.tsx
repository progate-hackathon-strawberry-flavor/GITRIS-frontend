"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useRouter } from 'next/navigation';

const Header = () => {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiRequest('/api/protected/auth/me', { credentials: 'include' });

        if (!response.ok) {
          setIconUrl(null);
          setUserId(null);
          return;
        }

        const data = await response.json();
        const resolvedUserId = data?.user?.login || data?.user?.userId || data?.user?.id || data?.user?.user_id;

        if (resolvedUserId) {
          setUserId(resolvedUserId);
          setIconUrl(`https://github.com/${resolvedUserId}.png`);
        } else {
          setIconUrl(null);
          setUserId(null);
        }
      } catch (error) {
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
