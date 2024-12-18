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
import { LogReturn } from "@ubiquity-os/ubiquity-os-logger";

// Mock constants
const MOCK_ANSWER_PASSED = "{confidenceThreshold: 1, reviewComment: 'passed'}";

jest.unstable_mockModule("../src/helpers/pull-helpers/fetch-diff", () => ({
  fetchPullRequestDiff: jest.fn(() => ({ diff: "abc" })),
}));

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  drop(db);
  server.resetHandlers();
});

afterAll(() => server.close());

describe("Pull Reviewer tests", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await setupTests();
  });

  describe("Perform pull precheck", () => {
    it("should skip review for draft PRs", async () => {
      const { PullReviewer } = await import("../src/handlers/pull-reviewer");
      const context = createContext();
      context.payload.pull_request.draft = true;
      const pullReviewer = new PullReviewer(context);

      const result = await pullReviewer.performPullPrecheck();
      expect(result.status).toBe(200);
      expect(result.reason).toContain("draft mode");
    });

    it("should skip review for closed PRs", async () => {
      const { PullReviewer } = await import("../src/handlers/pull-reviewer");
      const context = createContext();
      context.payload.pull_request.state = "closed";
      const pullReviewer = new PullReviewer(context);

      const result = await pullReviewer.performPullPrecheck();
      expect(result.status).toBe(200);
      expect(result.reason).toContain("closed");
    });

    it("should handle successful review", async () => {
      const { PullReviewer } = await import("../src/handlers/pull-reviewer");
      const pullReviewer = new PullReviewer(createContext());
      jest.spyOn(pullReviewer, "canPerformReview").mockImplementation(async () => true);
      jest.spyOn(pullReviewer, "getTaskNumberFromPullRequest").mockImplementation(async () => 1);
      jest.spyOn(pullReviewer, "submitCodeReview").mockImplementation(async () => {});

      const result = await pullReviewer.performPullPrecheck();
      expect(result).toEqual({ status: 200, reason: "Success" });
    });
  });

  describe("Review time restrictions", () => {
    it("should prevent multiple reviews within 24 hours", async () => {
      const { PullReviewer } = await import("../src/handlers/pull-reviewer");
      const context = createContext();
      const pullReviewer = new PullReviewer(context);

      jest
        .spyOn(pullReviewer.context.octokit, "paginate")
        .mockResolvedValue([{ event: "reviewed", actor: { type: "Bot" }, created_at: new Date().toISOString() }]);
      try {
        await pullReviewer.canPerformReview();
      } catch (error) {
        const e = error as LogReturn;
        expect(e.logMessage.raw).toBe("Only one review per day is allowed");
      }
    });

    it("should allow review after 24 hours have passed", async () => {
      const { PullReviewer } = await import("../src/handlers/pull-reviewer");
      const context = createContext();
      const pullReviewer = new PullReviewer(context);

      // Mock an old bot review
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25);

      jest
        .spyOn(pullReviewer.context.octokit, "paginate")
        .mockResolvedValue([{ event: "reviewed", actor: { type: "Bot" }, created_at: oldDate.toISOString() }]);

      expect(await pullReviewer.canPerformReview()).toBe(true);
    });
  });

  describe("Review data parsing", () => {
    it("should throw error for invalid confidence threshold", async () => {
      const { PullReviewer } = await import("../src/handlers/pull-reviewer");
      const pullReviewer = new PullReviewer(createContext());

      const invalidInput = '{"confidenceThreshold": "invalid", "reviewComment": "test"}';
      try {
        pullReviewer.parsePullReviewData(invalidInput);
      } catch (error) {
        const e = error as LogReturn;
        expect(e.logMessage.raw).toBe("Couldn't parse JSON output; Aborting");
      }
    });

    it("should throw error for missing review comment", async () => {
      const { PullReviewer } = await import("../src/handlers/pull-reviewer");
      const pullReviewer = new PullReviewer(createContext());

      const invalidInput = '{"confidenceThreshold": 0.8}';
      try {
        pullReviewer.parsePullReviewData(invalidInput);
      } catch (error) {
        const e = error as LogReturn;
        expect(e.logMessage.raw).toBe("Couldn't parse JSON output; Aborting");
      }
    });

    it("should accept string confidence threshold and convert to number", async () => {
      const { PullReviewer } = await import("../src/handlers/pull-reviewer");
      const pullReviewer = new PullReviewer(createContext());

      const input = '{"confidenceThreshold": "0.8", "reviewComment": "test"}';
      const result = pullReviewer.parsePullReviewData(input);

      expect(result).toEqual({
        confidenceThreshold: 0.8,
        reviewComment: "test",
      });
    });
  });

  it("should successfully submit a code review", async () => {
    const { PullReviewer } = await import("../src/handlers/pull-reviewer");
    const context = createContext();
    const pullReviewer = new PullReviewer(context);

    context.octokit.rest.pulls.createReview = jest.fn().mockReturnValue({
      data: { html_url: "abc" },
    }) as unknown as typeof context.octokit.rest.pulls.createReview;

    await pullReviewer.submitCodeReview("Great job!", "COMMENT");

    expect(context.octokit.rest.pulls.createReview).toHaveBeenCalledWith({
      owner: "ubiquity",
      repo: "test-repo",
      pull_number: 3,
      body: "Great job!",
      event: "COMMENT",
    });
  });

  it("should correctly parse valid review data", async () => {
    const { PullReviewer } = await import("../src/handlers/pull-reviewer");
    const pullReviewer = new PullReviewer(createContext());

    const result = pullReviewer.parsePullReviewData(MOCK_ANSWER_PASSED);
    expect(result).toEqual({
      confidenceThreshold: 1,
      reviewComment: "passed",
    });
  });

  it("should convert PR to draft if no issue is linked", async () => {
    const { PullReviewer } = await import("../src/handlers/pull-reviewer");
    const context = createContext();
    const pullReviewer = new PullReviewer(context);

    // Mock empty closing issues
    jest.spyOn(pullReviewer, "checkIfPrClosesIssues").mockResolvedValue({
      closesIssues: false,
      issues: [],
    });

    // Remove issue reference from PR body
    context.payload.pull_request.body = "Some description without issue reference";

    await expect(pullReviewer.getTaskNumberFromPullRequest(context)).rejects.toMatchObject({
      logMessage: {
        diff: "```diff\n! You need to link an issue and after that convert the PR to ready for review\n```",
        level: "error",
        raw: "You need to link an issue and after that convert the PR to ready for review",
        type: "error",
      },
      metadata: {
        caller: "PullReviewer.getTaskNumberFromPullRequest",
      },
    });
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
      ANTHROPIC_API_KEY: "test",
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
