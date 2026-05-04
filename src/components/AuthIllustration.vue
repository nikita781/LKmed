<script setup>
defineProps({
  imageSrc: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <section class="illustration-panel" aria-hidden="true">
    <div class="illustration-panel__frame">
      <img class="illustration-panel__image" :src="imageSrc" alt="" />
    </div>
  </section>
</template>

<style scoped>
.illustration-panel {
  min-width: 0;
  background: var(--color-surface);
}

.illustration-panel__frame {
  min-height: 1024px;
  overflow: hidden;
  background: var(--color-surface);
}

.illustration-panel__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

@media (max-width: 1199px) {
  .illustration-panel {
    min-height: auto;
    padding: 0 20px 40px;
    background: var(--color-bg);
  }

  .illustration-panel__frame {
    width: 100%;
    max-width: 540px;
    min-height: clamp(320px, 72vw, 520px);
    margin: 0 auto;
    border-radius: 20px;
  }

  .illustration-panel__image {
    object-position: center 32%;
  }
}

@media (max-width: 639px) {
  .illustration-panel {
    padding: 0 16px 32px;
  }

  .illustration-panel__frame {
    min-height: clamp(280px, 84vw, 420px);
    border-radius: 18px;
  }

  .illustration-panel__image {
    object-position: center 34%;
  }
}
</style>
