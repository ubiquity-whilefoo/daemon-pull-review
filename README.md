# `@ubiquity-os/daemon-pull-review`

This is a high context aware GitHub organization integrated bot that uses the Anthropic Claude 3.5 Sonnet model to provide automated reviews and feeback to Github pull requests.

## Usage

Just convert a pull request to be ready for review and the bot automatically reviews and requests changes if necessary

## How it works

With its huge context window, we are able to feed the entire issue specification and the pull request to the model which we obtain. This allows the model to have a very deep understanding of the current scope and provide highly relevant reviews.

## Installation

`.ubiquity-os.config.yml`:

```yml
plugins:
  - uses:
      - plugin: http://localhost:4000
        with:
          openRouterAiModel: "" # Optional - defaults to "anthropic/claude-3.5-sonnet"
          openRouterBaseUrl: "" # Optional - defaults to Open Router's API endpoint
```

`.dev.vars` (for local testing):

specify the OpenRouterBase URL in the `.ubiquity-os.config.yml` file and set the `OPENROUTER_API_KEY` in the `.dev.vars` file.

```sh
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
UBIQUITY_OS_APP_NAME="UbiquityOS"
```

## Custom Port Configuration

If you specify a different port in your config file instead of the default port 4005, you'll need to start the development server with the corresponding port number:

```sh
bun wrangler dev --env dev --port <your-port-number>
```

## Testing

```sh
yarn test
```
