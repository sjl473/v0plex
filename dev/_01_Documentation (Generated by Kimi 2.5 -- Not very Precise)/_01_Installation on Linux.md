---
title: Installation on Linux
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: v0plex
has_custom_tsx: false
---

# Installation on Linux

v0plex depends on Node.js and the pnpm package manager for its core functionality, while Chinese search capabilities require Python 3 and the jieba segmentation library. This section details how to install and configure these dependencies on common Linux distributions.

## System Requirements

Before beginning installation, ensure your system meets the following basic requirements. For operating systems, v0plex has been tested on Ubuntu 20.04 LTS and later, Debian 11, CentOS 8, and Fedora 35. Memory should be at least 4GB, and disk space of 2GB or more should be reserved for project dependencies and build outputs. Network connectivity is required for downloading Node.js packages and Python libraries.

## Installing Node.js

v0plex requires Node.js 18 or later. The NodeSource installation script is recommended as it provides the latest stable versions.

On Debian-based or Ubuntu systems, execute the following commands to install Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

For Fedora systems using dnf:

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

After installation, verify the Node.js version:

```bash
node --version
```

This should display v20.x.x or a higher version.

## Installing pnpm

pnpm is the package manager chosen for v0plex. Compared to npm and yarn, it offers significant advantages in disk space utilization and installation speed. The simplest way to install pnpm is using npm:

```bash
sudo npm install -g pnpm
```

Alternatively, use the official installation script:

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

After installing via the script, you need to reload your shell configuration file or restart the terminal for the pnpm command to become available. Verify the installation:

```bash
pnpm --version
```

## Installing Python 3

Most modern Linux distributions come with Python 3 pre-installed. You can check with:

```bash
python3 --version
```

If Python 3 is not installed on your system, on Ubuntu or Debian execute:

```bash
sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-pip
```

On Fedora:

```bash
sudo dnf install -y python3 python3-virtualenv python3-pip
```

v0plex build scripts automatically create Python virtual environments and install the jieba library, so manual installation is not required.

## Cloning the v0plex Repository

After installing system dependencies, clone the v0plex project from GitHub to your local machine:

```bash
git clone https://github.com/your-org/v0plex.git
cd v0plex
```

If you have forked the project, replace the repository URL with your own fork address.

## Installing Project Dependencies

Enter the project directory and use pnpm to install all Node.js dependencies:

```bash
pnpm install
```

This process may take several minutes depending on network conditions. pnpm will download all necessary packages and establish the symbolic links required by the project. After completion, the `node_modules/` directory will contain all dependencies.

## Verifying Installation

After completing the above steps, you can verify the installation by running the development server:

```bash
pnpm dev
```

The first run will execute Markdown parsing and Chinese index generation, which may take some time. If everything is functioning correctly, the terminal will display the development server access address, typically `http://localhost:3000`. Open a browser and visit this address; you should see v0plex's default page and example content.

## Troubleshooting

If you encounter issues during installation, here are solutions for common situations.

Permission issues: If you encounter EACCES errors when installing global packages, consider using nvm to manage Node.js versions, or adjust the default directory permissions for npm.

Network issues: In mainland China or other regions with network restrictions, configure npm and pnpm to use mirror registries. Edit `~/.npmrc` to add `registry=https://registry.npmmirror.com`.

Python virtual environment conflicts: If running `pnpm lex:gen` reports that you are already in a virtual environment, execute `deactivate` to exit the current virtual environment, then rerun the command.

Build failures: Ensure that `git` is installed on your system, as some dependencies may be pulled via the Git protocol.
