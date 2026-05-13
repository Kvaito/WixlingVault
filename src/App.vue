<script setup lang="ts">
import Content from "./components/Content.vue";
import bgImage from "./assets/entityMusician.png";
</script>

<template>
  <div :style="{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', minHeight: '100vh', minWidth: '100vw' }">
    <div class="overlay">
      <Content/>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
