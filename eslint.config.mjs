import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    "out/**",
    "next-env.d.ts",
    "ajuste-19-12-1-files/**",
    "corrigir-acentuacao-19-12-1.js",
    "corrigir-textos-assinatura-19-12-2.js",
  ]),
]);
