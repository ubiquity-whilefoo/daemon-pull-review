import { db } from "./__mocks__/db";
import { server } from "./__mocks__/node";
import usersGet from "./__mocks__/users-get.json";
import { describe, beforeAll, beforeEach, afterAll, afterEach, it, jest } from "@jest/globals";
import { Context, SupportedEvents } from "../src/types";
import { drop } from "@mswjs/data";
import issueTemplate from "./__mocks__/issue-template";
import repoTemplate from "./__mocks__/repo-template";
import { logger } from "../src/helpers/errors";
import { Octokit } from "@octokit/rest";
import { CompletionsType } from "../src/adapters/claude/helpers/completions";
import pullTemplate from "./__mocks__/pull-template";

// Mock constants
const MOCK_ANSWER_PASSED = "{confidenceThreshold: 1, reviewComment: 'passed'}";
// const MOCK_ANSWER_FAILED = "{confidenceThreshold: 0, reviewComment: 'failed'}";

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  drop(db);
  server.resetHandlers();
});

afterAll(() => server.close());

describe("Ask plugin tests", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await setupTests();
  });

  it("temp", async () => {
    return createContext();
  });
});

async function setupTests() {
  // Setup test data
  for (const item of usersGet) {
    db.users.create(item);
  }
  db.repo.create({
    ...repoTemplate,
  });
  db.issue.create({
    ...issueTemplate,
  });
  db.pull.create({ ...pullTemplate });
}

function createContext() {
  const user = db.users.findFirst({ where: { id: { equals: 1 } } });
  return {
    payload: {
      pull_request: db.pull.findFirst({ where: { id: { equals: 3 } } }) as unknown as Context["payload"]["pull_request"],
      sender: user,
      repository: db.repo.findFirst({ where: { id: { equals: 1 } } }) as unknown as Context["payload"]["repository"],
      action: "ready_for_review" as string,
      installation: { id: 1 } as unknown as Context["payload"]["installation"],
      organization: { login: "ubiquity" } as unknown as Context["payload"]["organization"],
      number: 3,
    },
    command: {
      name: null,
      parameters: null,
    },
    owner: "ubiquity",
    repo: "test-repo",
    logger: logger,
    config: {},
    env: {
      UBIQUITY_OS_APP_NAME: "UbiquityOS",
      ANTHOPIC_API_KEY: "test",
    },
    adapters: {
      anthropic: {
        completions: {
          getModelMaxTokenLimit: () => 50000,
          getModelMaxOutputLimit: () => 50000,
          createCompletion: async (): Promise<CompletionsType> => ({
            answer: MOCK_ANSWER_PASSED,
            groundTruths: [""],
            tokenUsage: {
              input: 1000,
              output: 150,
              total: 1150,
            },
          }),
          createGroundTruthCompletion: async (): Promise<string> => `[""]`,
        },
      },
    },
    octokit: new Octokit(),
    eventName: "pull_request.ready_for_review" as SupportedEvents,
  } as unknown as Context;
}
