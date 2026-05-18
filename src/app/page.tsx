import LoginButton from '../components/login-button';
import Image from 'next/image';
import './globals.css';
import HelpModalTrigger from './components/HelpModal/helpModal.module';
import RankingModalTrigger from './components/rankingModal/RankingModalTrigger';
import styles from './page.module.css';
export default function Login() {


  return (
    // CSS Modulesのクラスを適用
    <div className={styles.container}>
      {/* <style>タグはCSS Modulesファイルに移したので削除 */}

      {/* 右上アイコン */}
      <div className={styles.topRightIcons}>
        <div className={styles.iconButton} title="ヘルプ">
          <HelpModalTrigger />
        </div>
        <div className={styles.iconButton} title="お問い合わせ">
          <RankingModalTrigger />
        </div>
      </div>
      <div className={styles.supabaseAuthSection}>
        <Image
          className="dark:invert"
          src="/ロゴ.png"
          alt="gitris-logo"
          width={504}
          height={221}
          priority
        />
        <LoginButton />
      </div>
    </div>
  );
}
