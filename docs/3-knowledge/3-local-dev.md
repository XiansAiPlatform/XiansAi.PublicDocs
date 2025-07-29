# Local Development

When developing agents you can work with knowledge files locally for easier manipulation and faster iteration. This is particularly useful during development and testing phases.

## Setting Up Local Knowledge Development

To enable local knowledge development, set the `LOCAL_KNOWLEDGE_FOLDER` environment variable to point to your local knowledge directory:

```bash
LOCAL_KNOWLEDGE_FOLDER=./knowledge-base
```

### Environment Variable Configuration

You can set this environment variable in several ways:

1. **In your terminal session:**
   ```bash
   export LOCAL_KNOWLEDGE_FOLDER=./knowledge-base
   ```

2. **In your agent project's launch configuration:**
   ```bash
   LOCAL_KNOWLEDGE_FOLDER=./knowledge-base dotnet run
   ```

4. **Using a .env file** (if your agent supports it):
   ```
   LOCAL_KNOWLEDGE_FOLDER=./knowledge-base
   ```

## Directory Structure

When using local knowledge development, organize your knowledge files in the specified folder:

```
YourAgentProject/
├── knowledge-base/
│   ├── documents/
│   │   ├── procedures.md
│   │   ├── guidelines.txt
│   │   └── faq.pdf
│   ├── templates/
│   │   ├── response-templates.json
│   │   └── workflow-templates.yaml
│   └── data/
│       ├── product-catalog.csv
│       └── customer-data.json
├── Program.cs
└── YourAgent.csproj
```

## Controlled Upload of Knowledge Files

Users can manage the upload of local knowledge files to the server through environment variables:

### Specifying Knowledge Files Location

To specify the folder containing knowledge files, use the .env variable:
```
LOCAL_KNOWLEDGE_FOLDER=<path-to-knowledge-folder>
```

### Controlling Knowledge Upload

To control whether the knowledge files should be uploaded, set the following variable:
```
UPLOAD_RESOURCES=true
```

### Upload Behavior

The upload behavior is controlled by the environment variable:

- `UPLOAD_RESOURCES=true` → upload will occur.
- `UPLOAD_RESOURCES=false` or missing → upload will not occur.

### Usage Examples

```bash
# Use .env setting for upload control
UPLOAD_RESOURCES=true dotnet run

# Disable upload (default behavior if not specified)
UPLOAD_RESOURCES=false dotnet run
```

## Controlled Upload of Source Code

The agent now uses a hash-based mechanism on the client side to determine whether the current source code needs to be uploaded to the server:

### Hash-Based Upload Optimization

- **Hash Generation**: A hash of the source code is generated locally and compared with the value stored in the database.
- **No Changes Detected**: If the hashes match, the source code has not changed, and upload is skipped.
- **Changes Detected**: If the hashes do not match, the source code has changed and will be uploaded to the server, updating the value in the database accordingly.

This optimization reduces unnecessary uploads and improves deployment efficiency.

## Environment Configuration Examples

### Development Environment (.env.development)
```
LOCAL_KNOWLEDGE_FOLDER=./knowledge-base
UPLOAD_RESOURCES=false
```
