# Developer Guide - Agentic AI

This guide provides step-by-step instructions to set up and run the Agentic AI platform. Follow the steps below to clone the repositories, configure the server, and set up the UI.

---

## 1. Clone the Repositories

To begin, clone the following three repositories from GitHub:

1. **XiansAI.Server**  
   Repository URL: [https://github.com/XiansAiPlatform/XiansAi.Server.git](https://github.com/XiansAiPlatform/XiansAi.Server.git)  
   Command to clone:
   ```bash
   git clone https://github.com/XiansAiPlatform/XiansAi.Server.git
   ```

2. **XiansAI.Lib**  
   Repository URL: [https://github.com/XiansAiPlatform/XiansAi.Lib.git](https://github.com/XiansAiPlatform/XiansAi.Lib.git)  
   Command to clone:
   ```bash
   git clone https://github.com/XiansAiPlatform/XiansAi.Lib.git
   ```

3. **XiansAI.UI**  
   Repository URL: [https://github.com/XiansAiPlatform/XiansAi.UI.git](https://github.com/XiansAiPlatform/XiansAi.UI.git)  
   Command to clone:
   ```bash
   git clone https://github.com/XiansAiPlatform/XiansAi.UI.git
   ```

---

## 2. Setting Up the Server

To configure and run the server, follow these steps:

1. **Obtain Configuration Files**

      Request the `appsettings.json` and `appsettings.Development.json` files from a team member. These files contain the necessary configuration settings for the server.

2. **Place Configuration Files**

      Copy the `appsettings.json` and `appsettings.Development.json` files into the `src` folder of the `XiansAI.Server` repository.

      Example path:  
      ```
      XiansAI.Server/src/
      ```

3. **Run the Server**

      Follow the specific instructions provided in the `XiansAI.Server` repository's README file to build and run the server.

---


## 3. Setting Up the UI

To configure and run the UI, follow these steps:

1. **Create a `.env` File**  
      - Navigate to the root directory of the `XiansAI.UI` repository.  
      - Create a new file named `.env`.

2. **Copy Environment Variables**  
      - Open the `XiansAI.UI` repository and locate the `.env.development` file.  
      - Copy the contents of the `.env.development` file into the newly created `.env` file.

3. **Install Dependencies**  
      - Run the following command to install all required dependencies:
      ```bash
      npm install
      ```

4. **Start the UI**  
      - Start the development server by running:
      ```bash
      npm start
      ```

      - The UI should now be accessible in your browser. The default URL is typically `http://localhost:3000`, but refer to the project documentation for confirmation.

---



## 4. Setting Up the Library (XiansAI.Lib)

To configure and use the `XiansAI.Lib` library, follow these steps:

1. **Run the Library**  
      - After cloning the `XiansAI.Lib` repository, navigate to its root directory and run the following command to build and execute the library in release mode:
      ```bash
      dotnet run -c Release
      ```

2. **Making Changes to the Library**  
      - If you make any changes to the `XiansAI.Lib` codebase, you need to update its reference in the agent's package dependency list:
      - Locate the `.csproj` file of the `XiansAI.Lib` project.
      - Copy the file path of the `.csproj` file.
      - Update the agent's package dependency list to reference the updated `.csproj` file location.

      Example of referencing the `.csproj` file in another project:
      ```xml
      <ProjectReference Include="path/to/XiansAI.Lib.csproj" />
      ```

3. **Rebuild the Dependent Project**  
      - After updating the reference, rebuild the dependent project to ensure the changes in the library are applied.

---

## Notes

- Ensure you have the required versions of .NET SDK installed on your system before setting up the library. Refer to the `XiansAI.Lib` repository's README for version requirements.
- For the server and library, ensure you have the necessary runtime environment (e.g., .NET Core) installed. Check the respective repositories for specific prerequisites.
- If you encounter any issues during setup, consult the respective repository's documentation or reach out to your team for assistance.

---

By following these steps, you should be able to successfully set up and run the Agentic AI platform.
