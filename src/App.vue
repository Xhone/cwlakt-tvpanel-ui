<template>
  <div id="app">
    <TVPanel v-if="componentLoaded"/>
    <div v-else class="loading-container">
      <p>Loading component...</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent,ref,onMounted } from 'vue';
import TVPanel from './views/TVPanel.vue';

export default defineComponent({
  name: 'App',
  components: {
    TVPanel
  },
  setup() {
    const componentLoaded = ref(false);

    onMounted(() => {
     try{
      componentLoaded.value = true;
      console.log('Component loaded successfully');
     }catch(e){
        console.error('Error loading component:', e);
      }
    });

    return {
      componentLoaded
    };
  }
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}


#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  width: 100%;
  height: 100vh;
  background-color: #2c3e50;
  color: #ffffff;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: #ffffff;
  font-size: 1.2rem;
}

/* Mobile-specific styles */
@media screen and (max-width: 480px) {
  #app {
    font-size: 14px;
  }

  .loading-container {
    font-size: 1rem;
  }
}

/* Debug helper class */
.debug-outline * {
  outline: 1px solid red;
}
</style>