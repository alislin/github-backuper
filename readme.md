# GitHub Backuper

## Description

This tool can backup or list GitHub repositories.

## Usage

### Backup Repositories

```bash
node dist/index.js backup -p <repo-path>
```

*   `-p, --repo-path <repo-path>`: The path to the directory containing `source.txt`. The `source.txt` file should contain a list of GitHub repository URLs, one per line.

### List GitHub Repositories

```bash
node dist/index.js list -u <username> -o <output-path>
```

*   `<cmd>`: command [backup|list]
*   `-u, --username <username>`: Your GitHub username.
*   `-o, --output-path <output-path>`: (Optional) The output path for the repository lists. Default is `github-repos`.

## 中文说明

### 备份仓库

```bash
node dist/index.js backup -p <repo-path>
```

*   `-p, --repo-path <repo-path>`: 包含 `source.txt` 文件的目录路径。`source.txt` 文件应包含 GitHub 仓库 URL 列表，每行一个。

### 列出 GitHub 仓库

```bash
node dist/index.js list -u <username> -o <output-path>
```

*   `<cmd>`: command [backup|list]
*   `-u, --username <username>`: 你的 GitHub 用户名。
*   `-o, --output-path <output-path>`: (可选) 仓库列表的输出路径。默认为 `github-repos`。