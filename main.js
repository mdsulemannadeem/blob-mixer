import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils";
import vertexShaders from "./shaders/vertexShaders.glsl";
import { Text } from "troika-three-text";
import textVertexShaders from "./shaders/textVertexShaders.glsl";
import gsap from "gsap/all";

const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const rgbeLoader = new RGBELoader(loadingManager);

const blobs = [
  {
    name: "Color Fusion",
    background: "#9D73F7",
    config: {
      uPositionFrequency: 1,
      uPositionStrength: 0.3,
      uSmallWavePositionFrequency: 0.5,
      uSmallWavePositionStrength: 0.7,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.5,
      clearcoat: 0,
      clearcoatRoughness: 0,
      transmission: 0,
      flatShading: false,
      wireframe: false,
      map: "cosmic-fusion",
    },
  },
  {
    name: "Purple Mirror",
    background: "#5300B1",
    config: {
      uPositionFrequency: 0.584,
      uPositionStrength: 0.276,
      uSmallWavePositionFrequency: 0.899,
      uSmallWavePositionStrength: 1.266,
      roughness: 0,
      metalness: 1,
      envMapIntensity: 2,
      clearcoat: 0,
      clearcoatRoughness: 0,
      transmission: 0,
      flatShading: false,
      wireframe: false,
      map: "purple-rain",
    },
  },
  {
    name: "Alien Goo",
    background: "#45ACD8",
    config: {
      uPositionFrequency: 1.022,
      uPositionStrength: 0.99,
      uSmallWavePositionFrequency: 0.378,
      uSmallWavePositionStrength: 0.341,
      roughness: 0.292,
      metalness: 0.73,
      envMapIntensity: 0.86,
      clearcoat: 1,
      clearcoatRoughness: 0,
      transmission: 0,
      flatShading: false,
      wireframe: false,
      map: "lucky-day",
    },
  },
];

let isAnimating = false;
let currentIndex = 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#333");
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#canvas"),
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio to reduce GPU workload
renderer.setSize(window.innerWidth, window.innerHeight, false); // Avoid unnecessary resizing
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

const uniforms = {
  uTime: { value: 0 },
  uPositionFrequency: { value: blobs[currentIndex].config.uPositionFrequency },
  uPositionStrength: { value: blobs[currentIndex].config.uPositionStrength },
  uTimeFrequency: { value: 0.3 },
  uSmallWavePositionFrequency: {
    value: blobs[currentIndex].config.uSmallWavePositionFrequency,
  },
  uSmallWavePositionStrength: {
    value: blobs[currentIndex].config.uSmallWavePositionStrength,
  },
  uSmallWaveTimeFrequency: { value: 0.3 },
};

// Preload all textures asynchronously to avoid delays during runtime
const preloadedTextures = {};
blobs.forEach((blob) => {
  preloadedTextures[blob.config.map] = textureLoader.load(`./gradients/${blob.config.map}.png`);
});

const material = new CustomShaderMaterial({
  baseMaterial: THREE.MeshPhysicalMaterial,
  vertexShader: vertexShaders,
  map: preloadedTextures[blobs[currentIndex].config.map],
  metalness: blobs[currentIndex].config.metalness,
  roughness: blobs[currentIndex].config.roughness,
  envMapIntensity: blobs[currentIndex].config.envMapIntensity,
  clearcoat: blobs[currentIndex].config.clearcoat,
  clearcoatRoughness: blobs[currentIndex].config.clearcoatRoughness,
  transmission: blobs[currentIndex].config.transmission,
  flatShading: blobs[currentIndex].config.flatShading,
  wireframe: blobs[currentIndex].config.wireframe,
  uniforms,
});

// Reduce geometry complexity by lowering the subdivision level
const mergedGeometry = mergeVertices(new THREE.IcosahedronGeometry(1, 20)); // Reduced from 30 to 20
mergedGeometry.computeTangents();

const sphere = new THREE.Mesh(mergedGeometry, material);
scene.add(sphere);

camera.position.z = 3;

rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr",
  function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  }
);

const clock = new THREE.Clock();

const textMaterial = new THREE.ShaderMaterial({
  fragmentShader: `void main() { gl_FragColor = vec4(1.0); }`,
  vertexShader: textVertexShaders,
  side: THREE.DoubleSide,
  uniforms: {
    progress: { value: 0.0 },
    direction: { value: 1 },
  },
});

const texts = blobs.map((blob, index) => {
  const myText = new Text();
  myText.text = blob.name;
  myText.font = `./aften_screen.woff`;
  myText.anchorX = "center";
  myText.anchorY = "middle";
  myText.material = textMaterial;
  myText.position.set(0, 0, 2);
  if (index !== 0) myText.scale.set(0, 0, 0);
  myText.letterSpacing = -0.08;
  myText.fontSize = window.innerWidth / 4000;
  myText.glyphGeometryDetail = 20;
  myText.sync();
  scene.add(myText);
  return myText;
});

// Call updateResponsiveProperties after texts are initialized
updateResponsiveProperties();

// Function to update responsive properties
function updateResponsiveProperties() {
  // Adjust font size based on screen width
  const fontSize = window.innerWidth / 4000;
  texts.forEach((text) => {
    text.fontSize = fontSize;
    text.sync();
  });

  // Update renderer size and camera aspect ratio
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Call updateResponsiveProperties on window resize
window.addEventListener("resize", updateResponsiveProperties);

// Debounce the wheel event to prevent excessive calls
let wheelTimeout;
window.addEventListener("wheel", (e) => {
  if (isAnimating || wheelTimeout) return;
  wheelTimeout = setTimeout(() => (wheelTimeout = null), 200); // Debounce for 200ms
  isAnimating = true;
  let direction = Math.sign(e.deltaY);
  let next = (currentIndex + direction + blobs.length) % blobs.length;

  texts[next].scale.set(1, 1, 1);
  texts[next].position.x = direction * 3.5;

  gsap.to(textMaterial.uniforms.progress, {
    value: 0.5,
    duration: 0.8, // Reduced duration for faster animations
    ease: "linear",
    onComplete: () => {
      currentIndex = next;
      isAnimating = false;
      textMaterial.uniforms.progress.value = 0;
    },
  });

  gsap.to(texts[currentIndex].position, {
    x: -direction * 3,
    duration: 0.8, // Reduced duration
    ease: "power2.inOut",
  });

  gsap.to(sphere.rotation, {
    y: sphere.rotation.y + Math.PI * 2 * -direction, // Reduced rotation for faster animation
    duration: 0.8,
    ease: "power2.inOut",
  });

  gsap.to(texts[next].position, {
    x: 0,
    duration: 0.8,
    ease: "power2.inOut",
  });

  const bg = new THREE.Color(blobs[next].background);
  gsap.to(scene.background, {
    r: bg.r,
    g: bg.g,
    b: bg.b,
    duration: 0.8,
    ease: "linear",
  });

  updateBlob(blobs[next].config);
});

// Variables to track touch gestures
let touchStartX = 0;
let touchEndX = 0;

// Function to handle touch start
window.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].clientX;
});

// Function to handle touch end
window.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].clientX;
  handleSwipe();
});

// Function to handle swipe gestures
function handleSwipe() {
  if (isAnimating) return;

  const swipeDistance = touchEndX - touchStartX;
  if (Math.abs(swipeDistance) > 50) { // Minimum swipe distance threshold
    isAnimating = true;
    const direction = swipeDistance > 0 ? -1 : 1; // Determine swipe direction
    let next = (currentIndex + direction + blobs.length) % blobs.length;

    texts[next].scale.set(1, 1, 1);
    texts[next].position.x = direction * 3.5;

    gsap.to(textMaterial.uniforms.progress, {
      value: 0.5,
      duration: 0.8,
      ease: "linear",
      onComplete: () => {
        currentIndex = next;
        isAnimating = false;
        textMaterial.uniforms.progress.value = 0;
      },
    });

    gsap.to(texts[currentIndex].position, {
      x: -direction * 3,
      duration: 0.8,
      ease: "power2.inOut",
    });

    gsap.to(sphere.rotation, {
      y: sphere.rotation.y + Math.PI * 2 * -direction,
      duration: 0.8,
      ease: "power2.inOut",
    });

    gsap.to(texts[next].position, {
      x: 0,
      duration: 0.8,
      ease: "power2.inOut",
    });

    const bg = new THREE.Color(blobs[next].background);
    gsap.to(scene.background, {
      r: bg.r,
      g: bg.g,
      b: bg.b,
      duration: 0.8,
      ease: "linear",
    });

    updateBlob(blobs[next].config);
  }
}

// Use preloaded textures in updateBlob
function updateBlob(config) {
  if (config.uPositionFrequency !== undefined)
    gsap.to(material.uniforms.uPositionFrequency, {
      value: config.uPositionFrequency,
      duration: 1,
      ease: "power2.inOut",
    });
  if (config.uPositionStrength !== undefined)
    gsap.to(material.uniforms.uPositionStrength, {
      value: config.uPositionStrength,
      duration: 1,
      ease: "power2.inOut",
    });
  if (config.uSmallWavePositionFrequency !== undefined)
    gsap.to(material.uniforms.uSmallWavePositionFrequency, {
      value: config.uSmallWavePositionFrequency,
      duration: 1,
      ease: "power2.inOut",
    });
  if (config.uSmallWavePositionStrength !== undefined)
    gsap.to(material.uniforms.uSmallWavePositionStrength, {
      value: config.uSmallWavePositionStrength,
      duration: 1,
      ease: "power2.inOut",
    });
  if (config.uSmallWaveTimeFrequency !== undefined)
    gsap.to(material.uniforms.uSmallWaveTimeFrequency, {
      value: config.uSmallWaveTimeFrequency,
      duration: 1,
      ease: "power2.inOut",
    });
  if (config.map !== undefined) {
    setTimeout(() => {
      material.map = preloadedTextures[config.map];
    }, 200); // Reduced delay
  }
  if (config.roughness !== undefined)
    gsap.to(material, {
      roughness: config.roughness,
      duration: 1,
      ease: "power2.inOut",
    });
  if (config.metalness !== undefined)
    gsap.to(material, {
      metalness: config.metalness,
      duration: 1,
      ease: "power2.inOut",
    });
  if (config.envMapIntensity !== undefined)
    gsap.to(material, {
      envMapIntensity: config.envMapIntensity,
      duration: 1,
      ease: "power2.inOut",
    });
  if (config.clearcoat !== undefined)
    gsap.to(material, {
      clearcoat: config.clearcoat,
      duration: 1,
      ease: "power2.inOut",
    });
  if (config.clearcoatRoughness !== undefined)
    gsap.to(material, {
      clearcoatRoughness: config.clearcoatRoughness,
      duration: 1,
      ease: "power2.inOut",
    });
  if (config.transmission !== undefined)
    gsap.to(material, {
      transmission: config.transmission,
      duration: 1,
      ease: "power2.inOut",
    });
  if (config.flatShading !== undefined)
    gsap.to(material, {
      flatShading: config.flatShading,
      duration: 1,
      ease: "power2.inOut",
    });
  if (config.wireframe !== undefined)
    gsap.to(material, {
      wireframe: config.wireframe,
      duration: 1,
      ease: "power2.inOut",
    });
}

loadingManager.onLoad = () => {
  function animate() {
    requestAnimationFrame(animate);
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
  }
  const bg = new THREE.Color(blobs[currentIndex].background);
  gsap.to(scene.background, {
    r: bg.r,
    g: bg.g,
    b: bg.b,
    duration: 1,
    ease: "linear",
  });
  animate();
};
