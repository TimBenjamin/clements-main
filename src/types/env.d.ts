declare global {
    namespace NodeJS {
        interface ProcessEnv {
            [key: string]: undefined;
            NODE_ENV: "development" | "production" | "test";
            FOO: string;
            // Add other environment variables here as needed
        }
    }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
