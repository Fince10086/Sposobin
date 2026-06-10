<template>
  <header class="app-header">
    <div class="top-right-actions">
      <button @click="$emit('show-update')" class="modern-btn btn-primary update-top-btn">
        <span class="icon">🚀</span> 更新公告
      </button>
    </div>

    <div class="logo-area">
      <h1>Sposobin Engine <span class="badge">1.1</span></h1>
      <p class="subtitle">斯波索宾和声写作台</p>

      <div class="author-credits">
        <img src="https://github.com/Huaishu61.png" alt="青槐树的诗" class="github-avatar" />
        作者：<span class="author-name">青槐树的诗</span>
        <span class="divider">|</span>
        <a href="https://space.bilibili.com/381857406" target="_blank" class="author-link bilibili-link">
          <span class="link-icon">📺</span> B站主页
        </a>
        <span class="divider">|</span>
        <a href="https://github.com/Huaishu61" target="_blank" class="author-link github-link">
          <span class="link-icon">🐙</span> GitHub
        </a>
        <span class="divider">|</span>
        <span class="author-link qq-link">
          <span class="link-icon">👥</span> QQ群：850900762
        </span>
      </div>
    </div>
  </header>
</template>

<script setup>
defineEmits(['show-update']);
</script>

<style scoped>
.app-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
.logo-area { text-align: left; }
.top-right-actions { display: flex; gap: 8px; z-index: 50; flex-wrap: wrap; justify-content: flex-end; }
.update-top-btn { border-radius: 8px !important; box-shadow: var(--shadow-sm); padding: 8px 16px !important; font-size: 13px !important; background: #0EA5E9; color: white; }
.update-top-btn:hover { background: #0284C7; }
.logo-area h1 { font-size: 28px; font-weight: 700; color: var(--text-main); margin: 0 0 8px 0; letter-spacing: -0.5px;}
.badge { font-size: 12px; background: linear-gradient(135deg, #F59E0B, #EF4444); color: white; padding: 4px 10px; border-radius: 99px; vertical-align: middle; margin-left: 8px; font-weight: 600; }
.subtitle { color: var(--text-muted); font-size: 16px; font-weight: 500; margin: 0 0 8px 0; letter-spacing: 0.5px; }
.author-credits { font-size: 13px; color: var(--text-muted); display: flex; align-items: center; justify-content: flex-start; gap: 8px; margin-top: 12px; }
.author-name { font-weight: 600; color: var(--text-main); }
.divider { color: #CBD5E1; }
.author-link { text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px; transition: all 0.2s; }
.bilibili-link { color: #F472B6; background-color: #FDF2F8; }
.bilibili-link:hover { color: #DB2777; background-color: #FCE7F3; text-decoration: underline; }
.github-link { color: #334155; background-color: #F1F5F9; }
.github-link:hover { color: #0F172A; background-color: #E2E8F0; text-decoration: underline; }
.qq-link { color: #0284C7; background-color: #F0F9FF; font-weight: 600; }
.link-icon { font-size: 12px; }
.github-avatar { width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid #CBD5E1; object-fit: cover; box-shadow: var(--shadow-sm); }

@media screen and (max-width: 768px) {
  .app-header { flex-direction: column-reverse; align-items: center; }
  .logo-area { text-align: center; }
  .author-credits { justify-content: center; flex-wrap: wrap; line-height: 2; }
  .top-right-actions { position: static; justify-content: center; margin-bottom: 20px; width: 100%; }
  .divider { display: none; }
}
</style>
