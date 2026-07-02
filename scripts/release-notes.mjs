import { execSync } from "node:child_process";

const version = process.argv[2] || "v1.0.0";

function safe(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

const commits = safe("git log --pretty=format:'- %s (%h)' -n 20");

const output = `# ${version}\n\n## Tinh nang moi\n- Mo hinh Runtime Electron + React + Express + SQLite cuc bo\n- Ho tro mo hinh Boss ↔ Nhan vien va da tai khoan\n- Cai dat doi thu muc luu tru SQLite trong app\n- So do luong xu ly don hang theo quy trinh can vao/can ra\n\n## Loi da sua\n- Dong bo build TypeScript cho main process va renderer\n- Chuan hoa artifact release Windows NSIS + Portable\n\n## Cai tien\n- Pipeline GitHub Actions build Release tren Windows sach\n- Release assets upload tu dong len GitHub Releases\n\n## Commit gan day\n${commits || "- Khoi tao release"}\n`;

console.log(output);
