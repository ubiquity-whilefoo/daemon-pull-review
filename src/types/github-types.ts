import { RestEndpointMethodTypes } from "@octokit/rest";
import { Context } from "./context";

export type Issue = RestEndpointMethodTypes["issues"]["get"]["response"]["data"];

export type FetchParams = {
  context: Context;
  issueNum?: number;
  owner?: string;
  repo?: string;
};
