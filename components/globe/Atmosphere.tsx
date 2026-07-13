"use client";

import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  BackSide,
  ShaderMaterial,
  SphereGeometry,
} from "three";
import { GLOBE_RADIUS } from "@/lib/constants";

/**
 * Soft cyan atmosphere halo: a slightly larger back-side sphere with a
 * fresnel falloff and additive blending. Pure GPU, no textures — the classic
 * "planet from space" glow that sells the travel/exploration mood.
 */
export default function Atmosphere() {
  const geometry = useMemo(
    () => new SphereGeometry(GLOBE_RADIUS * 1.18, 64, 64),
    [],
  );

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        blending: AdditiveBlending,
        side: BackSide,
        depthWrite: false,
        uniforms: {
          uColor: { value: [0.42, 0.68, 0.92] },
          uIntensity: { value: 0.9 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vNormal;
          uniform vec3 uColor;
          uniform float uIntensity;
          void main() {
            float rim = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
            gl_FragColor = vec4(uColor, 1.0) * clamp(rim, 0.0, 1.0) * uIntensity;
          }
        `,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <mesh geometry={geometry} material={material} />;
}
