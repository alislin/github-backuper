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
  .argument('<path>', 'The path to the directory containing source.txt')
  .option('-u, --username <username>', 'GitHub username')
  .option('-o, --output-path <path>', 'Output path for repository lists', 'github-repos')
  .option('--list', 'List GitHub repositories')
  .action(async (_path, options) => {
    const { username, outputPath, list } = options;

    const getGithubRepoList = async (username: string, outputPath: string) => {
      if (!username) {
        console.error('Error: username is required when using --list');
        process.exit(1);
      }

      const reposDir = path.join(_path, outputPath);

      if (!fs.existsSync(reposDir)) {
        fs.mkdirSync(reposDir, { recursive: true });
      }

      try {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        const repos = await response.json();

        if (!Array.isArray(repos)) {
          console.error(`Error: Could not fetch repositories for ${username}`);
          process.exit(1);
        }

        const ownedRepos = repos.filter(repo => !repo.fork);
        const forkedRepos = repos.filter(repo => repo.fork);

        const writeRepoList = (repos: any[], filename: string) => {
          const filePath = path.join(reposDir, filename);
          const repoListContent = repos.map((repo: any) => `# ${repo.description || 'No description'}\n# ${repo.name}\n${repo.html_url}\n\n`).join('\n');
          fs.writeFileSync(filePath, repoListContent);
          console.log(`Wrote repository list to ${filePath}`);
        };

        writeRepoList(ownedRepos, `${username}.txt`);
        writeRepoList(forkedRepos, `${username}.fork.txt`);

      } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
      }
    };
    if (list) {
      await getGithubRepoList(username, outputPath);
    } else {
      const sourceFile = path.join(_path, 'source.txt');

      if (!fs.existsSync(sourceFile)) {
        console.error(`Error: source.txt not found in ${_path}`);
        process.exit(1);
      }

      const repositories = fs.readFileSync(sourceFile, 'utf-8').trim().split('\\n');

      repositories.forEach(repoUrl => {
        const repoName = repoUrl.substring(repoUrl.lastIndexOf('/') + 1).replace('.git', '');
        const repoPath = path.join(_path, repoName);

        if (!fs.existsSync(repoPath)) {
          console.log(`Cloning ${repoUrl} to ${repoPath}`);
          try {
            execSync(`git clone --mirror ${repoUrl} ${repoPath}`, { stdio: 'inherit' });
          } catch (error) {
            console.error(`Error cloning ${repoUrl}: ${error}`);
          }
        } else {
          console.log(`Updating ${repoUrl} in ${repoPath}`);
          try {
            execSync(`cd ${repoPath} && git remote update`, { stdio: 'inherit' });
          } catch (error) {
            console.error(`Error updating ${repoUrl}: ${error}`);
          }
        }
      });
    }
  });

program.parse(process.argv);