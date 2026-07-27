import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, relative, resolve } from "node:path";
import process from "node:process";

const projectRoot = process.cwd();

const requiredFiles = [
  "package.json",
  "package-lock.json",
  ".env.example",
  ".gitignore",
  ".github/workflows/quality.yml",
  "app/responsive-refinements.css",
  "components/admin/MotorcyclePublicPreviewLink.tsx",
  "lib/image-optimization.ts",
  "supabase/admin-seguranca.sql",
];

const textExtensions = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".json",
  ".css",
  ".md",
  ".sql",
  ".yml",
  ".yaml",
  ".txt",
]);

const forbiddenTrackedFiles = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
];

const sensitivePatterns = [
  {
    name: "chave service_role",
    expression: /SUPABASE_SERVICE_ROLE|service_role\s*[:=]/i,
  },
  {
    name: "chave privada do Supabase",
    expression: /SUPABASE_SECRET_KEY\s*=/i,
  },
  {
    name: "token da Vercel",
    expression: /VERCEL_TOKEN\s*=/i,
  },
];

function runGit(args) {
  return execFileSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function fail(message) {
  console.error(`\nERRO: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`OK: ${message}`);
}

function info(message) {
  console.log(`INFO: ${message}`);
}

console.log("\n=== VERIFICAÇÃO DE PUBLICAÇÃO ===\n");

const nodeMajor = Number(process.versions.node.split(".")[0]);

if (nodeMajor >= 22) {
  pass(`Node.js ${process.versions.node}`);
} else {
  fail(
    `Node.js ${process.versions.node} detectado. O projeto exige Node.js 22 ou superior.`,
  );
}

for (const requiredFile of requiredFiles) {
  const absolutePath = resolve(projectRoot, requiredFile);

  if (!existsSync(absolutePath)) {
    fail(`Arquivo obrigatório ausente: ${requiredFile}`);
    continue;
  }

  if (!statSync(absolutePath).isFile()) {
    fail(`O caminho obrigatório não é um arquivo: ${requiredFile}`);
    continue;
  }

  pass(`Arquivo encontrado: ${requiredFile}`);
}

let trackedFiles = [];

try {
  trackedFiles = runGit(["ls-files", "-z"])
    .split("\0")
    .filter(Boolean);
  pass(`Git respondeu com ${trackedFiles.length} arquivos rastreados.`);
} catch {
  fail(
    "Não foi possível consultar o Git. Confirme que o terminal está aberto na pasta do projeto.",
  );
}

for (const forbiddenFile of forbiddenTrackedFiles) {
  if (trackedFiles.includes(forbiddenFile)) {
    fail(
      `${forbiddenFile} está rastreado pelo Git. Remova-o do histórico antes da publicação.`,
    );
  } else {
    pass(`${forbiddenFile} não está rastreado.`);
  }
}

const suspiciousFiles = [];

for (const trackedFile of trackedFiles) {
  const absolutePath = resolve(projectRoot, trackedFile);

  if (
    !existsSync(absolutePath) ||
    !statSync(absolutePath).isFile() ||
    !textExtensions.has(extname(trackedFile).toLowerCase())
  ) {
    continue;
  }

  let content = "";

  try {
    content = readFileSync(absolutePath, "utf8");
  } catch {
    continue;
  }

  for (const pattern of sensitivePatterns) {
    if (pattern.expression.test(content)) {
      suspiciousFiles.push({
        file: trackedFile,
        pattern: pattern.name,
      });
    }
  }
}

if (suspiciousFiles.length > 0) {
  for (const suspiciousFile of suspiciousFiles) {
    fail(
      `Possível ${suspiciousFile.pattern} encontrada em ${suspiciousFile.file}.`,
    );
  }
} else {
  pass("Nenhuma chave privada conhecida foi encontrada nos arquivos rastreados.");
}

const gitignorePath = resolve(projectRoot, ".gitignore");

if (existsSync(gitignorePath)) {
  const gitignore = readFileSync(gitignorePath, "utf8");

  if (/^\.env\*$/m.test(gitignore)) {
    pass(".gitignore protege arquivos .env*.");
  } else {
    fail('.gitignore não contém a regra ".env*".');
  }
}

const adminSecurityPath = resolve(
  projectRoot,
  "supabase/admin-seguranca.sql",
);

if (existsSync(adminSecurityPath)) {
  const adminSecurity = readFileSync(adminSecurityPath, "utf8");

  if (adminSecurity.includes("COLOQUE_SEU_EMAIL_AQUI")) {
    pass("SQL administrativo usa marcador, sem e-mail pessoal versionado.");
  } else {
    info(
      "O SQL administrativo não contém o marcador COLOQUE_SEU_EMAIL_AQUI. Revise se um e-mail pessoal foi versionado.",
    );
  }
}

try {
  const branch = runGit(["branch", "--show-current"]);
  info(`Branch atual: ${branch || "não identificada"}`);

  if (branch && branch !== "main") {
    info(
      "A publicação de produção deve ser enviada para a branch configurada na Vercel, normalmente main.",
    );
  }

  const status = runGit(["status", "--short"]);

  if (status) {
    console.log("\nArquivos ainda não commitados:\n");
    console.log(status);
  } else {
    pass("Não existem alterações locais pendentes.");
  }
} catch {
  // O erro principal do Git já foi apresentado acima.
}

if (process.exitCode) {
  console.error(
    "\nA publicação foi bloqueada. Corrija os itens acima e execute novamente.\n",
  );
} else {
  console.log(
    "\nPRÉ-VALIDAÇÃO APROVADA. Agora execute typecheck, lint e build.\n",
  );
}
