#!/usr/bin/env node

/*
 * @Author: Lin Ya
 * @Date: 2025-04-10 09:16:06
 * @LastEditors: Lin Ya
 * @LastEditTime: 2025-04-10 09:17:23
 * @Description: 备份命令
 */
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const program = new Command();

program
  .version('0.0.1')
  .description('Backup or update GitHub repositories.')
  .argument("[cmd]", "command [backup|list]", "backup")
  .option('-p, --repo-path [path]', 'The path to the directory containing source.txt', ".")
  .option('-u, --username <username>', 'GitHub username')
  .option('-o, --output-path [path]', 'Output path for repository lists', 'github-repos')
  .action(async (_cmd, options) => {
    const { username, outputPath, repoPath } = options;

    const getGithubRepoList = async (username: string, outputPath: string) => {
      if (!username) {
        console.error('Error: username is required when using --list');
        program.help();
        process.exit(1);
      }

      const reposDir = path.join(outputPath, username);

      if (!fs.existsSync(reposDir)) {
        fs.mkdirSync(reposDir, { recursive: true });
      }

      try {
        let allRepos: any[] = [];
        let nextPageUrl: string | null = `https://api.github.com/users/${username}/repos`;

        while (nextPageUrl) {
          const response: Response = await fetch(nextPageUrl);
          const repos = await response.json();

          if (!Array.isArray(repos)) {
            console.error(`Error: Could not fetch repositories for ${username}`);
            process.exit(1);
          }

          allRepos = allRepos.concat(repos);

          const linkHeader: string | null = response.headers.get('Link');
          nextPageUrl = linkHeader?.split(',').find((link: string) => link.includes('rel="next"'))?.split(';')[0].replace(/<|>/g, '').trim() || null;
        }

        const ownedRepos = allRepos.filter(repo => !repo.fork);
        const publicRepos = ownedRepos.filter(repo => !repo.private);
        const privateRepos = ownedRepos.filter(repo => repo.private);
        const forkedRepos = allRepos.filter(repo => repo.fork);

        const writeRepoList = (repos: any[], filename: string) => {
          if (!repos || repos.length === 0) return;

          const filePath = path.join(reposDir, filename);
          const repoListContent = repos.map((repo: any) => `# ${repo.description || 'No description'}\n# ${repo.name}\n# ${repo.html_url}\n${repo.clone_url}\n\n`).join('\n');
          fs.writeFileSync(filePath, repoListContent);
          console.log(`Wrote repository list to ${filePath}`);
        };

        writeRepoList(publicRepos, `${username}.public.repo`);
        writeRepoList(privateRepos, `${username}.private.repo`);
        writeRepoList(forkedRepos, `${username}.fork.repo`);

      } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
      }
    };

    async function backupRepos() {
      const sourceFile = path.join(repoPath, 'source.txt');

      if (!fs.existsSync(sourceFile)) {
        console.error(`Error: source.txt not found in ${path}`);
        process.exit(1);
      }

      const repositories = fs.readFileSync(sourceFile, 'utf-8').trim().split('\r\n').map(x => x.trim()).filter(repoUrl => repoUrl && !repoUrl.startsWith('#') && repoUrl.endsWith(".git"));

      const totalRepositories = repositories.length;
      let processedRepositories = 0;
      const progressBarLength = 30;

      for (const repoUrl of repositories) {
        const repoName = repoUrl.substring(repoUrl.lastIndexOf('/') + 1).replace('.git', '');
        const repo_Path = path.join(repoPath, repoName);

        let action = "Cloning";
        if (fs.existsSync(repo_Path)) {
          action = "Updating";
        }

        try {
          if (!fs.existsSync(repo_Path)) {
            console.log(`${action} ${repoUrl} to ${repo_Path}`);
            execSync(`git clone --mirror ${repoUrl} ${repo_Path}`, { stdio: 'inherit' });
          } else {
            console.log(`${action} ${repoUrl} in ${repo_Path}`);
            execSync(`cd ${repo_Path} && git remote update`, { stdio: 'inherit' });
          }
        } catch (error) {
          console.error(`Error ${action.toLowerCase()} ${repoUrl}: ${error}`);
          process.exit(1);
        }

        processedRepositories++;
        const progress = processedRepositories / totalRepositories;
        const completed = Math.floor(progress * progressBarLength);
        const bar = '='.repeat(completed) + '-'.repeat(progressBarLength - completed);

        process.stdout.write(`\r[${bar}] ${action} ${repoName} (${processedRepositories}/${totalRepositories})`);

        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      process.stdout.write('\n');
    }

    if (_cmd === "list") {
      await getGithubRepoList(username, outputPath);
    } else if (_cmd === "backup") {
      await backupRepos();
    }
    else {
      program.help();
    }

  });

program.parse(process.argv);

if (process.argv.slice(2).length === 0) {
  program.help();
}