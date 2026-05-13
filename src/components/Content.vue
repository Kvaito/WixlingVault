<script setup lang="ts">
</script>

<template>
  <div class="hero">
    <h1 class="site-title">Wixling Vault</h1>
    <p class="subtitle">Интерактивная энциклопедия</p>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.site-title {
  font-size: 4rem;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.05em;
  text-align: center;
}

.subtitle {
  font-size: 1.35rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-align: center;
}
</style>
