import { scan, score, audit } from "@securesecrets/engine";
import type { ScanOptions } from "@securesecrets/engine";

export async function securityScan(args: {
  path?: string;
  deep?: boolean;
}) {
  const options: ScanOptions = {
    path: args.path,
    deep: args.deep,
  };
  return await scan(options);
}

export async function securityScore() {
  return await score();
}

export async function checkSkill(args: { skillName: string }) {
  return await audit(args.skillName);
}
