# Checklist

## Variables

- $PROJECT_NAME: `MyNewAgent`
- $LICENSE: `MIT`

## Step 1: Setup the root folder

- [ ] Create the LICENSE file with the content of the `{$LICENSE}` variable.
- [ ] Create the README.md file.

## Step 2: Create Src Project

- [ ] Add .gitignore file to the project for a typical .net console project. Add .env to the .gitignore file.
- [ ] Copy [.env](.env) file to `{$PROJECT_NAME}.Src` folder and use that file for the project.
- [ ] Follow  [Setting up Guide](docs/1-getting-started/1-setting-up.md) to create a new project with the name `{$PROJECT_NAME}` in the `{$PROJECT_NAME}.Src` folder.
  - [ ] Install necessary libraries as the guide says.
  - [ ] Once everything is in place validate the setup as per the guide.

## Step 3: Create Tests Project

- [ ] Create the xunit Tests project with the name `{$PROJECT_NAME}.Tests` in the `{$PROJECT_NAME}.Tests` folder.
