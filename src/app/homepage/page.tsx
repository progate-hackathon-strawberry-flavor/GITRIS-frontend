import Image from "next/image";
import { createClient } from '@/lib/supabase/server';
import HomepageButton from './HomepageButton';
import HelpModalTrigger from '../components/HelpModal/helpModal.module';
import RankingModalTrigger from '../components/rankingModal/RankingModalTrigger';
import styles from '../page.module.css';

export default async function Login() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    // ★ 1. すべての要素を単一の<main>タグで囲みます
    <main className={styles.container}>
      {/* ★ 2. 右上のアイコン群をグループ化 */}
      <div className={styles.topRightIcons}>
        <div className={styles.iconButton} title="ヘルプ">
          <HelpModalTrigger />
        </div>
        <div className={styles.iconButton} title="お問い合わせ">
          <RankingModalTrigger />
        </div>
      </div>

      {/* ★ 3. 中央のコンテンツをグループ化 */}
      <div className={styles.centerContent}>
        <Image
          className="dark:invert"
          src="/ロゴ.png"
          alt="gitris-logo"
          width={504}
          height={221}
          priority
        />
        {/* @ts-ignore */}
        <HomepageButton />
      </div>
    </main>
  );
}