import "./main.css";
import * as THREE from "three";
import imagesLoaded from "imagesloaded";
import FontFaceObserver from "fontfaceobserver";
import Scroll from "./scroll";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";
import * as dat from "lil-gui";
import gsap from "gsap";
import ocean from "./img/ocean.jpg";

export default class Sketch {
  constructor(options) {
    this.time = 0;
    this.scene = new THREE.Scene();
    this.container = options.dom;

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      100,
      2000
    );
    this.camera.position.z = 600;

    this.camera.fov = 2 * Math.atan(this.height / 2 / 600) * (180 / Math.PI);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.images = [...document.querySelectorAll("img")];

    const fontOpen = new Promise((resolve) => {
      new FontFaceObserver("Open Sans").load().then(() => {
        resolve();
      });
    });
    const fontPlayfair = new Promise((resolve) => {
      new FontFaceObserver("Playfair Display").load().then(() => {
        resolve();
      });
    });

    // Preload images
    const preloadImages = new Promise((resolve, reject) => {
      imagesLoaded(
        document.querySelectorAll("img"),
        { background: true },
        resolve
      );
    });

    let allDone = [fontOpen, fontPlayfair, preloadImages];
    this.currentScroll = 0;

    Promise.all(allDone).then(() => {
      this.scroll = new Scroll();
      this.addImages();
      this.setPosition();
      this.resize();
      //   this.addObjects();
      this.render();
      this.setupResize();
    });
    window.addEventListener("scroll", () => {
      //   this.currentScroll = window.scrollY;
      //   this.setPosition();
    });
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addImages() {
    this.imageStore = this.images.map((img) => {
      let bounds = img.getBoundingClientRect();

      let geometry = new THREE.PlaneGeometry(bounds.width, bounds.height, 1, 1);
      let texture = new THREE.Texture(img);
      texture.repeat.set(0.5, 0.5);
      texture.needsUpdate = true;

      let material = new THREE.MeshBasicMaterial({
        // color: 0xff0000,
        map: texture,
      });

      let mesh = new THREE.Mesh(geometry, material);

      this.scene.add(mesh);

      return {
        img: img,
        mesh: mesh,
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      };
    });
  }

  setPosition() {
    this.imageStore.forEach((o) => {
      o.mesh.position.x = o.left - this.width / 2 + o.width / 2;
      o.mesh.position.y =
        this.currentScroll - o.top + this.height / 2 - o.height / 2;
    });
  }

  addObjects() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.geometry = new THREE.PlaneGeometry(100, 100, 10, 10);
    // this.geometry = new THREE.SphereGeometry(0.5, 50, 50);
    this.material = new THREE.MeshNormalMaterial();

    this.material = new THREE.ShaderMaterial({
      wireframe: true,
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        oceanTexture: { value: new THREE.TextureLoader().load(ocean) },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.box = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.box);
  }

  render() {
    this.time += 0.05;

    this.scroll.render();
    this.currentScroll = this.scroll.scrollToRender;
    this.setPosition();
    // this.material.uniforms.time.value = this.time;

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container"),
});