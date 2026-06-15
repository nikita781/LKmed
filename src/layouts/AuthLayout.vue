<script setup>
import { medicalTeamIllustrationSrc, udmurtiaEmblemSrc } from "../assets/designAssets";
import AppHeader from "../components/AppHeader.vue";
import AuthIllustration from "../components/AuthIllustration.vue";
</script>

<template>
  <div class="auth-layout">
    <AppHeader class="auth-layout__header" :logo-src="udmurtiaEmblemSrc" />

    <main class="auth-layout__screen">
      <section class="auth-layout__panel">
        <slot />
      </section>

      <AuthIllustration :image-src="medicalTeamIllustrationSrc" />
    </main>
  </div>
</template>

<style scoped>
.auth-layout {
  position: relative;
  min-height: 100vh;
  background: var(--color-bg);
}

.auth-layout__header {
  position: relative;
  z-index: 10;
}

.auth-layout__screen {
  display: grid;
  grid-template-columns: minmax(0, 758px) minmax(0, 682px);
  justify-content: center;
  width: 100%;
  max-width: 1440px;
  min-height: 1024px;
  margin: calc(-1 * var(--header-height)) auto 0;
}

.auth-layout__panel {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-width: 0;
  padding: 96px 32px 32px;
  background: var(--color-bg);
}

@media (max-width: 1439px) {
  .auth-layout__screen {
    grid-template-columns: minmax(0, 56%) minmax(0, 44%);
  }

  .auth-layout__panel {
    padding: 96px 24px 32px;
  }
}

@media (max-width: 1199px) {
  .auth-layout__screen {
    grid-template-columns: 1fr;
    max-width: 820px;
    min-height: auto;
    margin-top: 0;
  }

  .auth-layout__panel {
    padding: 48px 20px 24px;
  }
}

@media (max-width: 639px) {
  .auth-layout__screen {
    max-width: none;
  }

  .auth-layout__panel {
    padding: 36px 16px 20px;
  }
}
</style>
