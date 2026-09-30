import { simpleGit, SimpleGit } from "simple-git";
import fsPromises from "fs/promises";

export interface CloneResult {
  commitHash: string;
  commitMessage: string;
  author: string;
  workspacePath: string;
}

export async function cloneOrPullRepository(
  repositoryUrl: string,
  branch: string,
  targetDir: string,
  logCallback?: (msg: string) => void
): Promise<CloneResult> {
  const log = (msg: string) => {
    if (logCallback) logCallback(`[Git] ${msg}`);
  };

  // Ensure target directory exists and is empty
  await fsPromises.rm(targetDir, { recursive: true, force: true });
  await fsPromises.mkdir(targetDir, { recursive: true });

  log(`Cloning repository ${repositoryUrl} (branch: ${branch})...`);
  const git: SimpleGit = simpleGit();

  await git.clone(repositoryUrl, targetDir, [
    "--branch",
    branch,
    "--single-branch",
    "--depth",
    "1",
  ]);

  log("Repository cloned successfully. Extracting commit metadata...");

  const repoGit = simpleGit(targetDir);
  const logSummary = await repoGit.log({ maxCount: 1 });
  const latest = logSummary.latest;

  const commitHash = latest ? latest.hash : "HEAD";
  const commitMessage = latest ? latest.message : "Latest commit";
  const author = latest ? latest.author_name : "Unknown";

  log(`Checked out commit ${commitHash.substring(0, 7)}: "${commitMessage}" by ${author}`);

  return {
    commitHash,
    commitMessage,
    author,
    workspacePath: targetDir,
  };
}
