import Image from "next/image";
import HomepageButton from './HomepageButton';

export default function Login() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/ロゴ.png"
          alt="gitris-logo"
          width={504}
          height={221}
          priority
        />
        <HomepageButton />
      </main>
    </div>
  );
}