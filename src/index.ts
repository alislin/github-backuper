#!/usr/bin/env node

/*
 * @Author: Lin Ya
 * @Date: 2025-04-10 09:16:06
 * @LastEditors: Lin Ya
 * @LastEditTime: 2025-04-10 09:17:23
 * @Description: file content
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
  .action((_path) => {
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
  });

program.parse(process.argv);