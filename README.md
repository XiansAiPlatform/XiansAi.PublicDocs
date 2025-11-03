# Xians.ai Public Docs

This is the public documentation for the Xians.ai platform. Documents are at [docs](docs) folder.

## Hosted on GitHub Pages

[https://xiansaiplatform.github.io/XiansAi.PublicDocs/](https://xiansaiplatform.github.io/XiansAi.PublicDocs/)

## Contributing Guide

To contribute to the documentation, you can fork the repository and create a pull request.

### Prerequisites

- [Python](https://www.python.org/downloads/)
- [mkdocs](https://www.mkdocs.org/getting-started/)

### Create Python vertual environment

```bash
python -m venv .venv
```

### Activate the virtual environment

macOS/Linux

```bash
source .venv/bin/activate
```

Windows

```bash
.venv/Scripts/activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Run the server
```bash
mkdocs serve
```
or
```bash
python -m mkdocs serve -a 127.0.0.1:8000
```

If the above doesn’t work in Git Bash on Windows, try:

```bash
py -3.13 -m mkdocs serve -a 127.0.0.1:8000
```
