module.exports = {
  loveApi: {
    input: "./openapi.json", // ou .yaml
    output: {
      target: "./src/api/loveApi.ts",
      client: "axios",
    },
    hooks: {
      afterAllFilesWrite: ["prettier --write"],
    },
  },
};
