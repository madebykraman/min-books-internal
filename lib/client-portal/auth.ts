import {randomBytes,scryptSync} from "node:crypto";

export function hashPortalPassword(password:string){
  const salt=randomBytes(16);
  const hash=scryptSync(password,salt,64);
  return "scrypt$"+salt.toString("hex")+"$"+hash.toString("hex");
}
