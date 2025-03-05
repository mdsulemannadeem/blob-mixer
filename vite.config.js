import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [
    glsl(),
    // ... existing plugins ...
  ],
  // ... existing configuration ...
  resolve: {
    alias: {
      'three': 'three'
    }
  }
});
