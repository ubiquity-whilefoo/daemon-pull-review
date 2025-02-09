import { PullRequest } from "@octokit/graphql-schema";
import { Context } from "../types/context";

type ClosedByPullRequestsReferences = {
  node: Pick<PullRequest, "url" | "title" | "number" | "body"> & { owner: string; name: string };
};

export type IssuesClosedByThisPr = {
  repository: {
    pullRequest: {
      closingIssuesReferences: {
        edges: ClosedByPullRequestsReferences[];
      };
    };
  };
};

type LinkedIssue = {
  number: number;
  title: string;
  state: string;
  url: string;
};

type QueryResponse = {
  repository: {
    pullRequest: {
      closingIssuesReferences: {
        nodes: LinkedIssue[];
      };
    };
  };
};

export const closedByPullRequestsReferences = /* GraphQL */ `
  query closingIssuesReferencesQuery($owner: String!, $repo: String!, $pr_number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr_number) {
        closingIssuesReferences(first: 100) {
          edges {
            node {
              number
              title
              url
              body
              repository {
                name
                owner {
                  login
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const linkedIssuesOnPullRequestReferences = /* GraphQL */ `
  query ($owner: String!, $repo: String!, $prNumber: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $prNumber) {
        closingIssuesReferences(first: 100) {
          nodes {
            number
            title
            state
            url
          }
        }
      }
    }
  }
`;

export async function getLinkedIssues(context: Context) {
  const prNumber = context.payload.pull_request.number;

  const response = await context.octokit.graphql<QueryResponse>(linkedIssuesOnPullRequestReferences, {
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    prNumber,
  });

  return response.repository.pullRequest.closingIssuesReferences.nodes;
}
