varying vec2 vUv;
    void main() {
     gl_FragColor = vec4(vUv * 0.5 + 0.5, 0.0, 1.0);

    }