"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useRouter } from 'next/navigation';

const GitHubicon = () => {
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
